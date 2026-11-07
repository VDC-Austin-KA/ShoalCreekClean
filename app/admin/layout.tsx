import { AppShell } from "@/components/AppShell";
import { requirePage } from "@/lib/auth";
import { STAFF } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requirePage(STAFF);
  return (
    <AppShell home="/admin" user={{ name: s.name, role: s.role }} nav={[
      { href: "/admin", label: "Overview", icon: "◎" },
      { href: "/admin/dispatch", label: "Dispatch board", icon: "▦" },
      { href: "/admin/planner", label: "Resource planner", icon: "⚙" },
      { href: "/admin/map", label: "Coverage map", icon: "⌖" },
      { href: "/admin/crm", label: "CRM pipeline", icon: "◧" },
      { href: "/admin/campaigns", label: "Email campaigns", icon: "✉" },
      { href: "/admin/competitors", label: "Competitor intel", icon: "◐" },
      { href: "/admin/strategy", label: "Strategy generator", icon: "✦" },
      { href: "/admin/pricing", label: "Price book", icon: "$" },
      { href: "/admin/outbox", label: "Outbox", icon: "⇪" },
      { href: "/field", label: "Field view", icon: "☖" },
    ]}>{children}</AppShell>
  );
}
