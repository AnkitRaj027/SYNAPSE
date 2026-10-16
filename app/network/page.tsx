"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Eye,
  HelpCircle,
  Layers,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Zap
} from "lucide-react";
import {
  ActivationFn,
  DatasetKind,
  checkNumericalGradient,
  evaluateGrid,
  makeDataset,
  trainNeuralNetwork
} from "../../lib/ml";

const DATASETS: { id: "moons" | "circles" | "blobs" | "xor"; label: string }[] = [
  { id: "circles", label: "Concentric Circles" },
  { id: "moons", label: "Two Moons" },
  { id: "xor", label: "Classic XOR Problem" },
  { id: "blobs", label: "Gaussian Blobs" }
];

const ACTIVATIONS: { id: ActivationFn; label: string; desc: string }[] = [
  { id: "tanh", label: "Tanh", desc: "Smooth non-linear mapping [-1, 1], susceptible to saturation." },
  { id: "relu", label: "ReLU", desc: "f(x) = max(0, x), strong gradient flow, avoids vanishing gradients." },
  { id: "leakyRelu", label: "Leaky ReLU", desc: "f(x) = max(0.05x, x), prevents dying neurons." },
  { id: "sigmoid", label: "Sigmoid", desc: "Maps into (0, 1), standard probability output." }
];

export default function NetworkStudioPage() {
  const [selectedDataset, setSelectedDataset] = useState<"moons" | "circles" | "blobs" | "xor">("circles");
  const [hiddenNeurons, setHiddenNeurons] = useState(4);
  const [activation, setActivation] = useState<ActivationFn>("tanh");
  const [epochs, setEpochs] = useState(150);
  const [learningRate, setLearningRate] = useState(0.12);

  // Backprop step explainer (0: Forward, 1: Loss, 2: Backward, 3: Gradient Check)
  const [explainerStep, setExplainerStep] = useState(0);

  // Inspected hidden neuron for spatial feature map
  const [inspectedNeuronIdx, setInspectedNeuronIdx] = useState<number | null>(null);

  // Generate input points
  const points = useMemo(() => {
    if (selectedDataset === "xor") {
      return [
        { x: -0.5, y: -0.5, label: 0 },
        { x: -0.5, y: 0.5, label: 1 },
        { x: 0.5, y: -0.5, label: 1 },
        { x: 0.5, y: 0.5, label: 0 }
      ];
    }
    return makeDataset(selectedDataset as DatasetKind, 60, 42);
  }, [selectedDataset]);

  // Train model
  const model = useMemo(() => {
    const data = points.map((p) => [p.x, p.y]);
    const targets = points.map((p) => p.label ?? 0);
    return trainNeuralNetwork(data, targets, hiddenNeurons, epochs, learningRate, activation);
  }, [points, hiddenNeurons, epochs, learningRate, activation]);

  // Numerical gradient check
  const gradCheck = useMemo(() => {
    return checkNumericalGradient([0.5, -0.4], 1, [0.4, -0.6]);
  }, []);

  // 2D Spatial Map of overall network
  const heatmap = useMemo(() => {
    if (!model.weights.length) return null;
    const w1 = model.weights.slice(0, hiddenNeurons);
    const w2 = model.weights[hiddenNeurons];
    const b2 = model.weights[hiddenNeurons + 1]?.[1] ?? 0;

    const act = (v: number) => {
      if (activation === "tanh") return Math.tanh(v);
      if (activation === "relu") return Math.max(0, v);
      if (activation === "leakyRelu") return v > 0 ? v : 0.05 * v;
      return 1 / (1 + Math.exp(-v));
    };

    return evaluateGrid(22, (x, y) => {
      const a1 = w1.map((w) => act(w[0] * x + w[1] * y));
      const z2 = a1.reduce((s, v, j) => s + v * (w2?.[j] ?? 0), 0) + b2;
      return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z2))));
    });
  }, [model, hiddenNeurons, activation]);

  // Spatial map for an individual hidden neuron
  const neuronHeatmap = useMemo(() => {
    if (inspectedNeuronIdx === null || !model.weights[inspectedNeuronIdx]) return null;
    const w = model.weights[inspectedNeuronIdx];
    return evaluateGrid(20, (x, y) => {
      const z = w[0] * x + w[1] * y;
      if (activation === "tanh") return (Math.tanh(z) + 1) / 2;
      if (activation === "relu") return Math.min(1, Math.max(0, z));
      return 1 / (1 + Math.exp(-z));
    });
  }, [inspectedNeuronIdx, model.weights, activation]);

  const trace = model.lastTrace;

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <p className="eyebrow">STEP-BY-STEP BACKPROPAGATION & GRADIENT FLOW</p>
          <h1>Neural Network Studio</h1>
          <p className="lede">
            Deconstruct how multi-layer perceptrons learn. Trace forward propagation, analytical loss
            gradients, and backward updates sample-by-sample.
          </p>
        </div>
      </div>

      <div className="studio-grid">
        {/* Left Column: Synapse Graph & Propagation Stages */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Synaptic Graph */}
          <div className="panel network-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span className="eyebrow">TOPOLOGY & WEIGHT MATRIX</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "16px" }}>
                  2 Inputs → {hiddenNeurons} Hidden Neurons ({activation.toUpperCase()}) → 1 Output
                </h3>
              </div>
              <span className="pg-run-state ready">
                {model.accuracy ? `${(model.accuracy * 100).toFixed(1)}% Accuracy` : "Trained"}
              </span>
            </div>

            <div
              style={{
                position: "relative",
                background: "var(--surface-alt)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "24px 20px",
                minHeight: "340px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                {/* Inputs to Hidden */}
                {Array.from({ length: 2 }).map((_, inIdx) =>
                  Array.from({ length: hiddenNeurons }).map((_, hIdx) => {
                    const weight = model.weights[hIdx]?.[inIdx] ?? 0.5;
                    const strokeWidth = Math.max(1, Math.min(4.5, Math.abs(weight) * 3));
                    const isPositive = weight >= 0;
                    return (
                      <line
                        key={`in-${inIdx}-h-${hIdx}`}
                        x1="18%"
                        y1={`${35 + inIdx * 30}%`}
                        x2="50%"
                        y2={`${20 + (hIdx / (hiddenNeurons - 1 || 1)) * 60}%`}
                        stroke={isPositive ? "var(--blue)" : "var(--coral)"}
                        strokeWidth={strokeWidth}
                        opacity={0.65}
                      />
                    );
                  })
                )}

                {/* Hidden to Output */}
                {Array.from({ length: hiddenNeurons }).map((_, hIdx) => {
                  const weight = model.weights[hiddenNeurons]?.[hIdx] ?? 0.5;
                  const strokeWidth = Math.max(1, Math.min(4.5, Math.abs(weight) * 3));
                  const isPositive = weight >= 0;
                  return (
                    <line
                      key={`h-${hIdx}-out`}
                      x1="50%"
                      y1={`${20 + (hIdx / (hiddenNeurons - 1 || 1)) * 60}%`}
                      x2="82%"
                      y2="50%"
                      stroke={isPositive ? "var(--blue)" : "var(--coral)"}
                      strokeWidth={strokeWidth}
                      opacity={0.75}
                    />
                  );
                })}
              </svg>

              {/* Layer 0: Inputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "45px", zIndex: 2 }}>
                <span className="layer-label">Input</span>
                {["x₁", "x₂"].map((label) => (
                  <div key={label} className="neuron">
                    {label}
                  </div>
                ))}
              </div>

              {/* Layer 1: Hidden Neurons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", zIndex: 2 }}>
                <span className="layer-label">Hidden (Click to inspect)</span>
                {Array.from({ length: hiddenNeurons }).map((_, i) => (
                  <div
                    key={i}
                    className={`neuron lit ${inspectedNeuronIdx === i ? "selected" : ""}`}
                    onClick={() => setInspectedNeuronIdx(inspectedNeuronIdx === i ? null : i)}
                    style={{
                      cursor: "pointer",
                      border: inspectedNeuronIdx === i ? "3px solid var(--accent)" : undefined
                    }}
                    title={`Click to inspect hidden neuron h${i + 1} feature map`}
                  >
                    h{i + 1}
                  </div>
                ))}
              </div>

              {/* Layer 2: Output */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", zIndex: 2 }}>
                <span className="layer-label">Output</span>
                <div className="neuron lit" style={{ background: "var(--accent)", color: "#FFFFFF" }}>
                  ŷ
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "11px", color: "var(--secondary)", fontFamily: "var(--font-family-mono)" }}>
              <span>Blue: Positive Weight</span>
              <span>Coral: Negative Weight</span>
              <span>Click any neuron h1..h{hiddenNeurons} to see its spatial feature filter</span>
            </div>
          </div>

          {/* Interactive Backpropagation Stepper */}
          <div className="panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span className="eyebrow">BACKPROPAGATION WALKTHROUGH</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {["1. Forward", "2. Loss", "3. Gradients", "4. Numerical Check"].map((lbl, idx) => (
                  <button
                    key={lbl}
                    className={`tab ${explainerStep === idx ? "active" : ""}`}
                    onClick={() => setExplainerStep(idx)}
                    style={{ padding: "4px 8px" }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {explainerStep === 0 && trace && (
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "14px" }}>Stage 1: Forward Propagation</h4>
                <p style={{ color: "var(--secondary)", fontSize: "12px", lineHeight: "1.5", margin: "0 0 12px" }}>
                  Input vector x = [{trace.input[0].toFixed(2)}, {trace.input[1].toFixed(2)}] passes
                  through the weight matrix, yielding pre-activations z and activations a:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  <div className="panel" style={{ padding: "10px", background: "var(--surface-alt)" }}>
                    <small style={{ color: "var(--secondary)" }}>Input (x)</small>
                    <code>[{trace.input[0].toFixed(2)}, {trace.input[1].toFixed(2)}]</code>
                  </div>
                  <div className="panel" style={{ padding: "10px", background: "var(--surface-alt)" }}>
                    <small style={{ color: "var(--secondary)" }}>Hidden Pre-act (z₁)</small>
                    <code>[{trace.z1.slice(0, 2).map((v) => v.toFixed(2)).join(", ")}]</code>
                  </div>
                  <div className="panel" style={{ padding: "10px", background: "var(--surface-alt)" }}>
                    <small style={{ color: "var(--secondary)" }}>Output (ŷ = σ(z₂))</small>
                    <strong style={{ color: "var(--accent)" }}>{trace.output.toFixed(4)}</strong>
                  </div>
                </div>
              </div>
            )}

            {explainerStep === 1 && trace && (
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "14px" }}>Stage 2: Objective Loss Calculation</h4>
                <p style={{ color: "var(--secondary)", fontSize: "12px", lineHeight: "1.5", margin: "0 0 12px" }}>
                  Target label y = {trace.target}. Binary cross-entropy evaluates error:
                </p>
                <div className="pg-metric positive" style={{ maxWidth: "260px" }}>
                  <span>Binary Cross-Entropy</span>
                  <strong>{trace.loss.toFixed(4)}</strong>
                </div>
              </div>
            )}

            {explainerStep === 2 && trace && (
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "14px" }}>Stage 3: Backward Propagation & Gradients</h4>
                <p style={{ color: "var(--secondary)", fontSize: "12px", lineHeight: "1.5", margin: "0 0 12px" }}>
                  By applying the chain rule, output error δ₂ = ŷ - y propagates back to calculate
                  ∂L/∂W for each connection:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="pg-detail"><span>Output Error (δ₂)</span><code>{trace.outputError.toFixed(4)}</code></div>
                  <div className="pg-detail"><span>Output Bias Grad</span><code>{trace.b2Gradient.toFixed(4)}</code></div>
                  <div className="pg-detail"><span>Hidden Layer Error (δ₁)</span><code>[{trace.hiddenErrors.slice(0, 2).map((v) => v.toFixed(3)).join(", ")}]</code></div>
                  <div className="pg-detail"><span>Learning Rate (α)</span><code>{learningRate.toFixed(2)}</code></div>
                </div>
              </div>
            )}

            {explainerStep === 3 && (
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "14px" }}>Stage 4: Numerical Gradient Verification</h4>
                <p style={{ color: "var(--secondary)", fontSize: "12px", lineHeight: "1.5", margin: "0 0 12px" }}>
                  Validating analytical backprop against finite differences (dL/dw ≈ [L(w+ε) - L(w-ε)] / 2ε):
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <div className="panel" style={{ padding: "10px", background: "var(--surface-alt)" }}>
                    <small style={{ color: "var(--secondary)" }}>Analytical ∂L/∂w</small>
                    <code>{gradCheck.analytical.toFixed(5)}</code>
                  </div>
                  <div className="panel" style={{ padding: "10px", background: "var(--surface-alt)" }}>
                    <small style={{ color: "var(--secondary)" }}>Numerical Difference</small>
                    <code>{gradCheck.numerical.toFixed(5)}</code>
                  </div>
                  <div className="panel" style={{ padding: "10px", background: "var(--surface-alt)" }}>
                    <small style={{ color: "var(--secondary)" }}>Relative Error</small>
                    <strong style={{ color: "var(--success)" }}>{gradCheck.relativeError.toExponential(2)} (Match!)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 2D Spatial Map & Configuration */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Spatial Decision Map */}
          <div className="panel" style={{ padding: "18px" }}>
            <span className="eyebrow">
              {inspectedNeuronIdx !== null
                ? `HIDDEN NEURON h${inspectedNeuronIdx + 1} FEATURE FILTER`
                : "2D NETWORK CLASSIFICATION PLANE"}
            </span>

            <div style={{ height: "190px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", margin: "10px 0", overflow: "hidden" }}>
              <svg style={{ width: "100%", height: "100%" }}>
                {(neuronHeatmap || heatmap)?.map((row, r) =>
                  row.map((prob, c) => (
                    <rect
                      key={`${r}-${c}`}
                      x={`${(c / row.length) * 100}%`}
                      y={`${(r / row.length) * 100}%`}
                      width={`${(1 / row.length) * 100}%`}
                      height={`${(1 / row.length) * 100}%`}
                      fill={prob >= 0.5 ? "var(--coral)" : "var(--blue)"}
                      opacity={Math.min(0.65, Math.abs(prob - 0.5) * 1.8)}
                    />
                  ))
                )}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={`${((p.x + 1) / 2) * 100}%`}
                    cy={`${((1 - p.y) / 2) * 100}%`}
                    r="3.5"
                    fill={p.label === 1 ? "var(--coral)" : "var(--blue)"}
                    stroke="#FFF"
                    strokeWidth="1"
                  />
                ))}
              </svg>
            </div>
            <small style={{ color: "var(--secondary)", fontSize: "11px" }}>
              {inspectedNeuronIdx !== null
                ? `Showing activation intensity of hidden neuron h${inspectedNeuronIdx + 1}.`
                : "Full output layer combination separating the dataset non-linearly."}
            </small>
          </div>

          {/* Model Settings */}
          <div className="panel config-card">
            <div className="panel-title">
              <SlidersHorizontal size={16} />
              <strong>ARCHITECTURE SETTINGS</strong>
            </div>

            <div className="pg-control">
              <span>Dataset Distribution</span>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value as any)}
              >
                {DATASETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pg-control">
              <span>Hidden Neurons: {hiddenNeurons}</span>
              <input
                type="range"
                min="1"
                max="6"
                value={hiddenNeurons}
                onChange={(e) => setHiddenNeurons(Number(e.target.value))}
              />
            </div>

            <div className="pg-control">
              <span>Activation Function</span>
              <select
                value={activation}
                onChange={(e) => setActivation(e.target.value as ActivationFn)}
              >
                {ACTIVATIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pg-control">
              <span>Learning Rate (α): {learningRate.toFixed(2)}</span>
              <input
                type="range"
                min="0.02"
                max="0.4"
                step="0.02"
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
              />
            </div>

            <div className="pg-control">
              <span>Training Epochs: {epochs}</span>
              <input
                type="range"
                min="50"
                max="300"
                step="25"
                value={epochs}
                onChange={(e) => setEpochs(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
