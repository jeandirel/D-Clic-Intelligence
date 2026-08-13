from __future__ import annotations

import asyncio
import json
import re
from datetime import UTC, datetime, timedelta
from html import unescape
from typing import Any

import httpx
from redis.asyncio import Redis

from app.core.config import Settings
from app.domain.copilot import (
    CopilotAnalysis,
    CopilotContext,
    CopilotPreview,
    CopilotPreviewRequest,
    CopilotTicket,
    CopilotTicketList,
    VisualizationDatum,
    VisualizationRequest,
    VisualizationResponse,
)
from app.freshservice.gateway import FreshserviceGateway


PRIORITIES = {1: "Faible", 2: "Moyenne", 3: "Élevée", 4: "Urgente"}
STATUSES = {2: "Ouvert", 3: "En attente", 4: "Résolu", 5: "Fermé"}
SOURCES = {
    1: "Email",
    2: "Portail",
    3: "Téléphone",
    4: "Chat",
    5: "Widget de satisfaction",
    9: "Accueil physique",
    10: "Slack",
    11: "Chatbot",
    12: "Workplace",
    14: "Alertes",
    15: "Microsoft Teams",
}


def _clean_html(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"</p>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    return re.sub(r"[ \t]+", " ", re.sub(r"\n{3,}", "\n\n", value)).strip()


def _normalize_text(value: str) -> str:
    import unicodedata

    normalized = unicodedata.normalize("NFD", value.lower())
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def _output_text(payload: dict[str, Any]) -> str:
    for item in payload.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                return str(content.get("text") or "")
    return ""


class CopilotService:
    def __init__(
        self,
        settings: Settings,
        gateway: FreshserviceGateway,
        redis: Redis,
    ) -> None:
        self.settings = settings
        self.gateway = gateway
        self.redis = redis

    async def _metadata(self) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
        cache_key = f"dclic:copilot:metadata:{self.settings.freshservice_workspace_id or 'primary'}"
        cached = await self.redis.get(cache_key)
        if cached:
            try:
                value = json.loads(cached)
                return value["ticket_fields"], value["groups"], value["agents"]
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

        fields_payload, groups_payload, agents_payload = await asyncio.gather(
            self.gateway.get_ticket_fields(workspace_id=self.settings.freshservice_workspace_id),
            self.gateway.list_groups(page=1, per_page=100),
            self.gateway.list_agents(page=1, per_page=100),
        )
        fields = list(fields_payload.get("ticket_fields") or [])
        groups = list(groups_payload.get("groups") or [])
        agents = list(agents_payload.get("agents") or [])
        await self.redis.setex(
            cache_key,
            300,
            json.dumps({"ticket_fields": fields, "groups": groups, "agents": agents}, default=str),
        )
        return fields, groups, agents

    @staticmethod
    def _name_maps(
        groups: list[dict[str, Any]], agents: list[dict[str, Any]]
    ) -> tuple[dict[int, str], dict[int, str]]:
        group_names = {
            int(item["id"]): str(item.get("name") or item["id"])
            for item in groups
            if item.get("id") is not None
        }
        agent_names: dict[int, str] = {}
        for item in agents:
            if item.get("id") is None:
                continue
            first = str(item.get("first_name") or "").strip()
            last = str(item.get("last_name") or "").strip()
            agent_names[int(item["id"])] = (f"{first} {last}".strip() or str(item["id"]))
        return group_names, agent_names

    @staticmethod
    def _normalize_ticket(
        raw: dict[str, Any],
        group_names: dict[int, str],
        agent_names: dict[int, str],
    ) -> CopilotTicket:
        ticket = raw.get("ticket", raw)
        requester = ticket.get("requester") or {}
        requester_name = requester.get("name")
        if not requester_name:
            requester_name = str(ticket.get("name") or "").strip() or None
        requester_email = requester.get("email") or ticket.get("email")

        group_id = ticket.get("group_id")
        responder_id = ticket.get("responder_id") or ticket.get("agent_id")
        return CopilotTicket(
            id=int(ticket.get("id") or 0),
            subject=str(ticket.get("subject") or "Sans objet"),
            description_text=_clean_html(ticket.get("description_text") or ticket.get("description")),
            requester_id=ticket.get("requester_id"),
            requester_name=requester_name,
            requester_email=requester_email,
            status=ticket.get("status"),
            status_label=STATUSES.get(ticket.get("status"), str(ticket.get("status") or "—")),
            priority=ticket.get("priority"),
            priority_label=PRIORITIES.get(ticket.get("priority"), str(ticket.get("priority") or "—")),
            source=ticket.get("source"),
            source_label=SOURCES.get(ticket.get("source"), str(ticket.get("source") or "—")),
            ticket_type=ticket.get("type"),
            urgency=ticket.get("urgency"),
            impact=ticket.get("impact"),
            group_id=group_id,
            group_name=group_names.get(int(group_id)) if group_id is not None else None,
            responder_id=responder_id,
            responder_name=agent_names.get(int(responder_id)) if responder_id is not None else None,
            category=ticket.get("category"),
            sub_category=ticket.get("sub_category"),
            item_category=ticket.get("item_category"),
            due_by=ticket.get("due_by"),
            fr_due_by=ticket.get("fr_due_by"),
            created_at=ticket.get("created_at"),
            updated_at=ticket.get("updated_at"),
            tags=list(ticket.get("tags") or []),
            custom_fields=dict(ticket.get("custom_fields") or {}),
            assets=list(ticket.get("assets") or []),
            stats=dict(ticket.get("stats") or {}),
            changes=list(ticket.get("changes") or []),
            related_tickets=list(ticket.get("related_tickets") or []),
        )

    async def list_tickets(
        self,
        *,
        page: int = 1,
        per_page: int | None = None,
        updated_since: str | None = None,
        ticket_type: str | None = None,
        email: str | None = None,
        filter_name: str | None = None,
    ) -> CopilotTicketList:
        fields, groups, agents = await self._metadata()
        del fields
        group_names, agent_names = self._name_maps(groups, agents)
        size = per_page or self.settings.copilot_ticket_page_size
        payload = await self.gateway.list_tickets(
            page=page,
            per_page=size,
            updated_since=updated_since,
            workspace_id=self.settings.freshservice_workspace_id,
            include="requester",
            ticket_type=ticket_type,
            email=email,
            filter_name=filter_name,
        )
        tickets = [self._normalize_ticket(item, group_names, agent_names) for item in payload.get("tickets", [])]
        return CopilotTicketList(tickets=tickets, page=page, per_page=size)

    async def filter_tickets(self, query: str, *, page: int = 1) -> CopilotTicketList:
        _, groups, agents = await self._metadata()
        group_names, agent_names = self._name_maps(groups, agents)
        payload = await self.gateway.filter_tickets(
            query,
            page=page,
            workspace_id=self.settings.freshservice_workspace_id,
        )
        tickets = [self._normalize_ticket(item, group_names, agent_names) for item in payload.get("tickets", [])]
        return CopilotTicketList(tickets=tickets, page=page, per_page=30)

    async def get_context(self, ticket_id: int) -> CopilotContext:
        fields, groups, agents = await self._metadata()
        group_names, agent_names = self._name_maps(groups, agents)
        ticket_payload, conversation_payload = await asyncio.gather(
            self.gateway.get_ticket(
                ticket_id,
                include="requester,stats,assets,changes,related_tickets",
            ),
            self.gateway.get_ticket_conversations(ticket_id, page=1, per_page=30),
        )
        raw_ticket = ticket_payload.get("ticket", ticket_payload)
        requester = raw_ticket.get("requester")
        ticket = self._normalize_ticket(raw_ticket, group_names, agent_names)
        return CopilotContext(
            ticket=ticket,
            conversations=list(conversation_payload.get("conversations") or []),
            requester=requester,
            ticket_fields=fields,
            groups=groups,
            agents=agents,
            generated_at=datetime.now(UTC),
        )

    @staticmethod
    def _category_field(fields: list[dict[str, Any]]) -> dict[str, Any]:
        for field in fields:
            if field.get("name") == "category" or field.get("field_type") == "default_category":
                return field
        return {}

    async def analyze(self, ticket_id: int) -> CopilotAnalysis:
        context = await self.get_context(ticket_id)
        if self.settings.openai_api_key:
            try:
                return await self._analyze_openai(context)
            except (httpx.HTTPError, json.JSONDecodeError, KeyError, TypeError, ValueError):
                # Keep the Copilot usable if the model provider is temporarily unavailable.
                return self._analyze_bootstrap(context)
        return self._analyze_bootstrap(context)

    async def _analyze_openai(self, context: CopilotContext) -> CopilotAnalysis:
        groups = [
            {"id": item.get("id"), "name": item.get("name")}
            for item in context.groups
            if item.get("id") is not None
        ]
        conversations = []
        for item in context.conversations[-12:]:
            conversations.append(
                {
                    "id": item.get("id"),
                    "incoming": item.get("incoming"),
                    "private": item.get("private"),
                    "body_text": _clean_html(item.get("body_text") or item.get("body"))[:2500],
                    "created_at": item.get("created_at"),
                }
            )

        schema = {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "summary": {"type": "string"},
                "improved_description": {"type": "string"},
                "suggested_priority": {"type": ["integer", "null"], "minimum": 1, "maximum": 4},
                "suggested_group_id": {"type": ["integer", "null"]},
                "suggested_group_name": {"type": ["string", "null"]},
                "suggested_category": {"type": ["string", "null"]},
                "suggested_sub_category": {"type": ["string", "null"]},
                "suggested_item_category": {"type": ["string", "null"]},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "missing_information": {"type": "array", "items": {"type": "string"}},
                "next_best_action": {"type": "string"},
                "draft_reply": {"type": "string"},
                "internal_note": {"type": "string"},
                "evidence": {"type": "array", "items": {"type": "string"}},
            },
            "required": [
                "summary",
                "improved_description",
                "suggested_priority",
                "suggested_group_id",
                "suggested_group_name",
                "suggested_category",
                "suggested_sub_category",
                "suggested_item_category",
                "confidence",
                "missing_information",
                "next_best_action",
                "draft_reply",
                "internal_note",
                "evidence",
            ],
        }

        ticket_payload = context.ticket.model_dump(mode="json")
        prompt = {
            "ticket": ticket_payload,
            "conversations": conversations,
            "allowed_groups": groups,
            "freshservice_category_field": self._category_field(context.ticket_fields),
        }
        instructions = (
            "Tu es le Copilote Agent D-Clic pour un Service Desk Freshservice. "
            "Analyse uniquement les données fournies. Reformule la description en français professionnel, "
            "détecte les informations manquantes et propose la prochaine meilleure action. "
            "Pour groupe/catégorie/sous-catégorie/élément, utilise seulement des valeurs présentes dans les données Freshservice fournies; "
            "sinon renvoie null. Ne prétends pas avoir exécuté une action. La confiance n'est jamais une permission. "
            "Le brouillon de réponse doit être directement relisible par un agent. L'internal_note doit résumer le diagnostic et les preuves utiles."
        )

        body = {
            "model": self.settings.openai_model,
            "store": False,
            "instructions": instructions,
            "input": json.dumps(prompt, ensure_ascii=False),
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "dclic_copilot_analysis",
                    "strict": True,
                    "schema": schema,
                }
            },
        }
        async with httpx.AsyncClient(timeout=self.settings.openai_timeout_seconds) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {self.settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            response.raise_for_status()
            raw = response.json()

        result = json.loads(_output_text(raw))
        valid_groups = {int(item["id"]): str(item.get("name") or "") for item in groups}
        suggested_group_id = result.get("suggested_group_id")
        if suggested_group_id is not None and int(suggested_group_id) not in valid_groups:
            suggested_group_id = None
            result["suggested_group_name"] = None
        elif suggested_group_id is not None:
            result["suggested_group_name"] = valid_groups[int(suggested_group_id)]

        return CopilotAnalysis(
            ticket_id=context.ticket.id,
            summary=result["summary"],
            improved_description=result["improved_description"],
            suggested_priority=result.get("suggested_priority"),
            suggested_group_id=suggested_group_id,
            suggested_group_name=result.get("suggested_group_name"),
            suggested_category=result.get("suggested_category"),
            suggested_sub_category=result.get("suggested_sub_category"),
            suggested_item_category=result.get("suggested_item_category"),
            confidence=float(result["confidence"]),
            missing_information=list(result.get("missing_information") or []),
            next_best_action=result["next_best_action"],
            draft_reply=result["draft_reply"],
            internal_note=result["internal_note"],
            evidence=list(result.get("evidence") or []),
            mode="openai",
            model=self.settings.openai_model,
            generated_at=datetime.now(UTC),
        )

    def _analyze_bootstrap(self, context: CopilotContext) -> CopilotAnalysis:
        ticket = context.ticket
        combined = _normalize_text(
            " ".join(
                [ticket.subject, ticket.description_text]
                + [_clean_html(item.get("body_text") or item.get("body")) for item in context.conversations[-8:]]
            )
        )
        missing: list[str] = []
        if "erreur" not in combined and "error" not in combined:
            missing.append("Quel message d’erreur exact est affiché ?")
        if "depuis" not in combined:
            missing.append("Depuis quand le problème ou la demande est-il présent ?")
        if not ticket.assets and any(token in combined for token in ("pc", "ordinateur", "imprimante", "ecran", "douchette")):
            missing.append("Quel équipement ou numéro de parc est concerné ?")

        summary = f"{ticket.subject}. {ticket.description_text[:500]}".strip()
        improved = (
            f"Objet : {ticket.subject}\n\n"
            f"Contexte : {ticket.description_text or 'Description initiale non renseignée.'}\n\n"
            f"Qualification actuelle : {ticket.category or 'Non renseignée'} > "
            f"{ticket.sub_category or 'Non renseignée'} > {ticket.item_category or 'Non renseigné'}.\n\n"
            "Action attendue : compléter les informations manquantes puis valider la qualification avant mise à jour."
        )
        requester = ticket.requester_name or "le demandeur"
        return CopilotAnalysis(
            ticket_id=ticket.id,
            summary=summary,
            improved_description=improved,
            suggested_priority=ticket.priority,
            suggested_group_id=ticket.group_id,
            suggested_group_name=ticket.group_name,
            suggested_category=ticket.category,
            suggested_sub_category=ticket.sub_category,
            suggested_item_category=ticket.item_category,
            confidence=0.55,
            missing_information=missing,
            next_best_action=(
                "Compléter la qualification à partir des informations manquantes et rechercher une résolution documentée avant toute modification."
            ),
            draft_reply=(
                f"Bonjour {requester}, nous avons bien pris en compte votre demande. "
                "Afin de poursuivre le traitement, pouvez-vous nous préciser les éléments manquants indiqués par notre équipe ?"
            ),
            internal_note="Analyse bootstrap D-Clic produite à partir du ticket Freshservice réel. OPENAI_API_KEY non configurée ou fournisseur indisponible.",
            evidence=["subject", "description_text", "conversations", "ticket properties"],
            mode="bootstrap",
            model=None,
            generated_at=datetime.now(UTC),
        )

    async def preview(self, request: CopilotPreviewRequest) -> CopilotPreview:
        context = await self.get_context(request.ticket_id)
        ticket = context.ticket
        before = {
            "description": ticket.description_text,
            "priority": ticket.priority,
            "group_id": ticket.group_id,
            "responder_id": ticket.responder_id,
            "category": ticket.category,
            "sub_category": ticket.sub_category,
            "item_category": ticket.item_category,
            "custom_fields": ticket.custom_fields,
        }
        requested = {
            "description": request.description,
            "priority": request.priority,
            "group_id": request.group_id,
            "responder_id": request.responder_id,
            "category": request.category,
            "sub_category": request.sub_category,
            "item_category": request.item_category,
        }
        payload: dict[str, Any] = {}
        after = dict(before)
        changed_fields: list[str] = []
        for key, value in requested.items():
            if value is None:
                continue
            if before.get(key) != value:
                payload[key] = value
                after[key] = value
                changed_fields.append(key)
        if request.custom_fields and request.custom_fields != ticket.custom_fields:
            payload["custom_fields"] = request.custom_fields
            after["custom_fields"] = request.custom_fields
            changed_fields.append("custom_fields")

        return CopilotPreview(
            ticket_id=request.ticket_id,
            before=before,
            after=after,
            payload=payload,
            changed_fields=changed_fields,
        )

    async def visualize(self, request: VisualizationRequest) -> VisualizationResponse:
        _, groups, agents = await self._metadata()
        group_names, agent_names = self._name_maps(groups, agents)
        updated_since = request.updated_since
        if updated_since is None:
            updated_since = datetime.now(UTC) - timedelta(days=30)

        tickets: list[CopilotTicket] = []
        for page in range(1, self.settings.copilot_visual_max_pages + 1):
            payload = await self.gateway.list_tickets(
                page=page,
                per_page=100,
                updated_since=updated_since.isoformat().replace("+00:00", "Z"),
                workspace_id=request.workspace_id
                if request.workspace_id is not None
                else self.settings.freshservice_workspace_id,
            )
            raw_tickets = list(payload.get("tickets") or [])
            tickets.extend(self._normalize_ticket(item, group_names, agent_names) for item in raw_tickets)
            if len(raw_tickets) < 100:
                break

        prompt = _normalize_text(request.prompt)
        kind = "bar"
        unit = "tickets"
        title = "Tickets par groupe"

        if any(token in prompt for token in ("courbe", "evolution", "tendance", "jour")):
            kind = "line"
        if any(token in prompt for token in ("donut", "camembert", "repartition")):
            kind = "donut"
        if any(token in prompt for token in ("heatmap", "heure", "horaire")):
            kind = "heatmap"

        def count_by(getter) -> list[VisualizationDatum]:
            counts: dict[str, int] = {}
            for ticket in tickets:
                label = str(getter(ticket) or "Non renseigné")
                counts[label] = counts.get(label, 0) + 1
            return [
                VisualizationDatum(label=label, value=value)
                for label, value in sorted(counts.items(), key=lambda item: item[1], reverse=True)
            ]

        if "priorite" in prompt:
            title = "Répartition des tickets par priorité"
            data = count_by(lambda ticket: ticket.priority_label)
            if "bar" not in prompt and "courbe" not in prompt:
                kind = "donut"
        elif "statut" in prompt or "avancement" in prompt:
            title = "Tickets par statut"
            data = count_by(lambda ticket: ticket.status_label)
        elif "categorie" in prompt:
            title = "Tickets par catégorie"
            data = count_by(lambda ticket: ticket.category)
        elif "source" in prompt:
            title = "Tickets par source"
            data = count_by(lambda ticket: ticket.source_label)
        elif "type" in prompt:
            title = "Tickets par type"
            data = count_by(lambda ticket: ticket.ticket_type)
        elif "sla" in prompt or "echeance" in prompt:
            title = "Tickets à échéance proche par groupe"
            now = datetime.now(UTC)
            threshold = now + timedelta(hours=4)
            at_risk = [
                ticket
                for ticket in tickets
                if ticket.status in {2, 3}
                and ticket.due_by is not None
                and ticket.due_by <= threshold
            ]
            original = tickets
            tickets = at_risk
            data = count_by(lambda ticket: ticket.group_name)
            tickets = original
        elif kind == "line":
            title = "Évolution quotidienne des tickets"
            counts: dict[str, int] = {}
            for ticket in tickets:
                if not ticket.created_at:
                    continue
                label = ticket.created_at.astimezone(UTC).strftime("%d/%m")
                counts[label] = counts.get(label, 0) + 1
            data = [VisualizationDatum(label=label, value=value) for label, value in counts.items()]
            data.sort(key=lambda item: datetime.strptime(item.label, "%d/%m"))
        elif kind == "heatmap":
            title = "Arrivées de tickets par plage horaire"
            buckets = [("08-10h", 8, 10), ("10-12h", 10, 12), ("12-14h", 12, 14), ("14-16h", 14, 16), ("16-18h", 16, 18)]
            data = []
            for label, start, end in buckets:
                value = sum(
                    1
                    for ticket in tickets
                    if ticket.created_at is not None and start <= ticket.created_at.hour < end
                )
                data.append(VisualizationDatum(label=label, value=value))
        else:
            data = count_by(lambda ticket: ticket.group_name)

        data = data[:12]
        leader = max(data, key=lambda item: item.value) if data else None
        insights = [
            f"{len(tickets)} tickets Freshservice réels ont été chargés pour cette analyse.",
            (
                f"{leader.label} est la valeur la plus élevée ({leader.value:g} {unit})."
                if leader
                else "Aucune donnée ne correspond au périmètre demandé."
            ),
        ]
        if "sla" in prompt:
            insights.append("Le visuel représente une échéance opérationnelle proche (≤ 4 h), pas une prédiction ML de breach SLA.")

        return VisualizationResponse(
            title=title,
            subtitle=f"Depuis le {updated_since.astimezone(UTC).strftime('%d/%m/%Y')} · données Freshservice",
            kind=kind,
            unit=unit,
            data=data,
            insights=insights,
            ticket_count=len(tickets),
            scope="Freshservice réel",
            generated_at=datetime.now(UTC),
        )
