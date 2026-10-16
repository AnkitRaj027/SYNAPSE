"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  ChevronRight,
  FlaskConical,
  Gauge,
  Library,
  Plus,
  RotateCcw,
  Sparkles,
  StepForward
} from "lucide-react";

type Experiment = {
  id: string;
  name: string;
  algorithm: string;
  dataset: string;
  seed: number;
  created: string;
};

const MODULES = [
  {
    href: "/playground",
    title: "ML Playground",
    description: "Train classical models, inspect 2D decision contours, and evaluate metrics.",
    icon: FlaskConical,
    colorClass: "purple",
    tag: "INTERACTIVE WORKBENCH"
  },
  {
    href: "/network",
    title: "Neural Network Studio",
    description: "Explore forward propagation, synaptic weight graphs, and nonlinear representations.",
    icon: BrainCircuit,
    colorClass: "blue",
    tag: "DEEP LEARNING"
  },
  {
    href: "/visualizer",
    title: "Algorithm Visualizer",
    description: "Step through live algorithmic iterations (k-Means, k-NN, Gradient Descent) on canvas.",
    icon: StepForward,
    colorClass: "green",
    tag: "STEP-BY-STEP SIMULATION"
  },
  {
    href: "/math",
    title: "Math Lab",
    description: "Connect equations to real behavior: Sigmoids, Loss landscapes, and Distance metrics.",
    icon: BookOpen,
    colorClass: "yellow",
    tag: "THEORY IN PRACTICE"
  },
  {
    href: "/experiments",
    title: "Experiment Shelf",
    description: "Review, compare, and reproduce saved model configurations locally on this device.",
    icon: Library,
    colorClass: "blue",
    tag: "WORKSPACE ARCHIVE"
  }
];

export default function DashboardPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);

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

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <p className="eyebrow">WELCOME TO SYNAPSE</p>
          <h1>Your laboratory is ready.</h1>
          <p className="lede">
            Understand machine learning from first principles by changing one variable at a time
            and directly seeing its impact on data, decision surfaces, and loss convergence.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/playground" className="primary">
            <Plus size={16} /> New Experiment
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left: Learning Modules */}
        <div className="module-list panel">
          <div className="section-heading">
            <p className="eyebrow">LEARNING MODULES</p>
            <h2>Choose a way into the laboratory</h2>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link key={mod.href} href={mod.href} className="module-row">
                  <div className={`module-symbol ${mod.colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong>{mod.title}</strong>
                      <span className="eyebrow" style={{ fontSize: "9px" }}>
                        {mod.tag}
                      </span>
                    </div>
                    <p>{mod.description}</p>
                  </div>
                  <ChevronRight size={18} className="row-arrow" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Experiments & Quick Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="panel recent-panel">
            <p className="eyebrow">SAVED WORKSPACE</p>
            <h2>{experiments.length ? "Recent Experiments" : "No Saved Experiments"}</h2>

            {experiments.length ? (
              <>
                <div className="mini-list">
                  {experiments.slice(0, 4).map((e) => (
                    <Link
                      href={`/playground?seed=${e.seed}&algo=${e.algorithm}`}
                      className="mini-item"
                      key={e.id}
                      style={{ textDecoration: "none" }}
                    >
                      <span className="mini-dot" />
                      <div style={{ flex: 1 }}>
                        <strong>{e.name}</strong>
                        <small>
                          {e.created ? new Date(e.created).toLocaleDateString() : "Saved"} · seed {e.seed}
                        </small>
                      </div>
                      <ChevronRight size={14} style={{ color: "var(--secondary)", marginTop: "4px" }} />
                    </Link>
                  ))}
                </div>
                <Link href="/experiments" className="secondary" style={{ width: "100%", marginTop: "12px" }}>
                  View All ({experiments.length})
                </Link>
              </>
            ) : (
              <div>
                <p style={{ color: "var(--secondary)", fontSize: "13px", lineHeight: "1.6" }}>
                  Save your configurations from the ML Playground to reproduce and compare models
                  later. Everything is persisted locally in your browser.
                </p>
                <Link href="/playground" className="secondary" style={{ marginTop: "14px" }}>
                  Open Playground <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>

          <div className="panel" style={{ padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Sparkles size={17} style={{ color: "var(--accent)" }} />
              <strong style={{ fontSize: "13px" }}>Zero-Cloud Architecture</strong>
            </div>
            <p style={{ color: "var(--secondary)", fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
              All neural network backpropagation, gradient descent, and cluster calculations execute
              directly inside your browser engine using zero external API calls.
            </p>
          </div>
        </div>
      </div>

      <section className="principle">
        <Gauge size={19} />
        <div>
          <strong>One useful idea at a time</strong>
          <p>
            SYNAPSE shows the observations, the learned parameters, the mathematical equation, and
            the decision surface together — so interacting with any control teaches you how machine
            learning works under the hood.
          </p>
        </div>
      </section>
    </div>
  );
}
