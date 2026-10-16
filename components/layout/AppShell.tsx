"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BrainCircuit,
  FlaskConical,
  Home,
  Library,
  Menu,
  Moon,
  Settings,
  StepForward,
  Sun,
  X,
  LucideIcon
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/playground", label: "ML Playground", icon: FlaskConical },
  { href: "/network", label: "Neural Network Studio", icon: BrainCircuit },
  { href: "/visualizer", label: "Algorithm Visualizer", icon: StepForward },
  { href: "/math", label: "Math Lab", icon: BookOpen },
  { href: "/experiments", label: "Experiments", icon: Library },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("synapse-theme") as "light" | "dark") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("synapse-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNav(false);
  }, [pathname]);

  const currentNav = NAV_ITEMS.find(
    (item) => item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href))
  ) || (pathname === "/settings" ? { label: "Settings" } : { label: "Laboratory" });

  return (
    <div className="app-shell">
      {/* Mobile Backdrop */}
      {mobileNav && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileNav(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <Link href="/" className="brand-link">
            <span className="brand-mark">S</span>
            <span className="brand-title">SYNAPSE</span>
          </Link>
          <button
            className="icon-btn mobile-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <p className="eyebrow">INTERACTIVE LABORATORY</p>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link
            href="/settings"
            className={`nav-item ${pathname === "/settings" ? "active" : ""}`}
          >
            <Settings size={17} />
            <span>Settings</span>
          </Link>

          <div className="theme-toggle-row">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {mounted && theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span>{mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>

          <div className="status">
            <span className="status-dot" /> Local workspace
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-breadcrumb">
            <span className="topbar-context">SYNAPSE</span>
            <span className="topbar-sep">/</span>
            <span className="topbar-current">{currentNav.label}</span>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-btn theme-quick-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <span className="local-badge">● SAVED LOCALLY</span>
          </div>
        </header>

        <main className="content-container">{children}</main>
      </div>
    </div>
  );
}
