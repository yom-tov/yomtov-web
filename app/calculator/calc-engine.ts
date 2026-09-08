import { create, all } from "mathjs";

const math = create(all);

export type AngleMode = "deg" | "rad";

export interface ComplexResult {
  re: number;
  im: number;
}

export type CalcResult = number | ComplexResult;

export function isComplex(v: CalcResult): v is ComplexResult {
  return typeof v === "object" && v !== null && "re" in v && "im" in v;
}

const DEG = Math.PI / 180;
const RDEG = 180 / Math.PI;

function preprocess(expr: string): string {
  let s = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "pi")
    .replace(/\bAns\b/gi, "ans");
  s = s.replace(/\blog\s*\(/g, "log10(");
  s = s.replace(/\bln\s*\(/g, "log(");
  s = s.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  return s;
}

function toCalcResult(val: unknown): CalcResult {
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (val && typeof val === "object" && "re" in val && "im" in val) {
    const c = val as { re: number; im: number };
    if (Math.abs(c.im) < 1e-12) return c.re;
    return { re: c.re, im: c.im };
  }
  return NaN;
}

export function evaluate(
  expr: string,
  mode: AngleMode = "deg",
  ans: CalcResult = 0,
): CalcResult {
  const processed = preprocess(expr);
  if (!processed.trim()) return 0;

  const scope: Record<string, unknown> = {
    ans: isComplex(ans) ? math.complex(ans.re, ans.im) : ans,
  };

  if (mode === "deg") {
    const wrap =
      (fn: (x: unknown) => unknown, inv: boolean) => (x: unknown) => {
        if (typeof x !== "number") return fn(x);
        return inv ? (fn(x) as number) * RDEG : fn(x * DEG);
      };
    scope.sin = wrap((x) => math.sin(x as number), false);
    scope.cos = wrap((x) => math.cos(x as number), false);
    scope.tan = wrap((x) => math.tan(x as number), false);
    scope.asin = wrap((x) => math.asin(x as number), true);
    scope.acos = wrap((x) => math.acos(x as number), true);
    scope.atan = wrap((x) => math.atan(x as number), true);
  }

  const result = math.evaluate(processed, scope);
  return toCalcResult(result);
}

function formatNum(n: number): string {
  if (!isFinite(n)) return isNaN(n) ? "Error" : n > 0 ? "∞" : "-∞";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12 || (abs < 1e-6 && abs > 0)) {
    return n.toExponential(8).replace(/\.?0+e/, "e").replace("e+", "e");
  }
  const s = n.toPrecision(10);
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

export function formatResult(value: CalcResult): string {
  if (isComplex(value)) {
    if (Math.abs(value.re) < 1e-12 && Math.abs(value.im) < 1e-12) return "0";
    const absIm = Math.abs(value.im);
    if (Math.abs(value.re) < 1e-12) {
      if (Math.abs(absIm - 1) < 1e-12) return value.im < 0 ? "-i" : "i";
      return `${formatNum(value.im)}i`;
    }
    if (absIm < 1e-12) return formatNum(value.re);
    const sign = value.im < 0 ? " - " : " + ";
    const imPart = Math.abs(absIm - 1) < 1e-12 ? "" : formatNum(absIm);
    return `${formatNum(value.re)}${sign}${imPart}i`;
  }
  return formatNum(value);
}

/* ── base conversion ── */

export function toBase(value: number, base: 2 | 8 | 10 | 16): string {
  const n = Math.trunc(value);
  if (base === 16) return n.toString(16).toUpperCase();
  return n.toString(base);
}

export function fromBase(str: string, base: 2 | 8 | 10 | 16): number {
  const n = parseInt(str, base);
  return isNaN(n) ? 0 : n;
}

export function bitwiseOp(
  a: number,
  b: number,
  op: "AND" | "OR" | "XOR" | "NOT" | "SHL" | "SHR",
): number {
  const ai = Math.trunc(a);
  const bi = Math.trunc(b);
  switch (op) {
    case "AND": return ai & bi;
    case "OR":  return ai | bi;
    case "XOR": return ai ^ bi;
    case "NOT": return ~ai;
    case "SHL": return ai << bi;
    case "SHR": return ai >> bi;
  }
}

/* ── equation solving ── */

export function solveLinearSystem(
  coefficients: number[][],
  constants: number[],
): CalcResult[] {
  try {
    const A = math.matrix(coefficients);
    const b = math.matrix(constants.map((c) => [c]));
    const x = math.lusolve(A, b);
    const arr = (x as unknown as { toArray(): number[][] }).toArray();
    return arr.map((row) => row[0]);
  } catch {
    throw new Error("No unique solution exists");
  }
}

export function solvePolynomial(coefficients: number[]): CalcResult[] {
  const n = coefficients.length - 1;
  if (n <= 0) return [];
  if (coefficients[0] === 0) throw new Error("Leading coefficient cannot be zero");
  if (n === 1) return [-coefficients[1] / coefficients[0]];
  if (n === 2)
    return solveQuadratic(coefficients[0], coefficients[1], coefficients[2]);
  return durandKerner(coefficients);
}

function solveQuadratic(a: number, b: number, c: number): CalcResult[] {
  const disc = b * b - 4 * a * c;
  if (disc >= 0) {
    const sq = Math.sqrt(disc);
    return [(-b + sq) / (2 * a), (-b - sq) / (2 * a)];
  }
  const re = -b / (2 * a);
  const im = Math.sqrt(-disc) / (2 * a);
  return [
    { re, im },
    { re, im: -im },
  ];
}

function durandKerner(coeffs: number[], maxIter = 300): CalcResult[] {
  const n = coeffs.length - 1;
  const lead = coeffs[0];
  const c = coeffs.map((x) => x / lead);
  const bound = 1 + Math.max(...c.slice(1).map(Math.abs));

  const roots = Array.from({ length: n }, (_, k) => {
    const angle = (2 * Math.PI * k) / n + 0.4;
    return {
      re: bound * 0.9 * Math.cos(angle),
      im: bound * 0.9 * Math.sin(angle),
    };
  });

  for (let iter = 0; iter < maxIter; iter++) {
    let maxDelta = 0;
    for (let i = 0; i < n; i++) {
      const { re: zR, im: zI } = roots[i];
      let pR = 1, pI = 0;
      for (let j = 1; j <= n; j++) {
        const nR = pR * zR - pI * zI + c[j];
        const nI = pR * zI + pI * zR;
        pR = nR;
        pI = nI;
      }
      let prR = 1, prI = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const dR = zR - roots[j].re;
        const dI = zI - roots[j].im;
        const nR = prR * dR - prI * dI;
        const nI = prR * dI + prI * dR;
        prR = nR;
        prI = nI;
      }
      const den = prR * prR + prI * prI;
      if (den < 1e-30) continue;
      const dR = (pR * prR + pI * prI) / den;
      const dI = (pI * prR - pR * prI) / den;
      roots[i].re -= dR;
      roots[i].im -= dI;
      maxDelta = Math.max(maxDelta, dR * dR + dI * dI);
    }
    if (maxDelta < 1e-24) break;
  }

  return roots.map((r) => {
    const re = Math.abs(r.re) < 1e-10 ? 0 : r.re;
    const im = Math.abs(r.im) < 1e-10 ? 0 : r.im;
    return im === 0 ? re : { re, im };
  });
}

/* ── matrix operations ── */

export function matDeterminant(matrix: number[][]): number {
  return math.det(matrix) as number;
}

export function matInverse(matrix: number[][]): number[][] | null {
  try {
    const inv = math.inv(matrix);
    if (Array.isArray(inv)) return inv as number[][];
    return (inv as unknown as { toArray(): number[][] }).toArray();
  } catch {
    return null;
  }
}

export function matTranspose(matrix: number[][]): number[][] {
  const r = math.transpose(matrix);
  if (Array.isArray(r)) return r as number[][];
  return (r as unknown as { toArray(): number[][] }).toArray();
}

export function matMultiply(a: number[][], b: number[][]): number[][] {
  const r = math.multiply(a, b);
  if (Array.isArray(r)) return r as number[][];
  return (r as unknown as { toArray(): number[][] }).toArray();
}

/* ── statistics ── */

export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
}

export function computeStats(data: number[]): StatsResult {
  const n = data.length;
  if (n === 0) throw new Error("No data");
  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median =
    n % 2 === 1
      ? sorted[Math.floor(n / 2)]
      : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = data.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  return {
    count: n,
    sum,
    mean,
    median,
    stdDev: Math.sqrt(variance),
    variance,
    min: sorted[0],
    max: sorted[n - 1],
  };
}

export function linearRegression(
  xs: number[],
  ys: number[],
): { slope: number; intercept: number; rSquared: number } {
  if (xs.length !== ys.length || xs.length < 2)
    throw new Error("Need at least 2 matched X,Y pairs");
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const meanY = sumY / n;
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-14)
    throw new Error("Cannot compute regression");
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = meanY - slope * (sumX / n);
  const ssRes = ys.reduce(
    (s, y, i) => s + (y - (slope * xs[i] + intercept)) ** 2,
    0,
  );
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, rSquared };
}
