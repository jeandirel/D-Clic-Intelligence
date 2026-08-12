import { AppShell } from "../../components/AppShell";
import { DemoCenter } from "../../components/DemoCenter";

export default function DemoPage() {
  return (
    <AppShell section="command" title="Démo fonctionnelle" searchPlaceholder="Rechercher un scénario...">
      <DemoCenter />
    </AppShell>
  );
}
