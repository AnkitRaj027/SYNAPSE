# SYNAPSE — Interactive Machine Learning Laboratory

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-green?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**SYNAPSE** is a zero-cloud, client-side educational machine learning laboratory. It bridges the gap between abstract equations and practical intuition by letting you manipulate datasets, hyperparameters, and models in real time while visualizing decision surfaces, loss landscapes, and synaptic graphs directly in the browser.

---

## ⚡ Core Features

### 1. ML Playground (`/playground`)
* **2D Probability Contour Heatmap**: Live background probability field ($P(y=1 \mid x_1, x_2)$) rendering smooth classification confidence gradients.
* **Interactive Point Insertion**: Click directly on the canvas to place custom **Class 0** or **Class 1** observations and immediately observe how outliers pull decision lines or cluster centroids.
* **Classical Algorithms**:
  * **Logistic Regression**: Linear boundary with adjustable threshold and L2 regularization.
  * **Linear Regression**: Ordinary least squares fit with Mean Squared Error (MSE) and $R^2$ fit scores.
  * **k-Nearest Neighbors (k-NN)**: Non-parametric majority vote with live query point distance rings.
  * **k-Means Clustering**: Unsupervised centroid clustering with within-cluster inertia tracking.
* **Evaluation Diagnostics**: Interactive **Confusion Matrix** (TP, FP, TN, FN), train/test split tagging, convergence loss traces, and single-click **CSV data export**.

### 2. Neural Network Studio (`/network`)
* **Non-Linear Representation**: Test multi-layer perceptrons on non-linearly separable datasets (**Concentric Circles**, **Two Moons**, **Gaussian Blobs**, and **XOR**).
* **Multi-Activation Engine**: Genuine analytical implementations and backpropagation derivatives for:
  * **Tanh**: Hyperbolic tangent activation $\tanh(z)$.
  * **Sigmoid**: Logistic curve $\sigma(z) = \frac{1}{1 + e^{-z}}$.
  * **ReLU**: Rectified linear unit $\max(0, z)$.
  * **LeakyReLU**: Non-saturating $\max(0.05z, z)$.
* **Bipartite Synaptic Graph**: Dynamic SVG canvas where synapse line thickness is proportional to weight magnitude $|w_{ij}|$ and color-coded by sign (Blue = positive, Coral = negative).
* **2D Non-Linear Space Map**: Visualizes how the hidden layer warps feature space to achieve linear separability.

### 3. Algorithm Visualizer (`/visualizer`)
Step through live algorithmic state-machines with forward, back, and reset controls:
* **k-Means**: Points scattered $\to$ Centroid seeding $\to$ Voronoi distance vector assignment $\to$ Centroid mean glide $\to$ Stabilization.
* **k-Nearest Neighbors**: Query drop $\to$ Euclidean distance calculation $\to$ Expanding radar radius capturing $k$ neighbors $\to$ Class vote tally.
* **Gradient Descent**: Parameter ball rolling down the loss bowl $J(\theta) = \theta^2$ with tangent slope vectors $\nabla J$.
* **Decision Tree**: 2D orthogonal split plane partitions ($x_1 < 0, x_2 < 0.2$) minimizing Gini impurity.

### 4. Math Lab (`/math`)
* **Sigmoid & Vanishing Gradients**: Real-time slider demonstrating derivative saturation $\sigma'(z) \to 0$ when $|z| > 4$.
* **Loss Landscapes**: Side-by-side comparison of **Mean Squared Error (MSE)** vs **Binary Cross-Entropy (Log Loss)**, illustrating the steep penalty for confident misclassifications.
* **Distance Norms**: Interactive 2D comparison between **Euclidean ($L_2$)**, **Manhattan ($L_1$)**, and **Chebyshev ($L_\infty$)** metrics.
* **Linear Model**: Projection on a 1D number line with worked arithmetic ($w \cdot x + b = \hat{y}$).

### 5. Experiment Shelf (`/experiments`)
* **Side-by-Side Comparison**: Select any two saved model configurations to compare hyperparameters, algorithms, and random seeds simultaneously.
* **JSON Backup**: Import and export experiment portfolios as `.json` files.

### 6. Design System & Themes (`/settings`)
* **Dual Theme Engine**:
  * **Light Theme ("Warm Paper")**: Tactile, editorial laboratory palette.
  * **Dark Theme ("Deep Cyber-Lab")**: High-contrast slate canvas optimized for glowing vector charts.
* **Typography**: Clean typography using **Inter** for UI and **JetBrains Mono** for numerical matrices and parameters.
* **Accessibility**: Reduced motion toggles and colorblind-friendly marker support.

---

## 🛠️ Tech Stack & Architecture

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
* **Frontend**: React 18, TypeScript
* **Styling**: Vanilla CSS Design Tokens (zero Tailwind runtime bloat)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Testing**: [Vitest](https://vitest.dev/)
* **Math Engine**: Pure TypeScript client-side numerical computation (`lib/ml.ts`) running zero external dependencies.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18.x or later
* npm / pnpm / yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/synapse.git

# Navigate to the workspace
cd synapse

# Install dependencies
npm install
```

### Running Locally
```bash
# Start the Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) to view the laboratory.

### Available Scripts
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with hot-reload |
| `npm run build` | Compiles the production bundle with static optimization |
| `npm run start` | Runs the compiled production server |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm run test` | Executes unit tests with Vitest |
| `npm run lint` | Runs ESLint checks |

---

## 📁 Project Structure

```
synapse/
├── app/
│   ├── globals.css         # Complete design token system (Light & Dark themes)
│   ├── layout.tsx          # Root layout with Google Fonts (Inter & JetBrains Mono)
│   ├── page.tsx            # Dashboard & quick-start hub (/)
│   ├── playground/         # ML Playground workbench (/playground)
│   ├── network/            # Neural Network Studio (/network)
│   ├── visualizer/         # Algorithm Visualizer simulation engine (/visualizer)
│   ├── math/               # Math Lab interactive derivations (/math)
│   ├── experiments/        # Experiment shelf & comparison (/experiments)
│   └── settings/           # Theme switcher & storage preferences (/settings)
├── components/
│   └── layout/
│       └── AppShell.tsx    # Universal layout with sidebar, topbar & theme provider
├── lib/
│   ├── ml.ts               # Core ML algorithms, 2D grid evaluator & activations
│   └── ml.test.ts          # Vitest mathematical test suite
├── package.json
└── tsconfig.json
```

---

## 🧪 Testing

SYNAPSE includes mathematical unit tests ensuring deterministic PRNG generation, numerical stability, and gradient convergence:

```bash
npm run test
```

All algorithms handle edge cases (e.g. division by zero, logarithmic underflow with $\epsilon = 10^{-9}$, and boundary clipping).

---

## 📄 License

This project is licensed under the MIT License.
