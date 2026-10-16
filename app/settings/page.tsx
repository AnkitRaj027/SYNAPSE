"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Eye,
  HardDrive,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  Zap
} from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pointGlyphs, setPointGlyphs] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const curTheme = (localStorage.getItem("synapse-theme") as "light" | "dark") || "light";
    setTheme(curTheme);

    const isReduced = document.documentElement.classList.contains("reduce-motion");
    setReducedMotion(isReduced);

    try {
      const exps = JSON.parse(localStorage.getItem("synapse-experiments") ?? "[]");
      setItemCount(exps.length);
    } catch {
      setItemCount(0);
    }
  }, []);

  const changeTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("synapse-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    setNotice(`Switched to ${newTheme} theme`);
    setTimeout(() => setNotice(""), 2000);
  };

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    document.documentElement.classList.toggle("reduce-motion", next);
  };

  const clearAllData = () => {
    if (confirm("Reset all SYNAPSE workspace data and saved experiments?")) {
      localStorage.clear();
      setItemCount(0);
      setNotice("Workspace cache cleared successfully");
      setTimeout(() => setNotice(""), 2000);
    }
  };

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <p className="eyebrow">PREFERENCES & WORKSPACE CONFIGURATION</p>
          <h1>Settings</h1>
          <p className="lede">
            Customize the laboratory environment, switch between Light and Dark visual themes, and
            manage local browser storage.
          </p>
        </div>
      </div>

      {notice && <div className="toast">{notice}</div>}

      <div className="settings-list panel" style={{ maxWidth: "800px" }}>
        {/* Theme Settings */}
        <div className="setting-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Palette size={16} style={{ color: "var(--accent)" }} />
              <strong>Interface Theme</strong>
            </div>
            <p>
              Choose between the tactile Warm Paper light theme or the high-contrast Deep Cyber-Lab
              dark theme optimized for chart readability.
            </p>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`tab ${theme === "light" ? "active" : ""}`}
              onClick={() => changeTheme("light")}
            >
              <Sun size={13} style={{ marginRight: "4px", verticalAlign: "-2px" }} /> Light
            </button>
            <button
              className={`tab ${theme === "dark" ? "active" : ""}`}
              onClick={() => changeTheme("dark")}
            >
              <Moon size={13} style={{ marginRight: "4px", verticalAlign: "-2px" }} /> Dark
            </button>
          </div>
        </div>

        {/* Accessibility & Reduced Motion */}
        <div className="setting-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={16} style={{ color: "var(--accent)" }} />
              <strong>Reduced Motion</strong>
            </div>
            <p>Disable spring transitions, neuron pulsing, and depth effects for a calmer study environment.</p>
          </div>

          <button
            className={`tab ${reducedMotion ? "active" : ""}`}
            onClick={toggleReducedMotion}
          >
            {reducedMotion ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Accessible Glyphs */}
        <div className="setting-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Eye size={16} style={{ color: "var(--accent)" }} />
              <strong>Colorblind-Friendly Markers</strong>
            </div>
            <p>Render distinct shapes (Circles vs Squares vs Triangles) for classes alongside colors.</p>
          </div>

          <button
            className={`tab ${pointGlyphs ? "active" : ""}`}
            onClick={() => setPointGlyphs(!pointGlyphs)}
          >
            {pointGlyphs ? "Active" : "Default"}
          </button>
        </div>

        {/* Local Storage */}
        <div className="setting-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <HardDrive size={16} style={{ color: "var(--accent)" }} />
              <strong>Local Data Storage</strong>
            </div>
            <p>
              All experiments are stored locally in your browser (currently <strong>{itemCount}</strong> saved items). No data is ever transmitted to external servers.
            </p>
          </div>

          <button className="secondary danger" onClick={clearAllData}>
            Clear Storage
          </button>
        </div>

        {/* System Information */}
        <div className="setting-row" style={{ borderBottom: "none" }}>
          <div>
            <strong>SYNAPSE Lab Version</strong>
            <p>v1.2.0 · Client-side WebAssembly & Typed Mathematical Engine</p>
          </div>
          <span className="pg-run-state ready">Up to date</span>
        </div>
      </div>
    </div>
  );
}
