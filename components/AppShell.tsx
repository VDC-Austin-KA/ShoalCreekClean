"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo, cx } from "./ui";

export type NavItem = { href: string; label: string; icon?: string }; // icon kept for compatibility; not rendered

export function AppShell({ nav, user, children, home }: { nav: NavItem[]; user: { name: string; role: string }; children: ReactNode; home: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === home ? path === h : path.startsWith(h));
  const links = (
    <nav className="flex flex-col gap-px">
      {nav.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n.href) ? "page" : undefined}
          className={cx("relative rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150",
            active(n.href) ? "bg-ink-800 font-medium text-slate-100 before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent" : "text-slate-400 hover:bg-ink-800/60 hover:text-slate-200")}>
          {n.label}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[224px_1fr]">
      <aside className="no-print sticky top-0 hidden h-dvh flex-col gap-6 border-r border-ink-700 bg-ink-900 px-3 py-4 lg:flex">
        <div className="px-3 pt-0.5"><Logo href={home} /></div>
        {links}
        <UserBox user={user} />
      </aside>
      <header className="no-print sticky top-0 z-[1000] flex items-center justify-between border-b border-ink-700 bg-ink-900 px-4 py-3 lg:hidden">
        <Logo href={home} />
        <button aria-label="Menu" aria-expanded={open} className="btn-ghost btn-sm" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
      </header>
      <div className={cx("fixed inset-x-0 top-[57px] z-[999] border-b border-ink-700 bg-ink-900 p-3 transition-opacity duration-150 lg:hidden",
        open ? "opacity-100" : "pointer-events-none opacity-0")}>
        {links}<div className="mt-4"><UserBox user={user} /></div>
      </div>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}

function UserBox({ user }: { user: { name: string; role: string } }) {
  return (
    <div className="mt-auto border-t border-ink-700 px-3 pt-3">
      <div className="truncate text-sm font-medium text-slate-200">{user.name}</div>
      <div className="text-xs capitalize text-slate-500">{user.role}</div>
      <form action="/api/auth/logout" method="post"><button className="mt-2 text-xs text-slate-500 hover:text-slate-200">Sign out</button></form>
    </div>
  );
}
