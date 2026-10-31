import { CheckCircle2, Circle } from "lucide-react";

export type RoadmapPlan = any;

/** Flatten a plan into stable task ids: "w{week}-t{index}" or "w{week}-d{day}". */
export function roadmapTaskIds(plan: RoadmapPlan): string[] {
  const ids: string[] = [];
  for (const n of [1, 2, 3, 4]) {
    const w = plan?.[`week_${n}`];
    const days = Array.isArray(w?.days) && w.days.length ? w.days : null;
    (days ?? w?.tasks ?? []).forEach((_: unknown, i: number) => ids.push(`w${n}-${days ? "d" : "t"}${i}`));
  }
  return ids;
}

export function RoadmapView({
  plan,
  completed,
  onToggle,
}: {
  plan: RoadmapPlan;
  completed: string[];
  onToggle?: (id: string) => void;
}) {
  const ids = roadmapTaskIds(plan);
  const done = ids.filter((i) => completed.includes(i)).length;
  const pct = ids.length ? Math.round((done / ids.length) * 100) : 0;
  return (
    <div>
      {plan.goal && <p className="text-sm text-muted-foreground">{plan.goal}</p>}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>
            {done}/{ids.length} tasks · {pct}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((n) => {
          const w = plan[`week_${n}`];
          if (!w) return null;
          const days = Array.isArray(w.days) && w.days.length ? w.days : null;
          const items: { id: string; label: string }[] = days
            ? days.map((d: any, i: number) => ({ id: `w${n}-d${i}`, label: `Day ${d?.day ?? ""}: ${d?.task ?? d}` }))
            : (w.tasks ?? []).map((t: string, i: number) => ({ id: `w${n}-t${i}`, label: t }));
          return (
            <div key={n} className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Week {n}: {w.focus}
              </h3>
              <ul className="mt-3 space-y-2">
                {items.map((it) => {
                  const isDone = completed.includes(it.id);
                  return (
                    <li key={it.id}>
                      <button
                        type="button"
                        disabled={!onToggle}
                        onClick={() => onToggle?.(it.id)}
                        className="flex w-full items-start gap-2 text-left text-sm text-muted-foreground disabled:cursor-default"
                      >
                        {isDone ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 size-4 shrink-0" />}
                        <span className={isDone ? "line-through opacity-60" : ""}>{it.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {w.deliverable && <p className="mt-3 text-xs text-primary">Deliverable: {w.deliverable}</p>}
            </div>
          );
        })}
      </div>
      {Array.isArray(plan.success_metrics) && plan.success_metrics.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground">Success metrics</h3>
          <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
            {plan.success_metrics.map((x: string, i: number) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
