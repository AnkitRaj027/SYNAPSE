"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  TrendingUp,
  XCircle
} from "lucide-react";

type LabTopic = "sigmoid" | "loss" | "linear" | "distance";

export default function MathLabPage() {
  const [topic, setTopic] = useState<LabTopic>("sigmoid");

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <p className="eyebrow">FIRST-PRINCIPLES CALCULUS & LINEAR ALGEBRA</p>
          <h1>Math Lab</h1>
          <p className="lede">
            Explore the core mathematical foundations of machine learning. Adjust parameters and
            watch derivatives, activations, and loss penalty landscapes update in real time.
          </p>
        </div>
      </div>

      <div className="tab-list">
        <button
          className={`tab ${topic === "sigmoid" ? "active" : ""}`}
          onClick={() => setTopic("sigmoid")}
        >
          Sigmoid & Vanishing Gradients
        </button>
        <button
          className={`tab ${topic === "loss" ? "active" : ""}`}
          onClick={() => setTopic("loss")}
        >
          Loss Functions (MSE vs Cross-Entropy)
        </button>
        <button
          className={`tab ${topic === "linear" ? "active" : ""}`}
          onClick={() => setTopic("linear")}
        >
          Linear Model (w·x + b)
        </button>
        <button
          className={`tab ${topic === "distance" ? "active" : ""}`}
          onClick={() => setTopic("distance")}
        >
          Distance Metrics (L₁, L₂, L_inf)
        </button>
      </div>

      {topic === "sigmoid" && <SigmoidLab />}
      {topic === "loss" && <LossLab />}
      {topic === "linear" && <LinearLab />}
      {topic === "distance" && <DistanceLab />}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 1. Sigmoid & Vanishing Gradients Lab
// -----------------------------------------------------------------------------
function SigmoidLab() {
  const [z, setZ] = useState(1.5);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  const prob = 1 / (1 + Math.exp(-z));
  const derivative = prob * (1 - prob);

  return (
    <div className="math-grid">
      <div className="panel lesson-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="eyebrow" style={{ margin: 0 }}>NON-LINEAR ACTIVATION</p>
          <Link href="/network" className="secondary" style={{ fontSize: "10px", padding: "4px 8px" }}>
            See in Neural Studio <ArrowRight size={12} />
          </Link>
        </div>

        <h2 style={{ margin: "6px 0 14px", fontSize: "22px" }}>The Logistic Sigmoid Function</h2>
        <p style={{ color: "var(--secondary)", lineHeight: "1.6" }}>
          The sigmoid maps any real number into a valid probability in (0, 1).
          In neural networks, notice what happens to the derivative when |z| &gt; 4: the gradient
          approaches 0, causing <strong>vanishing gradients</strong> during backpropagation.
        </p>

        <div className="equation">
          <span>σ(z) = 1 / (1 + e⁻ᶻ)</span>
        </div>

        <div className="pg-control" style={{ maxWidth: "460px", marginTop: "24px" }}>
          <span>Input Logit (z): {z.toFixed(2)}</span>
          <input
            type="range"
            min="-6"
            max="6"
            step="0.1"
            value={z}
            onChange={(e) => setZ(Number(e.target.value))}
          />
        </div>

        <div style={{ padding: "16px", background: "var(--surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginTop: "20px" }}>
          <div className="pg-detail">
            <span>Input Logit (z)</span>
            <code>{z.toFixed(2)}</code>
          </div>
          <div className="pg-detail">
            <span>Probability σ(z)</span>
            <strong style={{ color: "var(--accent)" }}>{prob.toFixed(4)}</strong>
          </div>
          <div className="pg-detail">
            <span>Derivative σ&apos;(z) = σ(z)(1 - σ(z))</span>
            <strong style={{ color: derivative < 0.05 ? "var(--danger)" : "var(--success)" }}>
              {derivative.toFixed(4)} {derivative < 0.05 ? "⚠️ Saturated" : "Active Flow"}
            </strong>
          </div>
        </div>

        {/* Knowledge Check */}
        <div className="panel" style={{ marginTop: "20px", padding: "16px", background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <HelpCircle size={15} style={{ color: "var(--accent)" }} />
            <strong style={{ fontSize: "12px" }}>Knowledge Check</strong>
          </div>
          <p style={{ fontSize: "12px", color: "var(--secondary)", margin: "0 0 10px" }}>
            What occurs in a deep network when z = 5 across many layers?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              "The gradient explodes exponentially.",
              "The derivative approaches zero, halting weight updates (vanishing gradient).",
              "The network switches to linear regression."
            ].map((ans, i) => (
              <button
                key={i}
                className={`tab ${quizAnswer === i ? "active" : ""}`}
                onClick={() => setQuizAnswer(i)}
                style={{ textAlign: "left", padding: "6px 10px", fontSize: "11px" }}
              >
                {ans}
              </button>
            ))}
          </div>
          {quizAnswer !== null && (
            <div style={{ marginTop: "10px", fontSize: "11px", color: quizAnswer === 1 ? "var(--success)" : "var(--danger)" }}>
              {quizAnswer === 1 ? "✓ Correct! Because σ'(5) ≈ 0.0066, multiplied through layers it kills learning." : "✗ Incorrect. Check the derivative readout above!"}
            </div>
          )}
        </div>
      </div>

      <div className="panel math-visual">
        <p className="eyebrow">CURVE & DERIVATIVE VISUALIZER</p>
        <svg viewBox="0 0 300 200" style={{ width: "100%", height: "200px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", margin: "14px 0" }}>
          <line x1="10" y1="100" x2="290" y2="100" stroke="var(--border)" strokeDasharray="2 2" />
          <line x1="150" y1="10" x2="150" y2="190" stroke="var(--border)" strokeDasharray="2 2" />

          {/* Sigmoid Curve */}
          <path d="M 10 185 Q 110 185, 150 100 T 290 15" fill="none" stroke="var(--accent)" strokeWidth="2.5" />

          {/* Current point */}
          <circle cx={150 + (z / 6) * 140} cy={190 - prob * 180} r="6" fill="var(--accent)" stroke="#FFF" strokeWidth="2" />
        </svg>

        <div className="pg-explanation" style={{ marginTop: "16px" }}>
          <p>
            <strong>ReLU Remedy</strong>: Modern deep architectures use ReLU (f(x) = max(0, x))
            because its derivative is exactly 1.0 for all positive inputs, completely curing vanishing
            gradients.
          </p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Loss Functions Lab
// -----------------------------------------------------------------------------
function LossLab() {
  const [actual, setActual] = useState(1);
  const [pred, setPred] = useState(0.8);

  const mse = (actual - pred) ** 2;
  const bce = -(actual * Math.log(Math.max(1e-9, pred)) + (1 - actual) * Math.log(Math.max(1e-9, 1 - pred)));

  return (
    <div className="math-grid">
      <div className="panel lesson-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="eyebrow" style={{ margin: 0 }}>OBJECTIVE FUNCTIONS</p>
          <Link href="/playground" className="secondary" style={{ fontSize: "10px", padding: "4px 8px" }}>
            See in Playground <ArrowRight size={12} />
          </Link>
        </div>

        <h2 style={{ margin: "6px 0 14px", fontSize: "22px" }}>Mean Squared Error vs Cross-Entropy</h2>
        <p style={{ color: "var(--secondary)", lineHeight: "1.6" }}>
          Why not use Mean Squared Error for classification? Binary Cross-Entropy applies an
          infinite penalty when the model makes a confident wrong prediction (p → 0 when y = 1),
          ensuring steep gradients that aggressively correct the error.
        </p>

        <div className="pg-control" style={{ maxWidth: "460px", marginTop: "20px" }}>
          <span>Ground Truth Target (y)</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className={`tab ${actual === 1 ? "active" : ""}`} onClick={() => setActual(1)}>
              Class 1 (y = 1)
            </button>
            <button className={`tab ${actual === 0 ? "active" : ""}`} onClick={() => setActual(0)}>
              Class 0 (y = 0)
            </button>
          </div>
        </div>

        <div className="pg-control" style={{ maxWidth: "460px", marginTop: "16px" }}>
          <span>Model Predicted Probability (p): {pred.toFixed(2)}</span>
          <input type="range" min="0.01" max="0.99" step="0.01" value={pred} onChange={(e) => setPred(Number(e.target.value))} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "24px" }}>
          <div className="pg-metric" style={{ background: "var(--surface-alt)", padding: "14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <span>Cross-Entropy Loss</span>
            <strong style={{ color: bce > 2 ? "var(--danger)" : "var(--success)", fontSize: "24px" }}>
              {bce.toFixed(3)}
            </strong>
            <small style={{ color: "var(--secondary)", display: "block", marginTop: "4px" }}>
              -log(p) steep curve
            </small>
          </div>

          <div className="pg-metric" style={{ background: "var(--surface-alt)", padding: "14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <span>Squared Error (MSE)</span>
            <strong style={{ fontSize: "24px" }}>{mse.toFixed(3)}</strong>
            <small style={{ color: "var(--secondary)", display: "block", marginTop: "4px" }}>
              (y - p)² quadratic curve
            </small>
          </div>
        </div>
      </div>

      <div className="panel math-visual">
        <p className="eyebrow">PENALTY ASYMMETRY</p>
        <div style={{ padding: "16px", background: "var(--surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginTop: "14px" }}>
          <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>Why Cross-Entropy Wins in Classification</h4>
          <p style={{ color: "var(--secondary)", fontSize: "12px", lineHeight: "1.6", margin: 0 }}>
            If the ground truth is <strong>1</strong> and the model outputs <strong>0.01</strong>:
            <br />
            • MSE = (1 - 0.01)² = 0.98 (weak gradient).
            <br />
            • Log Loss = -ln(0.01) = 4.60 (huge gradient driving parameter recovery!).
          </p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. Linear Model Lab
// -----------------------------------------------------------------------------
function LinearLab() {
  const [x, setX] = useState(0.4);
  const [w, setW] = useState(0.8);
  const [b, setB] = useState(0.1);
  const y = w * x + b;

  return (
    <div className="math-grid">
      <div className="panel lesson-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="eyebrow" style={{ margin: 0 }}>LINEAR ALGEBRA</p>
          <Link href="/playground" className="secondary" style={{ fontSize: "10px", padding: "4px 8px" }}>
            Fit on Real Data <ArrowRight size={12} />
          </Link>
        </div>

        <h2 style={{ margin: "6px 0 14px", fontSize: "22px" }}>Dot Product & Prediction</h2>
        <div className="equation">
          <span>ŷ = w · x + b</span>
        </div>

        <div className="pg-control" style={{ maxWidth: "460px" }}>
          <span>Input x: {x.toFixed(2)}</span>
          <input type="range" min="-1" max="1" step="0.05" value={x} onChange={(e) => setX(Number(e.target.value))} />
        </div>

        <div className="pg-control" style={{ maxWidth: "460px" }}>
          <span>Weight w: {w.toFixed(2)}</span>
          <input type="range" min="-2" max="2" step="0.1" value={w} onChange={(e) => setW(Number(e.target.value))} />
        </div>

        <div className="pg-control" style={{ maxWidth: "460px" }}>
          <span>Bias b: {b.toFixed(2)}</span>
          <input type="range" min="-1" max="1" step="0.05" value={b} onChange={(e) => setB(Number(e.target.value))} />
        </div>

        <div style={{ marginTop: "20px", padding: "14px", background: "var(--surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: "11px", color: "var(--secondary)" }}>WORKED CALCULATION</span>
          <div style={{ fontSize: "15px", fontFamily: "var(--font-family-mono)", marginTop: "4px" }}>
            ({w.toFixed(2)} × {x.toFixed(2)}) + {b.toFixed(2)} = <strong style={{ color: "var(--accent)" }}>{y.toFixed(3)}</strong>
          </div>
        </div>
      </div>

      <div className="panel math-visual">
        <p className="eyebrow">NUMBER LINE PROJECTION</p>
        <div className="number-line">
          <div className="number-dot" style={{ left: `${Math.max(5, Math.min(95, 50 + y * 25))}%` }} />
          <span className="number-label" style={{ left: `${Math.max(5, Math.min(95, 50 + y * 25))}%` }}>
            ŷ = {y.toFixed(2)}
          </span>
        </div>
        <div className="axis-labels">
          <span>−2.0</span>
          <span>0.0</span>
          <span>+2.0</span>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Distance Metrics Lab
// -----------------------------------------------------------------------------
function DistanceLab() {
  const [dx, setDx] = useState(3);
  const [dy, setDy] = useState(4);

  const l2 = Math.sqrt(dx ** 2 + dy ** 2);
  const l1 = Math.abs(dx) + Math.abs(dy);
  const linf = Math.max(Math.abs(dx), Math.abs(dy));

  return (
    <div className="math-grid">
      <div className="panel lesson-panel">
        <p className="eyebrow">METRIC SPACES</p>
        <h2 style={{ margin: "6px 0 14px", fontSize: "22px" }}>Distance Norms in Feature Space</h2>
        <p style={{ color: "var(--secondary)", lineHeight: "1.6" }}>
          In k-NN and clustering, the choice of metric determines which observations are considered
          neighbors.
        </p>

        <div className="pg-control" style={{ maxWidth: "460px" }}>
          <span>Delta x (Δx): {dx}</span>
          <input type="range" min="0" max="10" value={dx} onChange={(e) => setDx(Number(e.target.value))} />
        </div>

        <div className="pg-control" style={{ maxWidth: "460px" }}>
          <span>Delta y (Δy): {dy}</span>
          <input type="range" min="0" max="10" value={dy} onChange={(e) => setDy(Number(e.target.value))} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "24px" }}>
          <div className="pg-metric" style={{ background: "var(--surface-alt)", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <span>Euclidean (L₂)</span>
            <strong>{l2.toFixed(2)}</strong>
            <small style={{ color: "var(--secondary)" }}>√(Δx² + Δy²)</small>
          </div>

          <div className="pg-metric" style={{ background: "var(--surface-alt)", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <span>Manhattan (L₁)</span>
            <strong>{l1.toFixed(2)}</strong>
            <small style={{ color: "var(--secondary)" }}>|Δx| + |Δy|</small>
          </div>

          <div className="pg-metric" style={{ background: "var(--surface-alt)", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <span>Chebyshev (L_inf)</span>
            <strong>{linf.toFixed(2)}</strong>
            <small style={{ color: "var(--secondary)" }}>max(|Δx|, |Δy|)</small>
          </div>
        </div>
      </div>

      <div className="panel math-visual">
        <p className="eyebrow">NORM GEOMETRY</p>
        <div style={{ padding: "16px", background: "var(--surface-alt)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginTop: "14px" }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "14px" }}>L1 Regularization (Lasso) Connection</h4>
          <p style={{ color: "var(--secondary)", fontSize: "12px", lineHeight: "1.6", margin: 0 }}>
            The L1 unit ball has sharp diamond corners along coordinate axes. When loss contours
            hit these sharp corners, weights are forced to exactly zero — providing automatic
            feature selection!
          </p>
        </div>
      </div>
    </div>
  );
}
