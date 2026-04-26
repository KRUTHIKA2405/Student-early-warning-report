import studentsRaw from "../data/students.json";

export type RawStudent = {
  id: string;
  subject: "Math" | "Portuguese";
  school: "GP" | "MS";
  sex: "F" | "M";
  age: number;
  address: "U" | "R";
  famsize: "GT3" | "LE3";
  Pstatus: "A" | "T";
  Medu: number;
  Fedu: number;
  Mjob: string;
  Fjob: string;
  reason: string;
  guardian: string;
  traveltime: number;
  studytime: number;
  failures: number;
  schoolsup: "yes" | "no";
  famsup: "yes" | "no";
  paid: "yes" | "no";
  activities: "yes" | "no";
  nursery: "yes" | "no";
  higher: "yes" | "no";
  internet: "yes" | "no";
  romantic: "yes" | "no";
  famrel: number;
  freetime: number;
  goout: number;
  Dalc: number;
  Walc: number;
  health: number;
  absences: number;
  G1: number;
  G2: number;
  G3: number;
};

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type ScoredStudent = RawStudent & {
  riskScore: number;
  riskLevel: RiskLevel;
  predictedG3: number;
  trajectoryDelta: number;
  topRiskDrivers: { factor: string; weight: number; explanation: string }[];
  recommendations: string[];
};

export const STUDENTS: RawStudent[] = studentsRaw as RawStudent[];

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export function computeRisk(s: RawStudent): ScoredStudent {
  const drivers: { factor: string; weight: number; explanation: string }[] = [];
  let score = 0;

  const trajectoryDelta = s.G2 - s.G1;
  const academicDecline = trajectoryDelta < 0 ? Math.min(8, -trajectoryDelta) : 0;
  if (s.G2 < 10) {
    const w = (10 - s.G2) * 4;
    score += w;
    drivers.push({
      factor: "Low recent grades (G2)",
      weight: w,
      explanation: `Grade in second period (${s.G2}/20) is below the passing threshold of 10.`,
    });
  }
  if (academicDecline > 0) {
    const w = academicDecline * 5;
    score += w;
    drivers.push({
      factor: "Negative grade trajectory",
      weight: w,
      explanation: `Grade dropped by ${(-trajectoryDelta).toFixed(0)} points between G1 and G2.`,
    });
  }

  if (s.failures > 0) {
    const w = s.failures * 12;
    score += w;
    drivers.push({
      factor: "Past class failures",
      weight: w,
      explanation: `Student has ${s.failures} past class failure${s.failures > 1 ? "s" : ""}, a strong predictor of further academic risk.`,
    });
  }

  if (s.absences >= 10) {
    const w = Math.min(20, (s.absences - 8) * 1.5);
    score += w;
    drivers.push({
      factor: "High absenteeism",
      weight: w,
      explanation: `${s.absences} absences this term — chronic absenteeism strongly correlates with course failure.`,
    });
  }

  if (s.studytime <= 1) {
    const w = 8;
    score += w;
    drivers.push({
      factor: "Insufficient study time",
      weight: w,
      explanation: "Reports less than 2 hours of weekly study time outside of class.",
    });
  }

  if (s.Dalc >= 3 || s.Walc >= 4) {
    const w = Math.max(s.Dalc * 2, s.Walc * 1.5);
    score += w;
    drivers.push({
      factor: "Elevated alcohol consumption",
      weight: w,
      explanation: `Daily/weekend alcohol levels (D:${s.Dalc}, W:${s.Walc}) suggest behaviour that interferes with study.`,
    });
  }

  if (s.goout >= 4) {
    const w = (s.goout - 3) * 3;
    score += w;
    drivers.push({
      factor: "Frequent going out",
      weight: w,
      explanation: `Going out level ${s.goout}/5 reduces time available for study.`,
    });
  }

  if (s.famrel <= 2) {
    const w = (3 - s.famrel) * 5;
    score += w;
    drivers.push({
      factor: "Poor family relationships",
      weight: w,
      explanation: `Family relationship quality is rated ${s.famrel}/5 — limited home support is a known risk factor.`,
    });
  }

  if (s.Medu <= 1 && s.Fedu <= 1) {
    score += 6;
    drivers.push({
      factor: "Low parental education",
      weight: 6,
      explanation: "Both parents have primary education or less; correlated with weaker academic scaffolding at home.",
    });
  }

  if (s.health <= 2) {
    score += 4;
    drivers.push({
      factor: "Poor self-reported health",
      weight: 4,
      explanation: `Health rated ${s.health}/5 — frequent illness disrupts learning continuity.`,
    });
  }

  if (s.higher === "no") {
    score += 8;
    drivers.push({
      factor: "No higher-ed aspiration",
      weight: 8,
      explanation: "Student does not plan to pursue higher education — disengagement risk indicator.",
    });
  }

  if (s.internet === "no") {
    score += 3;
    drivers.push({
      factor: "No home internet access",
      weight: 3,
      explanation: "Lack of home internet limits research, homework and remote-learning resources.",
    });
  }

  if (s.traveltime >= 3) {
    score += 3;
    drivers.push({
      factor: "Long travel time",
      weight: 3,
      explanation: `Commute > 1 hour each way reduces study time and increases fatigue.`,
    });
  }

  if (s.schoolsup === "yes") {
    score -= 4;
    drivers.push({
      factor: "Receiving school support (protective)",
      weight: -4,
      explanation: "Currently enrolled in extra educational support — slightly lowers projected risk.",
    });
  }

  if (s.activities === "yes") {
    score -= 2;
    drivers.push({
      factor: "Extracurricular engagement (protective)",
      weight: -2,
      explanation: "Participating in extracurriculars is associated with stronger school connectedness.",
    });
  }

  // Logistic-style projection of G3 from G1, G2, failures, absences, studytime
  const projection =
    0.18 * s.G1 +
    0.62 * s.G2 -
    1.4 * s.failures -
    0.05 * s.absences +
    0.35 * s.studytime +
    1.1;
  const predictedG3 = Math.round(clamp(projection, 0, 20) * 10) / 10;

  const riskScore = Math.round(clamp(score, 0, 100));
  let riskLevel: RiskLevel;
  if (riskScore >= 60) riskLevel = "Critical";
  else if (riskScore >= 40) riskLevel = "High";
  else if (riskScore >= 20) riskLevel = "Moderate";
  else riskLevel = "Low";

  drivers.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  const recommendations = buildRecommendations(s, riskLevel, drivers);

  return {
    ...s,
    riskScore,
    riskLevel,
    predictedG3,
    trajectoryDelta,
    topRiskDrivers: drivers.slice(0, 5),
    recommendations,
  };
}

function buildRecommendations(
  s: RawStudent,
  level: RiskLevel,
  drivers: { factor: string }[],
): string[] {
  const recs: string[] = [];
  const has = (k: string) => drivers.some((d) => d.factor.toLowerCase().includes(k));

  if (level === "Critical" || level === "High") {
    recs.push("Schedule a one-on-one meeting with the homeroom teacher within 5 school days.");
    recs.push("Open a formal support file with the school counsellor and notify the guardian.");
  }
  if (has("absenteeism")) {
    recs.push("Initiate attendance-recovery plan; require daily check-in with mentor for 4 weeks.");
  }
  if (has("trajectory") || has("low recent")) {
    recs.push("Assign peer tutoring twice a week focused on weakest unit since the last assessment.");
  }
  if (has("failures")) {
    recs.push("Place student into the structured study-hall track and review prerequisite mastery.");
  }
  if (has("study time")) {
    recs.push("Co-create a weekly study calendar; monitor through learning-management system.");
  }
  if (has("alcohol") || has("going out")) {
    recs.push("Refer to youth wellbeing counsellor for confidential lifestyle conversation.");
  }
  if (has("family")) {
    recs.push("Family liaison officer to coordinate home-support meeting with guardian(s).");
  }
  if (has("internet")) {
    recs.push("Issue device + connectivity stipend through school equity program.");
  }
  if (has("higher-ed")) {
    recs.push("Schedule motivation interview with career counsellor; map post-secondary pathways.");
  }
  if (recs.length === 0) {
    recs.push("Maintain current support; re-evaluate next assessment cycle.");
  }
  return recs;
}

export const SCORED: ScoredStudent[] = STUDENTS.map(computeRisk);

export const RISK_COLORS: Record<RiskLevel, string> = {
  Low: "hsl(152 60% 45%)",
  Moderate: "hsl(45 90% 55%)",
  High: "hsl(25 90% 55%)",
  Critical: "hsl(0 75% 55%)",
};

export function aggregateByRisk(scored: ScoredStudent[]) {
  const buckets: Record<RiskLevel, number> = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
  for (const s of scored) buckets[s.riskLevel]++;
  return (Object.keys(buckets) as RiskLevel[]).map((k) => ({
    name: k,
    value: buckets[k],
    color: RISK_COLORS[k],
  }));
}

export function aggregateByFeature<T extends keyof RawStudent>(
  scored: ScoredStudent[],
  feature: T,
  bucketLabel: (v: RawStudent[T]) => string,
) {
  const map = new Map<string, { sum: number; count: number; risky: number }>();
  for (const s of scored) {
    const k = bucketLabel(s[feature]);
    const cur = map.get(k) ?? { sum: 0, count: 0, risky: 0 };
    cur.sum += s.G3;
    cur.count += 1;
    if (s.riskLevel === "High" || s.riskLevel === "Critical") cur.risky += 1;
    map.set(k, cur);
  }
  return Array.from(map.entries()).map(([k, v]) => ({
    bucket: k,
    avgGrade: Math.round((v.sum / v.count) * 10) / 10,
    students: v.count,
    atRiskPct: Math.round((v.risky / v.count) * 100),
  }));
}

export function correlation(scored: ScoredStudent[], feature: keyof RawStudent) {
  const xs = scored.map((s) => Number(s[feature])).filter((v) => !Number.isNaN(v));
  const ys = scored.map((s) => s.G3);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

export function modelMetrics(scored: ScoredStudent[]) {
  // Simulated supervised metrics computed against actual G3 < 10 (failure)
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  for (const s of scored) {
    const actuallyFailing = s.G3 < 10;
    const flagged = s.riskLevel === "High" || s.riskLevel === "Critical";
    if (flagged && actuallyFailing) tp++;
    else if (flagged && !actuallyFailing) fp++;
    else if (!flagged && actuallyFailing) fn++;
    else tn++;
  }
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const accuracy = (tp + tn) / scored.length;
  const f1 = (2 * precision * recall) / Math.max(0.0001, precision + recall);
  // residuals on predicted G3
  const errors = scored.map((s) => s.predictedG3 - s.G3);
  const mae = errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length;
  const rmse = Math.sqrt(errors.reduce((a, b) => a + b * b, 0) / errors.length);
  return {
    precision: +(precision * 100).toFixed(1),
    recall: +(recall * 100).toFixed(1),
    accuracy: +(accuracy * 100).toFixed(1),
    f1: +(f1 * 100).toFixed(1),
    mae: +mae.toFixed(2),
    rmse: +rmse.toFixed(2),
    confusion: { tp, fp, tn, fn },
  };
}

export function featureImportance(scored: ScoredStudent[]) {
  const features: { key: keyof RawStudent; label: string }[] = [
    { key: "failures", label: "Past failures" },
    { key: "G2", label: "Grade G2" },
    { key: "G1", label: "Grade G1" },
    { key: "absences", label: "Absences" },
    { key: "studytime", label: "Study time" },
    { key: "Medu", label: "Mother education" },
    { key: "Fedu", label: "Father education" },
    { key: "goout", label: "Going out" },
    { key: "Walc", label: "Weekend alcohol" },
    { key: "Dalc", label: "Workday alcohol" },
    { key: "famrel", label: "Family relationship" },
    { key: "health", label: "Health" },
    { key: "traveltime", label: "Travel time" },
    { key: "freetime", label: "Free time" },
    { key: "age", label: "Age" },
  ];
  return features
    .map((f) => ({
      feature: f.label,
      importance: Math.abs(correlation(scored, f.key)),
    }))
    .sort((a, b) => b.importance - a.importance);
}

export function gradeBands(scored: ScoredStudent[]) {
  const bands = [
    { band: "0–4 (Fail)", min: 0, max: 4 },
    { band: "5–9 (At-risk)", min: 5, max: 9 },
    { band: "10–13 (Pass)", min: 10, max: 13 },
    { band: "14–16 (Good)", min: 14, max: 16 },
    { band: "17–20 (Excellent)", min: 17, max: 20 },
  ];
  return bands.map((b) => ({
    band: b.band,
    students: scored.filter((s) => s.G3 >= b.min && s.G3 <= b.max).length,
  }));
}

export function trajectoryScatter(scored: ScoredStudent[]) {
  return scored.map((s) => ({
    g1: s.G1,
    g2: s.G2,
    g3: s.G3,
    risk: s.riskScore,
    level: s.riskLevel,
    id: s.id,
  }));
}
