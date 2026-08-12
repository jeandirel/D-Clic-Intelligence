import { AppShell } from "../../components/AppShell";
import { DemoCenter } from "../../components/DemoCenter";

export default function DemoPage() {
  return (
    <AppShell section="command" title="Mode démonstration" searchPlaceholder="Rechercher un scénario...">
      <DemoCenter />
    </AppShell>
  );
}
