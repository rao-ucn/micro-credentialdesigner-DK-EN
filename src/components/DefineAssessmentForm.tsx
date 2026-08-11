import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Info, Lightbulb, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type EQFDimension = 'knowledge' | 'skills' | 'responsibility';
type CognitiveDomain = 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
type CompetenceDimension = 'knowledge' | 'skills' | 'responsibility_autonomy';

interface LearningOutcome {
  id: string;
  approach?: 'bloom' | 'tuning';
  // Bloom fields
  cognitiveDomain?: CognitiveDomain;
  activeVerb?: string;
  outcomeText?: string;
  // Tuning fields
  competenceFocus?: string;
  composedOutcome?: string;
  competenceDimensions?: CompetenceDimension[];
  contextOfApplication?: string;
  keyActions?: string;
  expectedResult?: string;
}

interface DefineAssessmentFormProps {
  data: {
    assessmentType?: string;
    individualOrGroup?: string;
    deliveryMode?: string;
    activityTypes?: string[];
    otherActivityType?: string;
    activityDescription?: string;
    alignmentCheck1?: 'no-conflict' | 'has-conflict';
    alignmentCheck1Issue?: string;
    alignmentCheck2?: 'suitable' | 'not-suitable';
    alignmentCheck2Issue?: string;
  };
  onChange: (data: DefineAssessmentFormProps['data']) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  learningOutcomes?: LearningOutcome[];
}

const BLOOM_TO_EQF: Record<CognitiveDomain, EQFDimension> = {
  knowledge: 'knowledge',
  comprehension: 'knowledge',
  application: 'skills',
  analysis: 'responsibility',
  synthesis: 'responsibility',
  evaluation: 'responsibility',
};

const EQF_DIMENSION_LABELS: Record<EQFDimension, string> = {
  knowledge: 'Knowledge',
  skills: 'Skills',
  responsibility: 'Responsibility and autonomy',
};

const ASSESSMENT_TYPES = [
  { value: 'written', label: 'Written' },
  { value: 'oral', label: 'Oral' },
  { value: 'combination', label: 'Combination of written and oral' },
];

const INDIVIDUAL_OR_GROUP = [
  { value: 'individual', label: 'Individual assessment' },
  { value: 'group', label: 'Group assessment' },
  { value: 'combination', label: 'Combination' },
];

const DELIVERY_MODES = [
  { value: 'physical', label: 'Physical attendance required' },
  { value: 'online-possible', label: 'Online possible' },
  { value: 'fully-online', label: 'Fully online' },
];

const ACTIVITY_TYPES = [
  { value: 'simulation', label: 'Simulation' },
  { value: 'portfolio', label: 'Portfolio with oral defence' },
  { value: 'case-based', label: 'Case-based assessment' },
  { value: 'project-based', label: 'Project-based assessment' },
  { value: 'practical-performance', label: 'Practical performance task' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'observation-checklist', label: 'Observation checklist' },
  { value: 'other', label: 'Other' },
];

const DefineAssessmentForm: React.FC<DefineAssessmentFormProps> = ({
  data,
  onChange,
  courseType,
  learningOutcomes = [],
}) => {
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  
  const [formData, setFormData] = useState({
    assessmentType: data.assessmentType || '',
    individualOrGroup: data.individualOrGroup || '',
    deliveryMode: data.deliveryMode || '',
    activityTypes: data.activityTypes || [],
    otherActivityType: data.otherActivityType || '',
    activityDescription: data.activityDescription || '',
    alignmentCheck1: data.alignmentCheck1 || '',
    alignmentCheck1Issue: data.alignmentCheck1Issue || '',
    alignmentCheck2: data.alignmentCheck2 || '',
    alignmentCheck2Issue: data.alignmentCheck2Issue || '',
  });

  useEffect(() => {
    setFormData({
      assessmentType: data.assessmentType || '',
      individualOrGroup: data.individualOrGroup || '',
      deliveryMode: data.deliveryMode || '',
      activityTypes: data.activityTypes || [],
      otherActivityType: data.otherActivityType || '',
      activityDescription: data.activityDescription || '',
      alignmentCheck1: data.alignmentCheck1 || '',
      alignmentCheck1Issue: data.alignmentCheck1Issue || '',
      alignmentCheck2: data.alignmentCheck2 || '',
      alignmentCheck2Issue: data.alignmentCheck2Issue || '',
    });
  }, [data]);

  const updateField = (field: keyof typeof formData, value: string | string[]) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated as DefineAssessmentFormProps['data']);
  };

  const toggleActivityType = (value: string) => {
    const current = formData.activityTypes || [];
    const updated = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value];
    updateField('activityTypes', updated);
  };

  const COMPETENCE_TO_EQF: Record<CompetenceDimension, EQFDimension> = {
    knowledge: 'knowledge',
    skills: 'skills',
    responsibility_autonomy: 'responsibility',
  };

  const getOutcomeText = (o: LearningOutcome): string => {
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

  const isOutcomeComplete = (o: LearningOutcome): boolean => {
    if (o.approach === 'tuning') {
      return !!(o.composedOutcome?.trim() || o.competenceFocus?.trim());
    }
    return !!(o.cognitiveDomain && o.outcomeText?.trim());
  };

  // Group learning outcomes by EQF dimension
  const eqfGroupedOutcomes = useMemo(() => {
    const grouped: Record<EQFDimension, { id: string; text: string }[]> = {
      knowledge: [],
      skills: [],
      responsibility: [],
    };
    
    const completeOutcomes = learningOutcomes.filter(isOutcomeComplete);
    
    completeOutcomes.forEach((outcome) => {
      const text = getOutcomeText(outcome);
      if (outcome.approach === 'tuning') {
        const dims = outcome.competenceDimensions && outcome.competenceDimensions.length > 0
          ? outcome.competenceDimensions
          : null;
        if (dims) {
          dims.forEach(d => {
            grouped[COMPETENCE_TO_EQF[d]].push({ id: outcome.id, text });
          });
        } else {
          grouped['skills'].push({ id: outcome.id, text });
        }
      } else if (outcome.cognitiveDomain) {
        const eqfDimension = (outcome as any).eqfDimension || BLOOM_TO_EQF[outcome.cognitiveDomain];
        grouped[eqfDimension].push({ id: outcome.id, text });
      }
    });
    
    return grouped;
  }, [learningOutcomes]);

  const hasLearningOutcomes = learningOutcomes.some(isOutcomeComplete);

  return (
    <div className="space-y-6">
      {/* Learning Outcomes Reference Table */}
      {hasLearningOutcomes && (
        <Card className="p-6 space-y-4 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
          <h3 className="text-lg font-semibold text-foreground">Summary of learning outcomes</h3>
          <p className="text-sm text-muted-foreground">
            Your learning outcomes grouped by EQF dimensions. Use this as a reference when defining your assessment framework.
          </p>
          
          {(['knowledge', 'skills', 'responsibility'] as EQFDimension[]).map((dimension) => (
            <div key={dimension} className="space-y-2">
              <h4 className="text-base font-semibold text-foreground border-b border-border pb-2">
                {EQF_DIMENSION_LABELS[dimension]}
              </h4>
              {eqfGroupedOutcomes[dimension].length > 0 ? (
                <Table>
                  <TableBody>
                    {eqfGroupedOutcomes[dimension].map((outcome) => (
                      <TableRow key={outcome.id}>
                        <TableCell className="text-sm">{outcome.text}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No learning outcomes mapped to this dimension.
                </p>
              )}
            </div>
          ))
          }
        </Card>
      )}

      {/* Metatext */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Define assessment establishes the overall assessment framework for the {courseLabel}. Before designing specific assessment activities, the developer must determine the general form of assessment, the mode of delivery, and whether it is individual or group-based. These choices create the fixed parameters within which the final assessment design will later be developed. The actual assessment tasks will be defined in a later step.
        </p>
      </Card>

      {/* Question 1: Assessment Type */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            What overall assessment type will you use?
          </Label>
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
              <div className="text-sm">
                <p>
                  The overall assessment type sets the primary format for how the learner will be evaluated. Written assessments typically measure analytical reasoning, structured argumentation, and comprehension. Oral assessments examine verbal articulation, critical reflection, and real-time reasoning. A combination allows flexibility when learning outcomes require both written structure and oral explanation.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-warning hover:text-warning/80">
                <Lightbulb className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Inspiration</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  Consider which format best aligns with your learning outcomes. Outcomes related to analysis or argumentation may suit a written assessment, while outcomes focused on explanation, discussion, or judgment might be better evaluated orally. If your learning outcomes require both structured writing and oral demonstration, a combination is often the most accurate choice.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Select
          value={formData.assessmentType}
          onValueChange={(value) => updateField('assessmentType', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select assessment type" />
          </SelectTrigger>
          <SelectContent>
            {ASSESSMENT_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Question 2: Individual or Group */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            Will the assessment be individual, group-based, or a combination?
          </Label>
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
              <div className="text-sm">
                <p>
                  Micro-credentials must document individual achievement, but group work can still be part of the assessment design. This selection clarifies whether the performance being assessed is individual, group-based, or combines both aspects. If group work is involved, the final assessment activity must still make it possible to determine each learner's contribution.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-warning hover:text-warning/80">
                <Lightbulb className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Inspiration</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  Choose group assessment only if collaboration is an essential part of the intended learning outcomes. Otherwise, select individual assessment or a combination. Many programmes use group processes for learning but ensure individual grading.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Select
          value={formData.individualOrGroup}
          onValueChange={(value) => updateField('individualOrGroup', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select assessment format" />
          </SelectTrigger>
          <SelectContent>
            {INDIVIDUAL_OR_GROUP.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Question 3: Delivery Mode */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            Will any part of the assessment require physical attendance?
          </Label>
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
              <div className="text-sm">
                <p>
                  This choice determines whether the assessment relies on in-person performance, can be conducted online, or is fully digital. This affects logistical planning and may influence which assessment activities are feasible later.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-warning hover:text-warning/80">
                <Lightbulb className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Inspiration</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  For practical demonstrations or simulations, physical attendance may be necessary. Written assessments or oral defenses can often be conducted online. Choose the solution that best supports fairness, accessibility, and validity.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Select
          value={formData.deliveryMode}
          onValueChange={(value) => updateField('deliveryMode', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select delivery mode" />
          </SelectTrigger>
          <SelectContent>
            {DELIVERY_MODES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Question 4: Activity Types and Description */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            Describe the intended type of assessment activities
          </Label>
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
              <div className="text-sm">
                <p>
                  Assessment activities specify how the learner will demonstrate mastery. A simulation tests applied decision-making in realistic scenarios. A portfolio with oral defence allows learners to document progress and justify choices. Practical performance tasks verify procedural competence. Explain the activities clearly so they can later be developed into a complete assessment design.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-warning hover:text-warning/80">
                <Lightbulb className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Inspiration</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  Look back at your learning outcomes table. Identify what kinds of evidence would most convincingly demonstrate that the learner has achieved each outcome. Choose activity types that naturally fit the cognitive level and complexity of your outcomes.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm text-muted-foreground">
          Within the parameters you selected above, describe the assessment activities you intend to use. This information will guide the development of the final assessment design later in the process.
        </p>

        {/* Multi-select Activity Types */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select activity type(s)</Label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPES.map((activity) => (
              <Badge
                key={activity.value}
                variant={formData.activityTypes?.includes(activity.value) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => toggleActivityType(activity.value)}
              >
                {activity.label}
                {formData.activityTypes?.includes(activity.value) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Other Activity Type Text Field */}
        {formData.activityTypes?.includes('other') && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Specify other activity type</Label>
            <Input
              value={formData.otherActivityType}
              onChange={(e) => updateField('otherActivityType', e.target.value)}
              placeholder="Enter your custom activity type"
              className="bg-background"
            />
          </div>
        )}

        {/* Activity Description Textarea */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Activity description</Label>
          <Textarea
            value={formData.activityDescription}
            onChange={(e) => updateField('activityDescription', e.target.value)}
            placeholder="Describe the assessment activity you intend to use. Explain briefly how the learner will demonstrate achievement within the chosen format."
            className="min-h-[120px] bg-background"
          />
        </div>
      </Card>

    </div>
  );
};

export default DefineAssessmentForm;
