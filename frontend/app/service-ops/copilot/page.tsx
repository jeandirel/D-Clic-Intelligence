import { AppShell } from "../../../components/AppShell";
import { CopilotWorkspace } from "../../../components/CopilotWorkspace";

const subnav = [
  { label: "Intelligence ticket", href: "/service-ops" },
  { label: "Copilote Agent", href: "/service-ops/copilot", active: true },
  { label: "Charge & capacité", href: "/service-ops/workload" },
  { label: "Connaissances", href: "/service-ops/knowledge" },
  { label: "Actions IA", href: "/service-ops/actions" },
];

export default function CopilotPage() {
  return (
    <AppShell
      section="service"
      title="D-Clic Copilote Agent"
      searchPlaceholder="Rechercher un ticket, une vue ou une commande..."
      subnav={subnav}
    >
      <CopilotWorkspace />
    </AppShell>
  );
}
