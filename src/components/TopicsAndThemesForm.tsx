import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info, Lightbulb, Plus, X, Sparkles } from 'lucide-react';

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

interface BoKSAContent {
  knowledge: string[];
  skills: string[];
  attitudes: string[];
}

interface TopicsAndThemesFormProps {
  data: {
    themes?: string[];
    boksaGenerated?: boolean;
    boksaContent?: BoKSAContent;
  };
  onChange: (data: TopicsAndThemesFormProps['data']) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  learningOutcomes?: LearningOutcome[];
}

type CognitiveDomain = 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
type EQFDimension = 'knowledge' | 'skills' | 'competence';

// Mapping from Bloom's taxonomy to EQF/BoKSA dimensions
const BLOOM_TO_BOKSA: Record<CognitiveDomain, EQFDimension> = {
  knowledge: 'knowledge',
  comprehension: 'knowledge',
  application: 'skills',
  analysis: 'competence',
  synthesis: 'competence',
  evaluation: 'competence',
};

const TopicsAndThemesForm: React.FC<TopicsAndThemesFormProps> = ({
  data,
  onChange,
  courseType,
  learningOutcomes = [],
}) => {
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  
  const [themes, setThemes] = useState<string[]>(data.themes || ['']);
  const [boksaGenerated, setBoksaGenerated] = useState(data.boksaGenerated || false);
  const [boksaContent, setBoksaContent] = useState<BoKSAContent>(
    data.boksaContent || { knowledge: [], skills: [], attitudes: [] }
  );

  useEffect(() => {
    setThemes(data.themes?.length ? data.themes : ['']);
  }, [data.themes]);

  useEffect(() => {
    setBoksaGenerated(data.boksaGenerated || false);
    setBoksaContent(data.boksaContent || { knowledge: [], skills: [], attitudes: [] });
  }, [data.boksaGenerated, data.boksaContent]);

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

  const COMPETENCE_TO_BOKSA: Record<CompetenceDimension, EQFDimension> = {
    knowledge: 'knowledge',
    skills: 'skills',
    responsibility_autonomy: 'competence',
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

  // Group learning outcomes by BoKSA dimension
  const groupedLearningOutcomes = useMemo(() => {
    const grouped: Record<EQFDimension, LearningOutcome[]> = {
      knowledge: [],
      skills: [],
      competence: [],
    };

    completeLearningOutcomes.forEach((outcome) => {
      if (outcome.approach === 'tuning') {
        const dims = outcome.competenceDimensions && outcome.competenceDimensions.length > 0
          ? outcome.competenceDimensions : null;
        if (dims) {
          dims.forEach(d => {
            const key = COMPETENCE_TO_BOKSA[d];
            if (key && grouped[key]) {
              grouped[key].push(outcome);
            }
          });
        } else {
          grouped['skills'].push(outcome);
        }
      } else if (outcome.cognitiveDomain) {
        const dimension = (outcome as any).eqfDimension || BLOOM_TO_BOKSA[outcome.cognitiveDomain as CognitiveDomain];
        if (dimension && grouped[dimension as EQFDimension]) {
          grouped[dimension as EQFDimension].push(outcome);
        }
      }
    });

    return grouped;
  }, [completeLearningOutcomes]);

  // Check if at least one theme is filled
  const hasAtLeastOneTheme = themes.some((t) => t.trim().length > 0);

  // Get non-empty themes
  const filledThemes = themes.filter((t) => t.trim().length > 0);

  const handleGenerateBoKSA = () => {
    setBoksaGenerated(true);
    onChange({ 
      ...data, 
      themes, 
      boksaGenerated: true,
      boksaContent: boksaContent 
    });
  };

  const addBoksaItem = (column: keyof BoKSAContent) => {
    const newContent = {
      ...boksaContent,
      [column]: [...boksaContent[column], '']
    };
    setBoksaContent(newContent);
    onChange({ ...data, boksaContent: newContent });
  };

  const updateBoksaItem = (column: keyof BoKSAContent, index: number, value: string) => {
    const newContent = {
      ...boksaContent,
      [column]: boksaContent[column].map((item, i) => i === index ? value : item)
    };
    setBoksaContent(newContent);
    onChange({ ...data, boksaContent: newContent });
  };

  const removeBoksaItem = (column: keyof BoKSAContent, index: number) => {
    const newContent = {
      ...boksaContent,
      [column]: boksaContent[column].filter((_, i) => i !== index)
    };
    setBoksaContent(newContent);
    onChange({ ...data, boksaContent: newContent });
  };

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

        {/* Generate BoKSA Button - shown when at least one theme is entered */}
        {hasAtLeastOneTheme && !boksaGenerated && (
          <div className="pt-4 border-t border-border">
            <Button
              type="button"
              onClick={handleGenerateBoKSA}
              className="w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate BoKSA
            </Button>
          </div>
        )}
      </Card>

      {/* BoKSA Section - shown after generation */}
      {boksaGenerated && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Body of Knowledge, Skills and Attitudes (BoKSA)
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setBoksaGenerated(false);
                onChange({ ...data, boksaGenerated: false });
              }}
            >
              Edit themes
            </Button>
          </div>

          {/* Row 1: Learning Outcomes grouped by dimension */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Learning outcomes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Knowledge */}
              <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
                <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  Knowledge
                </h5>
                {groupedLearningOutcomes.knowledge.length > 0 ? (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {groupedLearningOutcomes.knowledge.map((o) => (
                      <li key={o.id}>• {getOText(o)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No learning outcomes mapped to this dimension
                  </p>
                )}
              </Card>

              {/* Skills */}
              <Card className="p-4 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800">
                <h5 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                  Skills
                </h5>
                {groupedLearningOutcomes.skills.length > 0 ? (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {groupedLearningOutcomes.skills.map((o) => (
                      <li key={o.id}>• {getOText(o)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No learning outcomes mapped to this dimension
                  </p>
                )}
              </Card>

              {/* Competence */}
              <Card className="p-4 bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800">
                <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                  Competence
                </h5>
                {groupedLearningOutcomes.competence.length > 0 ? (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {groupedLearningOutcomes.competence.map((o) => (
                      <li key={o.id}>• {getOText(o)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No learning outcomes mapped to this dimension
                  </p>
                )}
              </Card>
            </div>
          </div>

          {/* Row 2: BoKSA Themes */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              BoKSA themes
            </h4>
            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2 italic">
                Derived from Topics and skills
              </p>
              {filledThemes.length > 0 ? (
                <ul className="text-sm text-foreground space-y-1">
                  {filledThemes.map((theme, index) => (
                    <li key={index}>• {theme}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No themes defined
                </p>
              )}
            </Card>
          </div>

          {/* Row 3: BoKSA Content (Editable) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                BoKSA content
              </h4>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-primary hover:text-primary/80">
                    <Info className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>What is BoKSA content?</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm space-y-3">
                    <p>
                      A BoKSA describes the underlying Body of Knowledge, Skills and Attitudes that must be in place for learners to achieve the learning outcomes.
                    </p>
                    <p>
                      Unlike learning outcomes, BoKSA elements are not assessed individually. They function as the academic and professional scaffolding that supports learning activities, assessment design and progression.
                    </p>
                    <p className="font-medium">
                      Think of BoKSA as answering the question:
                    </p>
                    <p className="italic text-muted-foreground">
                      "What does the learner need to know, be able to work with, and be disposed towards in order to achieve the learning outcomes?"
                    </p>
                    <p>
                      A BoKSA improves transparency, supports constructive alignment, and helps ensure that important foundations are not left implicit.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-semibold w-1/3">Knowledge</TableHead>
                    <TableHead className="font-semibold w-1/3">Skills</TableHead>
                    <TableHead className="font-semibold w-1/3">Attitudes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    {/* Knowledge Column */}
                    <TableCell className="align-top p-4">
                      <div className="space-y-2">
                        {boksaContent.knowledge.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => updateBoksaItem('knowledge', index, e.target.value)}
                              placeholder="e.g. terminology, concepts"
                              className="bg-background text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBoksaItem('knowledge', index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addBoksaItem('knowledge')}
                          className="text-primary hover:text-primary/80"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add item
                        </Button>
                      </div>
                    </TableCell>

                    {/* Skills Column */}
                    <TableCell className="align-top p-4 border-x">
                      <div className="space-y-2">
                        {boksaContent.skills.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => updateBoksaItem('skills', index, e.target.value)}
                              placeholder="e.g. methods, techniques"
                              className="bg-background text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBoksaItem('skills', index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addBoksaItem('skills')}
                          className="text-primary hover:text-primary/80"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add item
                        </Button>
                      </div>
                    </TableCell>

                    {/* Attitudes Column */}
                    <TableCell className="align-top p-4">
                      <div className="space-y-2">
                        {boksaContent.attitudes.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => updateBoksaItem('attitudes', index, e.target.value)}
                              placeholder="e.g. professional values"
                              className="bg-background text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBoksaItem('attitudes', index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addBoksaItem('attitudes')}
                          className="text-primary hover:text-primary/80"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add item
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground italic">
              BoKSA elements are not assessed individually. Add short, generic terms describing the underlying foundations needed to achieve the learning outcomes.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TopicsAndThemesForm;
