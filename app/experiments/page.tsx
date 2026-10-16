"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Download,
  ExternalLink,
  Library,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react";

type Experiment = {
  id: string;
  name: string;
  algorithm: string;
  dataset: string;
  seed: number;
  epochs?: number;
  rate?: number;
  k?: number;
  threshold?: number;
  regularization?: number;
  created: string;
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("synapse-experiments");
      if (stored) {
        setExperiments(JSON.parse(stored));
      }
    } catch {
      setExperiments([]);
    }
  }, []);

  const deleteExperiment = (id: string) => {
    const next = experiments.filter((e) => e.id !== id);
    setExperiments(next);
    localStorage.setItem("synapse-experiments", JSON.stringify(next));
    setCompareIds((prev) => prev.filter((i) => i !== id));
    setNotice("Experiment deleted from shelf");
    setTimeout(() => setNotice(""), 2000);
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to clear all saved experiments?")) {
      setExperiments([]);
      localStorage.removeItem("synapse-experiments");
      setCompareIds([]);
      setNotice("All experiments cleared");
      setTimeout(() => setNotice(""), 2000);
    }
  };

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds((prev) => prev.filter((i) => i !== id));
    } else {
      if (compareIds.length >= 2) {
        setCompareIds([compareIds[1], id]); // Keep last + new
      } else {
        setCompareIds((prev) => [...prev, id]);
      }
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(experiments, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `synapse-experiments-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const combined = [...imported, ...experiments];
          setExperiments(combined);
          localStorage.setItem("synapse-experiments", JSON.stringify(combined));
          setNotice(`Imported ${imported.length} experiments successfully`);
          setTimeout(() => setNotice(""), 2200);
        }
      } catch {
        alert("Invalid JSON file format");
      }
    };
    reader.readAsText(file);
  };

  const expA = experiments.find((e) => e.id === compareIds[0]);
  const expB = experiments.find((e) => e.id === compareIds[1]);

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <p className="eyebrow">PERSISTENT LABORATORY REPOSITORY</p>
          <h1>Experiment Shelf</h1>
          <p className="lede">
            Reproduce and compare your experimental configurations. Save snapshots from the
            playground, compare side-by-side, or export them as JSON.
          </p>
        </div>

        <div className="header-actions">
          {experiments.length > 0 && (
            <>
              <button className="secondary" onClick={exportJSON}>
                <Download size={14} /> Export JSON
              </button>
              <button className="secondary danger" onClick={clearAll}>
                <Trash2 size={14} /> Clear All
              </button>
            </>
          )}
          <label className="secondary" style={{ cursor: "pointer", display: "inline-flex" }}>
            <Upload size={14} /> Import JSON
            <input type="file" accept=".json" onChange={importJSON} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {notice && <div className="toast">{notice}</div>}

      {/* Side-by-Side Comparison Card if 2 experiments selected */}
      {expA && expB && (
        <div className="panel" style={{ padding: "24px", marginBottom: "30px", border: "2px solid var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowLeftRight size={18} style={{ color: "var(--accent)" }} />
              <h3 style={{ margin: 0, fontSize: "16px" }}>Side-by-Side Experiment Comparison</h3>
            </div>
            <button className="secondary" onClick={() => setCompareIds([])} style={{ fontSize: "10px", padding: "4px 8px" }}>
              Close Comparison
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ padding: "16px", background: "var(--surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>{expA.name}</strong>
              <div className="pg-detail"><span>Algorithm</span><strong>{expA.algorithm}</strong></div>
              <div className="pg-detail"><span>Dataset</span><strong>{expA.dataset}</strong></div>
              <div className="pg-detail"><span>PRNG Seed</span><code>{expA.seed}</code></div>
              <div className="pg-detail"><span>Learning Rate</span><code>{expA.rate ?? "—"}</code></div>
              <div className="pg-detail"><span>Epochs</span><code>{expA.epochs ?? "—"}</code></div>
              <div className="pg-detail"><span>L2 Regularization</span><code>{expA.regularization ?? "0.00"}</code></div>
              <Link href="/playground" className="primary" style={{ width: "100%", marginTop: "14px" }}>
                Load in Playground
              </Link>
            </div>

            <div style={{ padding: "16px", background: "var(--surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>{expB.name}</strong>
              <div className="pg-detail"><span>Algorithm</span><strong>{expB.algorithm}</strong></div>
              <div className="pg-detail"><span>Dataset</span><strong>{expB.dataset}</strong></div>
              <div className="pg-detail"><span>PRNG Seed</span><code>{expB.seed}</code></div>
              <div className="pg-detail"><span>Learning Rate</span><code>{expB.rate ?? "—"}</code></div>
              <div className="pg-detail"><span>Epochs</span><code>{expB.epochs ?? "—"}</code></div>
              <div className="pg-detail"><span>L2 Regularization</span><code>{expB.regularization ?? "0.00"}</code></div>
              <Link href="/playground" className="primary" style={{ width: "100%", marginTop: "14px" }}>
                Load in Playground
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Experiments Table */}
      <div className="panel table-panel">
        {experiments.length ? (
          <div className="experiment-table">
            <div className="table-head">
              <span>Experiment Name & Date</span>
              <span>Algorithm</span>
              <span>Dataset</span>
              <span>Seed</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {experiments.map((e) => {
              const isCompared = compareIds.includes(e.id);
              return (
                <div className="table-row" key={e.id} style={{ background: isCompared ? "var(--surface-hover)" : undefined }}>
                  <div className="table-name">
                    <strong>{e.name}</strong>
                    <small>{e.created ? new Date(e.created).toLocaleString() : "Saved"}</small>
                  </div>
                  <span>{e.algorithm.toUpperCase()}</span>
                  <span>{e.dataset}</span>
                  <code>{e.seed}</code>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                    <button
                      className={`tab ${isCompared ? "active" : ""}`}
                      onClick={() => toggleCompare(e.id)}
                      title="Select to compare side-by-side"
                      style={{ padding: "4px 8px" }}
                    >
                      Compare
                    </button>
                    <Link
                      href="/playground"
                      className="icon-btn"
                      title="Load into playground"
                    >
                      <Play size={15} />
                    </Link>
                    <button
                      className="icon-btn danger"
                      onClick={() => deleteExperiment(e.id)}
                      title="Delete experiment"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="large-empty">
            <Library size={32} />
            <h2>Your experiment shelf is empty</h2>
            <p>
              Tune a model in the ML Playground and click &quot;Save Experiment&quot; to make it reproducible
              and comparable later.
            </p>
            <Link href="/playground" className="primary" style={{ marginTop: "16px" }}>
              Go to ML Playground
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
