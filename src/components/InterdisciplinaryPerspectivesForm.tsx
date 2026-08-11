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
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

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
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : lt.courseLabelMicroCredential;

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
      const shouldContinue = window.confirm(lt.ipRemoveConfirm);
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
        <h3 className="text-lg font-semibold">{lt.ipTitle}</h3>
        <p className="text-sm text-muted-foreground">
          {lt.ipIntro.replace(/{course}/g, courseLabel)}
        </p>
      </div>

      {/* First item - Interdisciplinary Perspectives */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              {lt.ipQLabel.replace(/{course}/g, courseLabel)}
            </Label>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:text-primary/80">
                  <Info className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{lt.ipWhy}</DialogTitle>
                </DialogHeader>
                <div className="text-sm space-y-3">
                  <p>
                    {lt.ipWhyText1.replace(/{course}/g, courseLabel)}
                  </p>
                  <p>
                    {lt.ipWhyText2}
                  </p>
                  <p>
                    {lt.ipWhyText3}
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
                  <DialogTitle>{lt.ipInspiration}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>{lt.ipInspireItem1}</li>
                    <li>{lt.ipInspireItem2}</li>
                    <li>{lt.ipInspireItem3}</li>
                    <li>{lt.ipInspireItem4}</li>
                    <li>{lt.ipInspireItem5}</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            {lt.ipHelp.replace(/{course}/g, courseLabel)}
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
              {lt.ipYesLabel}
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
                    placeholder={lt.ipPerspectivePlaceholder}
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
                {lt.ipAddPerspective}
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <RadioGroupItem value="none" id="perspectives-none" />
            <Label htmlFor="perspectives-none" className="font-normal cursor-pointer">
              {lt.ipNoneLabel}
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
