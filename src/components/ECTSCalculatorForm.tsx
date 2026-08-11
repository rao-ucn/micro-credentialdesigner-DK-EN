import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Calculator, Info, Lightbulb, RotateCcw, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { CourseType } from "@/types/course";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Activity {
  id: string;
  name: string;
  hours: string;
  isPredefined?: boolean; // Indicates activity came from Phase 5.1
}

interface ECTSResults {
  totalLearningHours: number;
  totalAssessmentHours: number;
  ectsLearningMin: number;
  ectsLearningMax: number;
  ectsAssessmentMin: number;
  ectsAssessmentMax: number;
  ectsTotalMin: number;
  ectsTotalMax: number;
}

interface ECTSData {
  learningActivities: Activity[];
  assessmentActivities: Activity[];
  results?: ECTSResults;
  confirmedECTS?: number;
}

interface PredefinedActivity {
  id: string;
  activity: string;
  timeStructure: string;
  deliveryMode: string;
  participationForm: string;
  notes?: string;
}

interface ECTSCalculatorFormProps {
  data: ECTSData;
  onChange: (data: ECTSData) => void;
  courseType: CourseType;
  predefinedLearningActivities?: PredefinedActivity[];
  assessmentProcessDescription?: string; // From Phase 5.5
  onBreakCompositeIntegrity?: () => void;
  basedOnSingleSource?: boolean;
  onBreakSingleSourceIntegrity?: () => void;
  onGoToLearningActivities?: () => void;
}

// Generate valid ECTS options (whole and half values) within a range
const generateECTSOptions = (min: number, max: number): number[] => {
  const options: number[] = [];
  // Start from the first valid half/whole value >= min and >= 1
  let start = Math.max(1, Math.ceil(min * 2) / 2);
  // Ensure start is a valid .0 or .5 value
  start = Math.ceil(start * 2) / 2;
  
  for (let val = start; val <= max; val += 0.5) {
    options.push(parseFloat(val.toFixed(1)));
  }
  
  // If no options in range but max >= 1, at least suggest 1
  if (options.length === 0 && max >= 1) {
    options.push(1);
  }
  
  return options;
};

const ECTSCalculatorForm = ({ data, onChange, courseType, predefinedLearningActivities = [], assessmentProcessDescription, onBreakCompositeIntegrity, basedOnSingleSource, onBreakSingleSourceIntegrity, onGoToLearningActivities }: ECTSCalculatorFormProps) => {
  const hasAssessmentSection = courseType !== 'standalone';
  // Initialize learning activities with predefined ones from Phase 5.1 (if not already saved)
  const getInitialLearningActivities = (): Activity[] => {
    // If we have saved data, use that
    if (data.learningActivities?.length > 0) {
      return data.learningActivities;
    }
    
    // If we have predefined activities from Phase 5.1, convert them
    if (predefinedLearningActivities.length > 0) {
      return predefinedLearningActivities.map((pa, index) => ({
        id: `predefined-${index}-${Date.now()}`,
        name: pa.activity,
        hours: "", // Hours must be filled by user
        isPredefined: true, // Mark as coming from Phase 5.1
      }));
    }

    return [];
  };


  const [learningActivities, setLearningActivities] = useState<Activity[]>(getInitialLearningActivities());
  const [assessmentActivities, setAssessmentActivities] = useState<Activity[]>(
    data.assessmentActivities?.length > 0 
      ? data.assessmentActivities 
      : [{ id: "1", name: "", hours: "" }]
  );
  const [results, setResults] = useState<ECTSResults | null>(data.results || null);
  const [confirmedECTS, setConfirmedECTS] = useState<number | undefined>(data.confirmedECTS);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; type: 'learning' | 'assessment' } | null>(null);
  const [pendingAddLearning, setPendingAddLearning] = useState(false);
  const [showAddInfo, setShowAddInfo] = useState(false);
  const [deleteDialogStep, setDeleteDialogStep] = useState<'warning' | 'confirm' | null>(null);
  const [addDialogStep, setAddDialogStep] = useState<'warning' | 'confirm' | null>(null);

  // Keep predefined learning activities in sync with Phase 5.1.
  // Preserves user-entered hours and any user-added (non-predefined) rows.
  useEffect(() => {
    setLearningActivities((current) => {
      const predefinedNames = predefinedLearningActivities.map((pa) => (pa.activity || '').trim());

      // Map existing predefined rows by name to preserve hours
      const existingPredefinedByName = new Map<string, Activity>();
      current.forEach((a) => {
        if (a.isPredefined && a.name?.trim()) {
          existingPredefinedByName.set(a.name.trim(), a);
        }
      });

      const synced: Activity[] = predefinedLearningActivities.map((pa, index) => {
        const name = (pa.activity || '').trim();
        const existing = existingPredefinedByName.get(name);
        return {
          id: existing?.id || `predefined-${index}-${Date.now()}`,
          name,
          hours: existing?.hours ?? "",
          isPredefined: true,
        };
      });

      // Keep legacy user-added rows that already have a name (from older saves)
      const userRows = current.filter((a) => !a.isPredefined && a.name?.trim());

      const next = [...synced, ...userRows];


      // Skip update if nothing actually changed (avoid render loop)
      const sameLength = next.length === current.length;
      const sameContent = sameLength && next.every((a, i) =>
        a.id === current[i].id &&
        a.name === current[i].name &&
        a.hours === current[i].hours &&
        !!a.isPredefined === !!current[i].isPredefined
      );
      if (sameContent) return current;
      return next;
    });
    if (!hasInitialized) setHasInitialized(true);
  }, [predefinedLearningActivities]);

  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';

  useEffect(() => {
    onChange({
      learningActivities,
      assessmentActivities,
      results: results || undefined,
      confirmedECTS,
    });
  }, [learningActivities, assessmentActivities, results, confirmedECTS]);

  const integrityGuardActive = courseType === 'composite-micro-credential' || basedOnSingleSource === true;

  const triggerBreakIntegrity = () => {
    if (courseType === 'composite-micro-credential') {
      onBreakCompositeIntegrity?.();
    } else if (basedOnSingleSource) {
      onBreakSingleSourceIntegrity?.();
    }
  };

  const addLearningRow = () => {
    setShowAddInfo(true);
  };


  const addAssessmentRow = () => {
    setAssessmentActivities([
      ...assessmentActivities,
      { id: Date.now().toString(), name: "", hours: "" },
    ]);
  };

  const deleteActivity = (id: string, type: "learning" | "assessment") => {
    if (integrityGuardActive) {
      setPendingDelete({ id, type });
      setDeleteDialogStep('warning');
      return;
    }

    if (type === "learning") {
      if (learningActivities.length > 1) {
        setLearningActivities(learningActivities.filter((a) => a.id !== id));
      } else {
        toast.error("You must have at least one learning activity row");
      }
    } else {
      if (assessmentActivities.length > 1) {
        setAssessmentActivities(assessmentActivities.filter((a) => a.id !== id));
      } else {
        toast.error("You must have at least one assessment activity row");
      }
    }
  };

  const openFinalDeleteConfirmation = () => setDeleteDialogStep('confirm');

  const confirmDeleteActivity = () => {
    if (!pendingDelete) return;
    const { id, type } = pendingDelete;

    if (type === 'learning') {
      if (learningActivities.length > 1) {
        setLearningActivities(learningActivities.filter((a) => a.id !== id));
      } else {
        toast.error("You must have at least one learning activity row");
      }
    } else {
      if (assessmentActivities.length > 1) {
        setAssessmentActivities(assessmentActivities.filter((a) => a.id !== id));
      } else {
        toast.error("You must have at least one assessment activity row");
      }
    }

    setPendingDelete(null);
    setDeleteDialogStep(null);
    triggerBreakIntegrity();
  };

  const updateActivity = (
    id: string,
    field: "name" | "hours",
    value: string,
    type: "learning" | "assessment"
  ) => {
    if (type === "learning") {
      setLearningActivities(
        learningActivities.map((a) =>
          a.id === id ? { ...a, [field]: value } : a
        )
      );
    } else {
      setAssessmentActivities(
        assessmentActivities.map((a) =>
          a.id === id ? { ...a, [field]: value } : a
        )
      );
    }
  };

  const parseHours = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const calculateECTS = () => {
    const totalLearningHours = learningActivities.reduce(
      (sum, a) => sum + parseHours(a.hours),
      0
    );
    const totalAssessmentHours = assessmentActivities.reduce(
      (sum, a) => sum + parseHours(a.hours),
      0
    );

    const ectsLearningMin = parseFloat((totalLearningHours / 30).toFixed(1));
    const ectsLearningMax = parseFloat((totalLearningHours / 25).toFixed(1));
    const ectsAssessmentMin = parseFloat((totalAssessmentHours / 30).toFixed(1));
    const ectsAssessmentMax = parseFloat((totalAssessmentHours / 25).toFixed(1));

    const totalHours = totalLearningHours + totalAssessmentHours;
    const ectsTotalMin = parseFloat((totalHours / 30).toFixed(1));
    const ectsTotalMax = parseFloat((totalHours / 25).toFixed(1));

    const newResults = {
      totalLearningHours,
      totalAssessmentHours,
      ectsLearningMin,
      ectsLearningMax,
      ectsAssessmentMin,
      ectsAssessmentMax,
      ectsTotalMin,
      ectsTotalMax,
    };

    setResults(newResults);

    // For MC/composite MC, auto-suggest the first valid ECTS option
    if (courseType !== 'standalone') {
      const options = generateECTSOptions(ectsTotalMin, ectsTotalMax);
      if (options.length > 0 && !confirmedECTS) {
        setConfirmedECTS(options[0]);
      }
    }

    toast.success("ECTS calculated successfully");
  };

  const handleReset = () => {
    setLearningActivities([{ id: "1", name: "", hours: "" }]);
    setAssessmentActivities([{ id: "1", name: "", hours: "" }]);
    setResults(null);
    setConfirmedECTS(undefined);
    setShowResetDialog(false);
    toast.info("Calculator reset");
  };

  // Check if total is under 1 ECTS for MC/composite MC
  const isUnderMinimum = courseType !== 'standalone' && results && results.ectsTotalMax < 1;
  
  // Generate ECTS options for the confirmation dropdown
  const ectsOptions = results ? generateECTSOptions(results.ectsTotalMin, results.ectsTotalMax) : [];

  return (
    <>
      <Card className="p-6 space-y-6">
        {/* Header with info buttons */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              What is the estimated workload for this {courseLabel}?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Define learning activities and their estimated hours to calculate ECTS credits.
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
                  <DialogTitle>Why calculate ECTS?</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    ECTS (European Credit Transfer and Accumulation System) credits help standardize 
                    the workload across different educational institutions.
                  </p>
                  <p>
                    1 ECTS credit equals 25-30 hours of student workload, including lectures, 
                    self-study, assignments, and assessments.
                  </p>
                  <p>
                    Calculating ECTS ensures transparency and helps learners understand the 
                    time commitment required for this {courseLabel}.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-warning hover:text-warning/80">
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inspiration for activities</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>Learning activities may include:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Lectures and seminars</li>
                    <li>Self-study and reading</li>
                    <li>Group work and discussions</li>
                    <li>Practical exercises</li>
                    <li>Online modules</li>
                    <li>Project work</li>
                  </ul>
                  {courseType === 'micro-credential' && (
                    <>
                      <p className="mt-4"><strong>Assessment activities may include:</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Written exams</li>
                        <li>Oral presentations</li>
                        <li>Portfolio submissions</li>
                        <li>Practical demonstrations</li>
                        <li>Peer assessments</li>
                      </ul>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Learning Activities Table */}
        <div>
          <Label className="text-base font-medium mb-3 block">
            Learning activities that the learner must engage with
          </Label>
          
          {/* Info about predefined activities */}
          <div className="flex items-start gap-2 p-3 mb-3 bg-primary/10 rounded-lg border border-primary/20">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              These activities are transferred from your learning activities design (Phase 5) and cannot be edited or created here. Only the estimated workload is entered below. To add, rename or remove an activity, go back to Phase 5, change it there and lock the item again.
            </p>
          </div>

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
                </tr>
              </thead>
              <tbody>
                {learningActivities.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-3 border border-border text-sm text-muted-foreground italic">
                      No learning activities yet — add them in Phase 5 (Develop learning activities).
                    </td>
                  </tr>
                )}
                {learningActivities.map((activity, index) => (
                  <tr key={activity.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                    <td className="p-3 border border-border">
                      <p className="text-sm text-foreground">{activity.name}</p>
                    </td>
                    <td className="p-3 border border-border">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={activity.hours}
                        onChange={(e) => updateActivity(activity.id, "hours", e.target.value, "learning")}
                        placeholder="0"
                        className="border-input bg-background"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={addLearningRow} variant="outline" size="sm" className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Add activity
          </Button>
        </div>

        {/* Assessment Activities Table (MC only) */}
        {hasAssessmentSection && (
          <div className="space-y-4">
            <Label className="text-base font-medium block">
              Assessment activities that the learner must engage with
            </Label>
            
            {/* Read-only Assessment Process Description */}
            {assessmentProcessDescription && assessmentProcessDescription.trim() && (
              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Assessment process description</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {assessmentProcessDescription}
                </p>
                <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/50 mt-3">
                  Use this as inspiration to derive all time-consuming activities, so that ECTS activities for assessment can be ensured.
                </p>
              </div>
            )}
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
                  {assessmentActivities.map((activity, index) => (
                    <tr key={activity.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <td className="p-3 border border-border">
                        <Input
                          value={activity.name}
                          onChange={(e) => updateActivity(activity.id, "name", e.target.value, "assessment")}
                          placeholder="Enter activity name"
                          className="border-input bg-background"
                        />
                      </td>
                      <td className="p-3 border border-border">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={activity.hours}
                          onChange={(e) => updateActivity(activity.id, "hours", e.target.value, "assessment")}
                          placeholder="0"
                          className="border-input bg-background"
                        />
                      </td>
                      <td className="p-3 border border-border text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteActivity(activity.id, "assessment")}
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
            <Button onClick={addAssessmentRow} variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Add activity
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={calculateECTS}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate ECTS
          </Button>
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-foreground">Results</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label className="text-sm text-muted-foreground">Total hours (learning)</Label>
                <p className="text-2xl font-bold text-foreground mt-1">{results.totalLearningHours}</p>
              </div>
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label className="text-sm text-muted-foreground">ECTS (learning)</Label>
                <p className="text-2xl font-bold text-primary mt-1">
                  {results.ectsLearningMin} - {results.ectsLearningMax}
                </p>
              </div>
              {hasAssessmentSection && (
                <>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <Label className="text-sm text-muted-foreground">Total hours (assessment)</Label>
                    <p className="text-2xl font-bold text-foreground mt-1">{results.totalAssessmentHours}</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <Label className="text-sm text-muted-foreground">ECTS (assessment)</Label>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {results.ectsAssessmentMin} - {results.ectsAssessmentMax}
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border sm:col-span-2">
                    <Label className="text-sm text-muted-foreground">Total micro-credential workload</Label>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {results.ectsTotalMin} - {results.ectsTotalMax} ECTS
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Warning if under minimum */}
            {isUnderMinimum && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Workload is below minimum</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Micro-credentials must have a minimum of 1 ECTS credit. 
                    Please add more learning or assessment activities to reach at least 25 hours of total workload.
                  </p>
                </div>
              </div>
            )}

            {/* Confirmation dropdown for MC */}
            {hasAssessmentSection && !isUnderMinimum && ectsOptions.length > 0 && (
              <div className="bg-card p-4 rounded-lg border-2 border-primary/30">
                <Label className="text-sm font-medium text-foreground">
                  Confirm final ECTS value for this micro-credential <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  You must select a whole or half ECTS value (e.g., 1.0, 1.5, 2.0) within the calculated range.
                </p>
                <Select
                  value={confirmedECTS?.toString()}
                  onValueChange={(val) => setConfirmedECTS(parseFloat(val))}
                >
                  <SelectTrigger className="w-48">
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
                {confirmedECTS && (
                  <p className="text-sm text-primary font-medium mt-3">
                    Confirmed: {confirmedECTS.toFixed(1)} ECTS
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground italic">
              Calculated using ECTS standard: 1 ECTS = 25-30 hours of workload.
            </p>
          </div>
        )}
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all activities and calculated results. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep data</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Yes, reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialogStep === 'warning'}
        onOpenChange={(open) => {
          if (!open) {
            // Only fully reset if user cancelled (not advancing to confirm)
            setDeleteDialogStep((curr) => {
              if (curr === 'confirm') return curr;
              setPendingDelete(null);
              return null;
            });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove activity row?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {courseType === 'composite-micro-credential' ? (
                  <>
                    <p>
                      This composite micro-credential will no longer remain a combined micro-credential based on independent standalone courses if you continue.
                    </p>
                    <p>
                      Instead, the imported standalone courses will be treated as one combined standalone course that can be edited as a single whole.
                    </p>
                    <p>
                      This is required because the standalone courses used here are packaged and quality-assured as independent units.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      This micro-credential is currently based directly on a single existing standalone course. If you remove an activity, it will no longer be a faithful representation of that source course.
                    </p>
                    <p>
                      It will be treated as an independent micro-credential going forward, and the link to the original standalone course will be considered modified.
                    </p>
                    <p>
                      This is required because the source standalone course is packaged and quality-assured as an independent unit.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={openFinalDeleteConfirmation}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialogStep === 'confirm'}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogStep('warning');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogStep('warning')}>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteActivity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAddInfo} onOpenChange={setShowAddInfo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Add the activity in Phase 5 instead
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  Learning activities cannot be created here. The list below mirrors the activities you designed in Phase 5 (Develop learning activities), so that the workload calculation always matches the actual course design.
                </p>
                <p>
                  Go back to Phase 5, add the activity there and lock the item again. It will then appear automatically in this table, where you only need to enter the estimated workload.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAddInfo(false)}>Got it</AlertDialogCancel>
            {onGoToLearningActivities && (
              <AlertDialogAction
                onClick={() => {
                  setShowAddInfo(false);
                  onGoToLearningActivities();
                }}
              >
                Go to Phase 5
              </AlertDialogAction>
            )}
          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

    </>
  );
};

export default ECTSCalculatorForm;
