from app.services.ticket_intelligence import TicketIntelligenceService


def test_vpn_ticket_generates_bootstrap_signal() -> None:
    payload = {
        "ticket": {
            "id": 101,
            "subject": "VPN impossible",
            "description_text": "Le VPN ne se connecte plus depuis ce matin",
            "priority": 3,
        }
    }
    result = TicketIntelligenceService().analyze(payload)
    assert result.ticket_id == 101
    assert result.classification_confidence >= 0.8
    assert result.recommended_actions[0]["changes"]["tags"][-1] == "vpn"
