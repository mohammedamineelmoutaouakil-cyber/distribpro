import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "brand" | "teal" | "navy" | "amber";
}) {
  const accents = {
    brand: "bg-brand-light text-brand-dark",
    teal: "bg-teal-light text-teal-700",
    navy: "bg-slate-100 text-navy",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-navy">{value}</p>
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accents[accent])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              trend.positive ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
        {hint && <span className="text-slate-400">{hint}</span>}
      </div>
    </Card>
  );
}
