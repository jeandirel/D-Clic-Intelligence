import httpx

from app.core.config import Settings


class FreshserviceError(RuntimeError):
    pass


class FreshserviceClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _auth(self) -> tuple[str, str]:
        if not self.settings.freshservice_api_key:
            raise FreshserviceError("FRESHSERVICE_API_KEY is not configured")
        return (self.settings.freshservice_api_key, "X")

    def _url(self, path: str) -> str:
        if not self.settings.freshservice_base_url:
            raise FreshserviceError("FRESHSERVICE_DOMAIN is not configured")
        return f"{self.settings.freshservice_base_url}/{path.lstrip('/')}"

    async def get_ticket(self, ticket_id: int) -> dict:
        async with httpx.AsyncClient(timeout=self.settings.freshservice_timeout_seconds) as client:
            response = await client.get(self._url(f"tickets/{ticket_id}"), auth=self._auth())
            if response.status_code >= 400:
                raise FreshserviceError(f"Freshservice GET failed: {response.status_code} {response.text[:300]}")
            return response.json()

    async def update_ticket(self, ticket_id: int, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=self.settings.freshservice_timeout_seconds) as client:
            response = await client.put(
                self._url(f"tickets/{ticket_id}"),
                auth=self._auth(),
                json=payload,
            )
            if response.status_code >= 400:
                raise FreshserviceError(f"Freshservice PUT failed: {response.status_code} {response.text[:300]}")
            return response.json()
