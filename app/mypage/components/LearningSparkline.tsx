type Point = { date: string; value: number };

function padSeries(points: Point[], days = 14): Point[] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const map = new Map(points.map((p) => [p.date, p.value]));

  const out: Point[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, value: map.get(key) ?? 0 });
  }
  return out;
}

export function LearningSparkline({
  title,
  subtitle,
  points,
  strokeClass = "text-blue-600",
}: {
  title: string;
  subtitle?: string;
  points: Point[];
  strokeClass?: string;
}) {
  const series = padSeries(points, 14);
  const w = 520;
  const h = 140;
  const pad = 10;
  const max = Math.max(1, ...series.map((p) => p.value));
  const poly = series
    .map((p, idx) => {
      const x =
        pad + (idx * (w - pad * 2)) / Math.max(1, series.length - 1);
      const y = h - pad - (p.value / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">최근 14일</p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-32 w-full min-w-[420px] text-slate-900"
          role="img"
          aria-label="학습 지표 그래프"
        >
          <line
            x1={pad}
            y1={h - pad}
            x2={w - pad}
            y2={h - pad}
            stroke="currentColor"
            className="text-slate-200"
            strokeWidth="1"
          />
          <polyline
            fill="none"
            stroke="currentColor"
            className={strokeClass}
            strokeWidth="2"
            points={poly}
          />
        </svg>
      </div>
    </div>
  );
}
