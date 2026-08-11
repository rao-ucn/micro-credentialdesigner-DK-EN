import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Info, Lightbulb, AlertTriangle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms56Translations } from '@/lib/translations/forms56';

type CognitiveDomain = 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
type CompetenceDimension = 'knowledge' | 'skills' | 'responsibility_autonomy';

interface LearningOutcome {
  id: string;
  approach?: 'bloom' | 'tuning';
  cognitiveDomain?: CognitiveDomain;
  activeVerb?: string;
  outcomeText?: string;
  competenceFocus?: string;
  composedOutcome?: string;
  competenceDimensions?: CompetenceDimension[];
  contextOfApplication?: string;
  keyActions?: string;
  expectedResult?: string;
}

interface AssessmentFrameworkData {
  assessmentType?: string;
  individualOrGroup?: string;
  deliveryMode?: string;
  activityTypes?: string[];
  activityDescription?: string;
}

interface DesignAssessmentFormProps {
  data: {
    // 5.5 - Assessment Process
    assessmentProcessDescription?: string;
    assessors?: Array<{ id: string; type: 'internal' | 'external' | 'other'; otherDescription?: string }>;
    // Transparent Evaluation Design
    transparencyMeasures?: string[];
    transparencyOther?: string;
    transparencyConfirmed?: boolean;
    // Assessment Access Model
    assessmentAccessModel?: 'open' | 'fixed' | 'partially-fixed';
    assessmentAccessConfirmed?: boolean;
    partiallyFixedRequiredSources?: string[];
    partiallyFixedEitherSources?: string[];
    // Map of source id -> either-group number (1, 2, 3, ...). Sources in the same group form an OR-group.
    partiallyFixedEitherGroups?: Record<string, number>;
    // Special prerequisites beyond standalone courses (e.g. lab certificate, driver's license)
    additionalPrerequisites?: Array<{ id: string; description: string }>;
    // Grading System
    gradingSystem?: 'pass-fail' | 'eu-scale' | 'national' | 'dual';
    gradingSystemCountry?: string;
    // Resit Opportunities
    resitDescription?: string;
    resitAdminNotes?: string;
    // Legacy fields kept for backwards compatibility
    resitAvailability?: 'same-enrolment' | 're-enrolment';
    resitConditions?: string[];
    resitConditionsOther?: string;
    resitFeedbackType?: 'written' | 'oral-online' | 'none';
    resitFormat?: 'new-submission' | 'revision' | 'other';
    resitFormatOther?: string;
    resitAlignmentConfirmed?: boolean;
    // 5.6 - Quality Framework
    qualityFrameworkType?: string;
    qualityFrameworkOther?: string;
    // 5.7 - Resit Options (legacy, kept for backwards compatibility)
    resitAvailable?: 'yes' | 'no';
    // 5.8 - Institutional responsibility for assessment
    responsibleInstitution?: string;
    // 5.9 - Authentic Assessment
    hasAuthenticElements?: boolean;
    authenticDescription?: string;
    // Authentic Case-Based Assessment
    authenticCaseBasedUsed?: 'yes' | 'no';
    authenticCaseBasedReconsider?: 'reconsider' | 'proceed';
    // 5.10 - Success Criteria
    successCriteria?: string;
    // 5.11 - Calibration
    calibrationMethods?: string[];
    // 5.12 - Four-Eye Principle
    fourEyeApplied?: boolean;
    fourEyeJustification?: string;
    // Final Confirmation
    assessmentDesignConfirmed?: boolean;
  };
  onChange: (data: DesignAssessmentFormProps['data']) => void;
  onUpdatePhase3?: (activityDescription: string) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  learningOutcomes?: LearningOutcome[];
  assessmentFramework?: AssessmentFrameworkData;
  currentItemId?: string;
  standaloneSources?: Array<{ workingTitle?: string; documentId?: string; fileName?: string; data?: Record<string, any> }>;
}

const ASSESSOR_TYPE_OPTIONS = [
  { value: 'internal', label: 'Internal assessor (from the institution)' },
  { value: 'external', label: 'External assessor (outside the institution)' },
  { value: 'other', label: 'Other' },
];

const QUALITY_FRAMEWORK_OPTIONS = [
  { value: 'institutional', label: 'Institutional QA framework' },
  { value: 'national', label: 'National framework' },
  { value: 'european', label: 'European framework' },
  { value: 'other', label: 'Other' },
];

const ASSESSING_INSTITUTION_OPTIONS = [
  { value: 'hosting', label: 'Hosting institution' },
  { value: 'partner', label: 'Partner institution' },
  { value: 'external', label: 'External assessor' },
  { value: 'joint', label: 'Joint responsibility' },
];

const CALIBRATION_METHODS = [
  { value: 'shared-criteria', label: 'Shared criteria among assessors' },
  { value: 'example-submissions', label: 'Use of example submissions' },
  { value: 'calibration-meetings', label: 'Calibration meetings' },
  { value: 'rubrics', label: 'Rubrics or scoring guides' },
];

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  'written': 'Written',
  'oral': 'Oral',
  'combination': 'Combination of written and oral',
};

const INDIVIDUAL_GROUP_LABELS: Record<string, string> = {
  'individual': 'Individual assessment',
  'group': 'Group assessment',
  'combination': 'Combination',
};

const DELIVERY_MODE_LABELS: Record<string, string> = {
  'physical': 'Physical attendance required',
  'online-possible': 'Online possible',
  'fully-online': 'Fully online',
};

const DesignAssessmentForm: React.FC<DesignAssessmentFormProps> = ({
  data,
  onChange,
  onUpdatePhase3,
  courseType,
  learningOutcomes = [],
  assessmentFramework = {},
  currentItemId,
  standaloneSources = [],
}) => {
  const [formData, setFormData] = useState(data);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize assessmentProcessDescription from Phase 3's activityDescription if not already set
  useEffect(() => {
    if (!hasInitialized && assessmentFramework.activityDescription && !data.assessmentProcessDescription) {
      const updated = { ...data, assessmentProcessDescription: assessmentFramework.activityDescription };
      setFormData(updated);
      onChange(updated);
      setHasInitialized(true);
    } else if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, [assessmentFramework.activityDescription, data, hasInitialized, onChange]);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const updateField = (field: keyof typeof formData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
    
    // Sync assessmentProcessDescription back to Phase 3
    if (field === 'assessmentProcessDescription' && onUpdatePhase3) {
      onUpdatePhase3(value as string);
    }
  };

  // State for authentic case-based assessment
  const [caseBasedAnswer, setCaseBasedAnswer] = useState<string>('');
  const [reconsiderAnswer, setReconsiderAnswer] = useState<string>('');

  // Sync from formData on mount/change
  useEffect(() => {
    setCaseBasedAnswer(formData.authenticCaseBasedUsed || '');
    setReconsiderAnswer(formData.authenticCaseBasedReconsider || '');
  }, [formData.authenticCaseBasedUsed, formData.authenticCaseBasedReconsider]);

  const selectCaseBasedAnswer = (answer: string) => {
    setCaseBasedAnswer(answer);
    updateField('authenticCaseBasedUsed', answer);
    if (answer === 'yes') {
      setReconsiderAnswer('');
      updateField('authenticCaseBasedReconsider', undefined);
    }
  };

  const selectReconsiderAnswer = (answer: string) => {
    setReconsiderAnswer(answer);
    updateField('authenticCaseBasedReconsider', answer);
  };

  const toggleCalibrationMethod = (value: string) => {
    const current = formData.calibrationMethods || [];
    const updated = current.includes(value)
      ? current.filter(m => m !== value)
      : [...current, value];
    updateField('calibrationMethods', updated);
  };

  const getOText = (o: LearningOutcome): string => {
    if (o.approach === 'tuning') {
      if (o.composedOutcome) return o.composedOutcome;
      const parts: string[] = [];
      if (o.competenceFocus) {
        let s = `The learner can ${o.competenceFocus}`;
        if (o.contextOfApplication) s += ` ${o.contextOfApplication}`;
        parts.push(s);
      }
      if (o.keyActions) parts.push(o.keyActions);
      if (o.expectedResult) parts.push(`in order to ${o.expectedResult}`);
      return parts.length > 0 ? parts.join(', ') + '.' : '';
    }
    return o.outcomeText || '';
  };

  const isOComplete = (o: LearningOutcome): boolean => {
    if (o.approach === 'tuning') return !!(o.composedOutcome?.trim() || o.competenceFocus?.trim());
    return !!(o.cognitiveDomain && o.outcomeText?.trim());
  };

  const hasLearningOutcomes = learningOutcomes.some(isOComplete);

  // Get the complete outcomes for display
  const completeOutcomes = useMemo(() => {
    return learningOutcomes.filter(isOComplete);
  }, [learningOutcomes]);

  // Determine which section to render based on currentItemId
  const renderAssessmentOverview = () => (
    <div className="space-y-4">
      {/* Learning Outcomes Summary */}
      {hasLearningOutcomes && (
        <Card className="p-4 bg-secondary/50 border-secondary">
          <h4 className="text-sm font-semibold text-foreground mb-2">Learning Outcomes</h4>
          <Table>
            <TableBody>
              {completeOutcomes.map((outcome, index) => (
                <TableRow key={outcome.id}>
                  <TableCell className="text-sm py-2">
                    <span className="text-muted-foreground mr-2">{index + 1}.</span>
                    {getOText(outcome)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Assessment Framework Summary */}
      <Card className="p-4 bg-accent/50 border-accent">
        <h4 className="text-sm font-semibold text-foreground mb-3">Assessment Framework (from Phase 3)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <p className="font-medium">
              {assessmentFramework.assessmentType 
                ? ASSESSMENT_TYPE_LABELS[assessmentFramework.assessmentType] || assessmentFramework.assessmentType
                : 'Not defined'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Format:</span>
            <p className="font-medium">
              {assessmentFramework.individualOrGroup 
                ? INDIVIDUAL_GROUP_LABELS[assessmentFramework.individualOrGroup] || assessmentFramework.individualOrGroup
                : 'Not defined'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Delivery:</span>
            <p className="font-medium">
              {assessmentFramework.deliveryMode 
                ? DELIVERY_MODE_LABELS[assessmentFramework.deliveryMode] || assessmentFramework.deliveryMode
                : 'Not defined'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  // 5.5 - Define the Assessment Process
  const renderAssessmentProcess = () => (
    <div className="space-y-6">
      {/* Warning box when user chose to reconsider authentic case-based assessment */}
      {caseBasedAnswer === 'no' && reconsiderAnswer === 'reconsider' && (
        <Card className="p-4 bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-amber-600 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Action required: Implement authentic case-based assessment
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You indicated you would like to reconsider and revise the assessment design to include authentic case-based assessment. Please update your assessment process description below accordingly.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                Note: Once implemented, return to the authentic case-based assessment question and select "Yes" to confirm the change.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Define the assessment process</h3>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Why?</DialogTitle>
              </DialogHeader>
              <p className="text-sm">
                Describe how learner performance is assessed, when assessment takes place, and on what basis judgements are made. A clear process supports transparency and fairness.
              </p>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Assessment process description</Label>
            {assessmentFramework.activityDescription && (
              <Badge variant="secondary" className="text-xs">
                Pre-filled from Phase 3
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Your initial activity description from Phase 3 is shown below. You can now expand and refine this description with additional details about the assessment process. Any changes made here will automatically update the description in Phase 3.
          </p>
          <Textarea
            value={formData.assessmentProcessDescription || ''}
            onChange={(e) => updateField('assessmentProcessDescription', e.target.value)}
            placeholder="Briefly describe how learner performance will be assessed..."
            className="min-h-[100px] bg-background"
          />
        </div>

        {/* Authentic Case-Based Assessment Section */}
        <div className="space-y-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Authentic case-based assessment can strengthen validity by assessing learners' ability to apply knowledge and skills in realistic or professional contexts.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In this step, you are asked to explicitly consider whether such an approach is relevant for this assessment design.
          </p>

          {/* Check if case-based was already selected in Phase 3 */}
          {assessmentFramework.activityTypes?.includes('case-based') ? (
            // Show confirmation message instead of Yes/No options
            <div className="space-y-4 pt-2">
              <Card className="p-4 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
                <p className="text-sm text-foreground mb-4">
                  You have marked that case-based assessment is part of the assessment in Phase 3. Please confirm that it is implemented in the description.
                </p>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="caseBasedConfirmation"
                    checked={caseBasedAnswer === 'yes'}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectCaseBasedAnswer('yes');
                      } else {
                        selectCaseBasedAnswer('');
                      }
                    }}
                  />
                  <Label htmlFor="caseBasedConfirmation" className="text-sm font-medium cursor-pointer">
                    I confirm that authentic case-based assessment is implemented in the assessment description <span className="text-destructive">*</span>
                  </Label>
                </div>
              </Card>
            </div>
          ) : (
            // Show original Yes/No options when case-based was NOT selected in Phase 3
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">
                  Is authentic case-based assessment used in the assessment design? <span className="text-destructive">*</span>
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="text-primary hover:text-primary/80">
                      <Info className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Authentic case-based assessment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        Authentic case-based assessment evaluates learners through realistic or professional scenarios that reflect how competencies are used in practice.
                      </p>
                      <p>
                        It is not mandatory, but should be deliberately considered as part of a robust assessment design.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => selectCaseBasedAnswer('yes')}
                  onKeyDown={(e) => e.key === 'Enter' && selectCaseBasedAnswer('yes')}
                  className={`w-full text-left p-4 border rounded-lg cursor-pointer transition-colors ${
                    caseBasedAnswer === 'yes'
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      caseBasedAnswer === 'yes' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {caseBasedAnswer === 'yes' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm">Yes, authentic case-based assessment is used in the assessment description</span>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => selectCaseBasedAnswer('no')}
                  onKeyDown={(e) => e.key === 'Enter' && selectCaseBasedAnswer('no')}
                  className={`w-full text-left p-4 border rounded-lg cursor-pointer transition-colors ${
                    caseBasedAnswer === 'no'
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      caseBasedAnswer === 'no' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {caseBasedAnswer === 'no' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm">No, authentic case-based assessment is not used</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reflection prompt when "No" is selected (only shown when case-based was NOT pre-selected) */}
          {!assessmentFramework.activityTypes?.includes('case-based') && caseBasedAnswer === 'no' && (
            <div className="space-y-4 p-4 bg-muted/50 border rounded-lg">
              <p className="text-sm text-foreground leading-relaxed">
                Many learning outcomes involving application, judgement, or problem-solving are often well supported by authentic cases or scenarios.
              </p>
              <p className="text-sm text-foreground leading-relaxed font-medium">
                Are you sure you want to proceed without authentic case-based assessment?
              </p>

              <div className="space-y-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => selectReconsiderAnswer('reconsider')}
                  onKeyDown={(e) => e.key === 'Enter' && selectReconsiderAnswer('reconsider')}
                  className={`w-full text-left p-4 bg-background border rounded-lg cursor-pointer transition-colors ${
                    reconsiderAnswer === 'reconsider'
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      reconsiderAnswer === 'reconsider' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {reconsiderAnswer === 'reconsider' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm">Yes, I would like to reconsider and revise the assessment design</span>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => selectReconsiderAnswer('proceed')}
                  onKeyDown={(e) => e.key === 'Enter' && selectReconsiderAnswer('proceed')}
                  className={`w-full text-left p-4 bg-background border rounded-lg cursor-pointer transition-colors ${
                    reconsiderAnswer === 'proceed'
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      reconsiderAnswer === 'proceed' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {reconsiderAnswer === 'proceed' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm">No, I want to proceed without authentic case-based assessment</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Number of assessors</h3>
          <button
            type="button"
            onClick={() => {
              const currentAssessors = formData.assessors || [];
              const newAssessor = { id: crypto.randomUUID(), type: 'internal' as const };
              updateField('assessors', [...currentAssessors, newAssessor]);
            }}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            + Add assessor
          </button>
        </div>
        
        {(!formData.assessors || formData.assessors.length === 0) && (
          <p className="text-sm text-muted-foreground italic">
            No assessors added yet. Click "Add assessor" to specify who will assess.
          </p>
        )}
        
        {formData.assessors && formData.assessors.length > 0 && (
          <div className="space-y-3">
            {formData.assessors.map((assessor, index) => (
              <div key={assessor.id} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground mt-2">
                  {index + 1}.
                </span>
                <div className="flex-1 space-y-2">
                  <Select
                    value={assessor.type}
                    onValueChange={(value: 'internal' | 'external' | 'other') => {
                      const updated = formData.assessors!.map(a => 
                        a.id === assessor.id ? { ...a, type: value } : a
                      );
                      updateField('assessors', updated);
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select assessor type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSESSOR_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {assessor.type === 'other' && (
                    <Input
                      value={assessor.otherDescription || ''}
                      onChange={(e) => {
                        const updated = formData.assessors!.map(a => 
                          a.id === assessor.id ? { ...a, otherDescription: e.target.value } : a
                        );
                        updateField('assessors', updated);
                      }}
                      placeholder="Describe the assessor type..."
                      className="bg-background"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = formData.assessors!.filter(a => a.id !== assessor.id);
                    updateField('assessors', updated);
                  }}
                  className="text-muted-foreground hover:text-destructive mt-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Conditional Four-Eye Principle Recommendation - only shown when exactly 1 assessor */}
      {formData.assessors && formData.assessors.length === 1 && (
        <Card className="p-4 bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Recommendation: Four-eye principle
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  Where feasible, involving more than one assessor is recommended. Using two assessors can strengthen fairness, consistency, and reliability of assessment decisions by reducing individual bias and supporting shared judgement.
                </p>
              </div>
            </div>
            
            <div className="ml-8 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keepOneAssessor"
                  checked={formData.fourEyeApplied === false}
                  onCheckedChange={(checked) => {
                    updateField('fourEyeApplied', checked ? false : undefined);
                  }}
                />
                <Label 
                  htmlFor="keepOneAssessor" 
                  className="text-sm text-blue-700 dark:text-blue-300 cursor-pointer"
                >
                  Keep one assessor
                </Label>
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                This confirms that a single-assessor setup is an intentional design choice.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // Transparent Evaluation Design
  const toggleTransparencyMeasure = (value: string) => {
    const current = formData.transparencyMeasures || [];
    const updated = current.includes(value)
      ? current.filter(m => m !== value)
      : [...current, value];
    updateField('transparencyMeasures', updated);
    
    // Clear "other" text if "other" is unchecked
    if (value === 'other' && current.includes('other')) {
      updateField('transparencyOther', '');
    }
  };

  const TRANSPARENCY_MEASURES = [
    { value: 'informed-performance', label: 'Learners are informed about what constitutes satisfactory performance' },
    { value: 'grading-basis', label: 'The basis for grading or pass/fail decisions is clearly described' },
    { value: 'shared-criteria', label: 'Assessors use shared criteria or rubrics to ensure consistent judgement' },
    { value: 'other', label: 'Other (please specify)' },
  ];

  const hasAtLeastOneTransparencyMeasure = (formData.transparencyMeasures || []).length > 0;
  const needsOtherDescription = (formData.transparencyMeasures || []).includes('other') && !(formData.transparencyOther?.trim());

  const renderTransparentEvaluationDesign = () => (
    <Card className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-foreground">Transparent evaluation design</h3>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Why?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Transparent evaluation helps learners understand expectations, supports fairness, and strengthens trust in assessment decisions.
              </p>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-warning hover:text-warning/80 flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                <span className="text-sm">Inspiration</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assessment quality inspiration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  International quality frameworks emphasise transparency, shared criteria, and clear communication:
                </p>
                
                <div className="space-y-3">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-1">Australian Qualifications Framework (AQF)</h4>
                    <p className="text-muted-foreground">
                      Emphasises clarity of standards, explicit performance expectations, and consistent judgement.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-1">EADTU Excellence Framework (Assessment chapter)</h4>
                    <p className="text-muted-foreground">
                      Highlights transparent criteria, learner-facing explanations, and consistency across assessors in online and blended assessment.
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground italic border-t pt-3">
                  These frameworks are provided as inspiration. You are not required to adopt a specific framework.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          This step focuses on transparency in evaluation. You are asked to confirm how learners will understand what counts as satisfactory performance and how assessment decisions are made consistently.
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">
          How is transparency ensured in the evaluation process? <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">Select at least one option</p>
        
        <div className="space-y-3">
          {TRANSPARENCY_MEASURES.map((measure) => (
            <div key={measure.value} className="flex items-start space-x-3">
              <Checkbox
                id={`transparency-${measure.value}`}
                checked={(formData.transparencyMeasures || []).includes(measure.value)}
                onCheckedChange={() => toggleTransparencyMeasure(measure.value)}
              />
              <Label 
                htmlFor={`transparency-${measure.value}`} 
                className="text-sm font-normal cursor-pointer leading-relaxed"
              >
                {measure.label}
              </Label>
            </div>
          ))}
        </div>
        
        {(formData.transparencyMeasures || []).includes('other') && (
          <div className="ml-6 space-y-2">
            <Label className="text-sm font-medium">
              Describe the additional transparency measure <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={formData.transparencyOther || ''}
              onChange={(e) => updateField('transparencyOther', e.target.value)}
              placeholder="Briefly describe how transparency is ensured."
              className="bg-background"
              rows={3}
            />
          </div>
        )}
        
        {!hasAtLeastOneTransparencyMeasure && (
          <p className="text-xs text-destructive">Please select at least one transparency measure.</p>
        )}
      </div>
    </Card>
  );

  // Assessment Access Model
  const renderAssessmentAccessModel = () => {
    const isComposite = courseType === 'composite-micro-credential';
    const sourcesList = (standaloneSources || []).map((s, i) => {
      const id = s.documentId || s.fileName || `source-${i}`;
      const label = s.workingTitle || s.fileName || s.documentId || `Standalone source ${i + 1}`;
      return { id, label };
    });
    const required = formData.partiallyFixedRequiredSources || [];
    const either = formData.partiallyFixedEitherSources || [];
    const eitherGroups = formData.partiallyFixedEitherGroups || {};

    // All distinct group numbers currently in use (sorted)
    const usedGroups = Array.from(
      new Set(either.map(id => eitherGroups[id]).filter((g): g is number => typeof g === 'number'))
    ).sort((a, b) => a - b);

    const nextAvailableGroup = (): number => {
      let g = 1;
      while (usedGroups.includes(g)) g++;
      return g;
    };

    const setSourceMode = (id: string, mode: 'required' | 'optional') => {
      const nextRequired = required.filter(r => r !== id);
      // Always clear any legacy either/or assignment for this source
      const nextEither = either.filter(r => r !== id);
      const nextGroups = { ...eitherGroups };
      delete nextGroups[id];
      if (mode === 'required') nextRequired.push(id);
      const updated = {
        ...formData,
        partiallyFixedRequiredSources: nextRequired,
        partiallyFixedEitherSources: nextEither,
        partiallyFixedEitherGroups: nextGroups,
      };
      setFormData(updated);
      onChange(updated as DesignAssessmentFormProps['data']);
    };

    const getSourceMode = (id: string): 'required' | 'optional' => {
      if (required.includes(id)) return 'required';
      return 'optional';
    };

    return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Assessment access model</h3>
        <p className="text-sm text-muted-foreground">
          This step defines how learners gain access to assessment. It clarifies whether the micro-credential allows direct access to assessment or requires completion of defined learning activities before assessment is permitted.
        </p>
      </div>

      <div className="flex items-start gap-2 p-4 rounded-lg border-2 border-destructive/40 bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="text-sm text-foreground">
          <span className="font-bold text-destructive">VERY IMPORTANT:</span>{' '}
          The access model you choose here directly determines learner eligibility for assessment and shapes the entire learning pathway. {isComposite && 'For a Composite Micro-Credential — which combines several standalone courses — this choice also defines whether some or all of those uploaded standalone parts must be completed before the final assessment. '}Be deliberate: this decision affects fairness, validity of recognition, and the learner contract. Once published, changing it later may require a new version of the micro-credential.
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">
          How is access to assessment structured in this micro-credential?
        </Label>
        
        <RadioGroup
          value={formData.assessmentAccessModel || ''}
          onValueChange={(value) => updateField('assessmentAccessModel', value as 'open' | 'fixed' | 'partially-fixed')}
          className="space-y-4"
        >
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-secondary/30 transition-colors">
            <RadioGroupItem value="open" id="access-open" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="access-open" className="font-medium cursor-pointer">
                Open assessment pathway
              </Label>
              <p className="text-sm text-muted-foreground">
                Learners may attempt the assessment directly, without completing the learning activities.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-secondary/30 transition-colors">
            <RadioGroupItem value="fixed" id="access-fixed" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="access-fixed" className="font-medium cursor-pointer">
                Fixed learning pathway
              </Label>
                <p className="text-sm text-muted-foreground">
                  Learners must complete <span className="font-medium">all</span> the defined learning activities — and therefore all uploaded standalone elements — before being eligible for assessment.
                </p>
            </div>
          </div>

          {isComposite && (
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-secondary/30 transition-colors">
              <RadioGroupItem value="partially-fixed" id="access-partial" className="mt-1" />
              <div className="space-y-1 flex-1">
                <Label htmlFor="access-partial" className="font-medium cursor-pointer">
                  Partially Fixed learning pathway
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only some of the uploaded standalone courses / learning activities must be completed before the assessment. Select below which uploaded parts are mandatory prerequisites — the remaining parts stay optional for the learner.
                </p>
              </div>
            </div>
          )}
        </RadioGroup>
      </div>

      {formData.assessmentAccessModel === 'open' && (
        <div className="space-y-4 p-4 bg-accent/50 border border-accent rounded-lg">
          <p className="text-sm text-foreground">
            This model assumes that learners may already possess the required competencies and choose to demonstrate them directly through assessment.
          </p>
          
          <div className="flex items-start space-x-3">
            <Checkbox
              id="access-confirmed"
              checked={formData.assessmentAccessConfirmed || false}
              onCheckedChange={(checked) => updateField('assessmentAccessConfirmed', checked === true)}
            />
            <Label htmlFor="access-confirmed" className="text-sm font-normal cursor-pointer">
              I confirm that the assessment alone is sufficient to validly demonstrate all learning outcomes
            </Label>
          </div>
        </div>
      )}

      {isComposite && formData.assessmentAccessModel === 'partially-fixed' && (
        <div className="space-y-4 p-4 bg-accent/50 border border-accent rounded-lg">
          {/* Consequences block removed — redundant in this context */}

          <div>
            <Label className="text-sm font-medium">
              Which uploaded standalone parts must be completed before the assessment?
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              For each standalone part, choose:
              <span className="font-medium"> Required</span> = must be completed before assessment;
              <span className="font-medium"> Optional</span> = not required for assessment.
            </p>
          </div>

          {sourcesList.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No uploaded standalone sources were detected for this composite micro-credential.
            </p>
          ) : (
            <div className="space-y-2">
              {sourcesList.map((src) => {
                const mode = getSourceMode(src.id);
                return (
                  <div key={src.id} className="flex items-center justify-between gap-3 p-3 border rounded-md bg-background flex-wrap">
                    <span className="text-sm leading-relaxed flex-1 min-w-[200px]">{src.label}</span>
                    <div className="flex gap-1 flex-shrink-0 items-center flex-wrap">
                      {(['required', 'optional'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSourceMode(src.id, m)}
                          className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                            mode === m
                              ? m === 'required'
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted text-muted-foreground border-muted'
                              : 'bg-background hover:bg-secondary/50 border-border'
                          }`}
                        >
                          {m === 'required' ? 'Required' : 'Optional'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sourcesList.length > 0 && required.length === 0 && (
            <p className="text-xs text-destructive">
              Select at least one mandatory standalone part — otherwise consider choosing the Open assessment pathway instead.
            </p>
          )}

          {sourcesList.length > 0 && required.length === sourcesList.length && (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-semibold">All standalone parts are marked as Required.</p>
                <p className="text-muted-foreground">
                  If every uploaded standalone part must be completed before assessment, you should
                  choose the <span className="font-medium text-foreground">Fixed learning pathway</span> instead
                  of Partially fixed — it more accurately describes this design.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </Card>
    );
  };

  // 5.6 - Quality Framework
  const renderQualityFramework = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">Use an assessment quality framework</h3>
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-primary hover:text-primary/80">
              <Info className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Why?</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              An assessment quality framework ensures that evaluation is valid, reliable, and aligned with recognised standards.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Select quality framework</Label>
        <Select
          value={formData.qualityFrameworkType || ''}
          onValueChange={(value) => updateField('qualityFrameworkType', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select framework type" />
          </SelectTrigger>
          <SelectContent>
            {QUALITY_FRAMEWORK_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.qualityFrameworkType === 'other' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Specify framework</Label>
          <Input
            value={formData.qualityFrameworkOther || ''}
            onChange={(e) => updateField('qualityFrameworkOther', e.target.value)}
            placeholder="Enter the name of the framework..."
            className="bg-background"
          />
        </div>
      )}
    </Card>
  );

  // Resit Opportunities helpers
  const RESIT_CONDITIONS = [
    { value: 'not-meet-criteria', label: 'If the learner submits but does not meet the minimum criteria' },
    { value: 'fails-components', label: 'If the learner fails specific assessment components' },
    { value: 'other', label: 'Other condition (describe)' },
  ];

  const toggleResitCondition = (value: string) => {
    const current = formData.resitConditions || [];
    const updated = current.includes(value)
      ? current.filter(c => c !== value)
      : [...current, value];
    updateField('resitConditions', updated);
    
    // Clear "other" text if "other" is unchecked
    if (value === 'other' && current.includes('other')) {
      updateField('resitConditionsOther', '');
    }
  };

  // Grading System
  const [selectedGrading, setSelectedGrading] = useState(formData.gradingSystem || '');
  const [gradingCountry, setGradingCountry] = useState(formData.gradingSystemCountry || '');

  // Sync local state with formData
  useEffect(() => {
    setSelectedGrading(formData.gradingSystem || '');
    setGradingCountry(formData.gradingSystemCountry || '');
  }, [formData.gradingSystem, formData.gradingSystemCountry]);

  const handleGradingChange = (value: string) => {
    setSelectedGrading(value);
    updateField('gradingSystem', value);
    if (value !== 'national' && value !== 'dual') {
      setGradingCountry('');
      updateField('gradingSystemCountry', '');
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGradingCountry(e.target.value);
    updateField('gradingSystemCountry', e.target.value);
  };

  const renderGradingSystem = () => (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">How is the assessment graded?</h3>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Grading systems and comparability</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>
                  The selected grading system defines how learner performance is formally evaluated.
                </p>
                <p>
                  Grades can always be converted or interpreted in connection with recognition, credit transfer, or stackability within an institution or across institutions.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          Specify the grading system used for this micro-credential.
        </p>
        <p className="text-sm text-muted-foreground">
          This information supports transparency, recognition, and potential credit transfer across institutions.
        </p>
      </div>

      {/* Grading system selection */}
      <div className="space-y-4">
        <Label htmlFor="grading-select" className="text-sm font-medium">
          Select the grading system applied to this micro-credential <span className="text-destructive">*</span>
        </Label>
        
        <Select value={selectedGrading} onValueChange={handleGradingChange}>
          <SelectTrigger id="grading-select">
            <SelectValue placeholder="Select a grading system..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pass-fail">Pass / Fail</SelectItem>
            <SelectItem value="eu-scale">EU grading scale (A–F)</SelectItem>
            <SelectItem value="national">National grading framework</SelectItem>
            <SelectItem value="dual">Dual grading system (EU grading + National framework)</SelectItem>
          </SelectContent>
        </Select>

        {/* Conditional country field for national or dual */}
        {(selectedGrading === 'national' || selectedGrading === 'dual') && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Country / national framework <span className="text-destructive">*</span>
            </Label>
            <Input
              value={gradingCountry}
              onChange={handleCountryChange}
              placeholder="e.g. Denmark, Germany, Finland"
              className="bg-background"
            />
          </div>
        )}
      </div>

      {/* Note banner */}
      <div className="flex gap-3 p-4 bg-muted/50 border rounded-lg">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Note</p>
          <p className="text-sm text-muted-foreground">
            Regardless of the grading system selected, results can be converted or interpreted for purposes such as recognition of prior learning, credit transfer, or stackability within institutional frameworks.
          </p>
        </div>
      </div>
    </Card>
  );

  const renderResitOpportunities = () => (
    <Card className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-foreground">Establish resit opportunities for learners</h3>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Why?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                A resit does not mean an easier assessment or a guaranteed second chance. It means that a clear and fair process exists, aligned with the teaching and assessment design, in case a learner does not meet the requirements.
              </p>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-warning hover:text-warning/80 flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                <span className="text-sm">Inspiration</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Good practice principles</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Resits assess the same learning outcomes and standards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Criteria and expectations remain unchanged</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The resit process is communicated clearly in advance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The resit format matches the teaching and assessment design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Institutions avoid resits becoming automatic or routine</span>
                  </li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          This step defines how the programme handles cases where a learner does not pass the assessment. The purpose is not to lower standards, but to ensure transparency, fairness, and a clear process if resit becomes necessary.
        </p>
      </div>

      {/* Resit description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Describe the learner's opportunity for resit <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Clearly state if a resit is possible and under which conditions.
          <span className="font-semibold text-foreground"> Be aware that this description will be directly visible to learners as part of the course metadata.</span>
        </p>
        <Textarea
          value={formData.resitDescription || ''}
          onChange={(e) => updateField('resitDescription', e.target.value)}
          placeholder="Describe the resit policy, conditions, and process..."
          className="bg-background"
          rows={4}
        />
      </div>
    </Card>
  );

  // 5.8 - Institutional responsibility for assessment
  const renderAssessingInstitution = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">Institutional responsibility for assessment</h3>
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-primary hover:text-primary/80">
              <Info className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Institutional responsibility for assessment</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              This field identifies the institution that is formally responsible for conducting and quality-assuring the assessment.
              The responsible institution's existing quality assurance framework applies automatically. No further description of the framework is required here.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Which institution is formally responsible for facilitating the assessment and awarding the micro-credential?
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          value={formData.responsibleInstitution || ''}
          onChange={(e) => updateField('responsibleInstitution', e.target.value)}
          placeholder="Name of responsible institution (e.g. university, university college, alliance partner)"
          className="bg-background"
        />
        <p className="text-xs text-muted-foreground">
          Specify the institution that holds formal responsibility for the assessment process. This institution's quality assurance framework will apply to the micro-credential.
        </p>
      </div>
    </Card>
  );

  // 5.9 - Authentic Assessment
  const renderAuthenticAssessment = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">Authentic / case-based assessment</h3>
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-primary hover:text-primary/80">
              <Info className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Why?</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              Authentic assessment strengthens validity by allowing learners to demonstrate competence in realistic contexts.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Assessment includes authentic or case-based elements
        </Label>
        <Switch
          checked={formData.hasAuthenticElements || false}
          onCheckedChange={(checked) => updateField('hasAuthenticElements', checked)}
        />
      </div>

      {formData.hasAuthenticElements && (
        <div className="space-y-2 mt-4">
          <Label className="text-sm font-medium">Describe the case or real-world context</Label>
          <Textarea
            value={formData.authenticDescription || ''}
            onChange={(e) => updateField('authenticDescription', e.target.value)}
            placeholder="Describe how authentic elements are incorporated..."
            className="min-h-[80px] bg-background"
          />
        </div>
      )}
    </Card>
  );

  // 5.10 - Success Criteria
  const renderSuccessCriteria = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">Define success criteria</h3>
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-primary hover:text-primary/80">
              <Info className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Why?</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              Success criteria clarify what counts as sufficient performance and help ensure consistent judgement.
            </p>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-primary hover:text-primary/80">
              <Lightbulb className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Inspiration</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-2">
              <p>Examples of success criteria:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Demonstrates application of methods</li>
                <li>Provides justified decisions</li>
                <li>Communicates professionally</li>
                <li>Shows critical reflection</li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Success criteria (one per line)</Label>
        <Textarea
          value={formData.successCriteria || ''}
          onChange={(e) => updateField('successCriteria', e.target.value)}
          placeholder={"• Demonstrates application of methods\n• Provides justified decisions\n• Communicates professionally"}
          className="min-h-[120px] bg-background font-mono text-sm"
        />
      </div>
    </Card>
  );

  // 5.11 - Calibration
  const renderCalibration = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">Calibration of assessment</h3>
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-primary hover:text-primary/80">
              <Info className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Why?</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              Calibration reduces variation and supports fairness across assessors.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Select calibration methods used</Label>
        <div className="space-y-2">
          {CALIBRATION_METHODS.map((method) => (
            <div key={method.value} className="flex items-center space-x-3">
              <Checkbox
                id={`calibration-${method.value}`}
                checked={(formData.calibrationMethods || []).includes(method.value)}
                onCheckedChange={() => toggleCalibrationMethod(method.value)}
              />
              <Label
                htmlFor={`calibration-${method.value}`}
                className="font-normal cursor-pointer"
              >
                {method.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  // 5.12 - Four-Eye Principle
  const renderFourEyePrinciple = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">Four-eye principle</h3>
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-primary hover:text-primary/80">
              <Info className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Why?</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              The four-eye principle strengthens assessment quality by involving an additional qualified reviewer.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Four-eye principle applied
        </Label>
        <Switch
          checked={formData.fourEyeApplied || false}
          onCheckedChange={(checked) => updateField('fourEyeApplied', checked)}
        />
      </div>

      {formData.fourEyeApplied === false && (
        <div className="space-y-2 mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <Label className="text-sm font-medium">Justification required</Label>
          </div>
          <Textarea
            value={formData.fourEyeJustification || ''}
            onChange={(e) => updateField('fourEyeJustification', e.target.value)}
            placeholder="Explain why the four-eye principle is not applicable..."
            className="min-h-[80px] bg-background"
            required
          />
        </div>
      )}
    </Card>
  );

  // Final Confirmation
  const renderFinalConfirmation = () => (
    <Card className="p-6 space-y-4 border-primary/50 bg-primary/5">
      <h3 className="text-lg font-semibold text-foreground">Final assessment confirmation</h3>
      <p className="text-sm text-muted-foreground">
        Before proceeding, confirm that your assessment design is complete and aligned.
      </p>

      <div className="flex items-start space-x-3 pt-2">
        <Checkbox
          id="assessment-confirmed"
          checked={formData.assessmentDesignConfirmed || false}
          onCheckedChange={(checked) => updateField('assessmentDesignConfirmed', !!checked)}
        />
        <Label
          htmlFor="assessment-confirmed"
          className="font-normal cursor-pointer leading-relaxed"
        >
          I confirm that the assessment design is aligned with the learning outcomes, assessment framework, and learning activities defined earlier.
        </Label>
      </div>
    </Card>
  );

  // Render content based on currentItemId
  const renderContent = () => {
    switch (currentItemId) {
      case '5.5':
        return (
          <>
            {renderAssessmentOverview()}
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                The assessment design builds on the learning outcomes and assessment framework defined earlier. In this section, you specify how learner performance will be evaluated in a valid, transparent, and consistent way.
              </p>
            </Card>
            {renderAssessmentProcess()}
            {renderTransparentEvaluationDesign()}
            {renderAssessmentAccessModel()}
            {renderGradingSystem()}
            {renderResitOpportunities()}
            {renderAssessingInstitution()}
          </>
        );
      case '5.6':
        return (
          <>
            {renderAssessmentOverview()}
            {renderQualityFramework()}
          </>
        );
      case '5.7':
        return (
          <>
            {renderAssessmentOverview()}
            {renderResitOpportunities()}
          </>
        );
      case '5.8':
        return (
          <>
            {renderAssessmentOverview()}
            {renderAssessingInstitution()}
          </>
        );
      case '5.9':
        return (
          <>
            {renderAssessmentOverview()}
            {renderAuthenticAssessment()}
          </>
        );
      case '5.10':
        return (
          <>
            {renderAssessmentOverview()}
            {renderSuccessCriteria()}
          </>
        );
      case '5.11':
        return (
          <>
            {renderAssessmentOverview()}
            {renderCalibration()}
          </>
        );
      case '5.12':
        return (
          <>
            {renderAssessmentOverview()}
            {renderFourEyePrinciple()}
            {renderFinalConfirmation()}
          </>
        );
      default:
        // Show all sections if no specific item
        return (
          <>
            {renderAssessmentOverview()}
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                The assessment design builds on the learning outcomes and assessment framework defined earlier. In this section, you specify how learner performance will be evaluated in a valid, transparent, and consistent way.
              </p>
            </Card>
            {renderAssessmentProcess()}
            {renderTransparentEvaluationDesign()}
            {renderAssessmentAccessModel()}
            {renderGradingSystem()}
            {renderResitOpportunities()}
            {renderQualityFramework()}
            {renderAssessingInstitution()}
            {renderAuthenticAssessment()}
            {renderSuccessCriteria()}
            {renderCalibration()}
            {renderFourEyePrinciple()}
            {renderFinalConfirmation()}
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
};

export default DesignAssessmentForm;
