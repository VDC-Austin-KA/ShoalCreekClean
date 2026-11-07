import { AppShell } from "@/components/AppShell";
import { requirePage } from "@/lib/auth";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const s = await requirePage(["client"]);
  return (
    <AppShell home="/client" user={{ name: s.name, role: "Client" }}
      nav={[{ href: "/client", label: "My services", icon: "◎" }, { href: "/client/billing", label: "Billing", icon: "$" }, { href: "/quote", label: "New quote", icon: "+" }]}>
      {children}
    </AppShell>
  );
}
