import { describe, expect, it } from "vitest";
import {
  checkNumericalGradient,
  compareModels,
  computeConfusionMatrix,
  findBestSplit,
  kmeans,
  knn,
  linearRegression,
  logisticRegression,
  makeDataset,
  predictLogistic,
  trainTestSplit,
  trainXor
} from "./ml";

describe("educational algorithms & mathematical rigor", () => {
  it("trains logistic regression on separable data with valid metrics", () => {
    const points = makeDataset("separable", 80, 7);
    const split = trainTestSplit(points, 0.25);
    const result = logisticRegression(split.train, 180, 0.15, { testPoints: split.test });

    expect(result.accuracy).toBeGreaterThan(0.75);
    expect(result.loss.at(-1)!).toBeLessThan(result.loss[0]);
    expect(result.testAccuracy).toBeDefined();
    expect(result.confusionMatrix.total).toBe(split.train.length);
  });

  it("strictly separates train and test sets with zero data leakage", () => {
    const points = makeDataset("moons", 40, 12);
    const { train, test } = trainTestSplit(points, 0.25);

    expect(train.length).toBe(30);
    expect(test.length).toBe(10);

    const trainIds = new Set(train.map((p) => p.id));
    for (const tp of test) {
      expect(trainIds.has(tp.id)).toBe(false);
    }
  });

  it("handles undefined precision and recall gracefully in confusion matrix", () => {
    // Single class dataset (all label = 0)
    const points = [
      { x: 0, y: 0, label: 0 },
      { x: 1, y: 1, label: 0 }
    ];
    const predictions = [0, 0];
    const cm = computeConfusionMatrix(points, predictions);

    expect(cm.accuracy).toBe(1);
    expect(cm.precision).toBe(0); // Safe fallback (no false positives or true positives)
    expect(cm.recall).toBe(0);
    expect(cm.f1).toBe(0);
    expect(cm.specificity).toBe(1);
  });

  it("fits a noisy line without NaN values and reports valid R2", () => {
    const result = linearRegression(makeDataset("regression", 80, 4));
    expect(Number.isFinite(result.mse)).toBe(true);
    expect(Number.isFinite(result.slope)).toBe(true);
    expect(result.r2).toBeGreaterThanOrEqual(0);
    expect(result.r2).toBeLessThanOrEqual(1);
  });

  it("reassigns k-means points to final centroids and tracks inertia", () => {
    const result = kmeans(makeDataset("clusters", 60, 5), 3);
    expect(result.points.every((p) => typeof p.cluster === "number")).toBe(true);
    expect(Number.isFinite(result.inertia)).toBe(true);
    expect(result.centroids).toHaveLength(3);
  });

  it("learns a useful XOR signal with a small neural network", () => {
    const result = trainXor(2, 400, 0.15);
    expect(result.losses.at(-1)!).toBeLessThan(result.losses[0]);
    expect(result.predictions.length).toBe(4);
  });

  it("passes numerical gradient checks for analytical backpropagation", () => {
    const gradCheck = checkNumericalGradient([0.5, -0.3], 1, [0.4, -0.6]);
    expect(gradCheck.relativeError).toBeLessThan(1e-4);
  });

  it("compares two models on the same evaluation split and reports agreement rate", () => {
    const points = makeDataset("separable", 20, 99);
    const modelA = (p: typeof points[0]) => (p.x + p.y > 0 ? 1 : 0);
    const modelB = (p: typeof points[0]) => (p.x > 0 ? 1 : 0);

    const comp = compareModels(points, "Linear", modelA, "Threshold", modelB);
    expect(comp.agreementRate).toBeGreaterThanOrEqual(0);
    expect(comp.agreementRate).toBeLessThanOrEqual(1);
    expect(comp.modelA.predictions).toHaveLength(points.length);
  });

  it("calculates real Gini impurity and optimal orthogonal split threshold", () => {
    const points = [
      { x: -0.8, y: 0, label: 0 },
      { x: -0.6, y: 0, label: 0 },
      { x: 0.6, y: 0, label: 1 },
      { x: 0.8, y: 0, label: 1 }
    ];
    const split = findBestSplit(points);
    expect(split.feature).toBe("x");
    expect(split.threshold).toBeCloseTo(0, 1);
    expect(split.infoGain).toBeGreaterThan(0);
  });
});
