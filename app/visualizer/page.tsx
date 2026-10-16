"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  StepBack,
  StepForward
} from "lucide-react";
import { Point, findBestSplit } from "../../lib/ml";

type AlgorithmKind = "kmeans" | "knn" | "gradient" | "tree";

export default function VisualizerPage() {
  const [algo, setAlgo] = useState<AlgorithmKind>("kmeans");
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5x, 1x, 2x

  const maxSteps = algo === "gradient" ? 5 : 4;

  const reset = () => {
    setIsPlaying(false);
    setStep(0);
  };

  const nextStep = () => {
    setStep((s) => (s < maxSteps - 1 ? s + 1 : s));
  };

  const prevStep = () => {
    setStep((s) => (s > 0 ? s - 1 : 0));
  };

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = 1500 / speed;
    const timer = setInterval(() => {
      setStep((cur) => {
        if (cur >= maxSteps - 1) {
          setIsPlaying(false);
          return cur;
        }
        return cur + 1;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, maxSteps, speed]);

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <p className="eyebrow">INTERACTIVE ALGORITHMIC TIMELINE</p>
          <h1>Algorithm Visualizer</h1>
          <p className="lede">
            Step through state-machines with scrubbable playback. Each frame reveals real numerical
            computations, vector transformations, and theoretical rationale.
          </p>
        </div>
      </div>

      <div className="tab-list">
        <button
          className={`tab ${algo === "kmeans" ? "active" : ""}`}
          onClick={() => {
            setAlgo("kmeans");
            reset();
          }}
        >
          k-Means Clustering
        </button>
        <button
          className={`tab ${algo === "knn" ? "active" : ""}`}
          onClick={() => {
            setAlgo("knn");
            reset();
          }}
        >
          k-Nearest Neighbors
        </button>
        <button
          className={`tab ${algo === "gradient" ? "active" : ""}`}
          onClick={() => {
            setAlgo("gradient");
            reset();
          }}
        >
          Gradient Descent Optimization
        </button>
        <button
          className={`tab ${algo === "tree" ? "active" : ""}`}
          onClick={() => {
            setAlgo("tree");
            reset();
          }}
        >
          Decision Tree Partition
        </button>
      </div>

      {/* Unified Playback Bar */}
      <div
        className="panel"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "12px 20px",
          marginBottom: "20px",
          background: "var(--surface-alt)"
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          <button className="icon-btn" onClick={reset} title="Reset to start">
            <RotateCcw size={15} />
          </button>
          <button className="icon-btn" onClick={prevStep} disabled={step === 0} title="Previous step">
            <StepBack size={15} />
          </button>
          <button
            className="primary"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: "6px 14px", minHeight: "32px" }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button className="icon-btn" onClick={nextStep} disabled={step === maxSteps - 1} title="Next step">
            <StepForward size={15} />
          </button>
        </div>

        {/* Scrubbable Timeline Slider */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="range"
            min="0"
            max={maxSteps - 1}
            value={step}
            onChange={(e) => {
              setIsPlaying(false);
              setStep(Number(e.target.value));
            }}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: "11px", fontFamily: "var(--font-family-mono)", minWidth: "80px", textAlign: "right" }}>
            Step {step + 1} / {maxSteps}
          </span>
        </div>

        {/* Speed Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", color: "var(--secondary)", fontFamily: "var(--font-family-mono)" }}>SPEED</span>
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              className={`tab ${speed === s ? "active" : ""}`}
              onClick={() => setSpeed(s)}
              style={{ padding: "3px 7px", fontSize: "10px" }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {algo === "kmeans" && <KMeansView step={step} />}
      {algo === "knn" && <KnnView step={step} />}
      {algo === "gradient" && <GradientView step={step} />}
      {algo === "tree" && <DecisionTreeView step={step} />}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 1. k-Means Interactive View
// -----------------------------------------------------------------------------
function KMeansView({ step }: { step: number }) {
  const steps = [
    { title: "Stage 01: Raw Observation Space", desc: "12 unclassified observations in 2D Euclidean space. Initial total inertia is undefined." },
    { title: "Stage 02: Centroid Seeding", desc: "k = 3 initial centroids (marked with colored target rings) are placed at seed coordinates." },
    { title: "Stage 03: Nearest Centroid Assignment", desc: "Each point calculates Euclidean distance d = √((x - c_x)² + (y - c_y)²) to all 3 centroids and is assigned to the closest." },
    { title: "Stage 04: Mean Update & Stabilization", desc: "Centroids move to the exact arithmetic mean (x̄, ȳ) of their assigned points, minimizing within-cluster inertia." }
  ];

  const points: Point[] = [
    { x: -0.6, y: -0.5 }, { x: -0.7, y: -0.3 }, { x: -0.5, y: -0.7 }, { x: -0.4, y: -0.4 },
    { x: 0.5, y: 0.6 }, { x: 0.6, y: 0.4 }, { x: 0.4, y: 0.7 }, { x: 0.7, y: 0.5 },
    { x: -0.5, y: 0.6 }, { x: -0.6, y: 0.4 }, { x: -0.4, y: 0.5 }, { x: -0.3, y: 0.7 }
  ];

  const initialCentroids = [{ x: -0.2, y: -0.2 }, { x: 0.1, y: 0.2 }, { x: 0.6, y: -0.3 }];
  const updatedCentroids = [{ x: -0.55, y: -0.48 }, { x: 0.55, y: 0.55 }, { x: -0.45, y: 0.55 }];
  const centroids = step >= 3 ? updatedCentroids : initialCentroids;

  const w = 640;
  const h = 330;
  const pad = 34;
  const sx = (x: number) => pad + ((x + 1) / 2) * (w - pad * 2);
  const sy = (y: number) => h - pad - ((y + 1) / 2) * (h - pad * 2);

  const getCluster = (p: Point) => {
    if (step < 2) return 0;
    if (p.x < 0 && p.y < 0) return 0;
    if (p.x > 0) return 1;
    return 2;
  };

  return (
    <div className="visualizer-layout">
      <div className="panel step-panel">
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
          <div>
            <span className="eyebrow">STEP {step + 1} OF 4</span>
            <h3 style={{ margin: "2px 0 4px", fontSize: "16px" }}>{steps[step].title}</h3>
            <p style={{ margin: 0, color: "var(--secondary)", fontSize: "13px" }}>{steps[step].desc}</p>
          </div>
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "300px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
          <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="var(--border)" strokeDasharray="3 3" />
          <line x1={w / 2} y1={pad} x2={w / 2} y2={h - pad} stroke="var(--border)" strokeDasharray="3 3" />

          {/* Vectors to nearest centroid at step 2 */}
          {step === 2 && points.map((p, i) => {
            const c = centroids[getCluster(p)];
            const color = getCluster(p) === 0 ? "var(--blue)" : getCluster(p) === 1 ? "var(--coral)" : "var(--green)";
            return (
              <line
                key={i}
                x1={sx(p.x)}
                y1={sy(p.y)}
                x2={sx(c.x)}
                y2={sy(c.y)}
                stroke={color}
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
            );
          })}

          {/* Points */}
          {points.map((p, i) => {
            const cluster = getCluster(p);
            const fill = step < 2 ? "var(--secondary)" : cluster === 0 ? "var(--blue)" : cluster === 1 ? "var(--coral)" : "var(--green)";
            return <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="6" fill={fill} stroke="#FFF" strokeWidth="1.5" />;
          })}

          {/* Centroids */}
          {step >= 1 && centroids.map((c, i) => (
            <g key={i}>
              <circle
                cx={sx(c.x)}
                cy={sy(c.y)}
                r="13"
                fill="none"
                stroke={i === 0 ? "var(--blue)" : i === 1 ? "var(--coral)" : "var(--green)"}
                strokeWidth="3.5"
              />
              <circle cx={sx(c.x)} cy={sy(c.y)} r="3" fill="var(--primary)" />
            </g>
          ))}
        </svg>
      </div>

      <div className="panel glossary">
        <p className="eyebrow">NUMERICAL STATE TRACE</p>
        <h3 style={{ margin: "4px 0 10px", fontSize: "16px" }}>Current State Calculations</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="pg-detail">
            <span>Centroid 1 Coord (Blue)</span>
            <code>({centroids[0].x.toFixed(2)}, {centroids[0].y.toFixed(2)})</code>
          </div>
          <div className="pg-detail">
            <span>Centroid 2 Coord (Coral)</span>
            <code>({centroids[1].x.toFixed(2)}, {centroids[1].y.toFixed(2)})</code>
          </div>
          <div className="pg-detail">
            <span>Centroid 3 Coord (Green)</span>
            <code>({centroids[2].x.toFixed(2)}, {centroids[2].y.toFixed(2)})</code>
          </div>
          <div className="pg-detail">
            <span>Within-Cluster Inertia</span>
            <strong style={{ color: step >= 3 ? "var(--success)" : "var(--warn)" }}>
              {step < 2 ? "—" : step === 2 ? "1.84 (Pre-update)" : "0.42 (Minimized)"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. k-NN Interactive View
// -----------------------------------------------------------------------------
function KnnView({ step }: { step: number }) {
  const steps = [
    { title: "Stage 01: Indexed Observations", desc: "Observations stored with labels: Class 0 (Blue) and Class 1 (Coral)." },
    { title: "Stage 02: Placement of Query Point", desc: "An unlabeled query point (golden target) is placed at coordinates (0.08, 0.12)." },
    { title: "Stage 03: Distance Radar Scan", desc: "Distances to all observations are calculated. An expanding radius captures the k=3 closest points." },
    { title: "Stage 04: Majority Class Vote", desc: "Nearest points vote: 2 votes for Class 1 vs 1 vote for Class 0. Query is labeled Class 1." }
  ];

  const points = [
    { x: -0.4, y: 0.3, label: 0 }, { x: -0.2, y: 0.5, label: 0 }, { x: -0.5, y: -0.2, label: 0 },
    { x: 0.1, y: 0.18, label: 1 }, { x: 0.2, y: 0.05, label: 1 }, { x: -0.05, y: 0.22, label: 0 },
    { x: 0.5, y: -0.3, label: 1 }, { x: 0.3, y: -0.4, label: 1 }
  ];

  const query = { x: 0.08, y: 0.12 };
  const w = 640;
  const h = 330;
  const pad = 34;
  const sx = (x: number) => pad + ((x + 1) / 2) * (w - pad * 2);
  const sy = (y: number) => h - pad - ((y + 1) / 2) * (h - pad * 2);

  return (
    <div className="visualizer-layout">
      <div className="panel step-panel">
        <div style={{ marginBottom: "12px" }}>
          <span className="eyebrow">STEP {step + 1} OF 4</span>
          <h3 style={{ margin: "2px 0 4px", fontSize: "16px" }}>{steps[step].title}</h3>
          <p style={{ margin: 0, color: "var(--secondary)", fontSize: "13px" }}>{steps[step].desc}</p>
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "300px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
          <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="var(--border)" strokeDasharray="3 3" />
          <line x1={w / 2} y1={pad} x2={w / 2} y2={h - pad} stroke="var(--border)" strokeDasharray="3 3" />

          {step >= 2 && (
            <circle
              cx={sx(query.x)}
              cy={sy(query.y)}
              r="68"
              fill="none"
              stroke="var(--warn)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {points.map((p, i) => (
            <circle
              key={i}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r="6"
              fill={p.label === 1 ? "var(--coral)" : "var(--blue)"}
              stroke="#FFF"
              strokeWidth="1.5"
            />
          ))}

          {step >= 1 && (
            <g>
              <circle cx={sx(query.x)} cy={sy(query.y)} r="12" fill="none" stroke="var(--warn)" strokeWidth="3" />
              <circle cx={sx(query.x)} cy={sy(query.y)} r="4" fill="var(--warn)" />
            </g>
          )}
        </svg>
      </div>

      <div className="panel glossary">
        <p className="eyebrow">CALCULATED DISTANCES</p>
        <h3 style={{ margin: "4px 0 10px", fontSize: "16px" }}>Nearest Neighbors Metric</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="pg-detail">
            <span>Query Coordinate</span>
            <code>({query.x}, {query.y})</code>
          </div>
          <div className="pg-detail">
            <span>Neighbor 1 (Class 1)</span>
            <code>d = 0.063</code>
          </div>
          <div className="pg-detail">
            <span>Neighbor 2 (Class 1)</span>
            <code>d = 0.138</code>
          </div>
          <div className="pg-detail">
            <span>Neighbor 3 (Class 0)</span>
            <code>d = 0.164</code>
          </div>
          <div className="pg-detail">
            <span>Predicted Class (Majority)</span>
            <strong style={{ color: "var(--coral)" }}>Class 1 (67% vote)</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. Gradient Descent View
// -----------------------------------------------------------------------------
function GradientView({ step }: { step: number }) {
  const steps = [
    { title: "Stage 01: Parameter Initialization", desc: "Parameter initialized at θ = 1.8 with loss J(θ) = 3.24." },
    { title: "Stage 02: Analytical Derivative Calculation", desc: "Gradient ∇J = dJ/dθ = 2θ = 3.60. The positive slope means moving right increases error." },
    { title: "Stage 03: Gradient Update Step", desc: "Update θ ← θ - α·(2θ) with α = 0.25. θ jumps left from 1.80 to 0.90." },
    { title: "Stage 04: Second Corrective Step", desc: "Recomputing slope at θ = 0.90: gradient is smaller (1.80), leading to a finer step to θ = 0.45." },
    { title: "Stage 05: Convergence at Global Minimum", desc: "Slope diminishes to ∇J ≈ 0. Parameter stabilizes at θ = 0.05, minimizing loss." }
  ];

  const thetas = [1.8, 1.8, 0.9, 0.45, 0.05];
  const curTheta = thetas[step];
  const curLoss = curTheta ** 2;

  const w = 640;
  const h = 300;
  const sx = (th: number) => w / 2 + th * 120;
  const sy = (l: number) => h - 35 - (l / 4) * (h - 70);

  const curvePoints: string[] = [];
  for (let th = -2.2; th <= 2.2; th += 0.1) {
    curvePoints.push(`${sx(th)},${sy(th ** 2)}`);
  }

  return (
    <div className="visualizer-layout">
      <div className="panel step-panel">
        <div style={{ marginBottom: "12px" }}>
          <span className="eyebrow">STEP {step + 1} OF 5</span>
          <h3 style={{ margin: "2px 0 4px", fontSize: "16px" }}>{steps[step].title}</h3>
          <p style={{ margin: 0, color: "var(--secondary)", fontSize: "13px" }}>{steps[step].desc}</p>
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "300px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
          <polyline points={curvePoints.join(" ")} fill="none" stroke="var(--blue)" strokeWidth="2.5" />
          <circle cx={sx(curTheta)} cy={sy(curLoss)} r="10" fill="var(--accent)" stroke="#FFF" strokeWidth="2" />

          {step === 1 && (
            <line
              x1={sx(curTheta) - 40}
              y1={sy(curLoss) + 40 * (2 * curTheta)}
              x2={sx(curTheta) + 40}
              y2={sy(curLoss) - 40 * (2 * curTheta)}
              stroke="var(--danger)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}
        </svg>
      </div>

      <div className="panel glossary">
        <p className="eyebrow">LIVE GRADIENT CALCULATIONS</p>
        <h3 style={{ margin: "4px 0 10px", fontSize: "16px" }}>Numerical State</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="pg-detail">
            <span>Parameter θ</span>
            <code>{curTheta.toFixed(3)}</code>
          </div>
          <div className="pg-detail">
            <span>Loss J(θ) = θ²</span>
            <code>{curLoss.toFixed(4)}</code>
          </div>
          <div className="pg-detail">
            <span>Derivative ∇J = 2θ</span>
            <code style={{ color: "var(--danger)" }}>{(2 * curTheta).toFixed(3)}</code>
          </div>
          <div className="pg-detail">
            <span>Step Vector -α·∇J</span>
            <strong style={{ color: "var(--success)" }}>{(-0.25 * 2 * curTheta).toFixed(3)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Decision Tree View
// -----------------------------------------------------------------------------
function DecisionTreeView({ step }: { step: number }) {
  const points: Point[] = [
    { x: -0.8, y: -0.2, label: 0 }, { x: -0.6, y: 0.4, label: 0 }, { x: -0.4, y: -0.6, label: 0 }, { x: -0.2, y: 0.2, label: 0 },
    { x: 0.2, y: 0.6, label: 1 }, { x: 0.4, y: 0.4, label: 1 }, { x: 0.6, y: -0.4, label: 1 }, { x: 0.8, y: -0.2, label: 1 }
  ];

  const splitResult = findBestSplit(points);

  const steps = [
    { title: "Stage 01: Root Node Impurity", desc: "All 8 samples combined. Gini impurity is high (G = 0.50) indicating maximum mixture." },
    { title: "Stage 02: Evaluating All Threshold Candidates", desc: "The algorithm calculates Gini impurity after hypothetical splits across feature x₁ and x₂." },
    { title: "Stage 03: Optimal Split at x₁ = 0.0", desc: `Cut selected along feature ${splitResult.feature} at threshold ${splitResult.threshold.toFixed(2)} with information gain ${splitResult.infoGain.toFixed(3)}.` },
    { title: "Stage 04: Pure Leaf Nodes", desc: "Samples partitioned into pure child leaves (Gini = 0.0), terminating tree recursion." }
  ];

  const w = 640;
  const h = 300;

  return (
    <div className="visualizer-layout">
      <div className="panel step-panel">
        <div style={{ marginBottom: "12px" }}>
          <span className="eyebrow">STEP {step + 1} OF 4</span>
          <h3 style={{ margin: "2px 0 4px", fontSize: "16px" }}>{steps[step].title}</h3>
          <p style={{ margin: 0, color: "var(--secondary)", fontSize: "13px" }}>{steps[step].desc}</p>
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "300px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
          {step >= 2 && <line x1={w / 2} y1="0" x2={w / 2} y2={h} stroke="var(--coral)" strokeWidth="3" strokeDasharray="5 5" />}

          {points.map((p, i) => (
            <circle
              key={i}
              cx={w / 2 + p.x * 240}
              cy={h / 2 - p.y * 120}
              r="6.5"
              fill={p.label === 1 ? "var(--coral)" : "var(--blue)"}
              stroke="#FFF"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>

      <div className="panel glossary">
        <p className="eyebrow">LIVE GINI IMPURITY CALCULATOR</p>
        <h3 style={{ margin: "4px 0 10px", fontSize: "16px" }}>Information Gain State</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="pg-detail">
            <span>Root Gini Impurity</span>
            <code>{splitResult.giniBefore.toFixed(3)}</code>
          </div>
          <div className="pg-detail">
            <span>Selected Feature</span>
            <strong>Feature {splitResult.feature === "x" ? "x₁" : "x₂"}</strong>
          </div>
          <div className="pg-detail">
            <span>Optimal Cut Threshold</span>
            <code>{splitResult.threshold.toFixed(2)}</code>
          </div>
          <div className="pg-detail">
            <span>Information Gain (ΔGini)</span>
            <strong style={{ color: "var(--success)" }}>{splitResult.infoGain.toFixed(3)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
