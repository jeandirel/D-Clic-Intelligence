const kpis = [
  { label: "Tickets ouverts", value: "1 284", delta: "+3,8%" },
  { label: "SLA à risque", value: "74", delta: "19 critiques" },
  { label: "Clusters détectés", value: "7", delta: "3 nouveaux" },
  { label: "Actions IA", value: "312", delta: "91% approuvées" },
];

const priorities = [
  { id: "INC-18492", title: "VPN impossible après changement de mot de passe", risk: 94, team: "Workplace" },
  { id: "INC-18471", title: "Outlook ne démarre plus sur plusieurs postes", risk: 88, team: "Support N2" },
  { id: "INC-18433", title: "Accès ERP intermittent — site Rouen", risk: 82, team: "Réseau" },
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">D</span><div><strong>D-Clic</strong><small>Intelligence</small></div></div>
        <nav>
          {['Command Center','Ticket Intelligence','SLA Risk','Incident Radar','Workload','Knowledge','AI Actions','API Control','Models','Audit'].map((item, index) => (
            <a className={index === 0 ? 'active' : ''} href="#" key={item}><span>{String(index + 1).padStart(2,'0')}</span>{item}</a>
          ))}
        </nav>
        <div className="sideFooter"><span className="statusDot" /> Freshservice Gateway prêt</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">SERVICEOPS / LIVE COMMAND</p><h1>Command Center</h1></div>
          <div className="topActions"><button className="ghost">Mode observation</button><button className="primary">+ Nouvelle analyse</button></div>
        </header>

        <section className="hero">
          <div><span className="badge">AI SERVICEOPS</span><h2>Le Service Desk ne doit plus seulement réagir.<br/><em>Il doit anticiper.</em></h2><p>D-Clic observe Freshservice, détecte les risques, recommande la prochaine action et garde l’humain au contrôle.</p></div>
          <div className="heroScore"><span>État opérationnel</span><strong>92</strong><small>/ 100 — Stable</small></div>
        </section>

        <section className="grid4">
          {kpis.map((kpi) => <article className="metric" key={kpi.label}><span>{kpi.label}</span><strong>{kpi.value}</strong><small>{kpi.delta}</small></article>)}
        </section>

        <section className="mainGrid">
          <article className="panel priorityPanel">
            <div className="panelHead"><div><span className="eyebrow">NEXT BEST ACTION</span><h3>Priorités recommandées</h3></div><button className="ghost small">Voir tout</button></div>
            <div className="ticketList">
              {priorities.map((ticket) => <div className="ticket" key={ticket.id}><div className="risk"><strong>{ticket.risk}%</strong><span>risque SLA</span></div><div className="ticketBody"><span>{ticket.id} · {ticket.team}</span><h4>{ticket.title}</h4><p>Analyse contextuelle disponible · validation humaine requise avant action.</p></div><button className="arrow">→</button></div>)}
            </div>
          </article>

          <article className="panel radar">
            <div className="panelHead"><div><span className="eyebrow">INCIDENT RADAR</span><h3>Signal émergent</h3></div><span className="live">LIVE</span></div>
            <div className="radarVisual"><div className="orbit o1"/><div className="orbit o2"/><div className="pulse"/><span className="node n1"/><span className="node n2"/><span className="node n3"/></div>
            <div className="signal"><strong>VPN / Rouen</strong><span>47 tickets similaires · +243%</span><p>Corrélation probable avec un changement réseau récent.</p><button className="primary full">Analyser le cluster</button></div>
          </article>
        </section>

        <section className="commandBar"><div><span className="spark">✦</span><div><strong>Demander à D-Clic</strong><p>« Trouve les tickets VPN critiques et propose un plan d’action. »</p></div></div><button>Exécuter l’analyse →</button></section>
      </section>
    </main>
  );
}
