from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx

from app.core.config import Settings
from app.freshservice.quota import FreshserviceQuotaManager
from app.observability.metrics import (
    FRESHSERVICE_429,
    FRESHSERVICE_LATENCY,
    FRESHSERVICE_REMAINING,
    FRESHSERVICE_REQUESTS,
)


class FreshserviceError(RuntimeError):
    pass


class FreshserviceRateLimited(FreshserviceError):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(f"Freshservice rate limit exceeded; retry after {retry_after_seconds}s")
        self.retry_after_seconds = retry_after_seconds


class FreshserviceClient:
    def __init__(self, settings: Settings, quota: FreshserviceQuotaManager) -> None:
        self.settings = settings
        self.quota = quota
        self._client = httpx.AsyncClient(timeout=settings.freshservice_timeout_seconds)

    def _auth(self) -> tuple[str, str]:
        if not self.settings.freshservice_api_key:
            raise FreshserviceError("FRESHSERVICE_API_KEY is not configured")
        return (self.settings.freshservice_api_key, "X")

    def _url(self, path: str) -> str:
        if not self.settings.freshservice_base_url:
            raise FreshserviceError("FRESHSERVICE_DOMAIN is not configured")
        return f"{self.settings.freshservice_base_url}/{path.lstrip('/')}"

    @staticmethod
    def _int_header(response: httpx.Response, name: str) -> int | None:
        value = response.headers.get(name)
        if value is None:
            return None
        try:
            return int(value)
        except ValueError:
            return None

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json_payload: dict[str, Any] | None = None,
        emergency: bool = False,
    ) -> dict:
        endpoint = path.split("/", 1)[0]
        retries = self.settings.freshservice_max_retries

        for attempt in range(retries + 1):
            await self.quota.acquire(cost=1, emergency=emergency)
            started = time.perf_counter()
            try:
                response = await self._client.request(
                    method,
                    self._url(path),
                    auth=self._auth(),
                    json=json_payload,
                )
            except httpx.HTTPError as exc:
                if attempt < retries:
                    await asyncio.sleep(min(2**attempt, 5))
                    continue
                raise FreshserviceError(f"Freshservice transport error: {exc}") from exc
            finally:
                FRESHSERVICE_LATENCY.labels(method=method, endpoint=endpoint).observe(
                    time.perf_counter() - started
                )

            FRESHSERVICE_REQUESTS.labels(
                method=method,
                endpoint=endpoint,
                status=str(response.status_code),
            ).inc()

            used = self._int_header(response, "X-RateLimit-Used-CurrentRequest")
            if used and used > 1:
                await self.quota.consume_additional(used - 1)

            remaining = self._int_header(response, "X-RateLimit-Remaining")
            if remaining is not None:
                FRESHSERVICE_REMAINING.set(remaining)

            if response.status_code == 429:
                FRESHSERVICE_429.inc()
                retry_after = self._int_header(response, "Retry-After") or 60
                if attempt < retries:
                    await asyncio.sleep(min(retry_after, 60))
                    continue
                raise FreshserviceRateLimited(retry_after)

            if response.status_code in {502, 503, 504} and attempt < retries:
                await asyncio.sleep(min(2**attempt, 5))
                continue

            if response.status_code >= 400:
                raise FreshserviceError(
                    f"Freshservice {method} failed: {response.status_code} {response.text[:300]}"
                )
            return response.json()

        raise FreshserviceError("Freshservice request failed after retries")

    async def get_ticket(self, ticket_id: int) -> dict:
        return await self._request("GET", f"tickets/{ticket_id}")

    async def update_ticket(self, ticket_id: int, payload: dict, *, emergency: bool = False) -> dict:
        return await self._request(
            "PUT",
            f"tickets/{ticket_id}",
            json_payload=payload,
            emergency=emergency,
        )

    async def close(self) -> None:
        await self._client.aclose()
