"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  HelpCircle,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle
} from "lucide-react";
import {
  Mission,
  MISSIONS,
  MissionEvaluationState
} from "../../lib/missions";
import {
  logisticRegression,
  makeDataset,
  predictLogistic,
  trainTestSplit,
  Point,
  evaluateGrid
} from "../../lib/ml";

export default function MissionsPage() {
  const [activeMissionId, setActiveMissionId] = useState<string>("outlier-trap");
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [expandedHints, setExpandedHints] = useState<number[]>([]);

  // Active mission parameters
  const mission = MISSIONS.find((m) => m.id === activeMissionId) || MISSIONS[0];

  const [regularization, setRegularization] = useState(mission.initialParams.regularization ?? 0);
  const [threshold, setThreshold] = useState(mission.initialParams.threshold ?? 0.5);
  const [k, setK] = useState(mission.initialParams.k ?? 5);
  const [trained, setTrained] = useState(false);

  // Load completed missions from storage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("synapse-completed-missions") ?? "[]");
      setCompletedMissions(stored);
    } catch {
      setCompletedMissions([]);
    }
  }, []);

  // When switching mission, reset parameters to initialParams
  useEffect(() => {
    setRegularization(mission.initialParams.regularization ?? 0);
    setThreshold(mission.initialParams.threshold ?? 0.5);
    setK(mission.initialParams.k ?? 5);
    setTrained(false);
    setExpandedHints([]);
  }, [activeMissionId, mission]);

  // Generate base points + mission-specific custom points (e.g. outlier)
  const points = useMemo(() => {
    const base = makeDataset(
      mission.initialParams.dataset,
      mission.initialParams.samples,
      mission.initialParams.seed
    );
    const custom = mission.initialParams.customPoints ?? [];
    return [...base, ...custom];
  }, [mission]);

  // Strict train/test split
  const split = useMemo(
    () => trainTestSplit(points, mission.initialParams.testRatio),
    [points, mission.initialParams.testRatio]
  );

  // Train model
  const result = useMemo(() => {
    if (!trained) return null;
    if (mission.initialParams.algorithm === "logistic") {
      return logisticRegression(split.train, 150, 0.15, {
        threshold,
        regularization,
        testPoints: split.test
      });
    }
    return null;
  }, [trained, mission.initialParams.algorithm, split, threshold, regularization]);

  // Evaluate current mission state against objectives
  const evalState: MissionEvaluationState = {
    algorithm: mission.initialParams.algorithm,
    dataset: mission.initialParams.dataset,
    trained,
    accuracy: result ? result.accuracy : 0,
    testAccuracy: result ? result.testAccuracy : 0,
    precision: result?.testConfusionMatrix?.precision,
    recall: result?.testConfusionMatrix?.recall,
    f1: result?.testConfusionMatrix?.f1,
    regularization,
    threshold,
    k
  };

  const objectivesStatus = mission.objectives.map((obj) => ({
    ...obj,
    passed: obj.check(evalState)
  }));

  const allPassed = objectivesStatus.every((o) => o.passed);

  // Save completion to storage
  useEffect(() => {
    if (allPassed && !completedMissions.includes(mission.id)) {
      const updated = [...completedMissions, mission.id];
      setCompletedMissions(updated);
      localStorage.setItem("synapse-completed-missions", JSON.stringify(updated));
    }
  }, [allPassed, completedMissions, mission.id]);

  const toggleHint = (idx: number) => {
    if (expandedHints.includes(idx)) {
      setExpandedHints(expandedHints.filter((h) => h !== idx));
    } else {
      setExpandedHints([...expandedHints, idx]);
    }
  };

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <p className="eyebrow">GUIDED DISCOVERY & PEDAGOGICAL CHALLENGES</p>
          <h1>Guided Learning Missions</h1>
          <p className="lede">
            Step into real-world machine learning challenges. Diagnose common failure modes, adjust
            hyperparameters to satisfy strict criteria, and unlock interactive victory debriefs.
          </p>
        </div>

        <div className="header-actions">
          <div className="pg-run-state ready" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Trophy size={14} style={{ color: "var(--accent)" }} />
            <span>{completedMissions.length} of {MISSIONS.length} Completed</span>
          </div>
        </div>
      </div>

      {/* Mission Selector Tabs */}
      <div className="tab-list">
        {MISSIONS.map((m) => {
          const isDone = completedMissions.includes(m.id);
          return (
            <button
              key={m.id}
              className={`tab ${activeMissionId === m.id ? "active" : ""}`}
              onClick={() => setActiveMissionId(m.id)}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {isDone ? (
                <CheckCircle2 size={13} style={{ color: "var(--success)" }} />
              ) : (
                <Target size={13} style={{ color: "var(--secondary)" }} />
              )}
              <span>{m.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Mission Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.8fr)", gap: "24px" }}>
        {/* Left Column: Canvas & Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Narrative Card */}
          <div className="panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="eyebrow">{mission.tag} MISSION</span>
              <span className="state" style={{ background: "var(--surface-alt)" }}>
                {mission.difficulty.toUpperCase()}
              </span>
            </div>
            <h2 style={{ margin: "4px 0 8px", fontSize: "20px" }}>{mission.title}</h2>
            <p style={{ color: "var(--secondary)", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              {mission.story}
            </p>
          </div>

          {/* Interactive Simulation Plot */}
          <div className="panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="pg-kicker">INTERACTIVE MISSION CANVAS</span>
              <span className="pg-chart-mode">
                {result ? "TRAINED RESULT" : "INITIAL SUBOPTIMAL STATE"}
              </span>
            </div>

            <MissionPlot
              trainPoints={split.train}
              testPoints={split.test}
              result={result}
              threshold={threshold}
              customPoints={mission.initialParams.customPoints}
            />

            <div className="pg-legend">
              <span>
                <i className="legend-dot" /> Class 0
              </span>
              <span>
                <i className="legend-dot class-b" /> Class 1
              </span>
              {mission.initialParams.customPoints && (
                <span>
                  <i className="legend-ring" /> Rogue Outlier
                </span>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="panel" style={{ padding: "20px" }}>
            <span className="eyebrow" style={{ display: "block", marginBottom: "12px" }}>
              MISSION PARAMETER CONTROLS
            </span>

            {mission.id === "outlier-trap" && (
              <div className="pg-control">
                <span>L2 Regularization Penalty (λ): {regularization.toFixed(2)}</span>
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
                <small>Higher λ penalizes extreme weights, preventing single outliers from dictating slope.</small>
              </div>
            )}

            {mission.id === "goldilocks-k" && (
              <div className="pg-control">
                <span>Neighbor Count (k): {k}</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                />
                <small>k=1 overfits to noise; k=20 oversmooths.</small>
              </div>
            )}

            {mission.id === "high-recall-screening" && (
              <div className="pg-control">
                <span>Decision Threshold (τ): {threshold.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.02"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <small>Lowering threshold flags points with lower confidence as positive, raising Recall.</small>
              </div>
            )}

            <button
              className="primary"
              onClick={() => setTrained(true)}
              style={{ width: "100%", marginTop: "12px" }}
            >
              <Play size={15} /> {trained ? "Retrain & Verify Mission" : "Train Model"}
            </button>
          </div>
        </div>

        {/* Right Column: Mission Objectives, Hints, and Victory Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Objectives Card */}
          <div className="panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Target size={16} style={{ color: "var(--accent)" }} />
                <strong>Mission Objectives</strong>
              </div>
              <span className="pg-run-state ready">
                {objectivesStatus.filter((o) => o.passed).length} / {mission.objectives.length} Met
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {objectivesStatus.map((obj) => (
                <div
                  key={obj.id}
                  style={{
                    padding: "12px",
                    background: obj.passed ? "rgba(43, 122, 88, 0.08)" : "var(--surface-alt)",
                    border: `1px solid ${obj.passed ? "var(--success)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px"
                  }}
                >
                  {obj.passed ? (
                    <CheckCircle2 size={16} style={{ color: "var(--success)", flex: "none", marginTop: "2px" }} />
                  ) : (
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: "2px solid var(--secondary)",
                        flex: "none",
                        marginTop: "2px"
                      }}
                    />
                  )}
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: obj.passed ? "700" : "500", color: obj.passed ? "var(--success)" : "var(--primary)" }}>
                      {obj.description}
                    </span>
                    {!obj.passed && (
                      <small style={{ display: "block", color: "var(--secondary)", marginTop: "3px" }}>
                        Hint: {obj.hint}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Victory Debrief */}
            {allPassed && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "16px",
                  background: "var(--surface)",
                  border: "2px solid var(--accent)",
                  borderRadius: "var(--radius-sm)",
                  animation: "toast-in 0.3s ease both"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Award size={18} style={{ color: "var(--accent)" }} />
                  <strong style={{ color: "var(--accent)", fontSize: "14px" }}>
                    MISSION COMPLETE!
                  </strong>
                </div>
                <p style={{ fontSize: "12px", lineHeight: "1.6", color: "var(--primary)", margin: 0 }}>
                  {mission.debrief}
                </p>
              </div>
            )}
          </div>

          {/* Progressive Hints Drawer */}
          <div className="panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Lightbulb size={16} style={{ color: "var(--accent)" }} />
              <strong>Tactical Hints</strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {mission.hints.map((h, i) => {
                const isOpen = expandedHints.includes(i);
                return (
                  <div
                    key={i}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden"
                    }}
                  >
                    <button
                      onClick={() => toggleHint(i)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "var(--surface-alt)",
                        border: 0,
                        fontSize: "11px",
                        fontFamily: "var(--font-family-mono)",
                        color: "var(--primary)",
                        fontWeight: "700"
                      }}
                    >
                      <span>HINT #{i + 1}</span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s"
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ padding: "12px 14px", fontSize: "12px", color: "var(--secondary)", lineHeight: "1.5", background: "var(--surface)" }}>
                        {h}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Mission Plot Canvas
// -----------------------------------------------------------------------------
function MissionPlot({
  trainPoints,
  testPoints,
  result,
  threshold,
  customPoints
}: {
  trainPoints: Point[];
  testPoints: Point[];
  result: any;
  threshold: number;
  customPoints?: Point[];
}) {
  const width = 640;
  const height = 360;
  const pad = 34;

  const sx = (v: number) => pad + ((v + 1) / 2) * (width - pad * 2);
  const sy = (v: number) => height - pad - ((v + 1) / 2) * (height - pad * 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: "100%",
        height: "300px",
        background: "var(--surface-alt)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)"
      }}
    >
      <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="var(--border)" strokeDasharray="3 3" />
      <line x1={width / 2} y1={pad} x2={width / 2} y2={height - pad} stroke="var(--border)" strokeDasharray="3 3" />

      {/* Train Points (Solid) */}
      {trainPoints.map((p, i) => (
        <circle
          key={`train-${i}`}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={5}
          fill={p.label === 1 ? "var(--coral)" : "var(--blue)"}
          stroke="#FFF"
          strokeWidth="1.2"
        />
      ))}

      {/* Test Points (Ring) */}
      {testPoints.map((p, i) => (
        <circle
          key={`test-${i}`}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={6.5}
          fill="none"
          stroke={p.label === 1 ? "var(--coral)" : "var(--blue)"}
          strokeWidth="2.5"
        />
      ))}

      {/* Custom Outlier Highlight */}
      {customPoints?.map((p, i) => (
        <g key={`outlier-${i}`}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r="12" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx={sx(p.x)} cy={sy(p.y)} r="6" fill="var(--accent)" stroke="#FFF" strokeWidth="1.5" />
        </g>
      ))}

      {/* Decision Boundary Line */}
      {result && "weights" in result && Math.abs(result.weights[1]) > 0.001 && (
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
    </svg>
  );
}
