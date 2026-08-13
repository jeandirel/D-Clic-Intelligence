"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../app/service-ops/copilot/copilot-live.module.css";

type Ticket = {
  id: number;
  subject: string;
  description_text: string;
  requester_name?: string | null;
  requester_email?: string | null;
  status?: number | null;
  status_label?: string | null;
  priority?: number | null;
  priority_label?: string | null;
  source_label?: string | null;
  ticket_type?: string | null;
  urgency?: number | null;
  impact?: number | null;
  group_id?: number | null;
  group_name?: string | null;
  responder_id?: number | null;
  responder_name?: string | null;
  category?: string | null;
  sub_category?: string | null;
  item_category?: string | null;
  due_by?: string | null;
  fr_due_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  assets?: Array<Record<string, unknown>>;
  custom_fields?: Record<string, unknown>;
};

type Context = {
  ticket: Ticket;
  conversations: Array<Record<string, unknown>>;
  requester?: Record<string, unknown> | null;
  ticket_fields: Array<Record<string, unknown>>;
  groups: Array<Record<string, unknown>>;
  agents: Array<Record<string, unknown>>;
  generated_at: string;
};

type Analysis = {
  ticket_id: number;
  summary: string;
  improved_description: string;
  suggested_priority?: number | null;
  suggested_group_id?: number | null;
  suggested_group_name?: string | null;
  suggested_category?: string | null;
  suggested_sub_category?: string | null;
  suggested_item_category?: string | null;
  confidence: number;
  missing_information: string[];
  next_best_action: string;
  draft_reply: string;
  internal_note: string;
  evidence: string[];
  mode: "openai" | "bootstrap";
  model?: string | null;
};

type Preview = {
  ticket_id: number;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  payload: Record<string, unknown>;
  changed_fields: string[];
  requires_human_approval: boolean;
  policy_id: string;
};

type Viz = {
  title: string;
  subtitle: string;
  kind: "bar" | "line" | "donut" | "heatmap";
  unit: string;
  data: Array<{ label: string; value: number; secondary?: number | null }>;
  insights: string[];
  source: "freshservice";
  ticket_count: number;
  scope: string;
  generated_at: string;
};

type Status = {
  freshservice_configured: boolean;
  freshservice_writes_enabled: boolean;
  llm_configured: boolean;
  llm_model?: string | null;
  speech_configured: boolean;
  speech_voice: string;
  speech_language: string;
  mode: string;
};

type SpeechToken = {
  token: string;
  region: string;
  language: string;
  voice: string;
  expires_in_seconds: number;
};

type Editable = {
  description: string;
  priority: number;
  group_id: number | null;
  category: string;
  sub_category: string;
  item_category: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const api = (path: string) => `${API_BASE}/api/v1${path}`;

const VOICES = [
  ["fr-FR-DeniseNeural", "Denise · Française · voix féminine"],
  ["fr-FR-HenriNeural", "Henri · Français · voix masculine"],
  ["fr-FR-VivienneMultilingualNeural", "Vivienne · Multilingue · voix féminine"],
  ["fr-FR-RemyMultilingualNeural", "Rémy · Multilingue · voix masculine"],
] as const;

function asText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function firstValue(record: Record<string, unknown> | null | undefined, keys: string[]): string {
  if (!record) return "—";
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return "—";
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : `Erreur HTTP ${response.status}`;
    throw new Error(detail);
  }
  return payload as T;
}

export function ProductionCopilotWorkspace() {
  const [status, setStatus] = useState<Status | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [editable, setEditable] = useState<Editable | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [viz, setViz] = useState<Viz | null>(null);
  const [command, setCommand] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [visualPrompt, setVisualPrompt] = useState("Crée un visuel des tickets par groupe sur les 30 derniers jours");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Connexion au Copilote…");
  const [voice, setVoice] = useState("fr-FR-DeniseNeural");
  const [voiceReplies, setVoiceReplies] = useState(false);

  const selectedTicket = useMemo(
    () => context?.ticket ?? tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [context, tickets, selectedId],
  );

  const groups = useMemo(() => {
    return (context?.groups ?? []).map((group) => ({
      id: Number(group.id),
      name: String(group.name ?? group.id),
    })).filter((item) => Number.isFinite(item.id));
  }, [context]);

  const fetchStatus = useCallback(async () => {
    const response = await fetch(api("/copilot/status"), { cache: "no-store" });
    const value = await readJson<Status>(response);
    setStatus(value);
    setVoice(value.speech_voice || "fr-FR-DeniseNeural");
    return value;
  }, []);

  const loadTickets = useCallback(async (filterQuery?: string) => {
    setBusy("tickets");
    setError("");
    try {
      const url = filterQuery
        ? `${api("/copilot/tickets/filter")}?query=${encodeURIComponent(filterQuery)}`
        : `${api("/copilot/tickets")}?page=1&per_page=50`;
      const response = await fetch(url, { cache: "no-store" });
      const value = await readJson<{ tickets: Ticket[] }>(response);
      setTickets(value.tickets);
      setMessage(`${value.tickets.length} tickets Freshservice chargés.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Impossible de charger les tickets Freshservice.");
    } finally {
      setBusy("");
    }
  }, []);

  const selectTicket = useCallback(async (ticketId: number) => {
    setSelectedId(ticketId);
    setContext(null);
    setAnalysis(null);
    setPreview(null);
    setBusy("context");
    setError("");
    try {
      const response = await fetch(api(`/copilot/tickets/${ticketId}/context`), { cache: "no-store" });
      const value = await readJson<Context>(response);
      setContext(value);
      setEditable({
        description: value.ticket.description_text || "",
        priority: value.ticket.priority || 1,
        group_id: value.ticket.group_id ?? null,
        category: value.ticket.category || "",
        sub_category: value.ticket.sub_category || "",
        item_category: value.ticket.item_category || "",
      });
      setMessage(`Ticket #${ticketId} chargé depuis Freshservice.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Impossible d'ouvrir le ticket.");
    } finally {
      setBusy("");
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!voiceReplies || !status?.speech_configured || !text.trim()) return;
    try {
      const tokenResponse = await fetch(api("/copilot/voice/token"), { method: "POST" });
      const token = await readJson<SpeechToken>(tokenResponse);
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token.token, token.region);
      speechConfig.speechSynthesisLanguage = token.language;
      speechConfig.speechSynthesisVoiceName = voice;
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
      await new Promise<void>((resolve, reject) => {
        synthesizer.speakTextAsync(
          text,
          () => { synthesizer.close(); resolve(); },
          (reason) => { synthesizer.close(); reject(new Error(String(reason))); },
        );
      });
    } catch {
      // Voice output is an enhancement; text remains the source of truth.
    }
  }, [status?.speech_configured, voice, voiceReplies]);

  const analyze = useCallback(async () => {
    if (!selectedId) return;
    setBusy("analysis");
    setError("");
    try {
      const response = await fetch(api("/copilot/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: selectedId, actor_id: "copilot-web-user" }),
      });
      const value = await readJson<Analysis>(response);
      setAnalysis(value);
      setEditable((current) => ({
        description: value.improved_description || current?.description || "",
        priority: value.suggested_priority ?? current?.priority ?? 1,
        group_id: value.suggested_group_id ?? current?.group_id ?? null,
        category: value.suggested_category ?? current?.category ?? "",
        sub_category: value.suggested_sub_category ?? current?.sub_category ?? "",
        item_category: value.suggested_item_category ?? current?.item_category ?? "",
      }));
      const text = `Analyse terminée. Confiance ${Math.round(value.confidence * 100)} pour cent. ${value.next_best_action}`;
      setMessage(text);
      void speak(text);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "L'analyse IA a échoué.");
    } finally {
      setBusy("");
    }
  }, [selectedId, speak]);

  const createPreview = useCallback(async () => {
    if (!selectedId || !editable) return;
    setBusy("preview");
    setError("");
    try {
      const response = await fetch(api("/copilot/preview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: selectedId,
          actor_id: "copilot-web-user",
          ...editable,
          reason: "Copilot Agent - prévisualisation validée par l'agent",
        }),
      });
      const value = await readJson<Preview>(response);
      setPreview(value);
      setMessage(`${value.changed_fields.length} modification(s) prête(s) pour validation humaine.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "La prévisualisation a échoué.");
    } finally {
      setBusy("");
    }
  }, [editable, selectedId]);

  const execute = useCallback(async () => {
    if (!selectedId || !editable || !preview) return;
    setBusy("execute");
    setError("");
    try {
      const commandId = `copilot-${selectedId}-${Date.now()}`;
      const response = await fetch(api("/copilot/execute"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: selectedId,
          actor_id: "copilot-web-user",
          command_id: commandId,
          approved: true,
          ...editable,
          reason: "Modification explicitement validée dans D-Clic Copilote Agent",
        }),
      });
      const value = await readJson<{ status: string; verified: boolean; dry_run: boolean }>(response);
      if (value.dry_run) {
        setMessage("La politique est validée, mais FRESHSERVICE_WRITE_ENABLED=false : aucune écriture n'a été envoyée.");
      } else if (value.verified) {
        setMessage("Freshservice mis à jour et relu avec succès : commande vérifiée.");
        setPreview(null);
        await selectTicket(selectedId);
      } else {
        setMessage(`Commande terminée avec le statut : ${value.status}.`);
      }
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "La mise à jour Freshservice a échoué.");
    } finally {
      setBusy("");
    }
  }, [editable, preview, selectTicket, selectedId]);

  const createVisualization = useCallback(async (prompt = visualPrompt) => {
    setBusy("visual");
    setError("");
    try {
      const response = await fetch(api("/copilot/visualize"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const value = await readJson<Viz>(response);
      setViz(value);
      setVisualPrompt(prompt);
      setMessage(`Visuel généré à partir de ${value.ticket_count} tickets Freshservice réels.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Impossible de générer le visuel.");
    } finally {
      setBusy("");
    }
  }, [visualPrompt]);

  const runCommand = useCallback(async (rawCommand: string) => {
    const text = rawCommand.trim();
    if (!text) return;
    setCommand("");
    setMessage(`Commande : « ${text} »`);
    const normalized = text.toLowerCase();
    const idMatch = text.match(/(?:#|inc-|sr-)?(\d{4,})/i);

    if (normalized.includes("visuel") || normalized.includes("graph") || normalized.includes("courbe") || normalized.includes("repartition")) {
      await createVisualization(text);
      return;
    }
    if (idMatch && (normalized.includes("ouvre") || normalized.includes("ticket") || normalized.includes("selection"))) {
      await selectTicket(Number(idMatch[1]));
      return;
    }
    if (normalized.includes("non assigne")) {
      await loadTickets("agent_id:null");
      return;
    }
    if (normalized.includes("urgent")) {
      await loadTickets("priority:4");
      return;
    }
    if (normalized.includes("en attente")) {
      await loadTickets("status:3");
      return;
    }
    if (normalized.includes("ouverts") || normalized.includes("ouvert")) {
      await loadTickets("status:2");
      return;
    }
    if (normalized.includes("analyse") || normalized.includes("resume")) {
      if (!selectedId) { setMessage("Sélectionne d'abord un ticket."); return; }
      await analyze();
      return;
    }
    if (normalized.includes("previsual") || normalized.includes("avant apres")) {
      if (!selectedId) { setMessage("Sélectionne d'abord un ticket."); return; }
      await createPreview();
      return;
    }
    const local = tickets.find((ticket) =>
      (ticket.requester_name ?? "").toLowerCase().includes(normalized) ||
      ticket.subject.toLowerCase().includes(normalized),
    );
    if (local) {
      await selectTicket(local.id);
      return;
    }
    setMessage("Je n'ai pas pu résoudre cette commande. Essaie un ID de ticket, « tickets non assignés », « analyse ce ticket » ou « crée un visuel par groupe ». ");
  }, [analyze, createPreview, createVisualization, loadTickets, selectTicket, selectedId, tickets]);

  const listen = useCallback(async () => {
    if (!status?.speech_configured) {
      setError("Azure Speech n'est pas configuré sur le backend.");
      return;
    }
    setBusy("voice");
    setError("");
    try {
      const tokenResponse = await fetch(api("/copilot/voice/token"), { method: "POST" });
      const token = await readJson<SpeechToken>(tokenResponse);
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token.token, token.region);
      speechConfig.speechRecognitionLanguage = token.language;
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      const result = await new Promise<{ text: string }>((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (recognized) => { recognizer.close(); resolve({ text: recognized.text ?? "" }); },
          (reason) => { recognizer.close(); reject(new Error(String(reason))); },
        );
      });
      if (!result.text.trim()) {
        setMessage("Je n'ai pas compris la commande vocale.");
      } else {
        setCommand(result.text);
        await runCommand(result.text);
      }
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "La reconnaissance vocale a échoué.");
    } finally {
      setBusy("");
    }
  }, [runCommand, status?.speech_configured]);

  useEffect(() => {
    void (async () => {
      try {
        const value = await fetchStatus();
        if (value.freshservice_configured) await loadTickets();
        else setError("Freshservice n'est pas configuré sur le backend.");
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Backend D-Clic indisponible.");
      }
    })();
  }, [fetchStatus, loadTickets]);

  const filteredTickets = useMemo(() => {
    const q = ticketSearch.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((ticket) =>
      String(ticket.id).includes(q) ||
      ticket.subject.toLowerCase().includes(q) ||
      (ticket.requester_name ?? "").toLowerCase().includes(q) ||
      (ticket.group_name ?? "").toLowerCase().includes(q),
    );
  }, [ticketSearch, tickets]);

  const maxViz = viz ? Math.max(...viz.data.map((item) => item.value), 1) : 1;
  const linePoints = viz?.kind === "line"
    ? viz.data.map((item, index) => {
      const x = viz.data.length <= 1 ? 50 : (index / (viz.data.length - 1)) * 100;
      const y = 92 - (item.value / maxViz) * 78;
      return `${x},${y}`;
    }).join(" ")
    : "";

  return (
    <div className={styles.workspace}>
      <div className={styles.statusBar}>
        <div><span className={status?.freshservice_configured ? styles.okDot : styles.badDot} />Freshservice {status?.freshservice_configured ? "connecté" : "non configuré"}</div>
        <div><span className={status?.llm_configured ? styles.okDot : styles.warnDot} />IA {status?.llm_configured ? status.llm_model : "bootstrap"}</div>
        <div><span className={status?.speech_configured ? styles.okDot : styles.warnDot} />Voix {status?.speech_configured ? "Azure Speech" : "non configurée"}</div>
        <div><span className={status?.freshservice_writes_enabled ? styles.okDot : styles.warnDot} />Écriture {status?.freshservice_writes_enabled ? "activée" : "désactivée"}</div>
      </div>

      {error ? <div className={styles.error}><strong>Erreur :</strong> {error}</div> : null}
      <div className={styles.message}>{busy ? "Traitement en cours…" : message}</div>

      <div className={styles.commandBar}>
        <button className={styles.micButton} onClick={() => void listen()} disabled={busy === "voice"} title="Parler au Copilote">
          <span className="material-symbols-outlined">mic</span>
        </button>
        <input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runCommand(command); }} placeholder="Ex. Ouvre le ticket 157104 · Analyse ce ticket · Crée un visuel par groupe…" />
        <button className={styles.primary} onClick={() => void runCommand(command)}>Envoyer</button>
        <select value={voice} onChange={(event) => setVoice(event.target.value)} aria-label="Choisir la voix du Copilote">
          {VOICES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className={styles.voiceToggle}><input type="checkbox" checked={voiceReplies} onChange={(event) => setVoiceReplies(event.target.checked)} /> Réponses vocales</label>
      </div>

      <div className={styles.mainGrid}>
        <aside className={styles.ticketList}>
          <div className={styles.panelTitle}><strong>Tickets Freshservice</strong><button onClick={() => void loadTickets()} title="Actualiser"><span className="material-symbols-outlined">refresh</span></button></div>
          <input className={styles.search} value={ticketSearch} onChange={(event) => setTicketSearch(event.target.value)} placeholder="Filtrer la liste…" />
          <div className={styles.ticketScroller}>
            {filteredTickets.map((ticket) => (
              <button key={ticket.id} onClick={() => void selectTicket(ticket.id)} className={`${styles.ticketItem} ${selectedId === ticket.id ? styles.ticketActive : ""}`}>
                <div><b>#{ticket.id}</b><span>{ticket.priority_label ?? "—"}</span></div>
                <strong>{ticket.subject}</strong>
                <small>{ticket.requester_name ?? ticket.requester_email ?? "Demandeur inconnu"} · {ticket.group_name ?? "Non assigné"}</small>
              </button>
            ))}
            {!filteredTickets.length && !busy ? <p className={styles.empty}>Aucun ticket dans cette page.</p> : null}
          </div>
        </aside>

        <section className={styles.ticketPanel}>
          {!selectedTicket ? (
            <div className={styles.emptyState}><span className="material-symbols-outlined">support_agent</span><h2>Sélectionne un ticket</h2><p>Le Copilote chargera son contexte Freshservice réel, puis tu pourras l'analyser, le reformuler et préparer une mise à jour contrôlée.</p></div>
          ) : (
            <>
              <div className={styles.ticketHeader}>
                <div><small>#{selectedTicket.id} · {selectedTicket.ticket_type ?? "Ticket"}</small><h2>{selectedTicket.subject}</h2><p>{selectedTicket.requester_name ?? selectedTicket.requester_email ?? "Demandeur inconnu"}</p></div>
                <button className={styles.primary} onClick={() => void analyze()} disabled={busy === "analysis"}><span className="material-symbols-outlined">auto_awesome</span>Analyser avec le Copilote</button>
              </div>

              <div className={styles.ticketMeta}>
                <div><small>Statut</small><b>{selectedTicket.status_label}</b></div>
                <div><small>Priorité</small><b>{selectedTicket.priority_label}</b></div>
                <div><small>Groupe</small><b>{selectedTicket.group_name ?? "Non assigné"}</b></div>
                <div><small>Agent</small><b>{selectedTicket.responder_name ?? "—"}</b></div>
                <div><small>Échéance</small><b>{formatDate(selectedTicket.due_by)}</b></div>
              </div>

              <article className={styles.description}><h3>Description Freshservice</h3><p>{selectedTicket.description_text || "Aucune description texte."}</p></article>

              {analysis ? (
                <div className={styles.analysisGrid}>
                  <article className={styles.card}><div className={styles.cardTitle}><h3>Compréhension du ticket</h3><span>{Math.round(analysis.confidence * 100)} %</span></div><p>{analysis.summary}</p><small>Mode : {analysis.mode === "openai" ? `LLM ${analysis.model}` : "bootstrap sans LLM"}</small></article>
                  <article className={styles.card}><h3>Prochaine meilleure action</h3><p>{analysis.next_best_action}</p><div className={styles.evidence}>{analysis.evidence.map((item) => <span key={item}>{item}</span>)}</div></article>
                  <article className={styles.card}><h3>Informations manquantes</h3>{analysis.missing_information.length ? <ul>{analysis.missing_information.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Aucune information critique manquante détectée.</p>}</article>
                  <article className={styles.card}><h3>Brouillon de réponse</h3><p>{analysis.draft_reply}</p><button className={styles.secondary} onClick={() => void speak(analysis.draft_reply)}>Lire à voix haute</button></article>
                  <article className={`${styles.card} ${styles.wide}`}><h3>Description améliorée</h3><textarea value={editable?.description ?? ""} onChange={(event) => setEditable((current) => current ? { ...current, description: event.target.value } : current)} rows={8} /></article>
                  <article className={`${styles.card} ${styles.wide}`}>
                    <h3>Classification et propriétés proposées</h3>
                    <div className={styles.formGrid}>
                      <label>Priorité<select value={editable?.priority ?? 1} onChange={(event) => setEditable((current) => current ? { ...current, priority: Number(event.target.value) } : current)}><option value={1}>Faible</option><option value={2}>Moyenne</option><option value={3}>Élevée</option><option value={4}>Urgente</option></select></label>
                      <label>Groupe<select value={editable?.group_id ?? ""} onChange={(event) => setEditable((current) => current ? { ...current, group_id: event.target.value ? Number(event.target.value) : null } : current)}><option value="">Non assigné</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
                      <label>Catégorie<input value={editable?.category ?? ""} onChange={(event) => setEditable((current) => current ? { ...current, category: event.target.value } : current)} /></label>
                      <label>Sous-catégorie<input value={editable?.sub_category ?? ""} onChange={(event) => setEditable((current) => current ? { ...current, sub_category: event.target.value } : current)} /></label>
                      <label>Élément<input value={editable?.item_category ?? ""} onChange={(event) => setEditable((current) => current ? { ...current, item_category: event.target.value } : current)} /></label>
                    </div>
                    <div className={styles.actions}><button className={styles.primary} onClick={() => void createPreview()}>Prévisualiser Avant / Après</button></div>
                  </article>
                </div>
              ) : null}

              {context?.ticket.assets?.length ? <article className={styles.card}><h3>Assets associés</h3>{context.ticket.assets.map((asset, index) => <p key={index}><b>{firstValue(asset, ["name", "display_name", "asset_tag"])}</b> · {firstValue(asset, ["display_id", "asset_tag", "serial_number"])}</p>)}</article> : null}
            </>
          )}
        </section>

        <aside className={styles.rightRail}>
          <div className={styles.panelTitle}><strong>Visual Intelligence</strong><span>LIVE</span></div>
          <textarea value={visualPrompt} onChange={(event) => setVisualPrompt(event.target.value)} rows={4} />
          <button className={styles.primary} onClick={() => void createVisualization()}>Créer le visuel</button>
          <div className={styles.quickPrompts}>
            {["Tickets par priorité", "Tickets par catégorie", "Évolution des tickets", "Tickets à risque SLA par groupe"].map((item) => <button key={item} onClick={() => void createVisualization(item)}>{item}</button>)}
          </div>
          <hr />
          <h3>Demandeur</h3><p>{firstValue(context?.requester, ["name", "first_name", "primary_email"])}</p>
          <h3>Créé</h3><p>{formatDate(selectedTicket?.created_at)}</p>
          <h3>Mis à jour</h3><p>{formatDate(selectedTicket?.updated_at)}</p>
          <h3>Source</h3><p>{selectedTicket?.source_label ?? "—"}</p>
          <h3>Taxonomie</h3><p>{selectedTicket ? `${selectedTicket.category ?? "—"} › ${selectedTicket.sub_category ?? "—"} › ${selectedTicket.item_category ?? "—"}` : "—"}</p>
        </aside>
      </div>

      {preview ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Prévisualisation des modifications">
          <div className={styles.modal}>
            <div className={styles.modalHeader}><div><small>{preview.policy_id} · validation humaine obligatoire</small><h2>Avant / Après — ticket #{preview.ticket_id}</h2></div><button onClick={() => setPreview(null)}>×</button></div>
            <div className={styles.diffGrid}>
              <div><h3>Avant</h3>{preview.changed_fields.map((field) => <div key={field}><small>{field}</small><p>{asText(preview.before[field])}</p></div>)}</div>
              <div><h3>Après</h3>{preview.changed_fields.map((field) => <div key={field}><small>{field}</small><p>{asText(preview.after[field])}</p></div>)}</div>
            </div>
            {!preview.changed_fields.length ? <p>Aucun changement détecté.</p> : null}
            <div className={styles.modalActions}><button className={styles.secondary} onClick={() => setPreview(null)}>Revenir modifier</button><button className={styles.danger} onClick={() => void execute()} disabled={!preview.changed_fields.length || busy === "execute"}>Valider et mettre à jour Freshservice</button></div>
            {!status?.freshservice_writes_enabled ? <p className={styles.warning}>L'écriture est actuellement désactivée côté backend. Active `FRESHSERVICE_WRITE_ENABLED=true` uniquement après validation de tes tests de lecture et de preview.</p> : null}
          </div>
        </div>
      ) : null}

      {viz ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Visualisation D-Clic">
          <div className={`${styles.modal} ${styles.vizModal}`}>
            <div className={styles.modalHeader}><div><small>{viz.scope} · {viz.ticket_count} tickets</small><h2>{viz.title}</h2><p>{viz.subtitle}</p></div><button onClick={() => setViz(null)}>×</button></div>
            <div className={styles.chartArea}>
              {viz.kind === "bar" ? viz.data.map((item) => <div className={styles.barRow} key={item.label}><span>{item.label}</span><div><i style={{ width: `${Math.max(2, (item.value / maxViz) * 100)}%` }} /></div><b>{item.value:g}</b></div>) : null}
              {viz.kind === "donut" ? <div className={styles.donutWrap}><div className={styles.donut}><b>{viz.ticket_count}</b><span>tickets</span></div><div>{viz.data.map((item) => <p key={item.label}><span>{item.label}</span><b>{item.value}</b></p>)}</div></div> : null}
              {viz.kind === "line" ? <div className={styles.lineChart}><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={linePoints} fill="none" vectorEffect="non-scaling-stroke" /></svg><div>{viz.data.map((item) => <span key={item.label}>{item.label}<b>{item.value}</b></span>)}</div></div> : null}
              {viz.kind === "heatmap" ? <div className={styles.heatmap}>{viz.data.map((item) => <div key={item.label} style={{ opacity: .25 + (item.value / maxViz) * .75 }}><span>{item.label}</span><b>{item.value}</b></div>)}</div> : null}
            </div>
            <div className={styles.insights}><h3>Lecture D-Clic</h3>{viz.insights.map((item) => <p key={item}>{item}</p>)}</div>
            <div className={styles.vizFollow}><input value={visualPrompt} onChange={(event) => setVisualPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createVisualization(); }} /><button className={styles.primary} onClick={() => void createVisualization()}>Modifier le visuel</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
