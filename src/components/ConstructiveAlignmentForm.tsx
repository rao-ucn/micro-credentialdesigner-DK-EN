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

const EQF_DIMENSION_LABELS: Record<EQFDimension, string> = {
  knowledge: 'Knowledge',
  skills: 'Skills',
  responsibility: 'Responsibility and autonomy',
};

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

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  'simulation': 'Simulation',
  'portfolio': 'Portfolio with oral defence',
  'case-based': 'Case-based assessment',
  'project-based': 'Project-based assessment',
  'practical-performance': 'Practical performance task',
  'presentation': 'Presentation',
  'observation-checklist': 'Observation checklist',
  'other': 'Other',
};

const ConstructiveAlignmentForm: React.FC<ConstructiveAlignmentFormProps> = ({
  data,
  onChange,
  courseType,
  learningOutcomes = [],
  topicsData,
  assessmentData,
}) => {
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  
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
            At this point, the core elements of the {courseLabel} have been defined. Learning outcomes describe what the learner must be able to demonstrate. These outcomes are supported by themes and topics, which structure the learning content. Finally, assessment defines how achievement of the learning outcomes is evaluated.
          </p>
          <p>
            This section brings these elements together. The purpose is to review whether learning outcomes, content and assessment are aligned in a coherent and logical way.
          </p>
        </div>
      </Card>

      {/* Part 1: Learning Outcomes Summary */}
      <Card className="p-6 space-y-4 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Learning outcomes defined</h3>
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
                    No learning outcomes mapped to this dimension.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">No learning outcomes defined</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Learning outcomes must be defined before constructive alignment can be verified. Please return to the learning outcomes section.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Narrative between Learning Outcomes and Topics */}
      <div className="text-sm text-muted-foreground px-2">
        <p>
          The learning outcomes define what the learner is expected to achieve. These outcomes should be addressed through the selected themes and topics. Review whether each learning outcome is meaningfully supported by the content areas listed below.
        </p>
      </div>

      {/* Part 2: Topics and Themes Summary */}
      <Card className="p-6 space-y-4 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-foreground">Topics and themes supporting the learning outcomes</h3>
        
        {hasThemes ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              These themes represent the learning content boundaries for the {courseLabel}.
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
            No topics or themes have been defined yet.
          </p>
        )}
      </Card>

      {/* Part 3: Assessment Approach Summary (only for micro-credentials) */}
      {courseType === 'micro-credential' && (
        <Card className="p-6 space-y-4 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-foreground">Assessment approach defined so far</h3>
          
          {hasAssessmentData ? (
            <div className="space-y-3">
              {assessmentData?.assessmentType && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Overall assessment type:</span>
                  <Badge variant="secondary">
                    {ASSESSMENT_TYPE_LABELS[assessmentData.assessmentType] || assessmentData.assessmentType}
                  </Badge>
                </div>
              )}
              
              {assessmentData?.individualOrGroup && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Assessment format:</span>
                  <Badge variant="secondary">
                    {INDIVIDUAL_GROUP_LABELS[assessmentData.individualOrGroup] || assessmentData.individualOrGroup}
                  </Badge>
                </div>
              )}
              
              {assessmentData?.deliveryMode && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Delivery mode:</span>
                  <Badge variant="secondary">
                    {DELIVERY_MODE_LABELS[assessmentData.deliveryMode] || assessmentData.deliveryMode}
                  </Badge>
                </div>
              )}
              
              {assessmentData?.activityTypes && assessmentData.activityTypes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Assessment activity types:</span>
                  <div className="flex flex-wrap gap-2">
                    {assessmentData.activityTypes.map((type) => (
                      <Badge key={type} variant="outline">
                        {ACTIVITY_TYPE_LABELS[type] || type}
                      </Badge>
                    ))}
                  </div>
                  {assessmentData.otherActivityType && (
                    <p className="text-sm text-muted-foreground">Other: {assessmentData.otherActivityType}</p>
                  )}
                </div>
              )}
              
              {assessmentData?.activityDescription && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-foreground">Activity description:</span>
                  <p className="text-sm text-muted-foreground">{assessmentData.activityDescription}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No assessment approach has been defined yet. Return to the Define assessment section to complete this.
            </p>
          )}
        </Card>
      )}

      {/* Part 5: Constructive Alignment Check */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Constructive alignment check</h3>
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
                  Constructive alignment reduces the risk of designing learning activities or assessments that do not support the intended learning outcomes. This checkpoint helps ensure that later design decisions build on a coherent foundation.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <p className="text-sm text-muted-foreground">
          When reviewing the elements above, consider whether constructive alignment has been achieved. Constructive alignment is present when learning outcomes, learning content and assessment mutually support each other.
        </p>

        <div className="space-y-3">
          <Label className="text-base font-medium">
            Based on the overview above, is constructive alignment ensured between learning outcomes, themes and topics, and assessment?
          </Label>
          
          <RadioGroup
            value={formData.alignmentConfirmed}
            onValueChange={(value) => updateField('alignmentConfirmed', value)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="aligned" id="aligned" className="mt-0.5" />
              <Label htmlFor="aligned" className="text-sm font-normal cursor-pointer flex-1">
                Yes, alignment is ensured
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="misaligned" id="misaligned" className="mt-0.5" />
              <Label htmlFor="misaligned" className="text-sm font-normal cursor-pointer flex-1">
                No, potential misalignment has been identified
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.alignmentConfirmed === 'misaligned' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              If misalignment is identified, return to the relevant section to revise content or assessment. This section is for checking alignment, not for editing.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConstructiveAlignmentForm;
