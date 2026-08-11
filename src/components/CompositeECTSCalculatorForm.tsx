import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Info,
  Lightbulb,
  AlertTriangle,
  Layers,
  ClipboardCheck,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CompositeSource {
  sourceIndex?: number;
  sourceTitle?: string;
  workingTitle?: string;
  fileName?: string;
  sourceDocumentId?: string;
  documentId?: string;
  data?: Record<string, any>;
}

interface SourceLearningActivity {
  id: string;
  name: string;
  hours: number;
}

interface SourceEntry {
  sourceKey: string;
  title: string;
  learningActivities: SourceLearningActivity[];
  totalLearningHours: number;
  ectsMin: number; // hours / 30
  ectsMax: number; // hours / 25
  selectedECTS: number; // user's chosen value within the range
  expanded: boolean;
  groupId: string | null;
}

interface EitherOrGroup {
  id: string;
  label: string;
}

interface AssessmentActivity {
  id: string;
  name: string;
  hours: string;
}

interface CompositeECTSData {
  sources: SourceEntry[];
  groups: EitherOrGroup[];
  assessmentActivities?: AssessmentActivity[];
  totalECTS?: number;
  totalECTSMin?: number;
  totalECTSMax?: number;
  confirmedECTS?: number;
}

interface CompositeECTSCalculatorFormProps {
  data: CompositeECTSData;
  onChange: (data: CompositeECTSData) => void;
  compositeSources: CompositeSource[];
  /** From Phase 5.5 — map of source-id -> either-group number */
  phase5EitherGroups?: Record<string, number>;
  /** From Phase 5.5 — list of source-ids marked as either/or */
  phase5EitherSources?: string[];
}

const generateECTSOptions = (min: number, max: number): number[] => {
  const options: number[] = [];
  const start = Math.max(0.5, Math.ceil(min * 2) / 2);
  for (let val = start; val <= max + 0.0001; val += 0.5) {
    options.push(parseFloat(val.toFixed(1)));
  }
  if (options.length === 0 && max > 0) options.push(parseFloat(max.toFixed(1)));
  return options;
};

/**
 * Read all learning activities from a standalone source.
 * Composite micro-credentials reuse ONLY the learning activities — assessment
 * workload from the source is excluded because the composite designs its own
 * assessment.
 */
function readSourceLearningActivities(
  source: CompositeSource
): SourceLearningActivity[] {
  const d = source?.data || {};
  const ectsData = d?.["6.3"]?.ectsData ?? d?.ectsData ?? null;
  const list = Array.isArray(ectsData?.learningActivities)
    ? ectsData.learningActivities
    : [];
  return list
    .map((a: any, idx: number) => {
      const h = parseFloat(a?.hours);
      return {
        id: a?.id ? String(a.id) : `la-${idx}`,
        name: String(a?.name || `Activity ${idx + 1}`),
        hours: isNaN(h) || h < 0 ? 0 : h,
      };
    })
    .filter((a) => a.hours > 0 || a.name.trim().length > 0);
}

function buildSourceKey(source: CompositeSource): string {
  return (
    source.sourceDocumentId ||
    source.documentId ||
    `src-${source.sourceIndex ?? Math.random().toString(36).slice(2)}`
  );
}

function readSourceTitle(source: CompositeSource): string {
  return (
    source.sourceTitle ||
    source.workingTitle ||
    source.fileName ||
    `Standalone source ${source.sourceIndex ?? ""}`.trim()
  );
}

/** Pick the default ECTS pick from a range (lower bound, rounded to 0.5). */
function defaultPickFromRange(min: number, max: number): number {
  const opts = generateECTSOptions(min, max);
  return opts.length > 0 ? opts[0] : 0;
}

const CompositeECTSCalculatorForm = ({
  data,
  onChange,
  compositeSources,
  phase5EitherGroups,
  phase5EitherSources,
}: CompositeECTSCalculatorFormProps) => {
  // Build the set of candidate ids Phase 5 may have used for a given source.
  // Phase 5 keys sources as: documentId || fileName || `source-${index}`.
  const candidateIdsFor = (source: CompositeSource, index: number): string[] => {
    const ids: string[] = [];
    if (source.sourceDocumentId) ids.push(source.sourceDocumentId);
    if (source.documentId) ids.push(source.documentId);
    if (source.fileName) ids.push(source.fileName);
    ids.push(`source-${index}`);
    return ids;
  };
  // Stable signature for the set of composite sources — recompute only when
  // the actual source set or its learning activities change, NOT on every
  // parent render (parent passes a fresh array reference each time).
  const sourcesSignature = useMemo(() => {
    return (compositeSources || [])
      .map((s) => {
        const key = buildSourceKey(s);
        const acts = readSourceLearningActivities(s);
        const hours = acts.reduce((sum, a) => sum + a.hours, 0);
        return `${key}:${acts.length}:${hours}`;
      })
      .join("|");
  }, [compositeSources]);

  // Build / sync source entries from composite sources, preserving user state where possible.
  const initialEntries = useMemo<SourceEntry[]>(() => {
    const existing = new Map((data?.sources || []).map((s) => [s.sourceKey, s]));
    return (compositeSources || []).map((source) => {
      const key = buildSourceKey(source);
      const prev = existing.get(key);
      const learningActivities = readSourceLearningActivities(source);
      const totalLearningHours = learningActivities.reduce(
        (s, a) => s + a.hours,
        0
      );
      const ectsMin = parseFloat((totalLearningHours / 30).toFixed(2));
      const ectsMax = parseFloat((totalLearningHours / 25).toFixed(2));

      return {
        sourceKey: key,
        title: readSourceTitle(source),
        learningActivities,
        totalLearningHours,
        ectsMin,
        ectsMax,
        selectedECTS: 0,
        expanded: prev?.expanded ?? false,
        groupId: prev?.groupId ?? null,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesSignature]);

  const [entries, setEntries] = useState<SourceEntry[]>(initialEntries);
  const [groups, setGroups] = useState<EitherOrGroup[]>(data?.groups || []);
  const [assessmentActivities, setAssessmentActivities] = useState<
    AssessmentActivity[]
  >(
    data?.assessmentActivities && data.assessmentActivities.length > 0
      ? data.assessmentActivities
      : [{ id: `a-${Date.now()}`, name: "", hours: "" }]
  );
  const [confirmedECTS, setConfirmedECTS] = useState<number | undefined>(
    data?.confirmedECTS
  );

  // Re-sync only when the source signature actually changes (new file added,
  // removed, or its learning hours changed). User's groupId/expanded state is
  // preserved because we merge from current `entries` state, not from `data`.
  useEffect(() => {
    setEntries((prev) => {
      const prevByKey = new Map(prev.map((e) => [e.sourceKey, e]));
      return initialEntries.map((fresh) => {
        const old = prevByKey.get(fresh.sourceKey);
        if (!old) return fresh;
        return {
          ...fresh,
          groupId: old.groupId,
          expanded: old.expanded,
        };
      });
    });
  }, [sourcesSignature]);

  // ---------------------------------------------------------------------------
  // Auto-sync either/or groups from Phase 5.5 (Assessment access model).
  // Phase 5 stores: partiallyFixedEitherGroups = { sourceId: groupNumber }
  // We map those group numbers to local EitherOrGroup ids and assign each
  // matching source-entry to the corresponding group.
  // ---------------------------------------------------------------------------
  const phase5Signature = useMemo(() => {
    if (!phase5EitherGroups) return "";
    return Object.entries(phase5EitherGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("|");
  }, [phase5EitherGroups]);

  useEffect(() => {
    if (!phase5EitherGroups || Object.keys(phase5EitherGroups).length === 0) {
      return;
    }

    // Build sourceKey -> phase5 group number, by trying every candidate id
    const sourceKeyToGroupNum = new Map<string, number>();
    (compositeSources || []).forEach((source, idx) => {
      const ids = candidateIdsFor(source, idx);
      const localKey = buildSourceKey(source);
      for (const id of ids) {
        if (phase5EitherGroups[id] !== undefined) {
          sourceKeyToGroupNum.set(localKey, phase5EitherGroups[id]);
          break;
        }
      }
    });
    if (sourceKeyToGroupNum.size === 0) return;

    // Build (or reuse) local EitherOrGroup entries for each Phase 5 group number
    const groupNumToLocalId = new Map<number, string>();
    setGroups((prevGroups) => {
      const next = [...prevGroups];
      const distinctNums = Array.from(new Set(sourceKeyToGroupNum.values())).sort(
        (a, b) => a - b
      );
      for (const num of distinctNums) {
        const label = `Either/or group ${num} (from Phase 5)`;
        let existing = next.find((g) => g.label === label);
        if (!existing) {
          const id = `phase5-grp-${num}`;
          existing = { id, label };
          if (!next.some((g) => g.id === id)) next.push(existing);
        }
        groupNumToLocalId.set(num, existing.id);
      }
      return next;
    });

    // After groups are settled, assign entries to their groups
    setEntries((prev) =>
      prev.map((e) => {
        const num = sourceKeyToGroupNum.get(e.sourceKey);
        if (num === undefined) {
          // Source was NOT marked as either in Phase 5 → ensure it's ungrouped
          // (only clear if it's currently in a phase5-* group, so we don't
          // wipe manually-created groups for non-phase5 sources)
          if (e.groupId && e.groupId.startsWith("phase5-grp-")) {
            return { ...e, groupId: null };
          }
          return e;
        }
        const targetGroupId = `phase5-grp-${num}`;
        if (e.groupId === targetGroupId) return e;
        return { ...e, groupId: targetGroupId };
      })
    );
  }, [phase5Signature, sourcesSignature]);

  // Sum learning HOURS from sources. Either/or groups: all members must have
  // the same total learning hours; only one of them counts toward the workload.
  const { groupedByGroup, ungrouped, sourcesLearningHours, groupErrors } = useMemo(() => {
    const byGroup = new Map<string, SourceEntry[]>();
    const free: SourceEntry[] = [];
    entries.forEach((e) => {
      if (e.groupId) {
        if (!byGroup.has(e.groupId)) byGroup.set(e.groupId, []);
        byGroup.get(e.groupId)!.push(e);
      } else {
        free.push(e);
      }
    });
    let totalHours = free.reduce((s, e) => s + (Number(e.totalLearningHours) || 0), 0);
    const errs: Record<string, string> = {};
    byGroup.forEach((members, gid) => {
      if (members.length === 0) return;
      const first = Number(members[0].totalLearningHours) || 0;
      const allMatch = members.every(
        (m) => (Number(m.totalLearningHours) || 0) === first
      );
      if (!allMatch) {
        errs[gid] =
          "All courses in an either/or group must have the same total learning hours.";
      }
      totalHours += first;
    });
    return {
      groupedByGroup: byGroup,
      ungrouped: free,
      sourcesLearningHours: parseFloat(totalHours.toFixed(2)),
      groupErrors: errs,
    };
  }, [entries]);

  const sourcesECTSMin = parseFloat((sourcesLearningHours / 30).toFixed(2));
  const sourcesECTSMax = parseFloat((sourcesLearningHours / 25).toFixed(2));

  // Composite-level assessment activities → ECTS range using 25–30h standard
  const assessmentTotals = useMemo(() => {
    const hours = assessmentActivities.reduce((s, a) => {
      const h = parseFloat(a.hours);
      return s + (isNaN(h) || h < 0 ? 0 : h);
    }, 0);
    const ectsMin = parseFloat((hours / 30).toFixed(2));
    const ectsMax = parseFloat((hours / 25).toFixed(2));
    return { hours, ectsMin, ectsMax };
  }, [assessmentActivities]);

  // Total = (source learning hours + composite assessment hours) → range
  const totalHours = sourcesLearningHours + assessmentTotals.hours;
  const totalECTSMin = parseFloat((totalHours / 30).toFixed(2));
  const totalECTSMax = parseFloat((totalHours / 25).toFixed(2));

  const ectsOptions = useMemo(
    () => generateECTSOptions(totalECTSMin, totalECTSMax),
    [totalECTSMin, totalECTSMax]
  );

  // Reset confirmed value if it falls outside the new range
  useEffect(() => {
    if (
      confirmedECTS !== undefined &&
      (confirmedECTS < totalECTSMin - 0.0001 ||
        confirmedECTS > totalECTSMax + 0.0001)
    ) {
      setConfirmedECTS(undefined);
    }
  }, [totalECTSMin, totalECTSMax]);

  // Persist
  useEffect(() => {
    onChange({
      sources: entries,
      groups,
      assessmentActivities,
      totalECTS: totalECTSMin,
      totalECTSMin,
      totalECTSMax,
      confirmedECTS,
    });
  }, [
    entries,
    groups,
    assessmentActivities,
    totalECTSMin,
    totalECTSMax,
    confirmedECTS,
  ]);

  const updateEntry = (key: string, patch: Partial<SourceEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.sourceKey === key ? { ...e, ...patch } : e))
    );
  };

  // (no per-source ECTS pick — totals derive from learning hours)

  const toggleExpanded = (key: string) => {
    const e = entries.find((x) => x.sourceKey === key);
    if (!e) return;
    updateEntry(key, { expanded: !e.expanded });
  };

  // Either/or groups are managed exclusively from Phase 5.5 (Assessment access
  // model). No manual add/delete/assign helpers here — see auto-sync effect above.

  // --- Composite-level assessment activities ---
  const addAssessmentRow = () => {
    setAssessmentActivities((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        hours: "",
      },
    ]);
  };
  const updateAssessmentRow = (
    id: string,
    field: "name" | "hours",
    value: string
  ) => {
    setAssessmentActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };
  const deleteAssessmentRow = (id: string) => {
    setAssessmentActivities((prev) => {
      if (prev.length <= 1) {
        toast.error("You must have at least one assessment activity row");
        return prev;
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Composite ECTS — workload from your standalone sources
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Each standalone source loads its own learning activities from the
            uploaded file and produces an ECTS <strong>range</strong> (1 ECTS =
            25–30 h). Pick a value inside each range. Assessment workload from
            the sources is excluded — the composite designs its own assessment
            below.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>How ECTS works for a composite</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  A composite micro-credential reuses the{" "}
                  <strong>learning activities</strong> of its standalone
                  sources. For each source we sum the hours of its learning
                  activities and convert to an ECTS range using the 25–30 h
                  standard.
                </p>
                <p>
                  You then pick a value inside each source's range. Assessment
                  workload from the source is intentionally left out, because
                  the composite designs its own assessment.
                </p>
                <p>
                  An <strong>either/or group</strong> represents a real choice
                  for the learner ("take Course A <em>or</em> Course B"). To
                  keep the total ECTS stable, all courses in such a group must
                  carry the same selected ECTS — only one of them counts toward
                  the workload.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-warning hover:text-warning/80"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tips</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Expand a source to inspect its learning activities — these
                  come straight from the uploaded standalone file and drive the
                  ECTS range.
                </p>
                <p>
                  When designing either/or pathways, line up courses with
                  matching ECTS so every learner path adds up to the same
                  total.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-muted/40 border border-border rounded-lg">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Upload at least two standalone source files in Phase 1 to build the
            composite workload here.
          </p>
        </div>
      )}

      {/* Source rows */}
      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => {
            const groupErr = entry.groupId
              ? groupErrors[entry.groupId]
              : undefined;
            const hasActivities = entry.learningActivities.length > 0;
            return (
              <div
                key={entry.sourceKey}
                className="border border-border rounded-lg bg-card"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {entry.title}
                        </span>
                        {entry.groupId && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Layers className="h-3 w-3" />
                            {
                              groups.find((g) => g.id === entry.groupId)
                                ?.label
                            }
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hasActivities ? (
                          <>
                            {entry.learningActivities.length} learning{" "}
                            {entry.learningActivities.length === 1
                              ? "activity"
                              : "activities"}{" "}
                            · {entry.totalLearningHours} h · range{" "}
                            <strong>
                              {entry.ectsMin.toFixed(1)} –{" "}
                              {entry.ectsMax.toFixed(1)} ECTS
                            </strong>{" "}
                            (assessment excluded)
                          </>
                        ) : (
                          <span className="text-warning">
                            No learning activities found in this source.
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Contribution
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {entry.totalLearningHours} h
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ≈ {entry.ectsMin.toFixed(1)}–{entry.ectsMax.toFixed(1)} ECTS
                      </p>
                    </div>
                  </div>

                  {/* Expand to see source learning activities */}
                  {hasActivities && (
                    <Collapsible
                      open={entry.expanded}
                      onOpenChange={() => toggleExpanded(entry.sourceKey)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-xs"
                        >
                          <BookOpen className="h-3 w-3" />
                          {entry.expanded ? "Hide" : "Show"} learning activities
                          from this source
                          {entry.expanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 border border-border rounded bg-muted/30 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted">
                                <th className="text-left p-2 border-b border-border font-medium">
                                  Learning activity (from source)
                                </th>
                                <th className="text-right p-2 border-b border-border font-medium w-32">
                                  Hours
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.learningActivities.map((a) => (
                                <tr
                                  key={a.id}
                                  className="border-b border-border/50 last:border-0"
                                >
                                  <td className="p-2 text-foreground">
                                    {a.name}
                                  </td>
                                  <td className="p-2 text-right text-muted-foreground">
                                    {a.hours}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-muted/60 font-medium">
                                <td className="p-2">Total learning hours</td>
                                <td className="p-2 text-right">
                                  {entry.totalLearningHours} h
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <p className="text-xs text-muted-foreground p-2">
                            ECTS range: {entry.totalLearningHours} h ÷ 30 ={" "}
                            {entry.ectsMin.toFixed(2)} ECTS · ÷ 25 ={" "}
                            {entry.ectsMax.toFixed(2)} ECTS
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Group selector — auto-managed from Phase 5.5 if present */}
                  {(() => {
                    const isFromPhase5 =
                      !!entry.groupId && entry.groupId.startsWith("phase5-grp-");
                    const phase5Active =
                      !!phase5EitherGroups &&
                      Object.keys(phase5EitherGroups).length > 0;
                    if (!phase5Active) return null;
                    return (
                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border text-xs">
                        <Label className="text-muted-foreground">
                          Either/or group:
                        </Label>
                        {isFromPhase5 ? (
                          <Badge variant="default" className="text-xs gap-1">
                            <Layers className="h-3 w-3" />
                            {groups.find((g) => g.id === entry.groupId)?.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic">
                            No group (Required or unassigned in Phase 5)
                          </span>
                        )}
                        <span className="text-muted-foreground/70 ml-1">
                          · synced from Phase 5 assessment access model
                        </span>
                      </div>
                    );
                  })()}

                  {groupErr && (
                    <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{groupErr}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Group management */}
      {entries.length > 0 && (() => {
        const phase5Active =
          !!phase5EitherGroups &&
          Object.keys(phase5EitherGroups).length > 0;

        if (phase5Active) {
          // Phase 5 is the source of truth — show read-only summary
          const phase5Groups = groups.filter((g) =>
            g.id.startsWith("phase5-grp-")
          );
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">
                  Either/or groups (auto-synced from Phase 5)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                These groups come from your Phase 5 assessment access model
                ("Partially Fixed"). To change them, edit the assessment access
                model in Phase 5.5 — this calculator stays in sync.
              </p>
              {phase5Groups.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No either/or groups defined in Phase 5 — every standalone
                  source counts toward the total.
                </p>
              ) : (
                <div className="space-y-2">
                  {phase5Groups.map((g) => {
                    const members = groupedByGroup.get(g.id) || [];
                    return (
                      <div
                        key={g.id}
                        className="flex items-center justify-between gap-2 p-2 bg-muted/40 border border-border rounded"
                      >
                        <div className="text-sm">
                          <span className="font-medium">{g.label}</span>
                          <span className="text-muted-foreground ml-2">
                            — {members.length} course
                            {members.length === 1 ? "" : "s"}
                            {members.length > 0 && (
                              <>
                                {" "}
                                · counts as{" "}
                                {Number(members[0].totalLearningHours) || 0} h
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // No Phase 5 input → no manual group UI; either/or groups must come from Phase 5.5
        return (
          <p className="text-xs text-muted-foreground italic">
            Either/or groups are managed in Phase 5.5 (set assessment access
            model to "Partially Fixed"). They will appear here automatically.
          </p>
        );
      })()}

      {/* Composite-level assessment activities */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <Label className="text-base font-medium">
              Assessment activities (designed for this composite)
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            The composite designs its own assessment — assessment workload from
            the source courses is intentionally excluded above. Add the
            assessment activities the learner must engage with here, with an
            estimated workload in hours.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 border border-border font-medium text-sm">
                    Activity
                  </th>
                  <th className="text-left p-3 border border-border font-medium text-sm w-48">
                    Estimated workload (hours)
                  </th>
                  <th className="w-12 p-3 border border-border"></th>
                </tr>
              </thead>
              <tbody>
                {assessmentActivities.map((a, idx) => (
                  <tr
                    key={a.id}
                    className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}
                  >
                    <td className="p-3 border border-border">
                      <Input
                        value={a.name}
                        onChange={(e) =>
                          updateAssessmentRow(a.id, "name", e.target.value)
                        }
                        placeholder="Enter activity name"
                        className="border-input bg-background"
                      />
                    </td>
                    <td className="p-3 border border-border">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={a.hours}
                        onChange={(e) =>
                          updateAssessmentRow(a.id, "hours", e.target.value)
                        }
                        placeholder="0"
                        className="border-input bg-background"
                      />
                    </td>
                    <td className="p-3 border border-border text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAssessmentRow(a.id)}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={addAssessmentRow} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add activity
          </Button>
        </div>
      )}

      {/* Total */}
      {entries.length > 0 && (
        <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-foreground">
            Total composite workload
          </h4>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-lg border border-border">
              <Label className="text-sm text-muted-foreground">
                Learning hours from sources
              </Label>
              <p className="text-2xl font-bold text-foreground mt-1">
                {sourcesLearningHours} h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {sourcesECTSMin.toFixed(1)} – {sourcesECTSMax.toFixed(1)} ECTS
                · only one course per either/or group counts
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <Label className="text-sm text-muted-foreground">
                Composite assessment hours
              </Label>
              <p className="text-2xl font-bold text-primary mt-1">
                {assessmentTotals.hours} h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {assessmentTotals.ectsMin.toFixed(1)} –{" "}
                {assessmentTotals.ectsMax.toFixed(1)} ECTS · 1 ECTS = 25–30 h
              </p>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border">
            <Label className="text-sm text-muted-foreground">
              Total ECTS for this composite micro-credential (range)
            </Label>
            <p className="text-3xl font-bold text-primary mt-1">
              {totalECTSMin.toFixed(1)} – {totalECTSMax.toFixed(1)} ECTS
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Calculated from {totalHours} total hours (source learning hours +
              composite assessment hours) using the 25–30 h per ECTS standard.
              Pick your final value below.
            </p>
          </div>

          {Object.keys(groupErrors).length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">
                Fix the either/or groups above so every member has the same
                total learning hours.
              </p>
            </div>
          )}

          {/* Confirm final ECTS */}
          {ectsOptions.length > 0 && Object.keys(groupErrors).length === 0 && (
            <div className="bg-card p-4 rounded-lg border-2 border-primary/30">
              <Label className="text-sm font-medium text-foreground">
                Confirm final ECTS value for this micro-credential{" "}
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Pick a whole or half ECTS value within the calculated range.
              </p>
              <Select
                value={confirmedECTS?.toString()}
                onValueChange={(val) => setConfirmedECTS(parseFloat(val))}
              >
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue placeholder="Select ECTS value" />
                </SelectTrigger>
                <SelectContent>
                  {ectsOptions.map((opt) => (
                    <SelectItem key={opt} value={opt.toString()}>
                      {opt.toFixed(1)} ECTS
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {confirmedECTS !== undefined && (
                <p className="text-sm text-primary font-medium mt-3">
                  Confirmed: {confirmedECTS.toFixed(1)} ECTS
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default CompositeECTSCalculatorForm;
