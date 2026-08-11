import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Calculator, Info, Lightbulb, RotateCcw, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { CourseType } from "@/types/course";
import { useLanguage } from "@/contexts/LanguageContext";
import { forms56bTranslations } from "@/lib/translations/forms56b";
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
  const { language } = useLanguage();
  const lt = forms56bTranslations[language];
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

  const courseLabel = courseType === 'standalone' ? lt.ectsStandaloneLabel : lt.ectsMicroCredentialLabel;

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
        toast.error(lt.ectsAtLeastOneLearningRow);
      }
    } else {
      if (assessmentActivities.length > 1) {
        setAssessmentActivities(assessmentActivities.filter((a) => a.id !== id));
      } else {
        toast.error(lt.ectsAtLeastOneAssessmentRow);
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

    toast.success(lt.ectsCalculatedSuccess);
  };

  const handleReset = () => {
    setLearningActivities([{ id: "1", name: "", hours: "" }]);
    setAssessmentActivities([{ id: "1", name: "", hours: "" }]);
    setResults(null);
    setConfirmedECTS(undefined);
    setShowResetDialog(false);
    toast.info(lt.ectsCalculatorReset);
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
              {lt.ectsHeading.replace('{courseLabel}', courseLabel)}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {lt.ectsSubheading}
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
                  <DialogTitle>{lt.ectsWhyDialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    {lt.ectsWhyP1}
                  </p>
                  <p>
                    {lt.ectsWhyP2}
                  </p>
                  <p>
                    {lt.ectsWhyP3.replace('{courseLabel}', courseLabel)}
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
                  <DialogTitle>{lt.ectsInspirationDialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>{lt.ectsInspirationLearningTitle}</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{lt.ectsInspirationLearning1}</li>
                    <li>{lt.ectsInspirationLearning2}</li>
                    <li>{lt.ectsInspirationLearning3}</li>
                    <li>{lt.ectsInspirationLearning4}</li>
                    <li>{lt.ectsInspirationLearning5}</li>
                    <li>{lt.ectsInspirationLearning6}</li>
                  </ul>
                  {courseType === 'micro-credential' && (
                    <>
                      <p className="mt-4"><strong>{lt.ectsInspirationAssessmentTitle}</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>{lt.ectsInspirationAssessment1}</li>
                        <li>{lt.ectsInspirationAssessment2}</li>
                        <li>{lt.ectsInspirationAssessment3}</li>
                        <li>{lt.ectsInspirationAssessment4}</li>
                        <li>{lt.ectsInspirationAssessment5}</li>
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
            {lt.ectsLearningActivitiesLabel}
          </Label>
          
          {/* Info about predefined activities */}
          <div className="flex items-start gap-2 p-3 mb-3 bg-primary/10 rounded-lg border border-primary/20">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {lt.ectsPredefinedInfo}
            </p>
          </div>

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
                </tr>
              </thead>
              <tbody>
                {learningActivities.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-3 border border-border text-sm text-muted-foreground italic">
                      {lt.ectsNoLearningActivities}
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
            {lt.addActivity}
          </Button>
        </div>

        {/* Assessment Activities Table (MC only) */}
        {hasAssessmentSection && (
          <div className="space-y-4">
            <Label className="text-base font-medium block">
              {lt.ectsAssessmentActivitiesLabel}
            </Label>
            
            {/* Read-only Assessment Process Description */}
            {assessmentProcessDescription && assessmentProcessDescription.trim() && (
              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{lt.ectsAssessmentProcessDescriptionLabel}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {assessmentProcessDescription}
                </p>
                <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/50 mt-3">
                  {lt.ectsAssessmentProcessDescriptionHint}
                </p>
              </div>
            )}
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
                  {assessmentActivities.map((activity, index) => (
                    <tr key={activity.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <td className="p-3 border border-border">
                        <Input
                          value={activity.name}
                          onChange={(e) => updateActivity(activity.id, "name", e.target.value, "assessment")}
                          placeholder={lt.enterActivityName}
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
              {lt.addActivity}
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={calculateECTS}>
            <Calculator className="h-4 w-4 mr-2" />
            {lt.ectsCalculateButton}
          </Button>
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {lt.ectsResetButton}
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-foreground">{lt.ectsResultsTitle}</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label className="text-sm text-muted-foreground">{lt.ectsTotalHoursLearning}</Label>
                <p className="text-2xl font-bold text-foreground mt-1">{results.totalLearningHours}</p>
              </div>
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label className="text-sm text-muted-foreground">{lt.ectsEctsLearning}</Label>
                <p className="text-2xl font-bold text-primary mt-1">
                  {results.ectsLearningMin} - {results.ectsLearningMax}
                </p>
              </div>
              {hasAssessmentSection && (
                <>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <Label className="text-sm text-muted-foreground">{lt.ectsTotalHoursAssessment}</Label>
                    <p className="text-2xl font-bold text-foreground mt-1">{results.totalAssessmentHours}</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <Label className="text-sm text-muted-foreground">{lt.ectsEctsAssessment}</Label>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {results.ectsAssessmentMin} - {results.ectsAssessmentMax}
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border sm:col-span-2">
                    <Label className="text-sm text-muted-foreground">{lt.ectsTotalWorkload}</Label>
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
                  <p className="font-medium text-destructive">{lt.ectsUnderMinimumTitle}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lt.ectsUnderMinimumText}
                  </p>
                </div>
              </div>
            )}

            {/* Confirmation dropdown for MC */}
            {hasAssessmentSection && !isUnderMinimum && ectsOptions.length > 0 && (
              <div className="bg-card p-4 rounded-lg border-2 border-primary/30">
                <Label className="text-sm font-medium text-foreground">
                  {lt.ectsConfirmFinalLabel} <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  {lt.ectsConfirmFinalHint}
                </p>
                <Select
                  value={confirmedECTS?.toString()}
                  onValueChange={(val) => setConfirmedECTS(parseFloat(val))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={lt.ectsSelectValuePlaceholder} />
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
                    {lt.ectsConfirmedLabel.replace('{value}', confirmedECTS.toFixed(1))}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground italic">
              {lt.ectsStandardNote}
            </p>
          </div>
        )}
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lt.ectsResetDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {lt.ectsResetDialogText}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lt.ectsKeepData}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>{lt.ectsYesReset}</AlertDialogAction>
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
              {lt.ectsRemoveRowTitle}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {courseType === 'composite-micro-credential' ? (
                  <>
                    <p>
                      {lt.ectsRemoveRowCompositeP1}
                    </p>
                    <p>
                      {lt.ectsRemoveRowCompositeP2}
                    </p>
                    <p>
                      {lt.ectsRemoveRowCompositeP3}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      {lt.ectsRemoveRowSingleP1}
                    </p>
                    <p>
                      {lt.ectsRemoveRowSingleP2}
                    </p>
                    <p>
                      {lt.ectsRemoveRowSingleP3}
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lt.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={openFinalDeleteConfirmation}>{lt.ectsContinue}</AlertDialogAction>
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
              {lt.ectsConfirmAreYouSure}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lt.ectsCannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogStep('warning')}>{lt.ectsGoBack}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteActivity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lt.ectsYesContinue}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAddInfo} onOpenChange={setShowAddInfo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {lt.ectsAddInPhase5Title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  {lt.ectsAddInPhase5P1}
                </p>
                <p>
                  {lt.ectsAddInPhase5P2}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAddInfo(false)}>{lt.ectsGotIt}</AlertDialogCancel>
            {onGoToLearningActivities && (
              <AlertDialogAction
                onClick={() => {
                  setShowAddInfo(false);
                  onGoToLearningActivities();
                }}
              >
                {lt.ectsGoToPhase5}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

    </>
  );
};

export default ECTSCalculatorForm;
