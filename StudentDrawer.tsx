import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScoredStudent } from "@/lib/predict";
import { AlertTriangle, BookOpen, Home, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  student: ScoredStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RISK_BADGE: Record<ScoredStudent["riskLevel"], string> = {
  Low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Moderate: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  High: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  Critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

export function StudentDrawer({ student, open, onOpenChange }: Props) {
  if (!student) return null;
  const TrendIcon = student.trajectoryDelta >= 0 ? TrendingUp : TrendingDown;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="font-mono text-lg">Student {student.id}</SheetTitle>
            <Badge variant="outline" className={`${RISK_BADGE[student.riskLevel]} font-medium`}>
              {student.riskLevel} · {student.riskScore}
            </Badge>
          </div>
          <SheetDescription>
            {student.subject} · {student.school === "GP" ? "Gabriel Pereira" : "Mousinho da Silveira"} · {student.sex === "F" ? "Female" : "Male"}, age {student.age}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5 px-4 pb-6">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-muted-foreground">Composite risk score</p>
              <p className="text-xs font-mono">{student.riskScore}/100</p>
            </div>
            <Progress value={student.riskScore} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="G1" value={`${student.G1}/20`} />
            <Stat label="G2" value={`${student.G2}/20`} />
            <Stat label="G3 (actual)" value={`${student.G3}/20`} />
            <Stat label="G3 (predicted)" value={`${student.predictedG3.toFixed(1)}/20`} />
            <Stat label="Absences" value={student.absences} />
            <Stat
              label="Trajectory G1→G2"
              value={
                <span className={`inline-flex items-center gap-1 ${student.trajectoryDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {student.trajectoryDelta >= 0 ? "+" : ""}
                  {student.trajectoryDelta}
                </span>
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" /> Family & social context
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Address" value={student.address === "U" ? "Urban" : "Rural"} />
              <Stat label="Family size" value={student.famsize === "GT3" ? ">3" : "≤3"} />
              <Stat label="Parents" value={student.Pstatus === "T" ? "Together" : "Apart"} />
              <Stat label="Mother edu" value={`${student.Medu}/4`} />
              <Stat label="Father edu" value={`${student.Fedu}/4`} />
              <Stat label="Family relationship" value={`${student.famrel}/5`} />
              <Stat label="Internet at home" value={student.internet} />
              <Stat label="Higher-ed plans" value={student.higher} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" /> Behaviour & study
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Study time" value={`${student.studytime}/4`} />
              <Stat label="Past failures" value={student.failures} />
              <Stat label="Going out" value={`${student.goout}/5`} />
              <Stat label="Workday alcohol" value={`${student.Dalc}/5`} />
              <Stat label="Weekend alcohol" value={`${student.Walc}/5`} />
              <Stat label="Health" value={`${student.health}/5`} />
              <Stat label="School support" value={student.schoolsup} />
              <Stat label="Activities" value={student.activities} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Top risk drivers
            </h4>
            <div className="space-y-2">
              {student.topRiskDrivers.map((d) => (
                <div key={d.factor} className="rounded-md border border-card-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{d.factor}</p>
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${d.weight >= 0 ? "bg-red-500/15 text-red-700 dark:text-red-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>
                      {d.weight >= 0 ? "+" : ""}{d.weight}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{d.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" /> Recommended interventions
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              {student.recommendations.map((r, i) => (
                <li key={i} className="leading-relaxed">{r}</li>
              ))}
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
