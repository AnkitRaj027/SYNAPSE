import { Algorithm, DatasetKind, Point } from "./ml";

export type MissionDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type MissionObjective = {
  id: string;
  description: string;
  hint: string;
  check: (state: MissionEvaluationState) => boolean;
};

export type MissionEvaluationState = {
  algorithm: Algorithm;
  dataset: DatasetKind;
  trained: boolean;
  accuracy: number; // Train accuracy (0 to 1)
  testAccuracy?: number; // Test accuracy (0 to 1)
  precision?: number;
  recall?: number;
  f1?: number;
  regularization?: number;
  threshold?: number;
  k?: number;
  epochs?: number;
};

export type Mission = {
  id: string;
  title: string;
  difficulty: MissionDifficulty;
  tag: string;
  brief: string;
  story: string;
  initialParams: {
    algorithm: Algorithm;
    dataset: DatasetKind;
    seed: number;
    testRatio: number;
    samples: number;
    threshold?: number;
    regularization?: number;
    k?: number;
    customPoints?: Point[];
  };
  objectives: MissionObjective[];
  hints: string[];
  debrief: string;
};

export const MISSIONS: Mission[] = [
  {
    id: "outlier-trap",
    title: "Mission 1: The Outlier Trap",
    difficulty: "Beginner",
    tag: "REGULARIZATION",
    brief: "Stop an extreme outlier from violently rotating the decision boundary.",
    story:
      "A sensor malfunction generated an extreme corrupted point (Class 1) deep within Class 0 territory. The unregularized model rotates sharply to accommodate this single outlier, causing held-out test accuracy to drop to 65%. Your mission is to tame the boundary using L2 regularization without modifying the training dataset.",
    initialParams: {
      algorithm: "logistic",
      dataset: "separable",
      seed: 14,
      testRatio: 0.25,
      samples: 60,
      regularization: 0.0,
      threshold: 0.5,
      customPoints: [
        {
          id: "rogue-outlier",
          x: -0.75,
          y: -0.85,
          label: 1,
          split: "train"
        }
      ]
    },
    objectives: [
      {
        id: "train-model",
        description: "Train the Logistic Regression model on the dataset.",
        hint: "Click the 'Train Model' button after adjusting parameters.",
        check: (s) => s.trained
      },
      {
        id: "apply-l2",
        description: "Apply L2 Regularization (λ ≥ 0.08) to penalize large weights.",
        hint: "Increase the L2 Regularization slider above 0.08 in the left configuration panel.",
        check: (s) => (s.regularization ?? 0) >= 0.08
      },
      {
        id: "restore-test-acc",
        description: "Achieve Held-out Test Accuracy ≥ 85%.",
        hint: "Tune regularization between 0.08 and 0.20 and retrain.",
        check: (s) => (s.testAccuracy ?? 0) >= 0.85
      }
    ],
    hints: [
      "Without regularization, gradient descent prioritizes minimizing loss on extreme outliers by inflating weights w₁ and w₂.",
      "L2 regularization adds a penalty (λ/2)||w||² to the loss function. This forces weights to shrink, resisting the rotational pull of isolated noise.",
      "Try setting L2 Regularization between 0.10 and 0.15, then retrain."
    ],
    debrief:
      "Victory! By penalizing large weights, the L2 weight decay prevented the decision hyperplane from over-rotating to capture the single outlier. The model sacrificed a tiny training loss penalty on the rogue point to maintain generalization across 90%+ of genuine test observations."
  },
  {
    id: "goldilocks-k",
    title: "Mission 2: The Goldilocks Zone",
    difficulty: "Intermediate",
    tag: "BIAS-VARIANCE",
    brief: "Find the optimal k in noisy data to prevent both memorization and underfitting.",
    story:
      "In an overlapping dataset, setting k=1 achieves 100% training accuracy by memorizing noise, but suffers high variance and fails on new data. Setting k=25 oversmooths and underfits. Your mission is to find the 'Goldilocks' neighborhood size that generalizes cleanly.",
    initialParams: {
      algorithm: "knn",
      dataset: "overlap",
      seed: 42,
      testRatio: 0.25,
      samples: 80,
      k: 1
    },
    objectives: [
      {
        id: "k-greater-one",
        description: "Increase neighbor count k to at least 5 to suppress single-point noise.",
        hint: "Move the Neighbors (k) slider to at least 5.",
        check: (s) => (s.k ?? 1) >= 5
      },
      {
        id: "k-under-fifteen",
        description: "Keep k ≤ 12 to avoid oversmoothing boundary details.",
        hint: "Ensure k remains between 5 and 12.",
        check: (s) => (s.k ?? 1) <= 12
      },
      {
        id: "inspect-boundary",
        description: "Click any query point to verify multi-neighbor majority voting.",
        hint: "Click the plot to position a query point and inspect neighbor votes.",
        check: (s) => (s.k ?? 1) >= 5 && (s.k ?? 1) <= 12
      }
    ],
    hints: [
      "When k=1, the decision boundary wraps tightly around every single point, creating islands of noise.",
      "As k increases, decision regions smooth out because classification requires a consensus majority.",
      "A value of k between 5 and 9 typically yields the lowest generalization error on this dataset."
    ],
    debrief:
      "Outstanding! You balanced the bias-variance tradeoff. By gathering votes from 5 to 9 neighbors, the classifier averages out stochastic noise while preserving local cluster boundaries."
  },
  {
    id: "high-recall-screening",
    title: "Mission 3: Critical Medical Screening",
    difficulty: "Intermediate",
    tag: "THRESHOLD TUNING",
    brief: "Shift the decision threshold to achieve Recall ≥ 90% for a life-critical test.",
    story:
      "You are configuring a diagnostic model for a critical condition (Class 1). A False Negative (missing a sick patient) is catastrophic. At the default threshold τ = 0.50, recall is only 70%. Your mission is to adjust the decision threshold so that held-out Test Recall reaches at least 90%, while preserving an acceptable precision balance.",
    initialParams: {
      algorithm: "logistic",
      dataset: "overlap",
      seed: 88,
      testRatio: 0.3,
      samples: 90,
      threshold: 0.5,
      regularization: 0.05
    },
    objectives: [
      {
        id: "lower-threshold",
        description: "Lower the Decision Threshold below 0.35 to catch more positives.",
        hint: "Slide the Decision Threshold control to 0.30 or lower.",
        check: (s) => (s.threshold ?? 0.5) <= 0.35
      },
      {
        id: "train-screen",
        description: "Train the model with the adjusted screening threshold.",
        hint: "Click 'Train Model'.",
        check: (s) => s.trained
      },
      {
        id: "achieve-recall",
        description: "Achieve Test Recall ≥ 90% (TP / (TP + FN)).",
        hint: "Check the confusion matrix and recall metric in the inspector.",
        check: (s) => (s.recall ?? 0) >= 0.90
      }
    ],
    hints: [
      "The default threshold τ = 0.50 assumes equal costs for False Positives and False Negatives.",
      "In medical screening, missing a positive (False Negative) is far more dangerous than a false alarm. Lowering τ flags any patient with even a moderate probability as positive.",
      "Lower τ to around 0.25 to 0.30 to capture over 90% of positive cases."
    ],
    debrief:
      "Mission accomplished! By decoupling the decision threshold τ from the fixed probability 0.50, you adapted the classifier to asymmetric real-world risk. The model now catches ≥ 90% of positive cases."
  }
];
