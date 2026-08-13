from __future__ import annotations

import httpx

from app.core.config import Settings
from app.domain.copilot import SpeechTokenResponse


class SpeechConfigurationError(RuntimeError):
    pass


class AzureSpeechService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def issue_token(self) -> SpeechTokenResponse:
        if not self.settings.azure_speech_key or not self.settings.azure_speech_region:
            raise SpeechConfigurationError(
                "AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be configured on the backend"
            )

        url = (
            f"https://{self.settings.azure_speech_region}.api.cognitive.microsoft.com/"
            "sts/v1.0/issueToken"
        )
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                headers={"Ocp-Apim-Subscription-Key": self.settings.azure_speech_key},
                content=b"",
            )
            response.raise_for_status()
            token = response.text.strip()

        if not token:
            raise SpeechConfigurationError("Azure Speech returned an empty token")

        return SpeechTokenResponse(
            token=token,
            region=self.settings.azure_speech_region,
            language=self.settings.azure_speech_language,
            voice=self.settings.azure_speech_voice,
        )
