import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { ScoredStudent } from "@/lib/predict";

interface Props {
  students: ScoredStudent[];
  onSelect: (s: ScoredStudent) => void;
}

const PAGE = 12;

const RISK_BADGE: Record<ScoredStudent["riskLevel"], string> = {
  Low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Moderate: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  High: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  Critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

export function StudentTable({ students, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<"riskScore" | "G3" | "absences" | "predictedG3">("riskScore");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = students;
    if (q) list = list.filter((s) => s.id.toLowerCase().includes(q) || s.school.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q));
    list = [...list].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
    return list;
  }, [students, query, sortKey]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by ID, school or subject…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort by</span>
          {(
            [
              ["riskScore", "Risk"],
              ["predictedG3", "Predicted G3"],
              ["G3", "Actual G3"],
              ["absences", "Absences"],
            ] as const
          ).map(([k, label]) => (
            <Button
              key={k}
              size="sm"
              variant={sortKey === k ? "default" : "outline"}
              onClick={() => setSortKey(k)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-card-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>School</TableHead>
              <TableHead className="text-right">G1</TableHead>
              <TableHead className="text-right">G2</TableHead>
              <TableHead className="text-right">G3</TableHead>
              <TableHead className="text-right">Pred G3</TableHead>
              <TableHead className="text-right">Absences</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="text-right w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.map((s) => (
              <TableRow key={s.id} className="hover-elevate">
                <TableCell className="font-mono text-xs">{s.id}</TableCell>
                <TableCell>{s.subject}</TableCell>
                <TableCell>{s.school === "GP" ? "Gabriel Pereira" : "Mousinho da Silveira"}</TableCell>
                <TableCell className="text-right font-mono">{s.G1}</TableCell>
                <TableCell className="text-right font-mono">{s.G2}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{s.G3}</TableCell>
                <TableCell className="text-right font-mono text-blue-600 dark:text-blue-400">
                  {s.predictedG3.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">{s.absences}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${RISK_BADGE[s.riskLevel]} font-medium`}>
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
                    {s.riskLevel} · {s.riskScore}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => onSelect(s)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {view.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  No students match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {filtered.length} students · page {page + 1} of {pages}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
