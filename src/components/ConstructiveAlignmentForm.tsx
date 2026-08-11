import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getOutcomeText, isOutcomeComplete } from '@/lib/learning-outcomes';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

type CognitiveDomain = 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
type EQFDimension = 'knowledge' | 'skills' | 'responsibility';
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


interface AssessmentData {
  assessmentType?: string;
  individualOrGroup?: string;
  deliveryMode?: string;
  activityTypes?: string[];
  otherActivityType?: string;
  activityDescription?: string;
}

interface TopicsData {
  themes?: string[];
}

interface ConstructiveAlignmentFormProps {
  data: {
    alignmentConfirmed?: 'aligned' | 'misaligned';
    misalignmentNote?: string;
  };
  onChange: (data: ConstructiveAlignmentFormProps['data']) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  learningOutcomes?: LearningOutcome[];
  topicsData?: TopicsData;
  assessmentData?: AssessmentData;
}

const BLOOM_TO_EQF: Record<CognitiveDomain, EQFDimension> = {
  knowledge: 'knowledge',
  comprehension: 'knowledge',
  application: 'skills',
  analysis: 'responsibility',
  synthesis: 'responsibility',
  evaluation: 'responsibility',
};

const COMPETENCE_TO_EQF: Record<CompetenceDimension, EQFDimension> = {
  knowledge: 'knowledge',
  skills: 'skills',
  responsibility_autonomy: 'responsibility',
};

const ConstructiveAlignmentForm: React.FC<ConstructiveAlignmentFormProps> = ({
  data,
  onChange,
  courseType,
  learningOutcomes = [],
  topicsData,
  assessmentData,
}) => {
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : lt.courseLabelMicroCredential;

  const EQF_DIMENSION_LABELS: Record<EQFDimension, string> = {
    knowledge: lt.caKnowledge,
    skills: lt.caSkills,
    responsibility: lt.caResponsibility,
  };

  const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
    'written': lt.caTypeWritten,
    'oral': lt.caTypeOral,
    'combination': lt.caTypeCombination,
  };

  const INDIVIDUAL_GROUP_LABELS: Record<string, string> = {
    'individual': lt.caFormatIndividual,
    'group': lt.caFormatGroup,
    'combination': lt.caFormatCombination,
  };

  const DELIVERY_MODE_LABELS: Record<string, string> = {
    'physical': lt.caDeliveryPhysical,
    'online-possible': lt.caDeliveryOnlinePossible,
    'fully-online': lt.caDeliveryFullyOnline,
  };

  const ACTIVITY_TYPE_LABELS: Record<string, string> = {
    'simulation': lt.caActivitySimulation,
    'portfolio': lt.caActivityPortfolio,
    'case-based': lt.caActivityCaseBased,
    'project-based': lt.caActivityProjectBased,
    'practical-performance': lt.caActivityPracticalPerformance,
    'presentation': lt.caActivityPresentation,
    'observation-checklist': lt.caActivityObservationChecklist,
    'other': lt.caActivityOther,
  };

  const [formData, setFormData] = useState({
    alignmentConfirmed: data.alignmentConfirmed || '',
    misalignmentNote: data.misalignmentNote || '',
  });

  useEffect(() => {
    setFormData({
      alignmentConfirmed: data.alignmentConfirmed || '',
      misalignmentNote: data.misalignmentNote || '',
    });
  }, [data]);

  const updateField = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated as ConstructiveAlignmentFormProps['data']);
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
        const dims = outcome.competenceDimensions?.length ? outcome.competenceDimensions : null;
        if (dims) {
          dims.forEach(d => grouped[COMPETENCE_TO_EQF[d]].push({ id: outcome.id, text }));
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

  const filledThemes = topicsData?.themes?.filter((t) => t.trim().length > 0) || [];
  const hasThemes = filledThemes.length > 0;


  const hasAssessmentData = !!(
    assessmentData?.assessmentType ||
    assessmentData?.individualOrGroup ||
    assessmentData?.deliveryMode ||
    (assessmentData?.activityTypes && assessmentData.activityTypes.length > 0)
  );

  return (
    <div className="space-y-6">
      {/* Metatext */}
      <Card className="p-6">
        <div className="text-sm text-muted-foreground space-y-3">
          <p>
            {lt.caIntro1.replace(/{course}/g, courseLabel)}
          </p>
          <p>
            {lt.caIntro2}
          </p>
        </div>
      </Card>

      {/* Part 1: Learning Outcomes Summary */}
      <Card className="p-6 space-y-4 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{lt.caOutcomesDefined}</h3>
        </div>
        
        {hasLearningOutcomes ? (
          <div className="space-y-4">
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
                    {lt.caNoOutcomesForDimension}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{lt.caNoOutcomesTitle}</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {lt.caNoOutcomesText}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Narrative between Learning Outcomes and Topics */}
      <div className="text-sm text-muted-foreground px-2">
        <p>
          {lt.caNarrative}
        </p>
      </div>

      {/* Part 2: Topics and Themes Summary */}
      <Card className="p-6 space-y-4 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-foreground">{lt.caTopicsTitle}</h3>
        
        {hasThemes ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {lt.caTopicsIntro.replace(/{course}/g, courseLabel)}
            </p>
            <ul className="space-y-1">
              {filledThemes.map((theme, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary font-medium">•</span>
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {lt.caNoTopics}
          </p>
        )}
      </Card>

      {/* Part 3: Assessment Approach Summary (only for micro-credentials) */}
      {courseType === 'micro-credential' && (
        <Card className="p-6 space-y-4 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-foreground">{lt.caAssessmentTitle}</h3>
          
          {hasAssessmentData ? (
            <div className="space-y-3">
              {assessmentData?.assessmentType && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{lt.caAssessmentType}</span>
                  <Badge variant="secondary">
                    {ASSESSMENT_TYPE_LABELS[assessmentData.assessmentType] || assessmentData.assessmentType}
                  </Badge>
                </div>
              )}
              
              {assessmentData?.individualOrGroup && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{lt.caAssessmentFormat}</span>
                  <Badge variant="secondary">
                    {INDIVIDUAL_GROUP_LABELS[assessmentData.individualOrGroup] || assessmentData.individualOrGroup}
                  </Badge>
                </div>
              )}
              
              {assessmentData?.deliveryMode && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{lt.caDeliveryMode}</span>
                  <Badge variant="secondary">
                    {DELIVERY_MODE_LABELS[assessmentData.deliveryMode] || assessmentData.deliveryMode}
                  </Badge>
                </div>
              )}
              
              {assessmentData?.activityTypes && assessmentData.activityTypes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">{lt.caActivityTypes}</span>
                  <div className="flex flex-wrap gap-2">
                    {assessmentData.activityTypes.map((type) => (
                      <Badge key={type} variant="outline">
                        {ACTIVITY_TYPE_LABELS[type] || type}
                      </Badge>
                    ))}
                  </div>
                  {assessmentData.otherActivityType && (
                    <p className="text-sm text-muted-foreground">{lt.caOther} {assessmentData.otherActivityType}</p>
                  )}
                </div>
              )}
              
              {assessmentData?.activityDescription && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-foreground">{lt.caActivityDescription}</span>
                  <p className="text-sm text-muted-foreground">{assessmentData.activityDescription}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {lt.caNoAssessment}
            </p>
          )}
        </Card>
      )}

      {/* Part 5: Constructive Alignment Check */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{lt.caCheckTitle}</h3>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.caCheckWhy}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.caCheckWhyText}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {lt.caCheckHelp}
        </p>

        <div className="space-y-3">
          <Label className="text-base font-medium">
            {lt.caCheckQuestion}
          </Label>
          
          <RadioGroup
            value={formData.alignmentConfirmed}
            onValueChange={(value) => updateField('alignmentConfirmed', value)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="aligned" id="aligned" className="mt-0.5" />
              <Label htmlFor="aligned" className="text-sm font-normal cursor-pointer flex-1">
                {lt.caAlignedLabel}
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="misaligned" id="misaligned" className="mt-0.5" />
              <Label htmlFor="misaligned" className="text-sm font-normal cursor-pointer flex-1">
                {lt.caMisalignedLabel}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.alignmentConfirmed === 'misaligned' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {lt.caMisalignedWarning}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConstructiveAlignmentForm;
