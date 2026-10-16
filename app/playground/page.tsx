"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  CheckCircle2,
  ChevronDown,
  Compass,
  Download,
  Eye,
  HelpCircle,
  Layers,
  MousePointer,
  Play,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Table2,
  Trash2,
  X
} from "lucide-react";
import {
  Algorithm,
  DatasetKind,
  Point,
  compareModels,
  evaluateGrid,
  kmeans,
  knn,
  linearRegression,
  logisticRegression,
  makeDataset,
  predictLogistic,
  trainTestSplit
} from "../../lib/ml";

const algorithms: Record<Algorithm, string> = {
  logistic: "Logistic Regression",
  linear: "Linear Regression",
  knn: "k-Nearest Neighbors",
  kmeans: "k-Means Clustering"
};

const datasets: Record<DatasetKind, string> = {
  separable: "Linearly separable",
  overlap: "Overlapping classes",
  regression: "Noisy regression",
  clusters: "Synthetic clusters",
  moons: "Two moons",
  circles: "Concentric circles",
  blobs: "Gaussian blobs"
};

const compatible: Record<Algorithm, DatasetKind[]> = {
  logistic: ["separable", "overlap", "moons", "circles", "blobs"],
  linear: ["regression"],
  knn: ["separable", "overlap", "moons", "circles", "blobs"],
  kmeans: ["clusters", "blobs"]
};

type Result =
  | ReturnType<typeof logisticRegression>
  | ReturnType<typeof linearRegression>
  | ReturnType<typeof kmeans>
  | null;

export default function PlaygroundPage() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("logistic");
  const [dataset, setDataset] = useState<DatasetKind>("separable");
  const [seed, setSeed] = useState(7);
  const [samples, setSamples] = useState(80);
  const [testRatio, setTestRatio] = useState(0.25);
  const [epochs, setEpochs] = useState(120);
  const [rate, setRate] = useState(0.15);
  const [threshold, setThreshold] = useState(0.5);
  const [regularization, setRegularization] = useState(0);
  const [k, setK] = useState(5);
  const [trained, setTrained] = useState(false);
  const [tab, setTab] = useState<"model" | "data" | "compare" | "training">("model");
  const [notice, setNotice] = useState("");
  const [customPoints, setCustomPoints] = useState<Point[]>([]);

  // Toggles for Boundary vs Probability
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showTestSplitOnly, setShowTestSplitOnly] = useState(false);

  // Prediction Inspector state
  const [inspectedPoint, setInspectedPoint] = useState<Point | null>({ x: 0.15, y: 0.25 });
  const [clickMode, setClickMode] = useState<"inspect" | "add-0" | "add-1">("inspect");

  // Comparison Model B settings
  const [compareAlgo, setCompareAlgo] = useState<Algorithm>("knn");
  const [compareK, setCompareK] = useState(7);

  // What-If previous run caching
  const [previousAccuracy, setPreviousAccuracy] = useState<number | null>(null);

  // Guided Missions
  const [activeMission, setActiveMission] = useState<number | null>(null);

  // Base dataset generation with seed
  const basePoints = useMemo(() => makeDataset(dataset, samples, seed), [dataset, samples, seed]);
  const allPoints = useMemo(() => [...basePoints, ...customPoints], [basePoints, customPoints]);

  // Strict train/test split - zero data leakage
  const split = useMemo(() => trainTestSplit(allPoints, testRatio), [allPoints, testRatio]);

  // Model A training
  const result = useMemo<Result>(() => {
    if (!trained) return null;
    if (algorithm === "logistic") {
      return logisticRegression(split.train, epochs, rate, {
        threshold,
        regularization,
        testPoints: split.test
      });
    }
    if (algorithm === "linear") {
      return linearRegression(split.train, epochs, rate / 2, split.test);
    }
    if (algorithm === "knn") return null;
    return kmeans(split.train, Math.min(k, 6));
  }, [algorithm, epochs, k, rate, regularization, split, threshold, trained]);

  // Model B for comparison mode
  const compareResult = useMemo(() => {
    if (tab !== "compare" || !trained) return null;
    const testPts = split.test;
    if (algorithm === "logistic" && compareAlgo === "knn") {
      const predA = (p: Point) => {
        if (!result || !("weights" in result)) return 0;
        return predictLogistic(p, result.weights, result.bias, threshold).prediction;
      };
      const predB = (p: Point) => knn(split.train, p, compareK).prediction;
      return compareModels(testPts, algorithms[algorithm], predA, algorithms[compareAlgo], predB);
    }
    return null;
  }, [tab, trained, algorithm, compareAlgo, split, result, threshold, compareK]);

  // Live k-NN query on inspected point
  const inspectedKnn = useMemo(() => {
    if (!inspectedPoint) return null;
    return knn(split.train, inspectedPoint, k);
  }, [inspectedPoint, split.train, k]);

  // Handle train
  const handleTrain = () => {
    if (result && "accuracy" in result) {
      setPreviousAccuracy(result.accuracy);
    }
    setTrained(true);
    setNotice("Model trained strictly on the train partition");
    setTimeout(() => setNotice(""), 2200);
  };

  const handleReset = () => {
    setTrained(false);
    setCustomPoints([]);
    setPreviousAccuracy(null);
    setNotice("Workbench reset to initial state");
    setTimeout(() => setNotice(""), 2000);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - box.left) / box.width) * 2 - 1;
    const ny = (1 - (e.clientY - box.top) / box.height) * 2 - 1;
    const p: Point = {
      id: `custom-${Date.now()}`,
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny))
    };

    if (clickMode === "inspect") {
      setInspectedPoint(p);
    } else if (clickMode === "add-0") {
      setCustomPoints((prev) => [...prev, { ...p, label: 0 }]);
      if (trained) setTrained(false);
    } else if (clickMode === "add-1") {
      setCustomPoints((prev) => [...prev, { ...p, label: 1 }]);
      if (trained) setTrained(false);
    }
  };

  const saveExperiment = () => {
    try {
      const current = JSON.parse(localStorage.getItem("synapse-experiments") ?? "[]");
      const item = {
        id: crypto.randomUUID(),
        name: `${algorithms[algorithm]} / ${datasets[dataset]}`,
        algorithm,
        dataset,
        seed,
        samples,
        testRatio,
        epochs,
        rate,
        k,
        threshold,
        regularization,
        accuracy: result && "accuracy" in result ? result.accuracy : undefined,
        testAccuracy: result && "testAccuracy" in result ? result.testAccuracy : undefined,
        created: new Date().toISOString()
      };
      localStorage.setItem("synapse-experiments", JSON.stringify([item, ...current]));
      setNotice("Complete experiment snapshot saved locally");
    } catch {
      setNotice("Storage unavailable");
    }
    setTimeout(() => setNotice(""), 2200);
  };

  return (
    <main className="pg-page">
      <header className="pg-header">
        <div>
          <p className="pg-kicker">MODEL WORKBENCH · ZERO DATA LEAKAGE</p>
          <h1>ML Playground</h1>
          <p>
            Train, diagnose, and inspect classical models with strictly segregated train/test splits.
          </p>
        </div>
        <div className="pg-actions">
          <span className={`pg-run-state ${trained ? "ready" : ""}`}>
            {trained ? "MODEL FITTED" : "AWAITING TRAINING"}
          </span>
          <button className="secondary" onClick={handleReset}>
            <RotateCcw size={15} /> Reset
          </button>
          <button className="primary" onClick={saveExperiment}>
            <Save size={15} /> Save Snapshot
          </button>
        </div>
      </header>

      {notice && <div className="toast">{notice}</div>}

      <div className="pg-layout">
        {/* Left Control Column */}
        <aside className="pg-config">
          <div className="pg-panel-title">
            <span>01</span>
            <strong>CONFIGURATION</strong>
          </div>

          <div className="pg-control">
            <span>Algorithm</span>
            <select
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value as Algorithm);
                setDataset(compatible[e.target.value as Algorithm][0]);
                setTrained(false);
              }}
            >
              {Object.entries(algorithms).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="pg-control">
            <span>Dataset Distribution</span>
            <select
              value={dataset}
              onChange={(e) => {
                setDataset(e.target.value as DatasetKind);
                setTrained(false);
              }}
            >
              {compatible[algorithm].map((key) => (
                <option key={key} value={key}>
                  {datasets[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="pg-section-label">PARTITION & SAMPLES</div>

          <div className="pg-control">
            <span>Train / Test Split Ratio</span>
            <select
              value={testRatio}
              onChange={(e) => {
                setTestRatio(Number(e.target.value));
                setTrained(false);
              }}
            >
              <option value={0.1}>90% Train / 10% Test</option>
              <option value={0.2}>80% Train / 20% Test</option>
              <option value={0.25}>75% Train / 25% Test</option>
              <option value={0.4}>60% Train / 40% Test</option>
            </select>
            <small>
              {split.train.length} train pts · {split.test.length} test pts
            </small>
          </div>

          <div className="pg-control">
            <span>Dataset Samples ({samples})</span>
            <input
              type="range"
              min="30"
              max="200"
              step="10"
              value={samples}
              onChange={(e) => {
                setSamples(Number(e.target.value));
                setTrained(false);
              }}
            />
          </div>

          <div className="pg-control">
            <span>Random Seed</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => {
                setSeed(Number(e.target.value) || 0);
                setTrained(false);
              }}
            />
          </div>

          <div className="pg-section-label">CANVAS INTERACTION</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px" }}>
            <button
              className={`tab ${clickMode === "inspect" ? "active" : ""}`}
              onClick={() => setClickMode("inspect")}
              title="Click any coordinate to inspect prediction mechanics"
            >
              <Search size={12} style={{ marginRight: "4px", verticalAlign: "-2px" }} /> Inspect Point
            </button>
            <button
              className={`tab ${clickMode === "add-0" ? "active" : ""}`}
              onClick={() => setClickMode("add-0")}
              style={{ color: "var(--blue)" }}
            >
              + Class 0
            </button>
            <button
              className={`tab ${clickMode === "add-1" ? "active" : ""}`}
              onClick={() => setClickMode("add-1")}
              style={{ color: "var(--coral)", gridColumn: "span 2" }}
            >
              + Class 1 (Outlier Testing)
            </button>
          </div>

          {customPoints.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <small style={{ color: "var(--secondary)" }}>{customPoints.length} custom points</small>
              <button
                className="icon-btn danger"
                onClick={() => {
                  setCustomPoints([]);
                  setTrained(false);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          <div className="pg-section-label">HYPERPARAMETERS</div>

          {algorithm === "logistic" && (
            <>
              <div className="pg-control">
                <span>Decision Threshold: {threshold.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <small>Moves boundary independently of probabilities</small>
              </div>

              <div className="pg-control">
                <span>L2 Regularization: {regularization.toFixed(2)}</span>
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.01"
                  value={regularization}
                  onChange={(e) => {
                    setRegularization(Number(e.target.value));
                    setTrained(false);
                  }}
                />
              </div>

              <div className="pg-control">
                <span>Learning Rate: {rate.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.01"
                  max="0.4"
                  step="0.01"
                  value={rate}
                  onChange={(e) => {
                    setRate(Number(e.target.value));
                    setTrained(false);
                  }}
                />
              </div>
            </>
          )}

          {algorithm === "knn" && (
            <div className="pg-control">
              <span>Neighbors (k): {k}</span>
              <input
                type="range"
                min="1"
                max={Math.min(15, split.train.length)}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
              />
              <small>Low k = complex boundary; High k = smoother vote</small>
            </div>
          )}

          {algorithm === "linear" && (
            <div className="pg-control">
              <span>Learning Rate: {rate.toFixed(2)}</span>
              <input
                type="range"
                min="0.01"
                max="0.3"
                step="0.01"
                value={rate}
                onChange={(e) => {
                  setRate(Number(e.target.value));
                  setTrained(false);
                }}
              />
            </div>
          )}

          <div className="pg-train-block">
            <button className="primary pg-train" onClick={handleTrain}>
              <Play size={15} /> {trained ? "Retrain On Train Split" : "Train Model"}
            </button>
          </div>
        </aside>

        {/* Center Canvas & Tab Area */}
        <section className="pg-main">
          <div className="pg-tabs">
            <button
              className={tab === "model" ? "active" : ""}
              onClick={() => setTab("model")}
            >
              <Eye size={14} /> Model & Predictions
            </button>
            <button
              className={tab === "compare" ? "active" : ""}
              onClick={() => setTab("compare")}
            >
              <ArrowLeftRight size={14} /> Model Comparison
            </button>
            <button
              className={tab === "data" ? "active" : ""}
              onClick={() => setTab("data")}
            >
              <Table2 size={14} /> Segregated Partitions
            </button>
            <button
              className={tab === "training" ? "active" : ""}
              onClick={() => setTab("training")}
            >
              <Activity size={14} /> Learning Curve
            </button>
          </div>

          {tab === "model" && (
            <>
              <div className="pg-chart-wrap">
                {/* Visual Layer Toggles */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", cursor: "pointer", fontFamily: "var(--font-family-mono)" }}>
                      <input
                        type="checkbox"
                        checked={showHeatmap}
                        onChange={(e) => setShowHeatmap(e.target.checked)}
                      />
                      Probability Heatmap
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", cursor: "pointer", fontFamily: "var(--font-family-mono)" }}>
                      <input
                        type="checkbox"
                        checked={showBoundary}
                        onChange={(e) => setShowBoundary(e.target.checked)}
                      />
                      Decision Boundary (τ={threshold})
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", cursor: "pointer", fontFamily: "var(--font-family-mono)" }}>
                      <input
                        type="checkbox"
                        checked={showTestSplitOnly}
                        onChange={(e) => setShowTestSplitOnly(e.target.checked)}
                      />
                      Highlight Test Split Only
                    </label>
                  </div>

                  <span className="pg-chart-mode">
                    {algorithm.toUpperCase()} · CLICK TO INSPECT
                  </span>
                </div>

                {/* SVG 2D Interactive Plot */}
                <WorkbenchPlot
                  trainPoints={split.train}
                  testPoints={split.test}
                  result={result}
                  algorithm={algorithm}
                  threshold={threshold}
                  showHeatmap={showHeatmap}
                  showBoundary={showBoundary}
                  showTestSplitOnly={showTestSplitOnly}
                  inspectedPoint={inspectedPoint}
                  onCanvasClick={handleCanvasClick}
                />

                <div className="pg-legend">
                  <span>
                    <i className="legend-dot" /> Train Point (Solid)
                  </span>
                  <span>
                    <span style={{ display: "inline-block", width: "9px", height: "9px", borderRadius: "50%", border: "2px solid var(--primary)", marginRight: "5px", verticalAlign: "-1px" }} /> Test Point (Ring)
                  </span>
                  {inspectedPoint && (
                    <span>
                      <i className="legend-ring" /> Inspected: ({inspectedPoint.x.toFixed(2)}, {inspectedPoint.y.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {/* What-If & Delta Bar */}
              {previousAccuracy !== null && result && "accuracy" in result && (
                <div style={{ padding: "10px 24px", background: "var(--surface-alt)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                  <span>
                    <strong>What-If Delta:</strong> Train accuracy changed by{" "}
                    <strong style={{ color: result.accuracy >= previousAccuracy ? "var(--success)" : "var(--danger)" }}>
                      {((result.accuracy - previousAccuracy) * 100).toFixed(1)}%
                    </strong>
                  </span>
                  <small style={{ color: "var(--secondary)" }}>Baseline: {(previousAccuracy * 100).toFixed(1)}%</small>
                </div>
              )}
            </>
          )}

          {tab === "compare" && (
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <span className="eyebrow">HEAD-TO-HEAD BENCHMARK</span>
                  <h2 style={{ margin: "4px 0", fontSize: "20px" }}>
                    Logistic Regression vs k-NN (Exact Same Test Split)
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-family-mono)" }}>Compare with:</span>
                  <select
                    value={compareAlgo}
                    onChange={(e) => setCompareAlgo(e.target.value as Algorithm)}
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                  >
                    <option value="knn">k-Nearest Neighbors (k={compareK})</option>
                  </select>
                </div>
              </div>

              {compareResult ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div className="panel" style={{ padding: "18px" }}>
                      <h3>{compareResult.modelA.name}</h3>
                      <div className="pg-detail"><span>Test Accuracy</span><strong>{(compareResult.modelA.testAccuracy * 100).toFixed(1)}%</strong></div>
                      <div className="pg-detail"><span>F1 Score</span><strong>{compareResult.modelA.f1.toFixed(3)}</strong></div>
                      <div className="pg-detail"><span>Inference Cost</span><code>O(1) Dot Product</code></div>
                      <div className="pg-detail"><span>Boundary Nature</span><code>Linear Hyperplane</code></div>
                    </div>

                    <div className="panel" style={{ padding: "18px" }}>
                      <h3>{compareResult.modelB.name}</h3>
                      <div className="pg-detail"><span>Test Accuracy</span><strong>{(compareResult.modelB.testAccuracy * 100).toFixed(1)}%</strong></div>
                      <div className="pg-detail"><span>F1 Score</span><strong>{compareResult.modelB.f1.toFixed(3)}</strong></div>
                      <div className="pg-detail"><span>Inference Cost</span><code>O(N) Distance Scan</code></div>
                      <div className="pg-detail"><span>Boundary Nature</span><code>Non-linear Voronoi</code></div>
                    </div>
                  </div>

                  <div className="panel" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <strong>Prediction Agreement Rate</strong>
                      <span className="pg-run-state ready">{(compareResult.agreementRate * 100).toFixed(1)}% Matched</span>
                    </div>
                    <p style={{ color: "var(--secondary)", fontSize: "12px", margin: "0 0 12px" }}>
                      Out of {split.test.length} held-out test points, the two models disagreed on{" "}
                      <strong>{compareResult.disagreements.length}</strong> instances.
                    </p>

                    {compareResult.disagreements.length > 0 && (
                      <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                        {compareResult.disagreements.map((d, i) => (
                          <div
                            key={i}
                            style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--border)", fontSize: "11px", fontFamily: "var(--font-family-mono)" }}
                          >
                            <span>Coord: ({d.point.x.toFixed(2)}, {d.point.y.toFixed(2)}) | Target: {d.point.label}</span>
                            <span>Model A: Class {d.predA} | Model B: Class {d.predB}</span>
                            <strong style={{ color: d.correctModel === "A" ? "var(--blue)" : d.correctModel === "B" ? "var(--coral)" : "var(--secondary)" }}>
                              Winner: {d.correctModel === "neither" ? "Both Wrong" : `Model ${d.correctModel}`}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ color: "var(--secondary)" }}>Train Model A to run the side-by-side benchmark comparison.</p>
                </div>
              )}
            </div>
          )}

          {tab === "data" && (
            <div className="pg-data-view">
              <div className="pg-data-meta">
                <div className="pg-metric">
                  <span>Training Partition</span>
                  <strong>{split.train.length} observations</strong>
                </div>
                <div className="pg-metric">
                  <span>Test Partition (Held-out)</span>
                  <strong>{split.test.length} observations</strong>
                </div>
                <div className="pg-metric">
                  <span>Data Leakage Guarantee</span>
                  <strong style={{ color: "var(--success)" }}>0% Leakage</strong>
                </div>
                <div className="pg-metric">
                  <span>Distribution</span>
                  <strong>{datasets[dataset]}</strong>
                </div>
              </div>

              <div className="pg-table-wrap">
                <div className="pg-table-head">
                  <span>#</span>
                  <span>Feature x₁</span>
                  <span>Feature x₂</span>
                  <span>Target Class</span>
                  <span>Strict Partition</span>
                </div>
                <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                  {[...split.train, ...split.test].slice(0, 40).map((p, i) => (
                    <div className="pg-table-row" key={i}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <code>{p.x.toFixed(4)}</code>
                      <code>{p.y.toFixed(4)}</code>
                      <span>Class {p.label ?? "—"}</span>
                      <span className={p.split === "train" ? "train-tag" : "test-tag"}>
                        {p.split?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "training" && (
            <div style={{ padding: "24px" }}>
              {result && "loss" in result && result.loss.length > 0 ? (
                <div>
                  <h3 style={{ margin: "0 0 10px", fontSize: "16px" }}>Loss History & Learning Curve</h3>
                  <div style={{ height: "180px", background: "var(--surface-alt)", border: "1px solid var(--border)", padding: "16px", borderRadius: "var(--radius-sm)" }}>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                      <polyline
                        points={result.loss
                          .map((v, i) => `${(i / (result.loss.length - 1 || 1)) * 100},${100 - (v / (result.loss[0] || 1)) * 80 - 10}`)
                          .join(" ")}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontFamily: "var(--font-family-mono)", fontSize: "11px" }}>
                    <span>Initial Loss: {result.loss[0].toFixed(4)}</span>
                    <strong style={{ color: "var(--success)" }}>Final Loss: {result.loss[result.loss.length - 1].toFixed(4)}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--secondary)" }}>Train the model to inspect its loss trajectory.</p>
              )}
            </div>
          )}
        </section>

        {/* Right Inspector Column */}
        <aside className="pg-inspector">
          {/* Prediction Inspector Drawer */}
          {inspectedPoint && (
            <div className="pg-inspector-section" style={{ background: "var(--surface)", padding: "14px", border: "1.5px solid var(--accent)", borderRadius: "var(--radius-sm)", marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span className="pg-label" style={{ color: "var(--accent)", margin: 0 }}>
                  PREDICTION INSPECTOR
                </span>
                <span className="pg-run-state" style={{ fontSize: "9px" }}>
                  ({inspectedPoint.x.toFixed(2)}, {inspectedPoint.y.toFixed(2)})
                </span>
              </div>

              {algorithm === "logistic" && result && "weights" in result && (
                (() => {
                  const pred = predictLogistic(inspectedPoint, result.weights, result.bias, threshold);
                  return (
                    <div>
                      <div className="pg-detail">
                        <span>Logit z = w·x + b</span>
                        <code>{pred.logit.toFixed(3)}</code>
                      </div>
                      <div className="pg-detail">
                        <span>Sigmoid σ(z)</span>
                        <strong style={{ color: "var(--accent)" }}>{(pred.probability * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="pg-detail">
                        <span>Threshold Test (≥ {threshold})</span>
                        <strong>{pred.probability >= threshold ? "Passes (≥ τ)" : "Fails (< τ)"}</strong>
                      </div>
                      <div className="pg-metric positive" style={{ marginTop: "8px" }}>
                        <span>Predicted Output</span>
                        <strong>Class {pred.prediction}</strong>
                      </div>
                    </div>
                  );
                })()
              )}

              {algorithm === "knn" && inspectedKnn && (
                <div>
                  <div className="pg-metric positive">
                    <span>k-NN Prediction</span>
                    <strong>Class {inspectedKnn.prediction}</strong>
                  </div>
                  <div className="pg-detail">
                    <span>Vote Probability</span>
                    <strong>{(inspectedKnn.probability * 100).toFixed(0)}% Class 1</strong>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <small style={{ color: "var(--secondary)", display: "block", marginBottom: "4px" }}>
                      Top {inspectedKnn.neighbors.length} Nearest Neighbors:
                    </small>
                    {inspectedKnn.neighbors.slice(0, 3).map((n) => (
                      <div key={n.rank} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--font-family-mono)", padding: "3px 0", borderTop: "1px solid var(--border-light)" }}>
                        <span>#{n.rank} Class {n.label}</span>
                        <span>dist: {n.distance.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strictly Segregated Metrics */}
          <div className="pg-inspector-section">
            <span className="pg-label">EVALUATION METRICS (DISJOINT SPLITS)</span>

            {algorithm === "logistic" && result && "accuracy" in result && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div className="pg-metric positive">
                    <span>Train Accuracy</span>
                    <strong>{(result.accuracy * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="pg-metric">
                    <span>Test Accuracy</span>
                    <strong style={{ color: result.testAccuracy && result.testAccuracy >= 0.8 ? "var(--success)" : "var(--warn)" }}>
                      {result.testAccuracy ? `${(result.testAccuracy * 100).toFixed(1)}%` : "—"}
                    </strong>
                  </div>
                </div>

                <div className="pg-detail" style={{ marginTop: "12px" }}>
                  <span>Train F1 Score</span>
                  <code>{result.confusionMatrix.f1.toFixed(3)}</code>
                </div>
                <div className="pg-detail">
                  <span>Train Precision</span>
                  <code>{result.confusionMatrix.precision.toFixed(3)}</code>
                </div>
                <div className="pg-detail">
                  <span>Train Recall</span>
                  <code>{result.confusionMatrix.recall.toFixed(3)}</code>
                </div>

                {/* Overfitting Indicator */}
                {result.testAccuracy !== undefined && (
                  <div style={{ marginTop: "12px", padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span>Generalization Gap</span>
                      <strong style={{ color: result.accuracy - result.testAccuracy > 0.15 ? "var(--danger)" : "var(--success)" }}>
                        {((result.accuracy - result.testAccuracy) * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <small style={{ color: "var(--secondary)", fontSize: "10px" }}>
                      {result.accuracy - result.testAccuracy > 0.15
                        ? "⚠️ Overfitting detected: train accuracy significantly exceeds test accuracy."
                        : "✓ Good generalization between train and test."}
                    </small>
                  </div>
                )}
              </>
            )}

            {algorithm === "linear" && result && "mse" in result && (
              <>
                <div className="pg-metric positive">
                  <span>Train MSE</span>
                  <strong>{result.mse.toFixed(4)}</strong>
                </div>
                {result.testMse !== undefined && (
                  <div className="pg-metric">
                    <span>Test MSE</span>
                    <strong>{result.testMse.toFixed(4)}</strong>
                  </div>
                )}
                <div className="pg-detail">
                  <span>Train R² Score</span>
                  <code>{(result.r2 * 100).toFixed(1)}%</code>
                </div>
              </>
            )}
          </div>

          <div className="pg-explanation">
            <span className="pg-label">WORKBENCH RULE</span>
            <p>
              <strong>Data Leakage Prevention</strong>: The model parameters are learned strictly
              from the train split. Test points are only evaluated once training concludes.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

// -----------------------------------------------------------------------------
// Workbench 2D Plot Component
// -----------------------------------------------------------------------------
function WorkbenchPlot({
  trainPoints,
  testPoints,
  result,
  algorithm,
  threshold,
  showHeatmap,
  showBoundary,
  showTestSplitOnly,
  inspectedPoint,
  onCanvasClick
}: {
  trainPoints: Point[];
  testPoints: Point[];
  result: Result;
  algorithm: Algorithm;
  threshold: number;
  showHeatmap: boolean;
  showBoundary: boolean;
  showTestSplitOnly: boolean;
  inspectedPoint: Point | null;
  onCanvasClick: (e: React.MouseEvent<SVGSVGElement>) => void;
}) {
  const width = 740;
  const height = 440;
  const pad = 36;

  const sx = (v: number) => pad + ((v + 1) / 2) * (width - pad * 2);
  const sy = (v: number) => height - pad - ((v + 1) / 2) * (height - pad * 2);

  // Compute 2D Probability Contour Grid
  const heatmap = useMemo(() => {
    if (!showHeatmap || !result || algorithm !== "logistic" || !("weights" in result)) {
      return null;
    }
    const res = 26;
    return evaluateGrid(res, (x, y) => predictLogistic({ x, y }, result.weights, result.bias, threshold).probability);
  }, [algorithm, result, threshold, showHeatmap]);

  const visiblePoints = showTestSplitOnly ? testPoints : [...trainPoints, ...testPoints];

  return (
    <svg
      className="pg-scatter"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Model workbench plot"
      onClick={onCanvasClick}
    >
      {/* Probability Heatmap */}
      {heatmap && (
        <g opacity="0.45">
          {heatmap.map((row, r) =>
            row.map((prob, c) => {
              const cellW = (width - pad * 2) / row.length;
              const cellH = (height - pad * 2) / heatmap.length;
              const fillColor = prob >= threshold ? "var(--coral)" : "var(--blue)";
              return (
                <rect
                  key={`${r}-${c}`}
                  x={pad + c * cellW}
                  y={pad + r * cellH}
                  width={cellW}
                  height={cellH}
                  fill={fillColor}
                  opacity={Math.min(0.7, Math.abs(prob - threshold) * 2.2)}
                />
              );
            })
          )}
        </g>
      )}

      {/* Grid Axes */}
      <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="var(--border)" strokeDasharray="3 3" />
      <line x1={width / 2} y1={pad} x2={width / 2} y2={height - pad} stroke="var(--border)" strokeDasharray="3 3" />

      {/* Observations: Train points = Solid, Test points = Ring */}
      {visiblePoints.map((p, i) => {
        const isTest = p.split === "test";
        const color = p.label === 1 ? "var(--coral)" : "var(--blue)";
        return (
          <circle
            key={p.id ?? i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={isTest ? 6.5 : 5}
            fill={isTest ? "none" : color}
            stroke={color}
            strokeWidth={isTest ? 2.5 : 1.2}
          />
        );
      })}

      {/* Decision Boundary Line for Logistic Regression at Threshold */}
      {showBoundary &&
        algorithm === "logistic" &&
        result &&
        "weights" in result &&
        Math.abs(result.weights[1]) > 0.001 && (
          <line
            x1={sx(-1)}
            y1={sy((-result.bias - result.weights[0] * -1 - Math.log(threshold / (1 - threshold || 1e-9))) / result.weights[1])}
            x2={sx(1)}
            y2={sy((-result.bias - result.weights[0] * 1 - Math.log(threshold / (1 - threshold || 1e-9))) / result.weights[1])}
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
        )}

      {/* Linear Regression Line */}
      {algorithm === "linear" && result && "slope" in result && (
        <line
          x1={sx(-1)}
          y1={sy(result.slope * -1 + result.intercept)}
          x2={sx(1)}
          y2={sy(result.slope * 1 + result.intercept)}
          className="pg-regression"
        />
      )}

      {/* Currently Inspected Point Indicator */}
      {inspectedPoint && (
        <g>
          <circle cx={sx(inspectedPoint.x)} cy={sy(inspectedPoint.y)} r="13" className="pg-query" />
          <circle cx={sx(inspectedPoint.x)} cy={sy(inspectedPoint.y)} r="3" fill="var(--warn)" />
        </g>
      )}
    </svg>
  );
}
