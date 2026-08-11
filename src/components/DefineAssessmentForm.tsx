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
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

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

// Labels are resolved inside the component via the active-language dictionary (lt).

const DefineAssessmentForm: React.FC<DefineAssessmentFormProps> = ({
  data,
  onChange,
  courseType,
  learningOutcomes = [],
}) => {
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : lt.courseLabelMicroCredential;

  const EQF_DIMENSION_LABELS: Record<EQFDimension, string> = {
    knowledge: lt.daKnowledge,
    skills: lt.daSkills,
    responsibility: lt.daResponsibility,
  };

  const ASSESSMENT_TYPES = [
    { value: 'written', label: lt.daTypeWritten },
    { value: 'oral', label: lt.daTypeOral },
    { value: 'combination', label: lt.daTypeCombination },
  ];

  const INDIVIDUAL_OR_GROUP = [
    { value: 'individual', label: lt.daGroupIndividual },
    { value: 'group', label: lt.daGroupGroup },
    { value: 'combination', label: lt.daGroupCombination },
  ];

  const DELIVERY_MODES = [
    { value: 'physical', label: lt.daDeliveryPhysical },
    { value: 'online-possible', label: lt.daDeliveryOnlinePossible },
    { value: 'fully-online', label: lt.daDeliveryFullyOnline },
  ];

  const ACTIVITY_TYPES = [
    { value: 'simulation', label: lt.daActivitySimulation },
    { value: 'portfolio', label: lt.daActivityPortfolio },
    { value: 'case-based', label: lt.daActivityCaseBased },
    { value: 'project-based', label: lt.daActivityProjectBased },
    { value: 'practical-performance', label: lt.daActivityPracticalPerformance },
    { value: 'presentation', label: lt.daActivityPresentation },
    { value: 'observation-checklist', label: lt.daActivityObservationChecklist },
    { value: 'other', label: lt.daActivityOther },
  ];
  
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
          <h3 className="text-lg font-semibold text-foreground">{lt.daSummaryTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {lt.daSummaryHelp}
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
                  {lt.daNoOutcomesForDimension}
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
          {lt.daIntro.replace(/{course}/g, courseLabel)}
        </p>
      </Card>

      {/* Question 1: Assessment Type */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            {lt.daQ1Label}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.daWhy}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.daQ1Why}
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
                <DialogTitle>{lt.daInspiration}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.daQ1Inspire}
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
            <SelectValue placeholder={lt.daQ1Placeholder} />
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
            {lt.daQ2Label}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.daWhy}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.daQ2Why}
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
                <DialogTitle>{lt.daInspiration}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.daQ2Inspire}
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
            <SelectValue placeholder={lt.daQ2Placeholder} />
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
            {lt.daQ3Label}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.daWhy}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.daQ3Why}
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
                <DialogTitle>{lt.daInspiration}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.daQ3Inspire}
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
            <SelectValue placeholder={lt.daQ3Placeholder} />
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
            {lt.daQ4Label}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.daWhy}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.daQ4Why}
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
                <DialogTitle>{lt.daInspiration}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.daQ4Inspire}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm text-muted-foreground">
          {lt.daQ4Help}
        </p>

        {/* Multi-select Activity Types */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{lt.daActivityTypesLabel}</Label>
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
            <Label className="text-sm font-medium">{lt.daOtherActivityLabel}</Label>
            <Input
              value={formData.otherActivityType}
              onChange={(e) => updateField('otherActivityType', e.target.value)}
              placeholder={lt.daOtherActivityPlaceholder}
              className="bg-background"
            />
          </div>
        )}

        {/* Activity Description Textarea */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{lt.daActivityDescriptionLabel}</Label>
          <Textarea
            value={formData.activityDescription}
            onChange={(e) => updateField('activityDescription', e.target.value)}
            placeholder={lt.daActivityDescriptionPlaceholder}
            className="min-h-[120px] bg-background"
          />
        </div>
      </Card>

    </div>
  );
};

export default DefineAssessmentForm;
