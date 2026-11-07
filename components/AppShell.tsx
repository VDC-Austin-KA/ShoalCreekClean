"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo, cx } from "./ui";

export type NavItem = { href: string; label: string; icon: string };

export function AppShell({ nav, user, children, home }: { nav: NavItem[]; user: { name: string; role: string }; children: ReactNode; home: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === home ? path === h : path.startsWith(h));
  const links = (
    <nav className="flex flex-col gap-1">
      {nav.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
          className={cx("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ease-(--ease-spring)",
            active(n.href) ? "bg-accent/10 text-accent" : "text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:translate-x-0.5")}>
          <span className="w-5 text-center text-base">{n.icon}</span>{n.label}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="no-print sticky top-0 hidden h-dvh flex-col gap-6 border-r border-white/5 bg-ink-950/60 p-4 backdrop-blur-xl lg:flex">
        <div className="px-2 pt-1"><Logo href={home} /></div>
        {links}
        <UserBox user={user} />
      </aside>
      <header className="no-print sticky top-0 z-[1000] flex items-center justify-between border-b border-white/5 bg-ink-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo href={home} />
        <button aria-label="Menu" className="btn-ghost btn-sm" onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
      </header>
      <div className={cx("fixed inset-x-0 top-[57px] z-[999] origin-top border-b border-white/5 bg-ink-950/95 p-4 backdrop-blur-xl transition-all duration-500 ease-(--ease-spring) lg:hidden",
        open ? "scale-y-100 opacity-100" : "pointer-events-none scale-y-95 opacity-0")}>
        {links}<div className="mt-4"><UserBox user={user} /></div>
      </div>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}

function UserBox({ user }: { user: { name: string; role: string } }) {
  return (
    <div className="mt-auto rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="truncate text-sm font-medium text-slate-200">{user.name}</div>
      <div className="text-xs capitalize text-slate-500">{user.role}</div>
      <form action="/api/auth/logout" method="post"><button className="mt-2 text-xs text-slate-400 hover:text-accent">Sign out →</button></form>
    </div>
  );
}
