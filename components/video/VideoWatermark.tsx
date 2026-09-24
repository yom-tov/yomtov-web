"use client";

import { useEffect, useState } from "react";

interface WatermarkData {
  name: string;
  email: string;
  phone: string;
  uid: string;
}

const POSITIONS = [
  { top: "8%", left: "auto", right: "5%", bottom: "auto" },
  { top: "auto", left: "5%", right: "auto", bottom: "12%" },
  { top: "8%", left: "5%", right: "auto", bottom: "auto" },
  { top: "auto", left: "auto", right: "5%", bottom: "12%" },
] as const;

const INTERVAL_MS = 15 * 60 * 1000;

function getPositionIndex(): number {
  return Math.floor(Date.now() / INTERVAL_MS) % POSITIONS.length;
}

export function VideoWatermark({ data }: { data: WatermarkData }) {
  const [posIndex, setPosIndex] = useState(getPositionIndex);

  useEffect(() => {
    const check = () => {
      const next = getPositionIndex();
      if (next !== posIndex) setPosIndex(next);
    };
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [posIndex]);

  const pos = POSITIONS[posIndex];
  const signature = `ID: ${data.uid}`;

  return (
    <div
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        right: pos.right,
        bottom: pos.bottom,
        zIndex: 20,
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        direction: "ltr",
        fontFamily: "monospace",
        fontSize: "11px",
        lineHeight: "1.5",
        color: "rgba(255, 255, 255, 0.45)",
        textShadow: "0 1px 3px rgba(0, 0, 0, 0.7)",
        padding: "6px 10px",
        borderRadius: "6px",
        background: "rgba(0, 0, 0, 0.15)",
        maxWidth: "260px",
        transition: "all 1s ease-in-out",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "12px" }}>{data.name}</div>
      <div>{data.email}</div>
      {data.phone && <div>{data.phone}</div>}
      <div style={{ opacity: 0.7, fontSize: "10px" }}>{signature}</div>
    </div>
  );
}
