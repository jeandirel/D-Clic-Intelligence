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
  group_id?: number | null;
  group_name?: string | null;
  responder_id?: number | null;
  responder_name?: string | null;
  category?: string | null;
  sub_category?: string | null;
  item_category?: string | null;
  due_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  assets?: Array<Record<string, unknown>>;
};

type Context = {
  ticket: Ticket;
  conversations: Array<Record<string, unknown>>;
  requester?: Record<string, unknown> | null;
  groups: Array<Record<string, unknown>>;
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

type Editable = {
  description: string;
  priority: number;
  group_id: number | null;
  category: string;
  sub_category: string;
  item_category: string;
};

type Preview = {
  ticket_id: number;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  changed_fields: string[];
  policy_id: string;
};

type Viz = {
  title: string;
  subtitle: string;
  kind: "bar" | "line" | "donut" | "heatmap";
  unit: string;
  data: Array<{ label: string; value: number }>;
  insights: string[];
  ticket_count: number;
  scope: string;
};

type Status = {
  freshservice_configured: boolean;
  freshservice_writes_enabled: boolean;
  llm_configured: boolean;
  llm_model?: string | null;
  speech_configured: boolean;
  speech_voice: string;
  speech_language: string;
};

type SpeechToken = {
  token: string;
  region: string;
  language: string;
  voice: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const api = (path: string) => `${API_BASE}/api/v1${path}`;

const VOICES = [
  ["fr-FR-DeniseNeural", "Denise · française · féminine"],
  ["fr-FR-HenriNeural", "Henri · français · masculine"],
  ["fr-FR-VivienneMultilingualNeural", "Vivienne · multilingue · féminine"],
  ["fr-FR-RemyMultilingualNeural", "Rémy · multilingue · masculine"],
] as const;

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { detail?: unknown } & Record<string, unknown>;
  if (!response.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : `Erreur HTTP ${response.status}`;
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
  const [visualPrompt, setVisualPrompt] = useState("Tickets par groupe sur les 30 derniers jours");
  const [message, setMessage] = useState("Connexion au Copilote…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [voice, setVoice] = useState("fr-FR-DeniseNeural");
  const [voiceReplies, setVoiceReplies] = useState(false);

  const ticket = context?.ticket ?? tickets.find((item) => item.id === selectedId) ?? null;
  const groups = useMemo(
    () => (context?.groups ?? [])
      .map((item) => ({ id: Number(item.id), name: String(item.name ?? item.id) }))
      .filter((item) => Number.isFinite(item.id)),
    [context],
  );

  const loadTickets = useCallback(async (filterQuery?: string) => {
    setBusy("tickets");
    setError("");
    try {
      const url = filterQuery
        ? `${api("/copilot/tickets/filter")}?query=${encodeURIComponent(filterQuery)}`
        : `${api("/copilot/tickets")}?page=1&per_page=50`;
      const response = await fetch(url, { cache: "no-store" });
      const result = await readJson<{ tickets: Ticket[] }>(response);
      setTickets(result.tickets);
      setMessage(`${result.tickets.length} tickets Freshservice chargés.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Impossible de charger Freshservice.");
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
      const result = await readJson<Context>(response);
      setContext(result);
      setEditable({
        description: result.ticket.description_text || "",
        priority: result.ticket.priority || 1,
        group_id: result.ticket.group_id ?? null,
        category: result.ticket.category || "",
        sub_category: result.ticket.sub_category || "",
        item_category: result.ticket.item_category || "",
      });
      setMessage(`Ticket #${ticketId} chargé depuis Freshservice.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Impossible d'ouvrir le ticket.");
    } finally {
      setBusy("");
    }
  }, []);

  const speechToken = useCallback(async (): Promise<SpeechToken> => {
    const response = await fetch(api("/copilot/voice/token"), { method: "POST" });
    return readJson<SpeechToken>(response);
  }, []);

  const speak = useCallback(async (text: string, force = false) => {
    if ((!voiceReplies && !force) || !status?.speech_configured || !text.trim()) return;
    try {
      const token = await speechToken();
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token.token, token.region);
      speechConfig.speechSynthesisLanguage = token.language;
      speechConfig.speechSynthesisVoiceName = voice;
      const synthesizer = new sdk.SpeechSynthesizer(
        speechConfig,
        sdk.AudioConfig.fromDefaultSpeakerOutput(),
      );
      await new Promise<void>((resolve, reject) => {
        synthesizer.speakTextAsync(
          text,
          () => { synthesizer.close(); resolve(); },
          (reason) => { synthesizer.close(); reject(new Error(String(reason))); },
        );
      });
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "La synthèse vocale a échoué.");
    }
  }, [speechToken, status?.speech_configured, voice, voiceReplies]);

  const analyze = useCallback(async () => {
    if (!selectedId) { setMessage("Sélectionne d'abord un ticket."); return; }
    setBusy("analysis");
    setError("");
    try {
      const response = await fetch(api("/copilot/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: selectedId, actor_id: "copilot-web-user" }),
      });
      const result = await readJson<Analysis>(response);
      setAnalysis(result);
      setEditable((current) => ({
        description: result.improved_description || current?.description || "",
        priority: result.suggested_priority ?? current?.priority ?? 1,
        group_id: result.suggested_group_id ?? current?.group_id ?? null,
        category: result.suggested_category ?? current?.category ?? "",
        sub_category: result.suggested_sub_category ?? current?.sub_category ?? "",
        item_category: result.suggested_item_category ?? current?.item_category ?? "",
      }));
      const spoken = `Analyse terminée. Confiance ${Math.round(result.confidence * 100)} pour cent. ${result.next_best_action}`;
      setMessage(spoken);
      void speak(spoken);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "L'analyse a échoué.");
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
        body: JSON.stringify({ ticket_id: selectedId, actor_id: "copilot-web-user", ...editable }),
      });
      const result = await readJson<Preview>(response);
      setPreview(result);
      setMessage(`${result.changed_fields.length} modification(s) à valider.`);
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
      const response = await fetch(api("/copilot/execute"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: selectedId,
          actor_id: "copilot-web-user",
          command_id: `copilot-${selectedId}-${Date.now()}`,
          approved: true,
          ...editable,
          reason: "Modification validée humainement dans D-Clic Copilote Agent",
        }),
      });
      const result = await readJson<{ status: string; verified: boolean; dry_run: boolean }>(response);
      if (result.dry_run) {
        setMessage("Validation acceptée, mais l'écriture Freshservice est désactivée côté backend.");
      } else if (result.verified) {
        setPreview(null);
        setMessage("Freshservice mis à jour puis relu : modification vérifiée.");
        await selectTicket(selectedId);
      } else {
        setMessage(`Commande terminée : ${result.status}.`);
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
      const result = await readJson<Viz>(response);
      setVisualPrompt(prompt);
      setViz(result);
      setMessage(`Visuel généré depuis ${result.ticket_count} tickets Freshservice.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "La visualisation a échoué.");
    } finally {
      setBusy("");
    }
  }, [visualPrompt]);

  const runCommand = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const normalized = text.toLowerCase();
    const idMatch = text.match(/(?:#|inc-|sr-)?(\d{4,})/i);
    setCommand("");

    if (/visuel|graph|courbe|répartition|repartition/.test(normalized)) {
      await createVisualization(text);
      return;
    }
    if (idMatch && /ouvre|ticket|sélection|selection/.test(normalized)) {
      await selectTicket(Number(idMatch[1]));
      return;
    }
    if (/non assign/.test(normalized)) { await loadTickets("agent_id:null"); return; }
    if (/urgent/.test(normalized)) { await loadTickets("priority:4"); return; }
    if (/en attente/.test(normalized)) { await loadTickets("status:3"); return; }
    if (/ouvert/.test(normalized)) { await loadTickets("status:2"); return; }
    if (/analyse|résume|resume/.test(normalized)) { await analyze(); return; }
    if (/prévisual|previsual|avant.*après|avant.*apres/.test(normalized)) { await createPreview(); return; }

    const found = tickets.find((item) =>
      (item.requester_name ?? "").toLowerCase().includes(normalized) ||
      item.subject.toLowerCase().includes(normalized),
    );
    if (found) { await selectTicket(found.id); return; }
    setMessage("Commande non résolue. Essaie un ID, « tickets non assignés », « analyse ce ticket » ou « crée un visuel par groupe ». ");
  }, [analyze, createPreview, createVisualization, loadTickets, selectTicket, tickets]);

  const listen = useCallback(async () => {
    if (!status?.speech_configured) { setError("Azure Speech n'est pas configuré sur le backend."); return; }
    setBusy("voice");
    setError("");
    try {
      const token = await speechToken();
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token.token, token.region);
      speechConfig.speechRecognitionLanguage = token.language;
      const recognizer = new sdk.SpeechRecognizer(
        speechConfig,
        sdk.AudioConfig.fromDefaultMicrophoneInput(),
      );
      const recognizedText = await new Promise<string>((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => { recognizer.close(); resolve(result.text ?? ""); },
          (reason) => { recognizer.close(); reject(new Error(String(reason))); },
        );
      });
      if (!recognizedText.trim()) setMessage("Je n'ai pas compris la commande vocale.");
      else { setCommand(recognizedText); await runCommand(recognizedText); }
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "La reconnaissance vocale a échoué.");
    } finally {
      setBusy("");
    }
  }, [runCommand, speechToken, status?.speech_configured]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(api("/copilot/status"), { cache: "no-store" });
        const result = await readJson<Status>(response);
        setStatus(result);
        setVoice(result.speech_voice || "fr-FR-DeniseNeural");
        if (result.freshservice_configured) await loadTickets();
        else setError("Freshservice n'est pas configuré sur le backend D-Clic.");
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Backend D-Clic indisponible.");
      }
    })();
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    const query = ticketSearch.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((item) =>
      String(item.id).includes(query) ||
      item.subject.toLowerCase().includes(query) ||
      (item.requester_name ?? "").toLowerCase().includes(query) ||
      (item.group_name ?? "").toLowerCase().includes(query),
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
        <div><i className={status?.freshservice_configured ? styles.okDot : styles.badDot} />Freshservice {status?.freshservice_configured ? "connecté" : "non configuré"}</div>
        <div><i className={status?.llm_configured ? styles.okDot : styles.warnDot} />IA {status?.llm_configured ? status.llm_model : "bootstrap"}</div>
        <div><i className={status?.speech_configured ? styles.okDot : styles.warnDot} />Voix {status?.speech_configured ? "Azure Speech" : "non configurée"}</div>
        <div><i className={status?.freshservice_writes_enabled ? styles.okDot : styles.warnDot} />Écriture {status?.freshservice_writes_enabled ? "activée" : "désactivée"}</div>
      </div>

      {error ? <div className={styles.error}><strong>Erreur :</strong> {error}</div> : null}
      <div className={styles.message}>{busy ? "Traitement en cours…" : message}</div>

      <div className={styles.commandBar}>
        <button className={styles.micButton} onClick={() => void listen()} disabled={busy === "voice"} title="Parler au Copilote"><span className="material-symbols-outlined">mic</span></button>
        <input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runCommand(command); }} placeholder="Ouvre le ticket 157104 · Analyse ce ticket · Crée un visuel…" />
        <button className={styles.primary} onClick={() => void runCommand(command)}>Envoyer</button>
        <select value={voice} onChange={(event) => setVoice(event.target.value)} aria-label="Choisir la voix du Copilote">{VOICES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <label className={styles.voiceToggle}><input type="checkbox" checked={voiceReplies} onChange={(event) => setVoiceReplies(event.target.checked)} /> Réponses vocales</label>
      </div>

      <div className={styles.mainGrid}>
        <aside className={styles.ticketList}>
          <div className={styles.panelTitle}><strong>Tickets Freshservice</strong><button onClick={() => void loadTickets()} title="Actualiser"><span className="material-symbols-outlined">refresh</span></button></div>
          <input className={styles.search} value={ticketSearch} onChange={(event) => setTicketSearch(event.target.value)} placeholder="Filtrer la page…" />
          <div className={styles.ticketScroller}>
            {filteredTickets.map((item) => <button key={item.id} onClick={() => void selectTicket(item.id)} className={`${styles.ticketItem} ${selectedId === item.id ? styles.ticketActive : ""}`}><div><b>#{item.id}</b><span>{item.priority_label ?? "—"}</span></div><strong>{item.subject}</strong><small>{item.requester_name ?? item.requester_email ?? "Demandeur inconnu"} · {item.group_name ?? "Non assigné"}</small></button>)}
            {!filteredTickets.length && !busy ? <p className={styles.empty}>Aucun ticket sur cette page.</p> : null}
          </div>
        </aside>

        <section className={styles.ticketPanel}>
          {!ticket ? <div className={styles.emptyState}><span className="material-symbols-outlined">support_agent</span><h2>Sélectionne un ticket</h2><p>Le Copilote chargera son contexte Freshservice réel puis préparera les recommandations sans modifier le ticket avant validation.</p></div> : <>
            <div className={styles.ticketHeader}><div><small>#{ticket.id} · {ticket.ticket_type ?? "Ticket"}</small><h2>{ticket.subject}</h2><p>{ticket.requester_name ?? ticket.requester_email ?? "Demandeur inconnu"}</p></div><button className={styles.primary} onClick={() => void analyze()}><span className="material-symbols-outlined">auto_awesome</span>Analyser avec le Copilote</button></div>
            <div className={styles.ticketMeta}><div><small>Statut</small><b>{ticket.status_label ?? "—"}</b></div><div><small>Priorité</small><b>{ticket.priority_label ?? "—"}</b></div><div><small>Groupe</small><b>{ticket.group_name ?? "Non assigné"}</b></div><div><small>Agent</small><b>{ticket.responder_name ?? "—"}</b></div><div><small>Échéance</small><b>{formatDate(ticket.due_by)}</b></div></div>
            <article className={styles.description}><h3>Description Freshservice</h3><p>{ticket.description_text || "Aucune description texte."}</p></article>

            {analysis && editable ? <div className={styles.analysisGrid}>
              <article className={styles.card}><div className={styles.cardTitle}><h3>Compréhension du ticket</h3><span>{Math.round(analysis.confidence * 100)} %</span></div><p>{analysis.summary}</p><small>{analysis.mode === "openai" ? `IA : ${analysis.model}` : "Mode bootstrap : données réelles, LLM non configuré"}</small></article>
              <article className={styles.card}><h3>Prochaine meilleure action</h3><p>{analysis.next_best_action}</p><div className={styles.evidence}>{analysis.evidence.map((item) => <span key={item}>{item}</span>)}</div></article>
              <article className={styles.card}><h3>Informations manquantes</h3>{analysis.missing_information.length ? <ul>{analysis.missing_information.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Aucune information critique manquante détectée.</p>}</article>
              <article className={styles.card}><h3>Brouillon de réponse</h3><p>{analysis.draft_reply}</p><button className={styles.secondary} onClick={() => void speak(analysis.draft_reply, true)}>Lire à voix haute</button></article>
              <article className={`${styles.card} ${styles.wide}`}><h3>Description améliorée</h3><textarea rows={8} value={editable.description} onChange={(event) => setEditable({ ...editable, description: event.target.value })} /></article>
              <article className={`${styles.card} ${styles.wide}`}><h3>Propriétés proposées</h3><div className={styles.formGrid}>
                <label>Priorité<select value={editable.priority} onChange={(event) => setEditable({ ...editable, priority: Number(event.target.value) })}><option value={1}>Faible</option><option value={2}>Moyenne</option><option value={3}>Élevée</option><option value={4}>Urgente</option></select></label>
                <label>Groupe<select value={editable.group_id ?? ""} onChange={(event) => setEditable({ ...editable, group_id: event.target.value ? Number(event.target.value) : null })}><option value="">Non assigné</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
                <label>Catégorie<input value={editable.category} onChange={(event) => setEditable({ ...editable, category: event.target.value })} /></label>
                <label>Sous-catégorie<input value={editable.sub_category} onChange={(event) => setEditable({ ...editable, sub_category: event.target.value })} /></label>
                <label>Élément<input value={editable.item_category} onChange={(event) => setEditable({ ...editable, item_category: event.target.value })} /></label>
              </div><div className={styles.actions}><button className={styles.primary} onClick={() => void createPreview()}>Prévisualiser Avant / Après</button></div></article>
            </div> : null}

            {context?.ticket.assets?.length ? <article className={styles.card}><h3>Assets associés</h3>{context.ticket.assets.map((asset, index) => <p key={index}>{displayValue(asset.name ?? asset.display_name ?? asset.asset_tag ?? asset)}</p>)}</article> : null}
          </>}
        </section>

        <aside className={styles.rightRail}>
          <div className={styles.panelTitle}><strong>Visual Intelligence</strong><span>LIVE</span></div>
          <textarea rows={4} value={visualPrompt} onChange={(event) => setVisualPrompt(event.target.value)} />
          <button className={styles.primary} onClick={() => void createVisualization()}>Créer le visuel</button>
          <div className={styles.quickPrompts}>{["Tickets par priorité", "Tickets par catégorie", "Évolution des tickets", "Tickets à risque SLA par groupe"].map((item) => <button key={item} onClick={() => void createVisualization(item)}>{item}</button>)}</div>
          <hr /><h3>Source</h3><p>{ticket?.source_label ?? "—"}</p><h3>Créé</h3><p>{formatDate(ticket?.created_at)}</p><h3>Mis à jour</h3><p>{formatDate(ticket?.updated_at)}</p><h3>Taxonomie</h3><p>{ticket ? `${ticket.category ?? "—"} › ${ticket.sub_category ?? "—"} › ${ticket.item_category ?? "—"}` : "—"}</p>
        </aside>
      </div>

      {preview ? <div className={styles.modalBackdrop} role="dialog" aria-modal="true"><div className={styles.modal}><div className={styles.modalHeader}><div><small>{preview.policy_id} · validation humaine obligatoire</small><h2>Avant / Après — ticket #{preview.ticket_id}</h2></div><button onClick={() => setPreview(null)}>×</button></div><div className={styles.diffGrid}><div><h3>Avant</h3>{preview.changed_fields.map((field) => <div key={field}><small>{field}</small><p>{displayValue(preview.before[field])}</p></div>)}</div><div><h3>Après</h3>{preview.changed_fields.map((field) => <div key={field}><small>{field}</small><p>{displayValue(preview.after[field])}</p></div>)}</div></div><div className={styles.modalActions}><button className={styles.secondary} onClick={() => setPreview(null)}>Revenir modifier</button><button className={styles.danger} disabled={!preview.changed_fields.length} onClick={() => void execute()}>Valider et mettre à jour Freshservice</button></div>{!status?.freshservice_writes_enabled ? <p className={styles.warning}>Écriture désactivée : conserve `FRESHSERVICE_WRITE_ENABLED=false` jusqu'à validation des lectures et previews, puis active-la sur le backend.</p> : null}</div></div> : null}

      {viz ? <div className={styles.modalBackdrop} role="dialog" aria-modal="true"><div className={`${styles.modal} ${styles.vizModal}`}><div className={styles.modalHeader}><div><small>{viz.scope} · {viz.ticket_count} tickets</small><h2>{viz.title}</h2><p>{viz.subtitle}</p></div><button onClick={() => setViz(null)}>×</button></div><div className={styles.chartArea}>
        {viz.kind === "bar" ? viz.data.map((item) => <div className={styles.barRow} key={item.label}><span>{item.label}</span><div><i style={{ width: `${Math.max(2, (item.value / maxViz) * 100)}%` }} /></div><b>{item.value.toLocaleString("fr-FR")}</b></div>) : null}
        {viz.kind === "donut" ? <div className={styles.donutWrap}><div className={styles.donut}><b>{viz.ticket_count}</b><span>tickets</span></div><div>{viz.data.map((item) => <p key={item.label}><span>{item.label}</span><b>{item.value.toLocaleString("fr-FR")}</b></p>)}</div></div> : null}
        {viz.kind === "line" ? <div className={styles.lineChart}><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={linePoints} fill="none" vectorEffect="non-scaling-stroke" /></svg><div>{viz.data.map((item) => <span key={item.label}>{item.label}<b>{item.value.toLocaleString("fr-FR")}</b></span>)}</div></div> : null}
        {viz.kind === "heatmap" ? <div className={styles.heatmap}>{viz.data.map((item) => <div key={item.label} style={{ opacity: .25 + (item.value / maxViz) * .75 }}><span>{item.label}</span><b>{item.value.toLocaleString("fr-FR")}</b></div>)}</div> : null}
      </div><div className={styles.insights}><h3>Lecture D-Clic</h3>{viz.insights.map((item) => <p key={item}>{item}</p>)}</div><div className={styles.vizFollow}><input value={visualPrompt} onChange={(event) => setVisualPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createVisualization(); }} /><button className={styles.primary} onClick={() => void createVisualization()}>Modifier le visuel</button></div></div></div> : null}
    </div>
  );
}
