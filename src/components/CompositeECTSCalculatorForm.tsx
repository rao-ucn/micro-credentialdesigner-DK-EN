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
import { useLanguage } from "@/contexts/LanguageContext";
import { forms56bTranslations } from "@/lib/translations/forms56b";

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
  const { language } = useLanguage();
  const lt = forms56bTranslations[language];
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
        const label = lt.cectsEitherOrGroupFromPhase5.replace('{num}', String(num));
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
        toast.error(lt.cectsAtLeastOneAssessmentRow);
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
            {lt.cectsHeading}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lt.cectsSubheading}
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
                <DialogTitle>{lt.cectsHowItWorksTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {lt.cectsHowItWorksP1}
                </p>
                <p>
                  {lt.cectsHowItWorksP2}
                </p>
                <p>
                  {lt.cectsHowItWorksP3}
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
                <DialogTitle>{lt.cectsTipsTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {lt.cectsTipsP1}
                </p>
                <p>
                  {lt.cectsTipsP2}
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
            {lt.cectsEmptyState}
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
                            {entry.learningActivities.length}{" "}
                            {entry.learningActivities.length === 1
                              ? lt.cectsLearningActivity
                              : lt.cectsLearningActivities}{" "}
                            · {entry.totalLearningHours} h · {lt.cectsRangeLabel}{" "}
                            <strong>
                              {entry.ectsMin.toFixed(1)} –{" "}
                              {entry.ectsMax.toFixed(1)} ECTS
                            </strong>{" "}
                            {lt.cectsAssessmentExcluded}
                          </>
                        ) : (
                          <span className="text-warning">
                            {lt.cectsNoLearningActivitiesFound}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {lt.cectsContribution}
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
                          {entry.expanded ? lt.cectsHideActivities : lt.cectsShowActivities}
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
                                  {lt.cectsLearningActivityFromSource}
                                </th>
                                <th className="text-right p-2 border-b border-border font-medium w-32">
                                  {lt.cectsHours}
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
                                <td className="p-2">{lt.cectsTotalLearningHours}</td>
                                <td className="p-2 text-right">
                                  {entry.totalLearningHours} h
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <p className="text-xs text-muted-foreground p-2">
                            {lt.cectsEctsRangeCalc
                              .replace('{hours}', String(entry.totalLearningHours))
                              .replace('{min}', entry.ectsMin.toFixed(2))
                              .replace('{max}', entry.ectsMax.toFixed(2))}
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
                          {lt.cectsEitherOrGroupLabel}
                        </Label>
                        {isFromPhase5 ? (
                          <Badge variant="default" className="text-xs gap-1">
                            <Layers className="h-3 w-3" />
                            {groups.find((g) => g.id === entry.groupId)?.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic">
                            {lt.cectsNoGroupUnassigned}
                          </span>
                        )}
                        <span className="text-muted-foreground/70 ml-1">
                          {lt.cectsSyncedFromPhase5}
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
                  {lt.cectsAutoSyncedGroupsLabel}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {lt.cectsAutoSyncedGroupsHint}
              </p>
              {phase5Groups.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {lt.cectsNoGroupsDefined}
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
                            — {members.length}{" "}
                            {members.length === 1 ? lt.cectsCourseCountLabel : lt.cectsCoursesCountLabel}
                            {members.length > 0 && (
                              <>
                                {" "}
                                {lt.cectsCountsAs.replace('{hours}', String(Number(members[0].totalLearningHours) || 0))}
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
            {lt.cectsManagedInPhase55}
          </p>
        );
      })()}

      {/* Composite-level assessment activities */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <Label className="text-base font-medium">
              {lt.cectsAssessmentDesignedLabel}
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {lt.cectsAssessmentDesignedHint}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 border border-border font-medium text-sm">
                    {lt.activity}
                  </th>
                  <th className="text-left p-3 border border-border font-medium text-sm w-48">
                    {lt.estimatedWorkloadHours}
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
                        placeholder={lt.enterActivityName}
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
            {lt.addActivity}
          </Button>
        </div>
      )}

      {/* Total */}
      {entries.length > 0 && (
        <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-foreground">
            {lt.cectsTotalCompositeWorkload}
          </h4>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-lg border border-border">
              <Label className="text-sm text-muted-foreground">
                {lt.cectsLearningHoursFromSources}
              </Label>
              <p className="text-2xl font-bold text-foreground mt-1">
                {sourcesLearningHours} h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {sourcesECTSMin.toFixed(1)} – {sourcesECTSMax.toFixed(1)} ECTS
                {lt.cectsOnlyOnePerGroupCounts}
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <Label className="text-sm text-muted-foreground">
                {lt.cectsCompositeAssessmentHours}
              </Label>
              <p className="text-2xl font-bold text-primary mt-1">
                {assessmentTotals.hours} h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {assessmentTotals.ectsMin.toFixed(1)} –{" "}
                {assessmentTotals.ectsMax.toFixed(1)} ECTS {lt.cectsEctsStandardNote}
              </p>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border">
            <Label className="text-sm text-muted-foreground">
              {lt.cectsTotalEctsForComposite}
            </Label>
            <p className="text-3xl font-bold text-primary mt-1">
              {totalECTSMin.toFixed(1)} – {totalECTSMax.toFixed(1)} ECTS
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {lt.cectsCalculatedFromNote.replace('{hours}', String(totalHours))}
            </p>
          </div>

          {Object.keys(groupErrors).length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">
                {lt.cectsFixGroupsError}
              </p>
            </div>
          )}

          {/* Confirm final ECTS */}
          {ectsOptions.length > 0 && Object.keys(groupErrors).length === 0 && (
            <div className="bg-card p-4 rounded-lg border-2 border-primary/30">
              <Label className="text-sm font-medium text-foreground">
                {lt.cectsConfirmFinalLabel}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                {lt.cectsConfirmFinalHint}
              </p>
              <Select
                value={confirmedECTS?.toString()}
                onValueChange={(val) => setConfirmedECTS(parseFloat(val))}
              >
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue placeholder={lt.cectsSelectValuePlaceholder} />
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
                  {lt.cectsConfirmedLabel.replace('{value}', confirmedECTS.toFixed(1))}
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
