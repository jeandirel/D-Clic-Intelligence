import re
from html import unescape

from app.domain.models import TicketIntelligence


class TicketIntelligenceService:
    """Bootstrap intelligence service. Replace heuristics with evaluated ML/LLM modules incrementally."""

    def analyze(self, ticket_payload: dict) -> TicketIntelligence:
        ticket = ticket_payload.get("ticket", ticket_payload)
        ticket_id = int(ticket.get("id", 0))
        subject = str(ticket.get("subject") or "Sans sujet")
        description = self._clean(str(ticket.get("description_text") or ticket.get("description") or ""))
        priority = int(ticket.get("priority") or 1)

        sla_risk = min(0.95, 0.20 + (priority - 1) * 0.20)
        text = f"{subject} {description}".lower()

        actions: list[dict] = []
        confidence = 0.55
        if "vpn" in text:
            actions.append({"action": "ticket.update", "changes": {"tags": ["dclic-ai", "vpn"]}, "reason": "VPN keyword detected"})
            confidence = 0.82
        elif any(word in text for word in ("mot de passe", "password", "connexion")):
            actions.append({"action": "ticket.update", "changes": {"tags": ["dclic-ai", "access"]}, "reason": "Access issue detected"})
            confidence = 0.76
        else:
            actions.append({"action": "ticket.update", "changes": {"tags": ["dclic-ai", "needs-review"]}, "reason": "No high-confidence bootstrap rule"})

        summary = subject if not description else f"{subject} — {description[:280]}"
        return TicketIntelligence(
            ticket_id=ticket_id,
            summary=summary,
            sla_risk=sla_risk,
            classification_confidence=confidence,
            recommended_actions=actions,
            evidence=["subject", "description", "priority"],
        )

    @staticmethod
    def _clean(value: str) -> str:
        value = re.sub(r"<[^>]+>", " ", value)
        return re.sub(r"\s+", " ", unescape(value)).strip()
