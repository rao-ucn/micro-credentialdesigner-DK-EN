import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Lightbulb, Plus, X } from 'lucide-react';
import OverallAimForm from './OverallAimForm';
import LearningOutcomesForm from './LearningOutcomesForm';

interface LearningOutcome {
  id: string;
  approach?: 'bloom' | 'tuning';
  cognitiveDomain?: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
  activeVerb?: string;
  outcomeText?: string;
  competenceFocus?: string;
  composedOutcome?: string;
  competenceDimensions?: ('knowledge' | 'skills' | 'responsibility_autonomy')[];
  contextOfApplication?: string;
  keyActions?: string;
  expectedResult?: string;
  successCriteria?: string;
  measurementMethod?: string;
}

interface InterdisciplinaryPerspectivesFormProps {
  data: {
    hasPerspectives?: 'yes' | 'none';
    perspectives?: string[];
    overallAim?: string;
    learningOutcomes?: LearningOutcome[];
    formulationApproach?: 'bloom' | 'tuning';
  };
  onChange: (data: {
    hasPerspectives?: 'yes' | 'none';
    perspectives?: string[];
    overallAim?: string;
    learningOutcomes?: LearningOutcome[];
    formulationApproach?: 'bloom' | 'tuning';
  }) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  onBreakCompositeIntegrity?: () => void;
  basedOnSingleSource?: boolean;
  onBreakSingleSourceIntegrity?: () => void;
  standaloneSources?: Array<{ workingTitle?: string; documentId?: string; fileName?: string; data?: Record<string, any> }>;
}

const InterdisciplinaryPerspectivesForm: React.FC<InterdisciplinaryPerspectivesFormProps> = ({
  data,
  onChange,
  courseType,
  onBreakCompositeIntegrity,
  basedOnSingleSource,
  onBreakSingleSourceIntegrity,
  standaloneSources,
}) => {
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';

  const [perspectives, setPerspectives] = useState<string[]>(
    data.perspectives && data.perspectives.length > 0 ? data.perspectives : ['']
  );

  useEffect(() => {
    if (data.perspectives && data.perspectives.length > 0) {
      setPerspectives(data.perspectives);
    }
  }, [data.perspectives]);

  const handleRadioChange = (value: 'yes' | 'none') => {
    onChange({
      ...data,
      hasPerspectives: value,
      perspectives: value === 'yes' ? perspectives.filter(p => p.trim() !== '') : [],
    });
  };

  const handlePerspectiveChange = (index: number, value: string) => {
    const updated = [...perspectives];
    updated[index] = value;
    setPerspectives(updated);
    onChange({
      ...data,
      hasPerspectives: data.hasPerspectives,
      perspectives: updated.filter(p => p.trim() !== ''),
    });
  };

  const addPerspective = () => {
    setPerspectives([...perspectives, '']);
  };

  const removePerspective = (index: number) => {
    if (perspectives.length > 1) {
      const shouldContinue = window.confirm('Are you sure you want to remove this perspective?');
      if (!shouldContinue) return;

      const updated = perspectives.filter((_, i) => i !== index);
      setPerspectives(updated);
      onChange({
        ...data,
        hasPerspectives: data.hasPerspectives,
        perspectives: updated.filter(p => p.trim() !== ''),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Theme introduction metatext */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Learning aims and objectives</h3>
        <p className="text-sm text-muted-foreground">
          Learning aims and objectives define the direction and purpose of the {courseLabel}. They clarify what the learner is expected to achieve and why these aims matter in relation to the identified labour-market need. This theme supports developers in formulating aims that are coherent, relevant and aligned with the expected learning outcomes. Each item in this theme guides the developer through a structured reflection process, ensuring that choices are transparent and grounded in documented needs.
        </p>
      </div>

      {/* First item - Interdisciplinary Perspectives */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              Are there any interdisciplinary or cross-sector perspectives that influence the design of this {courseLabel}?
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
                <div className="text-sm space-y-3">
                  <p>
                    This step encourages you to explore whether the competence need extends beyond a single discipline or sector. Interdisciplinary or cross-sector perspectives can influence how the relevance, scope or ambition of the {courseLabel} should be framed.
                  </p>
                  <p>
                    Considering these perspectives helps clarify whether learners operate in environments influenced by multiple fields or whether the competence has broader value across domains.
                  </p>
                  <p>
                    It is fully acceptable if your investigation finds no meaningful perspectives. Documenting either outcome supports transparency in the development process and strengthens the justification for the chosen aims.
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
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Review labour-market or sector reports to identify challenges shared across disciplines.</li>
                    <li>Consult practitioners in neighbouring fields to explore overlaps in tasks, tools or knowledge areas.</li>
                    <li>Examine job profiles in related sectors to identify possible intersections.</li>
                    <li>Consider whether technological developments, regulatory changes or collaborative practices influence the competence need across sectors.</li>
                    <li>If your investigation does not reveal relevant perspectives, select the option indicating that none appeared feasible at this time.</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            Identify whether interdisciplinary or cross-sector perspectives are relevant for this learning offer. If relevant perspectives exist, describe how they will be considered in the development of the {courseLabel}. If your investigation shows that no relevant perspectives exist, select the option indicating that none were currently feasible.
          </p>
        </div>

        {/* Radio options */}
        <RadioGroup
          value={data.hasPerspectives || ''}
          onValueChange={(value) => handleRadioChange(value as 'yes' | 'none')}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="yes" id="perspectives-yes" />
            <Label htmlFor="perspectives-yes" className="font-normal cursor-pointer">
              Yes – relevant perspectives have been identified
            </Label>
          </div>

          {/* Dynamic text list when "yes" is selected */}
          {data.hasPerspectives === 'yes' && (
            <div className="ml-7 space-y-3">
              {perspectives.map((perspective, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Textarea
                    value={perspective}
                    onChange={(e) => handlePerspectiveChange(index, e.target.value)}
                    placeholder="Enter a perspective, sector or role"
                    className="flex-1 min-h-[80px]"
                  />
                  {perspectives.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePerspective(index)}
                      className="h-9 w-9 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPerspective}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add another perspective
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <RadioGroupItem value="none" id="perspectives-none" />
            <Label htmlFor="perspectives-none" className="font-normal cursor-pointer">
              No relevant interdisciplinary or cross-sector perspectives identified at this stage
            </Label>
          </div>
        </RadioGroup>
      </Card>

      {/* Second item - Overall Aim */}
      <OverallAimForm
        data={{ overallAim: data.overallAim }}
        onChange={(aimData) => onChange({ ...data, ...aimData })}
        courseType={courseType}
      />

      {/* Third item - Define Learning Outcomes */}
      <LearningOutcomesForm
        data={{ learningOutcomes: data.learningOutcomes, formulationApproach: data.formulationApproach }}
        onChange={(outcomesData) => onChange({ ...data, ...outcomesData })}
        courseType={courseType}
        onBreakCompositeIntegrity={onBreakCompositeIntegrity}
        basedOnSingleSource={basedOnSingleSource}
        onBreakSingleSourceIntegrity={onBreakSingleSourceIntegrity}
        standaloneSources={standaloneSources}
      />
    </div>
  );
};

export default InterdisciplinaryPerspectivesForm;
