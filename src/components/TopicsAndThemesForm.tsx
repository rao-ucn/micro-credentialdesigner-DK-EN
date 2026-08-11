import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Info, Lightbulb, Plus, X } from 'lucide-react';

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
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  
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
            Which major topics or themes must be included to enable learners to achieve the learning outcomes?
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Why is this important?</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <p>
                  Major topics or themes must be strictly aligned with the learning outcomes to ensure that the content of the {courseLabel} remains focused and necessary.
                </p>
                <p>
                  This step prevents irrelevant or excessive content and guarantees that everything the learner engages with directly supports achieving the intended outcomes.
                </p>
                <p>
                  Each theme must therefore be clearly linked to at least one learning outcome.
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
                <DialogTitle>Inspiration</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Understanding the difference between themes and learning outcomes</h4>
                  <p className="text-muted-foreground mb-3">
                    Themes and learning outcomes are not the same. They serve different functions in the design process.
                  </p>
                  
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium border-r">Themes</th>
                          <th className="text-left p-3 font-medium">Learning outcomes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3 border-r">Describe content areas</td>
                          <td className="p-3">Describe what the learner must be able to do</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 border-r">Are not actions</td>
                          <td className="p-3">Are observable and assessable actions</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 border-r">Are not measurable</td>
                          <td className="p-3">Must be measurable</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 border-r">Provide structure for content</td>
                          <td className="p-3">Provide the basis for assessment</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 border-r">Are derived from learning outcomes</td>
                          <td className="p-3">Determine what content is needed</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 text-muted-foreground mb-4">
                    <p><strong>Themes</strong> are the input for learning.<br /><strong>Learning outcomes</strong> are the output of learning.</p>
                    <p><strong>Themes</strong> identify what learners must work with.<br /><strong>Learning outcomes</strong> state what learners must be able to do as a result.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">How to develop themes</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Review each learning outcome and identify the types of knowledge, skills or reasoning it requires.</li>
                    <li>Group related requirements into broader themes.</li>
                    <li>Remove anything not essential for at least one learning outcome.</li>
                    <li>Aim for 3-7 themes that cover everything without overlap.</li>
                    <li>Consider whether themes naturally sequence from foundational to advanced.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Examples of themes (generic)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Fundamental concepts and terminology</li>
                    <li>Key processes or workflows</li>
                    <li>Methods and tools</li>
                    <li>Ethical or professional considerations</li>
                    <li>Applied techniques linked to the learning outcomes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Examples if the {courseLabel} were about the Sustainable Development Goals</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Introduction to the SDGs</li>
                    <li>Understanding global challenges and interconnections</li>
                    <li>SDG indicators and evidence-based problem analysis</li>
                    <li>Stakeholder roles and governance</li>
                    <li>Methods for sustainable action and intervention design</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Learning Outcomes Reference Box */}
        {completeLearningOutcomes.length > 0 && (
          <Card className="p-4 space-y-3 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
            <h4 className="text-sm font-semibold text-foreground">Learning outcomes for reference</h4>
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
                placeholder="Add one theme per line. Themes must be clearly defined and directly linked to the learning outcomes."
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
            Add another theme
          </Button>
        </div>

        {/* Quality reminder */}
        <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
          Each theme must be necessary and sufficient to support at least one learning outcome. Remove anything that is not essential.
        </p>
      </Card>
    </div>
  );
};

export default TopicsAndThemesForm;
