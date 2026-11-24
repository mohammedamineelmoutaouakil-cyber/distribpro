"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMAD, formatMADCompact } from "@/lib/money";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";

export function MonthlyOrdersChart({
  data,
}: {
  data: { month: string; value: number; count: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            tickFormatter={(value: number) => formatMADCompact(value)}
            width={64}
          />
          <Tooltip
            cursor={{ fill: "rgba(37,99,235,0.06)" }}
            formatter={(value: number) => [formatMAD(value), "Montant"]}
            labelStyle={{ color: "#0F172A", fontSize: 12 }}
            contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#2563EB",
  preparing: "#6366F1",
  ready: "#14B8A6",
  completed: "#10B981",
  cancelled: "#F43F5E",
};

export function StatusPieChart({ data }: { data: { status: OrderStatus; count: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        Aucune commande pour le moment
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={48}
              outerRadius={78}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} commande${value > 1 ? "s" : ""}`,
                ORDER_STATUS_META[name as OrderStatus]?.label ?? name,
              ]}
              contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full space-y-2">
        {data.map((item) => (
          <div key={item.status} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />
              {ORDER_STATUS_META[item.status].label}
            </span>
            <span className="font-medium text-navy">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
