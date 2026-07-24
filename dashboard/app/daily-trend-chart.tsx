"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyCost } from "@/lib/db";

export function DailyTrendChart({ data }: { data: DailyCost[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">아직 데이터가 없어요.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
        <XAxis dataKey="date" fontSize={12} tickFormatter={(d: string) => d.slice(5)} />
        <YAxis fontSize={12} tickFormatter={(v: number) => `$${v.toFixed(1)}`} />
        <Tooltip formatter={(v) => [`$${Number(v).toFixed(4)}`, "비용"]} labelFormatter={(l) => `날짜: ${l}`} />
        <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
