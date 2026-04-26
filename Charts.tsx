import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ScoredStudent, RISK_COLORS } from "@/lib/predict";

const TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--popover-border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
};

export function RiskDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number, n) => [`${v} students (${Math.round((v / total) * 100)}%)`, n]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GradeBands({ data }: { data: { band: string; students: number }[] }) {
  const colors = ["hsl(0 75% 55%)", "hsl(25 90% 55%)", "hsl(45 90% 55%)", "hsl(152 60% 45%)", "hsl(200 80% 50%)"];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="band" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar isAnimationActive={false} dataKey="students" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FeatureImportance({ data }: { data: { feature: string; importance: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 26)}>
      <BarChart layout="vertical" data={data} margin={{ left: 20, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="feature" width={130} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => [`|r| = ${v.toFixed(3)}`, "Correlation w/ G3"]}
        />
        <Bar isAnimationActive={false} dataKey="importance" radius={[0, 6, 6, 0]} fill="hsl(var(--chart-1))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FeatureBuckets({
  data,
  xKey = "bucket",
}: {
  data: { bucket: string; avgGrade: number; atRiskPct: number; students: number }[];
  xKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 20]} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar isAnimationActive={false} yAxisId="left" dataKey="avgGrade" name="Avg G3" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
        <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="atRiskPct" name="% at risk" stroke="hsl(var(--chart-4))" strokeWidth={2.5} dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function TrajectoryScatter({ data }: { data: ScoredStudent[] }) {
  const points = data.map((s) => ({ g1: s.G1, g3: s.G3, risk: s.riskScore, level: s.riskLevel }));
  const groups: ScoredStudent["riskLevel"][] = ["Low", "Moderate", "High", "Critical"];
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis type="number" dataKey="g1" name="G1" domain={[0, 20]} tick={{ fontSize: 11 }} label={{ value: "First-period grade (G1)", position: "insideBottom", offset: -5, style: { fontSize: 11 } }} />
        <YAxis type="number" dataKey="g3" name="G3" domain={[0, 20]} tick={{ fontSize: 11 }} label={{ value: "Final grade (G3)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
        <ZAxis range={[40, 40]} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(v: any, n: any) => [v, n]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {groups.map((g) => (
          <Scatter
            key={g}
            name={g}
            data={points.filter((p) => p.level === g)}
            fill={RISK_COLORS[g]}
            opacity={0.75}
            isAnimationActive={false}
            shape="circle"
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function PredVsActual({ data }: { data: ScoredStudent[] }) {
  const points = data.map((s) => ({ predicted: s.predictedG3, actual: s.G3 }));
  const ref = Array.from({ length: 21 }, (_, i) => ({ predicted: i, actual: i }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis type="number" dataKey="predicted" domain={[0, 20]} tick={{ fontSize: 11 }} label={{ value: "Predicted G3", position: "insideBottom", offset: -5, style: { fontSize: 11 } }} />
        <YAxis type="number" dataKey="actual" domain={[0, 20]} tick={{ fontSize: 11 }} label={{ value: "Actual G3", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Scatter isAnimationActive={false} data={points} fill="hsl(var(--chart-1))" opacity={0.6} />
        <Scatter isAnimationActive={false} data={ref} fill="hsl(var(--chart-4))" line shape="circle" legendType="none" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
