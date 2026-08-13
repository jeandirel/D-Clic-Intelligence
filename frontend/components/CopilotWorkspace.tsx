"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DEMO_TICKETS, DEMO_VIEWS, DemoTicket, filterTicketsForView, normalizeText } from "../lib/copilot-demo";
import styles from "../app/service-ops/copilot/copilot.module.css";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type AuditEvent = {
  id: number;
  time: string;
  action: string;
  detail: string;
};

type CopilotAnalysis = {
  summary: string;
  improvedDescription: string;
  suggestedPriority: DemoTicket["priority"];
  suggestedGroup: string;
  suggestedCategory: string;
  suggestedSubcategory: string;
  suggestedItem: string;
  confidence: number;
  missing: string[];
  nextBestAction: string;
  draftReply: string;
  similar: { id: string; score: number; reason: string }[];
};

type VizKind = "bar" | "line" | "donut" | "heatmap";

type VizDatum = {
  label: string;
  value: number;
  secondary?: number;
};

type VisualizationSpec = {
  id: string;
  title: string;
  subtitle: string;
  kind: VizKind;
  unit: string;
  data: VizDatum[];
  insights: string[];
  source: string;
  scope: string;
  freshness: string;
};

type PreviewState = {
  description: string;
  priority: DemoTicket["priority"];
  group: string;
  category: string;
  subcategory: string;
  item: string;
};

type PreviewFields = Record<keyof PreviewState, boolean>;

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{ 0: { transcript: string; confidence: number } }>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const DEFAULT_VIEW = DEMO_VIEWS.find((view) => view.label === "TicketsDclic à traiter") ?? DEMO_VIEWS[0];
const EMPTY_PREVIEW_FIELDS: PreviewFields = {
  description: true,
  priority: true,
  group: true,
  category: true,
  subcategory: true,
  item: true,
};

function nowLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date());
}

function createAnalysis(ticket: DemoTicket): CopilotAnalysis {
  const isSecurityMail = ticket.id === "INC-157104";
  const highRisk = ticket.slaRisk >= 80;
  const suggestedPriority: DemoTicket["priority"] = highRisk && ticket.priority === "Faible" ? "Élevée" : ticket.priority;

  if (isSecurityMail) {
    return {
      summary: "Email externe de prospection commerciale transmis à la DSI pour vérification. Le ticket est déjà orienté Sécurité / Mails douteux, mais il ne précise pas si un lien ou une pièce jointe a été ouvert.",
      improvedDescription: "Contexte : réception d’un email externe non sollicité proposant un partenariat commercial.\nExpéditeur : rodrigo.souto@alinegroup.com.br.\nMotif du signalement : sollicitation inattendue susceptible de constituer un message indésirable ou douteux.\nInformations à confirmer : clic sur un lien, ouverture d’une pièce jointe, présence du même message chez d’autres utilisateurs.\nAction demandée : vérifier la légitimité du message et confirmer la conduite à tenir au demandeur.",
      suggestedPriority: "Moyenne",
      suggestedGroup: "Sécurité Niveau 2 RSSI",
      suggestedCategory: "Sécurité",
      suggestedSubcategory: "Mails douteux",
      suggestedItem: "À qualifier",
      confidence: 94,
      missing: [
        "Le demandeur a-t-il cliqué sur un lien ?",
        "Une pièce jointe a-t-elle été ouverte ?",
        "D’autres utilisateurs ont-ils reçu le même message ?",
        "L’adresse ou le domaine de l’expéditeur a-t-il déjà été signalé ?",
      ],
      nextBestAction: "Demander au demandeur s’il a interagi avec le message, puis corréler l’expéditeur avec les signalements récents avant toute clôture.",
      draftReply: "Bonjour Rodrigo, afin de poursuivre l’analyse de ce message, pouvez-vous nous confirmer si vous avez cliqué sur un lien ou ouvert une pièce jointe, et si d’autres collègues ont reçu le même email ? Merci de ne pas interagir davantage avec le message en attendant notre retour.",
      similar: [
        { id: "INC-156401", score: 96, reason: "Même motif : sollicitation externe inattendue" },
        { id: "INC-155982", score: 88, reason: "Même sous-catégorie : Mails douteux" },
        { id: "INC-154733", score: 79, reason: "Email commercial externe signalé à la sécurité" },
      ],
    };
  }

  return {
    summary: `${ticket.type} concernant « ${ticket.subject} ». Le ticket est actuellement affecté à ${ticket.group}${ticket.agent === "--" ? " sans agent nommé" : `, agent ${ticket.agent}`}. Risque SLA estimé à ${ticket.slaRisk} % dans le scénario de démonstration.`,
    improvedDescription: `Contexte : ${ticket.subject}.\nDescription utilisateur : ${ticket.description}\nÉléments déjà connus : ${ticket.conversation}\nQualification proposée : ${ticket.category} > ${ticket.subcategory} > ${ticket.item}.\nProchaine étape : confirmer les informations manquantes puis appliquer la meilleure action après validation humaine.`,
    suggestedPriority,
    suggestedGroup: ticket.group,
    suggestedCategory: ticket.category,
    suggestedSubcategory: ticket.subcategory,
    suggestedItem: ticket.item === "--" ? "À qualifier" : ticket.item,
    confidence: Math.max(74, 97 - Math.round(ticket.slaRisk / 5)),
    missing: [
      "Le symptôme est-il reproductible ?",
      "Quel message d’erreur exact est observé ?",
      "Depuis quand le problème est-il présent ?",
    ],
    nextBestAction: ticket.slaRisk >= 75
      ? "Traiter prioritairement ce ticket et vérifier une réaffectation vers une équipe disponible avant l’échéance SLA."
      : "Compléter la qualification, rechercher les tickets similaires puis préparer la réponse ou l’action la plus probable.",
    draftReply: `Bonjour ${ticket.requester}, nous avons bien pris en compte votre demande « ${ticket.subject} ». Afin de poursuivre le diagnostic, pouvez-vous nous confirmer le message d’erreur exact et si le problème est toujours reproductible ?`,
    similar: [
      { id: "INC-154911", score: 91, reason: `Même catégorie : ${ticket.category}` },
      { id: "INC-153804", score: 83, reason: `Même groupe : ${ticket.group}` },
      { id: "INC-151990", score: 72, reason: `Sujet sémantiquement proche de « ${ticket.subject.slice(0, 34)}… »` },
    ],
  };
}

function countBy(tickets: DemoTicket[], key: (ticket: DemoTicket) => string): VizDatum[] {
  const counts = new Map<string, number>();
  tickets.forEach((ticket) => counts.set(key(ticket), (counts.get(key(ticket)) ?? 0) + 1));
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function averageSlaByGroup(tickets: DemoTicket[]): VizDatum[] {
  const groups = new Map<string, { total: number; count: number }>();
  tickets.forEach((ticket) => {
    const current = groups.get(ticket.group) ?? { total: 0, count: 0 };
    groups.set(ticket.group, { total: current.total + ticket.slaRisk, count: current.count + 1 });
  });
  return [...groups.entries()]
    .map(([label, value]) => ({ label, value: Math.round(value.total / value.count) }))
    .sort((a, b) => b.value - a.value);
}

function dailyTrend(tickets: DemoTicket[]): VizDatum[] {
  const counts = new Map<string, number>();
  tickets.forEach((ticket) => {
    const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(ticket.createdAt));
    counts.set(day, (counts.get(day) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => {
      const [ad, am] = a.label.split("/").map(Number);
      const [bd, bm] = b.label.split("/").map(Number);
      return am === bm ? ad - bd : am - bm;
    });
}

function heatmapData(tickets: DemoTicket[]): VizDatum[] {
  const buckets = ["08-10h", "10-12h", "12-14h", "14-16h", "16-18h"];
  return buckets.map((label, index) => {
    const value = tickets.filter((ticket) => {
      const hour = new Date(ticket.createdAt).getHours();
      return hour >= 8 + index * 2 && hour < 10 + index * 2;
    }).length;
    return { label, value };
  });
}

function buildVisualization(prompt: string, tickets: DemoTicket[], scope: string): VisualizationSpec {
  const query = normalizeText(prompt);
  let kind: VizKind = "bar";
  let title = "Tickets par groupe";
  let unit = "tickets";
  let data = countBy(tickets, (ticket) => ticket.group).slice(0, 8);

  if (query.includes("ligne") || query.includes("courbe") || query.includes("evolution") || query.includes("tendance")) kind = "line";
  if (query.includes("donut") || query.includes("camembert") || query.includes("repartition")) kind = "donut";
  if (query.includes("heatmap") || query.includes("heure") || query.includes("horaire")) kind = "heatmap";

  if (query.includes("sla")) {
    title = "Risque SLA moyen par groupe";
    unit = "%";
    data = averageSlaByGroup(tickets).slice(0, 8);
  } else if (query.includes("priorite")) {
    title = "Répartition des tickets par priorité";
    data = countBy(tickets, (ticket) => ticket.priority);
    if (!query.includes("barre") && !query.includes("ligne")) kind = "donut";
  } else if (query.includes("statut") || query.includes("avancement")) {
    title = "Tickets par statut / avancement";
    data = countBy(tickets, (ticket) => ticket.status).slice(0, 8);
  } else if (query.includes("categorie")) {
    title = "Tickets par catégorie";
    data = countBy(tickets, (ticket) => ticket.category).slice(0, 8);
  } else if (query.includes("source") || query.includes("tickets ia") || query.includes("cree par l ia")) {
    title = "Répartition par source de création";
    data = countBy(tickets, (ticket) => ticket.source);
    kind = query.includes("barre") ? "bar" : "donut";
  } else if (query.includes("rouen") || query.includes("belfort") || query.includes("site") || query.includes("localisation")) {
    title = "Tickets par site";
    data = countBy(tickets, (ticket) => ticket.location);
  } else if (query.includes("evolution") || query.includes("tendance") || query.includes("jour")) {
    title = "Évolution quotidienne des tickets";
    data = dailyTrend(tickets);
    kind = "line";
  } else if (kind === "heatmap") {
    title = "Arrivées de tickets par plage horaire";
    data = heatmapData(tickets);
  }

  if (data.length === 0) data = [{ label: "Aucune donnée", value: 0 }];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const leader = data[0];
  const insights = [
    leader ? `${leader.label} est la valeur la plus élevée du visuel (${leader.value}${unit === "%" ? " %" : ""}).` : "Aucun signal dominant détecté.",
    unit === "%"
      ? "Les groupes au-dessus de 75 % méritent une revue prioritaire dans ce scénario de démonstration."
      : `${tickets.length} tickets simulés sont pris en compte dans le périmètre courant.`,
    total > 0 && unit !== "%" ? `Le visuel agrège ${total} occurrences sur les dimensions affichées.` : "Le calcul est produit à partir du jeu de données simulé du Copilote.",
  ];

  return {
    id: `viz-${Date.now()}`,
    title,
    subtitle: prompt,
    kind,
    unit,
    data,
    insights,
    source: "ODS Freshservice simulé",
    scope,
    freshness: "à l’instant",
  };
}

function BarChart({ spec }: { spec: VisualizationSpec }) {
  const max = Math.max(...spec.data.map((item) => item.value), 1);
  return (
    <div className={styles.barChart}>
      {spec.data.map((item) => (
        <div className={styles.barRow} key={item.label}>
          <div className={styles.barLabel}>{item.label}</div>
          <div className={styles.barTrack}><span style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }} /></div>
          <strong>{item.value}{spec.unit === "%" ? " %" : ""}</strong>
        </div>
      ))}
    </div>
  );
}

function LineChart({ spec }: { spec: VisualizationSpec }) {
  const width = 760;
  const height = 250;
  const max = Math.max(...spec.data.map((item) => item.value), 1);
  const points = spec.data.map((item, index) => {
    const x = spec.data.length === 1 ? width / 2 : 28 + (index * (width - 56)) / (spec.data.length - 1);
    const y = height - 36 - (item.value / max) * (height - 72);
    return { ...item, x, y };
  });
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <div className={styles.lineWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={spec.title}>
        {[0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1="28" x2={width - 28} y1={height - 36 - ratio * (height - 72)} y2={height - 36 - ratio * (height - 72)} className={styles.gridLine} />)}
        <polyline points={pointString} className={styles.trendLine} />
        {points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="5" className={styles.trendPoint} />)}
      </svg>
      <div className={styles.axisLabels}>{points.map((point) => <span key={point.label}>{point.label}</span>)}</div>
    </div>
  );
}

function DonutChart({ spec }: { spec: VisualizationSpec }) {
  const total = Math.max(spec.data.reduce((sum, item) => sum + item.value, 0), 1);
  let cursor = 0;
  const stops = spec.data.map((item, index) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    const tone = `var(--copilot-series-${(index % 5) + 1})`;
    return `${tone} ${start}% ${cursor}%`;
  }).join(", ");
  return (
    <div className={styles.donutLayout}>
      <div className={styles.donut} style={{ background: `conic-gradient(${stops})` }}><div><strong>{total}</strong><span>{spec.unit}</span></div></div>
      <div className={styles.legend}>{spec.data.map((item, index) => <div key={item.label}><i style={{ background: `var(--copilot-series-${(index % 5) + 1})` }} /><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
    </div>
  );
}

function HeatmapChart({ spec }: { spec: VisualizationSpec }) {
  const max = Math.max(...spec.data.map((item) => item.value), 1);
  return (
    <div className={styles.heatmap}>
      {spec.data.map((item) => {
        const opacity = 0.14 + (item.value / max) * 0.78;
        return <div key={item.label} style={{ opacity }}><strong>{item.value}</strong><span>{item.label}</span></div>;
      })}
    </div>
  );
}

function VisualizationRenderer({ spec }: { spec: VisualizationSpec }) {
  if (spec.kind === "line") return <LineChart spec={spec} />;
  if (spec.kind === "donut") return <DonutChart spec={spec} />;
  if (spec.kind === "heatmap") return <HeatmapChart spec={spec} />;
  return <BarChart spec={spec} />;
}

export function CopilotWorkspace() {
  const [tickets, setTickets] = useState<DemoTicket[]>(DEMO_TICKETS);
  const [selectedView, setSelectedView] = useState(DEFAULT_VIEW);
  const [viewSearch, setViewSearch] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(DEMO_TICKETS[0].id);
  const [analysis, setAnalysis] = useState<CopilotAnalysis | null>(null);
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", text: "Bonjour. Je peux rechercher ou sélectionner un ticket, l’analyser, préparer une réponse, prévisualiser ses modifications ou créer un visuel à partir de votre question." },
  ]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewFields, setPreviewFields] = useState<PreviewFields>(EMPTY_PREVIEW_FIELDS);
  const [visual, setVisual] = useState<VisualizationSpec | null>(null);
  const [visualOpen, setVisualOpen] = useState(false);
  const [visualRefine, setVisualRefine] = useState("");
  const [pinnedVisuals, setPinnedVisuals] = useState<VisualizationSpec[]>([]);

  const visibleViews = useMemo(() => {
    const query = normalizeText(viewSearch);
    if (!query) return DEMO_VIEWS;
    return DEMO_VIEWS.filter((view) => normalizeText(view.label).includes(query));
  }, [viewSearch]);

  const viewTickets = useMemo(() => filterTicketsForView(selectedView.label, tickets), [selectedView, tickets]);
  const visibleTickets = useMemo(() => {
    const query = normalizeText(ticketSearch);
    if (!query) return viewTickets;
    return viewTickets.filter((ticket) => normalizeText(`${ticket.id} ${ticket.subject} ${ticket.requester} ${ticket.group}`).includes(query));
  }, [ticketSearch, viewTickets]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    setVoiceSupported(Boolean(Constructor));
  }, []);

  useEffect(() => {
    if (!visibleTickets.some((ticket) => ticket.id === selectedTicketId) && visibleTickets[0]) {
      setSelectedTicketId(visibleTickets[0].id);
      setAnalysis(null);
    }
  }, [visibleTickets, selectedTicketId]);

  function addAudit(action: string, detail: string) {
    setAudit((events) => [{ id: Date.now() + Math.random(), time: nowLabel(), action, detail }, ...events].slice(0, 12));
  }

  function speak(text: string) {
    if (!speakReplies || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1.02;
    window.speechSynthesis.speak(utterance);
  }

  function assistant(text: string) {
    setMessages((items) => [...items, { id: Date.now() + Math.random(), role: "assistant", text }].slice(-14));
    speak(text);
  }

  function selectTicket(ticket: DemoTicket, source = "interface") {
    setSelectedTicketId(ticket.id);
    setAnalysis(null);
    addAudit("ticket.selected", `${ticket.id} sélectionné via ${source}`);
  }

  function selectViewByKeyword(keyword: string): boolean {
    const normalized = normalizeText(keyword);
    const candidates = [
      "Tickets non assignés",
      "Tous les dossiers demandeurs VIP",
      "Remplacement de PC",
      "Incident(s) Majeur(s) en cours",
      "Tickets IA - Aujourd'hui",
      "Création de comptes - Ouvert",
      "Demandes Outlook",
      "TicketsDclic à traiter",
      "Tous tickets BELFORT",
      "Incidents Métier NPI du jour - Rouen",
    ];
    const match = candidates
      .map((label) => DEMO_VIEWS.find((view) => view.label === label))
      .filter((view): view is NonNullable<typeof view> => Boolean(view))
      .find((view) => normalized.includes(normalizeText(view.label).split(" ").filter((word) => word.length > 4)[0] ?? ""));
    if (!match) return false;
    setSelectedView(match);
    setAnalysis(null);
    addAudit("view.selected", match.label);
    assistant(`Vue « ${match.label} » sélectionnée. Le jeu de démonstration contient ${filterTicketsForView(match.label, tickets).length} ticket(s) correspondant(s).`);
    return true;
  }

  function runAnalysis() {
    const result = createAnalysis(selectedTicket);
    setAnalysis(result);
    addAudit("copilot.analysis.completed", `${selectedTicket.id} · confiance classification ${result.confidence} %`);
    assistant(`Analyse terminée pour ${selectedTicket.id}. J’ai produit un résumé, une description améliorée, une classification, ${result.missing.length} information(s) manquante(s), une réponse proposée et une prochaine meilleure action.`);
  }

  function openPreview() {
    const currentAnalysis = analysis ?? createAnalysis(selectedTicket);
    setAnalysis(currentAnalysis);
    setPreview({
      description: currentAnalysis.improvedDescription,
      priority: currentAnalysis.suggestedPriority,
      group: currentAnalysis.suggestedGroup,
      category: currentAnalysis.suggestedCategory,
      subcategory: currentAnalysis.suggestedSubcategory,
      item: currentAnalysis.suggestedItem,
    });
    setPreviewFields({ ...EMPTY_PREVIEW_FIELDS });
    setPreviewOpen(true);
    addAudit("copilot.preview.opened", `${selectedTicket.id} · aucun changement externe`);
  }

  function applyPreview() {
    if (!preview || !analysis) return;
    const changedByHuman = preview.group !== analysis.suggestedGroup || preview.category !== analysis.suggestedCategory || preview.subcategory !== analysis.suggestedSubcategory || preview.item !== analysis.suggestedItem || preview.priority !== analysis.suggestedPriority;
    setTickets((items) => items.map((ticket) => {
      if (ticket.id !== selectedTicket.id) return ticket;
      return {
        ...ticket,
        description: previewFields.description ? preview.description : ticket.description,
        priority: previewFields.priority ? preview.priority : ticket.priority,
        group: previewFields.group ? preview.group : ticket.group,
        category: previewFields.category ? preview.category : ticket.category,
        subcategory: previewFields.subcategory ? preview.subcategory : ticket.subcategory,
        item: previewFields.item ? preview.item : ticket.item,
      };
    }));
    addAudit("command.verified.demo", `${selectedTicket.id} · external_write=false${changedByHuman ? " · correction humaine enregistrée" : ""}`);
    setPreviewOpen(false);
    assistant(`Mise à jour simulée appliquée sur ${selectedTicket.id}. Aucune écriture Freshservice n’a été effectuée.${changedByHuman ? " Votre correction diffère de la proposition IA et serait enregistrée comme feedback d’apprentissage." : ""}`);
  }

  function createVisualFromPrompt(prompt: string) {
    const scopeTickets = visibleTickets.length > 0 ? visibleTickets : tickets;
    const spec = buildVisualization(prompt, scopeTickets, selectedView.label);
    setVisual(spec);
    setVisualOpen(true);
    setVisualRefine("");
    addAudit("visual.created", `${spec.title} · ${scopeTickets.length} ticket(s) · ${spec.kind}`);
    assistant(`Visuel créé : ${spec.title}. Il utilise le périmètre « ${selectedView.label} » et ${scopeTickets.length} ticket(s) simulé(s). Vous pouvez maintenant me demander de le modifier.`);
  }

  function refineVisual() {
    if (!visual || !visualRefine.trim()) return;
    const query = normalizeText(visualRefine);
    let next = { ...visual, subtitle: `${visual.subtitle} · ${visualRefine}` };
    if (query.includes("barre")) next.kind = "bar";
    if (query.includes("ligne") || query.includes("courbe")) next.kind = "line";
    if (query.includes("donut") || query.includes("camembert")) next.kind = "donut";
    if (query.includes("heatmap")) next.kind = "heatmap";
    if (query.includes("enleve") || query.includes("retire")) {
      const removable = next.data.find((item) => query.includes(normalizeText(item.label)));
      if (removable) next.data = next.data.filter((item) => item.label !== removable.label);
    }
    if (query.includes("sla")) next = buildVisualization(`${visualRefine} sla`, visibleTickets.length ? visibleTickets : tickets, selectedView.label);
    if (query.includes("priorite")) next = buildVisualization(`${visualRefine} priorité`, visibleTickets.length ? visibleTickets : tickets, selectedView.label);
    if (query.includes("categorie")) next = buildVisualization(`${visualRefine} catégorie`, visibleTickets.length ? visibleTickets : tickets, selectedView.label);
    setVisual(next);
    setVisualRefine("");
    addAudit("visual.refined", visualRefine);
  }

  function pinVisual() {
    if (!visual) return;
    if (!pinnedVisuals.some((item) => item.id === visual.id)) setPinnedVisuals((items) => [...items, visual]);
    addAudit("visual.pinned", visual.title);
    assistant(`Le visuel « ${visual.title} » a été ajouté au tableau de bord personnel de la démonstration.`);
  }

  function processCommand(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setMessages((items) => [...items, { id: Date.now() + Math.random(), role: "user", text }].slice(-14));
    setCommand("");
    const query = normalizeText(text);

    if (query.includes("visuel") || query.includes("graph") || query.includes("repartition") || query.includes("evolution") || query.includes("heatmap") || query.includes("camembert") || query.includes("courbe")) {
      createVisualFromPrompt(text);
      return;
    }

    if (query.includes("rodrigo")) {
      const ticket = tickets.find((item) => normalizeText(item.requester).includes("rodrigo"));
      if (ticket) {
        selectTicket(ticket, "commande conversationnelle");
        assistant(`${ticket.id}, demandé par ${ticket.requester}, est maintenant sélectionné.`);
        return;
      }
    }

    const ticketIdMatch = text.toUpperCase().match(/(?:INC|SR)-?\d{5,6}/);
    if (ticketIdMatch) {
      const normalizedId = ticketIdMatch[0].includes("-") ? ticketIdMatch[0] : ticketIdMatch[0].replace(/^(INC|SR)/, "$1-");
      const ticket = tickets.find((item) => item.id === normalizedId);
      if (ticket) {
        selectTicket(ticket, "commande conversationnelle");
        assistant(`${ticket.id} est sélectionné. Que souhaitez-vous faire ?`);
        return;
      }
    }

    if ((query.includes("montre") || query.includes("affiche") || query.includes("vue")) && selectViewByKeyword(text)) return;
    if (query.includes("non assigne")) {
      const view = DEMO_VIEWS.find((item) => item.label === "Tickets non assignés");
      if (view) {
        setSelectedView(view);
        assistant(`J’affiche les tickets non assignés : ${filterTicketsForView(view.label, tickets).length} résultat(s) dans la démonstration.`);
        addAudit("view.selected", view.label);
      }
      return;
    }
    if (query.includes("vip")) {
      const view = DEMO_VIEWS.find((item) => item.label === "Tous les dossiers demandeurs VIP");
      if (view) {
        setSelectedView(view);
        assistant(`Vue VIP sélectionnée : ${filterTicketsForView(view.label, tickets).length} ticket(s) dans le jeu de démonstration.`);
        addAudit("view.selected", view.label);
      }
      return;
    }
    if (query.includes("analyse") || query.includes("resume") || query.includes("ameliore") || query.includes("qualifie")) {
      runAnalysis();
      return;
    }
    if (query.includes("manque") || query.includes("information manquante")) {
      const result = analysis ?? createAnalysis(selectedTicket);
      setAnalysis(result);
      assistant(`Il manque principalement : ${result.missing.join(" ; ")}`);
      return;
    }
    if (query.includes("reponse") || query.includes("repondre") || query.includes("brouillon")) {
      const result = analysis ?? createAnalysis(selectedTicket);
      setAnalysis(result);
      assistant(`Brouillon préparé : ${result.draftReply}`);
      addAudit("reply.draft.created", selectedTicket.id);
      return;
    }
    if (query.includes("preview") || query.includes("previsual") || query.includes("avant apres") || query.includes("modifier le ticket") || query.includes("modifie le ticket")) {
      openPreview();
      assistant("La prévisualisation avant / après est ouverte. Une confirmation visuelle reste obligatoire avant toute application, même en mode vocal.");
      return;
    }
    if (query.includes("valide") || query.includes("applique")) {
      openPreview();
      assistant("Je ne déclenche pas une modification uniquement depuis la voix. La prévisualisation est ouverte ; confirmez explicitement les champs à appliquer.");
      return;
    }
    assistant("Je peux sélectionner une vue ou un ticket, analyser le ticket courant, préparer une réponse, ouvrir l’avant/après, ou créer un visuel en langage naturel. Exemple : « crée un visuel du risque SLA par groupe ».");
  }

  function toggleListening() {
    if (typeof window === "undefined") return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      assistant("La reconnaissance vocale Web Speech n’est pas disponible dans ce navigateur. Utilisez le champ texte ou un navigateur compatible pour la démonstration.");
      return;
    }
    const recognition = new Constructor();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) processCommand(transcript);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      assistant(`La reconnaissance vocale n’a pas abouti (${event.error}). Vous pouvez continuer au clavier.`);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.demoBanner}>
        <div><span className="material-symbols-outlined">science</span><strong>COPILOTE AGENT · BAC À SABLE</strong><small>Données et actions simulées · external_write=false</small></div>
        <div className={styles.bannerStats}><span><b>{DEMO_VIEWS.length}</b> vues référencées</span><span><b>{tickets.length}</b> tickets démo</span><span><b>{pinnedVisuals.length}</b> visuels épinglés</span></div>
      </div>

      <section className={styles.copilotBar}>
        <div className={styles.copilotIdentity}><span className="material-symbols-outlined">smart_toy</span><div><strong>D-Clic Copilote</strong><small>Ticket · Recherche · Action · Visual Intelligence</small></div></div>
        <form onSubmit={(event) => { event.preventDefault(); processCommand(command); }} className={styles.commandForm}>
          <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Demandez : « sélectionne le ticket de Rodrigo » ou « crée un visuel du risque SLA par groupe »" aria-label="Parler ou écrire au Copilote" />
          <button type="button" className={isListening ? styles.micActive : styles.micButton} onClick={toggleListening} title={voiceSupported ? "Parler au Copilote" : "Reconnaissance vocale non disponible dans ce navigateur"}><span className="material-symbols-outlined">{isListening ? "graphic_eq" : "mic"}</span></button>
          <button type="submit" className={styles.sendButton}><span className="material-symbols-outlined">arrow_upward</span></button>
        </form>
        <label className={styles.voiceToggle}><input type="checkbox" checked={speakReplies} onChange={(event) => setSpeakReplies(event.target.checked)} /> Réponses vocales</label>
      </section>

      <div className={styles.mainGrid}>
        <aside className={styles.viewsPanel}>
          <div className={styles.panelHeader}><div><strong>Vues Freshservice</strong><small>Registre métier</small></div><span>{visibleViews.length}</span></div>
          <label className={styles.smallSearch}><span className="material-symbols-outlined">search</span><input value={viewSearch} onChange={(event) => setViewSearch(event.target.value)} placeholder="Rechercher une vue" /></label>
          <div className={styles.viewList}>
            {visibleViews.map((view) => <button key={`${view.id}-${view.label}`} type="button" onClick={() => { setSelectedView(view); setAnalysis(null); addAudit("view.selected", view.label); }} className={selectedView.id === view.id && selectedView.label === view.label ? styles.viewActive : styles.viewButton}><span>{view.label}</span><small>{view.id}</small></button>)}
          </div>
        </aside>

        <section className={styles.ticketListPanel}>
          <div className={styles.panelHeader}><div><strong>{selectedView.label}</strong><small>{visibleTickets.length} ticket(s) dans le jeu de démonstration</small></div><button type="button" className={styles.iconAction} onClick={() => createVisualFromPrompt("Créer un visuel des tickets par groupe dans la vue actuelle")} title="Visualiser cette vue"><span className="material-symbols-outlined">bar_chart</span></button></div>
          <label className={styles.smallSearch}><span className="material-symbols-outlined">search</span><input value={ticketSearch} onChange={(event) => setTicketSearch(event.target.value)} placeholder="Ticket, demandeur, groupe…" /></label>
          <div className={styles.ticketRows}>
            {visibleTickets.map((ticket) => <button type="button" key={ticket.id} onClick={() => selectTicket(ticket)} className={selectedTicket.id === ticket.id ? styles.ticketRowActive : styles.ticketRow}>
              <div><strong>{ticket.subject}</strong><span>{ticket.id} · {ticket.requester}</span></div>
              <div className={styles.rowMeta}><span className={`${styles.priorityDot} ${styles[`p${ticket.priority}`]}`} />{ticket.priority}<small>{ticket.group}</small></div>
            </button>)}
            {visibleTickets.length === 0 ? <div className={styles.emptyState}>Aucun ticket simulé ne correspond à cette vue. Le registre reste disponible pour le futur raccord Freshservice.</div> : null}
          </div>
        </section>

        <section className={styles.ticketDetail}>
          <div className={styles.detailTop}>
            <div><span className={styles.ticketType}>{selectedTicket.type}</span><h2>{selectedTicket.subject}</h2><p>{selectedTicket.id} · demandé par <strong>{selectedTicket.requester}</strong></p></div>
            <button type="button" className={styles.analyzeButton} onClick={runAnalysis}><span className="material-symbols-outlined">auto_awesome</span>Analyser avec le Copilote</button>
          </div>
          <div className={styles.detailLayout}>
            <div className={styles.descriptionArea}>
              <div className={styles.tabRow}><button type="button" className={styles.tabActive}>Informations</button><button type="button">Conversations</button><button type="button">Actifs</button><button type="button">Activité</button></div>
              <article className={styles.descriptionCard}><div className={styles.cardTitle}>Description</div><pre>{selectedTicket.description}</pre></article>
              <article className={styles.conversationCard}><div className={styles.cardTitle}>Conversation</div><p>{selectedTicket.conversation}</p><div><button type="button" onClick={() => { const result = analysis ?? createAnalysis(selectedTicket); setAnalysis(result); assistant(`Brouillon préparé : ${result.draftReply}`); }}>Répondre avec le Copilote</button><button type="button">Ajouter une note</button></div></article>

              {analysis ? <div className={styles.analysisStack}>
                <article className={styles.aiCard}><div className={styles.aiTitle}><span className="material-symbols-outlined">auto_awesome</span><strong>Compréhension du ticket</strong><span>{analysis.confidence} %</span></div><p>{analysis.summary}</p></article>
                <article className={styles.aiCard}><div className={styles.aiTitle}><span className="material-symbols-outlined">edit_note</span><strong>Description améliorée</strong></div><pre>{analysis.improvedDescription}</pre></article>
                <div className={styles.analysisColumns}>
                  <article className={styles.aiCard}><div className={styles.aiTitle}><span className="material-symbols-outlined">rule</span><strong>Informations manquantes</strong></div><ul>{analysis.missing.map((item) => <li key={item}>{item}</li>)}</ul></article>
                  <article className={styles.aiCard}><div className={styles.aiTitle}><span className="material-symbols-outlined">next_plan</span><strong>Prochaine meilleure action</strong></div><p>{analysis.nextBestAction}</p><button type="button" className={styles.inlineAction} onClick={openPreview}>Prévisualiser le package</button></article>
                </div>
                <article className={styles.aiCard}><div className={styles.aiTitle}><span className="material-symbols-outlined">content_copy</span><strong>Tickets similaires</strong></div><div className={styles.similarList}>{analysis.similar.map((item) => <div key={item.id}><strong>{item.id}</strong><span>{item.reason}</span><b>{item.score} %</b></div>)}</div></article>
              </div> : null}
            </div>

            <aside className={styles.propertiesPanel}>
              <div className={styles.statusCard}><strong>{selectedTicket.status}</strong><div><span>Priorité</span><b>{selectedTicket.priority}</b></div><div><span>Risque SLA démo</span><b className={selectedTicket.slaRisk >= 75 ? styles.danger : ""}>{selectedTicket.slaRisk} %</b></div></div>
              <div className={styles.requesterCard}><span className="material-symbols-outlined">person</span><div><small>Demandeur</small><strong>{selectedTicket.requester}</strong><span>{selectedTicket.requesterEmail}</span>{selectedTicket.vip ? <em>VIP</em> : null}</div></div>
              <div className={styles.propertiesCard}><div className={styles.cardTitle}>Propriétés</div>{[
                ["Priorité", selectedTicket.priority], ["Statut", selectedTicket.status], ["Source", selectedTicket.source], ["Type", selectedTicket.type], ["Urgence", selectedTicket.urgency], ["Impact", selectedTicket.impact], ["Groupe", selectedTicket.group], ["Agent", selectedTicket.agent], ["Catégorie", selectedTicket.category], ["Sous-catégorie", selectedTicket.subcategory], ["Élément", selectedTicket.item],
              ].map(([label, value]) => <div className={styles.propertyRow} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
              {selectedTicket.asset ? <div className={styles.assetCard}><div className={styles.cardTitle}>Actif identifié</div><strong>{selectedTicket.asset.name}</strong><span>{selectedTicket.asset.serial}</span><div><small>Garantie</small><b>{selectedTicket.asset.warranty}</b></div><div><small>Incidents connus</small><b>{selectedTicket.asset.incidentCount}</b></div><button type="button">Lier / vérifier l’actif</button></div> : <div className={styles.assetCard}><div className={styles.cardTitle}>Actif</div><p>Aucun actif lié dans le jeu de démonstration.</p><button type="button">Rechercher les actifs du demandeur</button></div>}
            </aside>
          </div>
        </section>
      </div>

      <section className={styles.bottomGrid}>
        <div className={styles.conversationPanel}><div className={styles.panelHeader}><div><strong>Conversation Copilote</strong><small>Texte + voix</small></div></div><div className={styles.messages}>{messages.map((message) => <div key={message.id} className={message.role === "assistant" ? styles.assistantMessage : styles.userMessage}><span>{message.role === "assistant" ? "D-Clic" : "Vous"}</span><p>{message.text}</p></div>)}</div></div>
        <div className={styles.auditPanel}><div className={styles.panelHeader}><div><strong>Traçabilité de la session</strong><small>Journal local de démonstration</small></div><code>external_write=false</code></div><div className={styles.auditList}>{audit.length ? audit.map((event) => <div key={event.id}><time>{event.time}</time><strong>{event.action}</strong><span>{event.detail}</span></div>) : <div className={styles.emptyState}>Les actions du Copilote apparaîtront ici.</div>}</div></div>
      </section>

      {previewOpen && preview ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
        <div className={styles.previewModal} role="dialog" aria-modal="true" aria-label="Prévisualisation avant après">
          <header><div><span>HITL · Niveau L2</span><h3>Prévisualiser la mise à jour de {selectedTicket.id}</h3><p>La voix ou l’IA ne peut pas contourner cette validation. Chaque champ peut être exclu ou corrigé.</p></div><button type="button" onClick={() => setPreviewOpen(false)}><span className="material-symbols-outlined">close</span></button></header>
          <div className={styles.previewGrid}>
            <div className={styles.beforePane}><strong>AVANT</strong><label>Description<pre>{selectedTicket.description}</pre></label><label>Priorité<b>{selectedTicket.priority}</b></label><label>Groupe<b>{selectedTicket.group}</b></label><label>Catégorie<b>{selectedTicket.category}</b></label><label>Sous-catégorie<b>{selectedTicket.subcategory}</b></label><label>Élément<b>{selectedTicket.item}</b></label></div>
            <div className={styles.afterPane}><strong>APRÈS · MODIFIABLE</strong>
              <label className={styles.fieldToggle}><input type="checkbox" checked={previewFields.description} onChange={(event) => setPreviewFields((fields) => ({ ...fields, description: event.target.checked }))} />Description</label><textarea value={preview.description} onChange={(event) => setPreview((state) => state ? { ...state, description: event.target.value } : state)} />
              <label className={styles.fieldToggle}><input type="checkbox" checked={previewFields.priority} onChange={(event) => setPreviewFields((fields) => ({ ...fields, priority: event.target.checked }))} />Priorité</label><select value={preview.priority} onChange={(event) => setPreview((state) => state ? { ...state, priority: event.target.value as DemoTicket["priority"] } : state)}><option>Faible</option><option>Moyenne</option><option>Élevée</option><option>Urgente</option></select>
              <label className={styles.fieldToggle}><input type="checkbox" checked={previewFields.group} onChange={(event) => setPreviewFields((fields) => ({ ...fields, group: event.target.checked }))} />Groupe</label><input value={preview.group} onChange={(event) => setPreview((state) => state ? { ...state, group: event.target.value } : state)} />
              <label className={styles.fieldToggle}><input type="checkbox" checked={previewFields.category} onChange={(event) => setPreviewFields((fields) => ({ ...fields, category: event.target.checked }))} />Catégorie</label><input value={preview.category} onChange={(event) => setPreview((state) => state ? { ...state, category: event.target.value } : state)} />
              <label className={styles.fieldToggle}><input type="checkbox" checked={previewFields.subcategory} onChange={(event) => setPreviewFields((fields) => ({ ...fields, subcategory: event.target.checked }))} />Sous-catégorie</label><input value={preview.subcategory} onChange={(event) => setPreview((state) => state ? { ...state, subcategory: event.target.value } : state)} />
              <label className={styles.fieldToggle}><input type="checkbox" checked={previewFields.item} onChange={(event) => setPreviewFields((fields) => ({ ...fields, item: event.target.checked }))} />Élément</label><input value={preview.item} onChange={(event) => setPreview((state) => state ? { ...state, item: event.target.value } : state)} />
            </div>
          </div>
          <footer><div><span className="material-symbols-outlined">verified_user</span><p><strong>Policy Engine DEMO</strong>L2 · validation humaine obligatoire · external_write=false</p></div><button type="button" className={styles.cancelButton} onClick={() => setPreviewOpen(false)}>Annuler</button><button type="button" className={styles.confirmButton} onClick={applyPreview}>Valider et appliquer en démo</button></footer>
        </div>
      </div> : null}

      {visualOpen && visual ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVisualOpen(false); }}>
        <div className={styles.visualModal} role="dialog" aria-modal="true" aria-label="Visual Intelligence">
          <header><div><span>VISUAL INTELLIGENCE</span><h3>{visual.title}</h3><p>{visual.subtitle}</p></div><button type="button" onClick={() => setVisualOpen(false)}><span className="material-symbols-outlined">close</span></button></header>
          <div className={styles.visualMeta}><span><b>{visibleTickets.length || tickets.length}</b> tickets analysés</span><span>Périmètre : <b>{visual.scope}</b></span><span>Source : <b>{visual.source}</b></span><span>Fraîcheur : <b>{visual.freshness}</b></span></div>
          <div className={styles.visualBody}><div className={styles.chartSurface}><VisualizationRenderer spec={visual} /></div><aside className={styles.insightPanel}><strong>Lecture D-Clic</strong>{visual.insights.map((item) => <p key={item}>{item}</p>)}<div className={styles.whyChart}><span className="material-symbols-outlined">lightbulb</span><div><b>Pourquoi ce visuel ?</b><small>{visual.kind === "line" ? "Une courbe met en évidence une évolution ordonnée." : visual.kind === "donut" ? "Un donut facilite la lecture d’une composition simple." : visual.kind === "heatmap" ? "La heatmap met en évidence les zones de concentration." : "Les barres facilitent la comparaison précise entre catégories."}</small></div></div></aside></div>
          <div className={styles.visualConversation}><span className="material-symbols-outlined">auto_awesome</span><input value={visualRefine} onChange={(event) => setVisualRefine(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") refineVisual(); }} placeholder="Modifier : « en barres », « ajoute le risque SLA », « par priorité », « enlève Service Desk »…" /><button type="button" onClick={refineVisual}>Modifier</button></div>
          <footer><div className={styles.chartTypeButtons}>{(["bar", "line", "donut", "heatmap"] as VizKind[]).map((kind) => <button type="button" key={kind} className={visual.kind === kind ? styles.chartTypeActive : ""} onClick={() => setVisual((current) => current ? { ...current, kind } : current)}>{kind}</button>)}</div><button type="button" className={styles.cancelButton} onClick={() => setVisualOpen(false)}>Fermer</button><button type="button" className={styles.confirmButton} onClick={pinVisual}>Ajouter au tableau de bord</button></footer>
        </div>
      </div> : null}
    </div>
  );
}
