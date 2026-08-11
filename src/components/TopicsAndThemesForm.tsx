import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Info, Lightbulb, Plus, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

type CompetenceDimension = 'knowledge' | 'skills' | 'responsibility_autonomy';

interface LearningOutcome {
  id: string;
  approach?: 'bloom' | 'tuning';
  cognitiveDomain?: string;
  activeVerb?: string;
  outcomeText?: string;
  competenceFocus?: string;
  composedOutcome?: string;
  competenceDimensions?: CompetenceDimension[];
  contextOfApplication?: string;
  keyActions?: string;
  expectedResult?: string;
}


interface TopicsAndThemesFormProps {
  data: {
    themes?: string[];
  };
  onChange: (data: TopicsAndThemesFormProps['data']) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  learningOutcomes?: LearningOutcome[];
}


const TopicsAndThemesForm: React.FC<TopicsAndThemesFormProps> = ({
  data,
  onChange,
  courseType,
  learningOutcomes = [],
}) => {
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : lt.courseLabelMicroCredential;
  
  const [themes, setThemes] = useState<string[]>(data.themes || ['']);

  useEffect(() => {
    setThemes(data.themes?.length ? data.themes : ['']);
  }, [data.themes]);


  const updateThemes = (newThemes: string[]) => {
    setThemes(newThemes);
    onChange({ ...data, themes: newThemes });
  };

  const handleThemeChange = (index: number, value: string) => {
    const newThemes = [...themes];
    newThemes[index] = value;
    updateThemes(newThemes);
  };

  const addTheme = () => {
    updateThemes([...themes, '']);
  };

  const removeTheme = (index: number) => {
    if (themes.length > 1) {
      const newThemes = themes.filter((_, i) => i !== index);
      updateThemes(newThemes);
    }
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

  const isComplete = (o: LearningOutcome): boolean => {
    if (o.approach === 'tuning') return !!(o.composedOutcome?.trim() || o.competenceFocus?.trim());
    return !!(o.outcomeText?.trim());
  };

  // Get complete learning outcomes for display
  const completeLearningOutcomes = learningOutcomes.filter(isComplete);

  return (
    <div className="space-y-6">

      {/* Main Question Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            {lt.ttQLabel}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.ttWhyTitle}</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <p>
                  {lt.ttWhyText1.replace(/{course}/g, courseLabel)}
                </p>
                <p>
                  {lt.ttWhyText2}
                </p>
                <p>
                  {lt.ttWhyText3}
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
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{lt.ttInspiration}</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{lt.ttDiffTitle}</h4>
                  <p className="text-muted-foreground mb-3">
                    {lt.ttDiffIntro}
                  </p>
                  
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium border-r">{lt.ttTableThemes}</th>
                          <th className="text-left p-3 font-medium">{lt.ttTableOutcomes}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3 border-r">{lt.ttRow1Themes}</td>
                          <td className="p-3">{lt.ttRow1Outcomes}</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 border-r">{lt.ttRow2Themes}</td>
                          <td className="p-3">{lt.ttRow2Outcomes}</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 border-r">{lt.ttRow3Themes}</td>
                          <td className="p-3">{lt.ttRow3Outcomes}</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 border-r">{lt.ttRow4Themes}</td>
                          <td className="p-3">{lt.ttRow4Outcomes}</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 border-r">{lt.ttRow5Themes}</td>
                          <td className="p-3">{lt.ttRow5Outcomes}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 text-muted-foreground mb-4">
                    <p>{lt.ttDiffSummary1}<br />{lt.ttDiffSummary1b}</p>
                    <p>{lt.ttDiffSummary2}<br />{lt.ttDiffSummary2b}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{lt.ttHowTitle}</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>{lt.ttHowItem1}</li>
                    <li>{lt.ttHowItem2}</li>
                    <li>{lt.ttHowItem3}</li>
                    <li>{lt.ttHowItem4}</li>
                    <li>{lt.ttHowItem5}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{lt.ttExamplesTitle}</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>{lt.ttExampleItem1}</li>
                    <li>{lt.ttExampleItem2}</li>
                    <li>{lt.ttExampleItem3}</li>
                    <li>{lt.ttExampleItem4}</li>
                    <li>{lt.ttExampleItem5}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{lt.ttSdgTitle.replace(/{course}/g, courseLabel)}</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>{lt.ttSdgItem1}</li>
                    <li>{lt.ttSdgItem2}</li>
                    <li>{lt.ttSdgItem3}</li>
                    <li>{lt.ttSdgItem4}</li>
                    <li>{lt.ttSdgItem5}</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Learning Outcomes Reference Box */}
        {completeLearningOutcomes.length > 0 && (
          <Card className="p-4 space-y-3 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
            <h4 className="text-sm font-semibold text-foreground">{lt.ttReferenceTitle}</h4>
            <ul className="space-y-2">
              {completeLearningOutcomes.map((outcome, index) => (
                <li key={outcome.id} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{index + 1}.</span>
                  <span>{getOText(outcome)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Themes Input */}
        <div className="space-y-3">
          {themes.map((theme, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={theme}
                onChange={(e) => handleThemeChange(index, e.target.value)}
                placeholder={lt.ttThemePlaceholder}
                className="bg-background flex-1"
              />
              {themes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTheme(index)}
                  className="text-muted-foreground hover:text-destructive"
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
            onClick={addTheme}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            {lt.ttAddTheme}
          </Button>
        </div>

        {/* Quality reminder */}
        <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
          {lt.ttReminder}
        </p>
      </Card>
    </div>
  );
};

export default TopicsAndThemesForm;
