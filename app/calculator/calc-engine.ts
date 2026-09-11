export function toBase(value: number, base: 2 | 8 | 10 | 16): string {
  if (!Number.isFinite(value)) return "0";
  const n = Math.trunc(value);
  if (base === 10) return n.toString(10);
  if (n < 0) return "-" + ((-n) >>> 0).toString(base).toUpperCase();
  return n.toString(base).toUpperCase();
}

export function fromBase(str: string, base: 2 | 8 | 10 | 16): number {
  if (!str || str === "-") return 0;
  return parseInt(str, base) || 0;
}

export function bitwiseOp(
  a: number,
  b: number,
  op: "AND" | "OR" | "XOR" | "NOT" | "SHL" | "SHR",
): number {
  const ai = a | 0;
  const bi = b | 0;
  switch (op) {
    case "AND": return ai & bi;
    case "OR":  return ai | bi;
    case "XOR": return ai ^ bi;
    case "NOT": return ~ai;
    case "SHL": return ai << bi;
    case "SHR": return ai >> bi;
  }
}
