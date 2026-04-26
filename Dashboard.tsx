import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Layers,
  Moon,
  Sun,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SCORED,
  ScoredStudent,
  aggregateByRisk,
  aggregateByFeature,
  featureImportance,
  modelMetrics,
  gradeBands,
} from "@/lib/predict";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  RiskDonut,
  FeatureImportance,
  FeatureBuckets,
  TrajectoryScatter,
  PredVsActual,
  GradeBands,
} from "@/components/dashboard/Charts";
import { StudentTable } from "@/components/dashboard/StudentTable";
import { StudentDrawer } from "@/components/dashboard/StudentDrawer";

export default function Dashboard() {
  const [subject, setSubject] = useState<"All" | "Math" | "Portuguese">("All");
  const [school, setSchool] = useState<"All" | "GP" | "MS">("All");
  const [riskFilter, setRiskFilter] = useState<"All" | "Critical" | "High" | "Moderate" | "Low">("All");
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState<ScoredStudent | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      SCORED.filter(
        (s) =>
          (subject === "All" || s.subject === subject) &&
          (school === "All" || s.school === school) &&
          (riskFilter === "All" || s.riskLevel === riskFilter),
      ),
    [subject, school, riskFilter],
  );

  const riskBuckets = useMemo(() => aggregateByRisk(filtered), [filtered]);
  const studyTimeBuckets = useMemo(
    () =>
      (() => {
        const order = ["<2 hrs", "2–5 hrs", "5–10 hrs", ">10 hrs"];
        return aggregateByFeature(filtered, "studytime", (v) => {
          const map: Record<number, string> = { 1: "<2 hrs", 2: "2–5 hrs", 3: "5–10 hrs", 4: ">10 hrs" };
          return map[v as number] ?? String(v);
        }).sort((a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket));
      })(),
    [filtered],
  );
  const failuresBuckets = useMemo(
    () => aggregateByFeature(filtered, "failures", (v) => `${v}`).sort((a, b) => Number(a.bucket) - Number(b.bucket)),
    [filtered],
  );
  const absencesBuckets = useMemo(() => {
    const buckets = ["0", "1–4", "5–9", "10–19", "20+"];
    const out = buckets.map((b) => ({ bucket: b, sum: 0, count: 0, risky: 0 }));
    for (const s of filtered) {
      let i = 0;
      if (s.absences === 0) i = 0;
      else if (s.absences < 5) i = 1;
      else if (s.absences < 10) i = 2;
      else if (s.absences < 20) i = 3;
      else i = 4;
      out[i].sum += s.G3;
      out[i].count += 1;
      if (s.riskLevel === "High" || s.riskLevel === "Critical") out[i].risky += 1;
    }
    return out
      .filter((b) => b.count > 0)
      .map((b) => ({
        bucket: b.bucket,
        avgGrade: Math.round((b.sum / b.count) * 10) / 10,
        students: b.count,
        atRiskPct: Math.round((b.risky / b.count) * 100),
      }));
  }, [filtered]);

  const meduBuckets = useMemo(
    () =>
      aggregateByFeature(filtered, "Medu", (v) => {
        const map: Record<number, string> = { 0: "None", 1: "Primary", 2: "5–9 yr", 3: "Secondary", 4: "Higher" };
        return map[v as number] ?? String(v);
      }).sort(
        (a, b) =>
          ["None", "Primary", "5–9 yr", "Secondary", "Higher"].indexOf(a.bucket) -
          ["None", "Primary", "5–9 yr", "Secondary", "Higher"].indexOf(b.bucket),
      ),
    [filtered],
  );

  const importance = useMemo(() => featureImportance(filtered), [filtered]);
  const metrics = useMemo(() => modelMetrics(filtered), [filtered]);
  const bands = useMemo(() => gradeBands(filtered), [filtered]);

  const totals = {
    total: filtered.length,
    avgG3: filtered.length ? +(filtered.reduce((a, b) => a + b.G3, 0) / filtered.length).toFixed(1) : 0,
    atRisk: filtered.filter((s) => s.riskLevel === "High" || s.riskLevel === "Critical").length,
    critical: filtered.filter((s) => s.riskLevel === "Critical").length,
    avgAbsences: filtered.length ? +(filtered.reduce((a, b) => a + b.absences, 0) / filtered.length).toFixed(1) : 0,
  };

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  };

  const handleSelect = (s: ScoredStudent) => {
    setSelected(s);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Student Early Warning System</h1>
              <p className="text-xs text-muted-foreground">Predictive analytics for proactive student support · UCI Student Performance dataset</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Select value={subject} onValueChange={(v) => setSubject(v as typeof subject)}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All subjects</SelectItem>
                <SelectItem value="Math">Mathematics</SelectItem>
                <SelectItem value="Portuguese">Portuguese</SelectItem>
              </SelectContent>
            </Select>
            <Select value={school} onValueChange={(v) => setSchool(v as typeof school)}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All schools</SelectItem>
                <SelectItem value="GP">Gabriel Pereira</SelectItem>
                <SelectItem value="MS">Mousinho da Silveira</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as typeof riskFilter)}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All risk levels</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={toggleDark} className="h-9 w-9">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="Students tracked" value={totals.total} sub={`${SCORED.length} total in cohort`} icon={Users} accent="primary" />
          <KpiCard label="At-risk students" value={totals.atRisk} sub={`${Math.round((totals.atRisk / Math.max(1, totals.total)) * 100)}% of cohort`} icon={AlertTriangle} accent="warning" />
          <KpiCard label="Critical interventions" value={totals.critical} sub="Immediate action recommended" icon={Target} accent="danger" />
          <KpiCard label="Average final grade" value={`${totals.avgG3}/20`} sub={`Pass threshold: 10/20`} icon={BookOpen} accent="success" />
          <KpiCard label="Average absences" value={totals.avgAbsences} sub="Per student, per term" icon={Layers} accent="violet" />
        </div>

        <Tabs defaultValue={(typeof window !== "undefined" && window.location.hash.replace("#", "")) || "overview"}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Feature analysis</TabsTrigger>
            <TabsTrigger value="model">Model performance</TabsTrigger>
            <TabsTrigger value="students">Student roster</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-card-border">
                <CardHeader>
                  <CardTitle className="text-base">Risk distribution</CardTitle>
                  <CardDescription>Composite score grouped into four bands</CardDescription>
                </CardHeader>
                <CardContent>
                  <RiskDonut data={riskBuckets} />
                </CardContent>
              </Card>
              <Card className="border-card-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Final grade (G3) distribution</CardTitle>
                  <CardDescription>Counts per Portuguese 0–20 grade band</CardDescription>
                </CardHeader>
                <CardContent>
                  <GradeBands data={bands} />
                </CardContent>
              </Card>
            </div>

            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="text-base">Academic trajectory: G1 vs final G3</CardTitle>
                <CardDescription>
                  Each point is a student. Coloured by predicted risk level. Students far below the diagonal are losing
                  ground.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrajectoryScatter data={filtered} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-card-border">
                <CardHeader>
                  <CardTitle className="text-base">Weekly study time vs outcomes</CardTitle>
                  <CardDescription>Average final grade and at-risk share by reported study time</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureBuckets data={studyTimeBuckets} />
                </CardContent>
              </Card>
              <Card className="border-card-border">
                <CardHeader>
                  <CardTitle className="text-base">Past failures vs outcomes</CardTitle>
                  <CardDescription>The strongest single behavioural predictor of failure</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureBuckets data={failuresBuckets} />
                </CardContent>
              </Card>
              <Card className="border-card-border">
                <CardHeader>
                  <CardTitle className="text-base">Absences vs outcomes</CardTitle>
                  <CardDescription>Chronic absenteeism is a leading indicator of dropout</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureBuckets data={absencesBuckets} />
                </CardContent>
              </Card>
              <Card className="border-card-border">
                <CardHeader>
                  <CardTitle className="text-base">Mother's education vs outcomes</CardTitle>
                  <CardDescription>A proxy for academic scaffolding at home</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureBuckets data={meduBuckets} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-6 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Accuracy" value={`${metrics.accuracy}%`} icon={Target} accent="primary" sub="Correctly classified" />
              <KpiCard label="Recall (sensitivity)" value={`${metrics.recall}%`} icon={AlertTriangle} accent="warning" sub="Of true at-risk students caught" />
              <KpiCard label="Precision" value={`${metrics.precision}%`} icon={Layers} accent="violet" sub="Of flagged students that actually fail" />
              <KpiCard label="F1 score" value={`${metrics.f1}%`} icon={BookOpen} accent="success" sub="Balance of precision & recall" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <Card className="border-card-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Confusion matrix</CardTitle>
                  <CardDescription>At-risk classifier vs actual failure (G3 &lt; 10)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 text-sm">
                    <div></div>
                    <div className="text-center text-xs text-muted-foreground py-2">Actually fail</div>
                    <div className="text-center text-xs text-muted-foreground py-2">Actually pass</div>

                    <div className="flex items-center text-xs text-muted-foreground py-2 pr-2 justify-end">Flagged</div>
                    <div className="rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 p-4 text-center font-mono font-semibold">
                      TP · {metrics.confusion.tp}
                    </div>
                    <div className="rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 p-4 text-center font-mono font-semibold m-1">
                      FP · {metrics.confusion.fp}
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground py-2 pr-2 justify-end">Not flagged</div>
                    <div className="rounded-md bg-red-500/15 text-red-700 dark:text-red-400 p-4 text-center font-mono font-semibold">
                      FN · {metrics.confusion.fn}
                    </div>
                    <div className="rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-400 p-4 text-center font-mono font-semibold m-1">
                      TN · {metrics.confusion.tn}
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-[10px] uppercase text-muted-foreground">Mean abs. error</p>
                      <p className="text-2xl font-bold mt-1">{metrics.mae}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">grade points / 20</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-[10px] uppercase text-muted-foreground">RMSE</p>
                      <p className="text-2xl font-bold mt-1">{metrics.rmse}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">grade points / 20</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-card-border lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Predicted vs actual final grade</CardTitle>
                  <CardDescription>Diagonal = perfect prediction. Spread shows residual error.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PredVsActual data={filtered} />
                </CardContent>
              </Card>
            </div>

            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="text-base">Feature importance</CardTitle>
                <CardDescription>Absolute Pearson correlation between each feature and the final grade (G3)</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureImportance data={importance} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4 pt-4">
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Student roster
                  <Badge variant="secondary" className="ml-1 font-normal">
                    {filtered.length} records
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Click a row to open the personalised early-warning brief and recommended interventions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentTable students={filtered} onSelect={handleSelect} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Data: UCI ML Repository · Student Performance (Cortez & Silva, 2008) · Combined Mathematics + Portuguese cohorts.
        </footer>
      </main>

      <StudentDrawer student={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
