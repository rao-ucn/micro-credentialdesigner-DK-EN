import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info, Lightbulb, Lock, Plus, Trash2, CheckCircle, HelpCircle, Wand2, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Popover as ReadMorePopover,
  PopoverContent as ReadMorePopoverContent,
  PopoverTrigger as ReadMorePopoverTrigger,
} from '@/components/ui/popover';

// Bloom's taxonomy data for the info modal
const BLOOM_TAXONOMY_DATA = [
  {
    domain: 'Knowledge',
    definition: 'Remember previously learned information',
    verbs: 'Arrange, Define, Describe, Duplicate, Identify, Label, List, Match, Memorize, Name, Order, Outline, Recognize, Relate, Recall, Repeat, Reproduce, Select, State'
  },
  {
    domain: 'Comprehension',
    definition: 'Demonstrate an understanding of the facts',
    verbs: 'Classify, Convert, Defend, Describe, Discuss, Distinguish, Estimate, Explain, Express, Extend, Generalize, Give examples, Identify, Indicate, Infer, Locate, Paraphrase, Predict, Recognize, Rewrite, Review, Select, Summarize, Translate'
  },
  {
    domain: 'Application',
    definition: 'Apply knowledge to actual situations',
    verbs: 'Apply, Change, Choose, Compute, Demonstrate, Discover, Dramatize, Employ, Illustrate, Interpret, Manipulate, Modify, Operate, Practice, Predict, Prepare, Produce, Relate, Schedule, Show, Sketch, Solve, Use, Write'
  },
  {
    domain: 'Analysis',
    definition: 'Break down objects or ideas into simpler parts and find evidence to support generalizations',
    verbs: 'Analyze, Appraise, Break down, Calculate, Categorize, Compare, Contrast, Criticize, Diagram, Differentiate, Discriminate, Distinguish, Examine, Experiment, Identify, Illustrate, Infer, Model, Outline, Question, Relate, Select, Separate, Subdivide, Test'
  },
  {
    domain: 'Synthesis',
    definition: 'Compile component ideas into a new whole or propose alternative solutions',
    verbs: 'Arrange, Assemble, Categorize, Collect, Combine, Comply, Compose, Construct, Create, Design, Develop, Devise, Explain, Formulate, Generate, Plan, Prepare, Rearrange, Reconstruct, Relate, Reorganize, Revise, Rewrite, Set up, Summarize, Synthesize, Tell, Write'
  },
  {
    domain: 'Evaluation',
    definition: 'Make and defend judgments based on internal evidence or external criteria',
    verbs: 'Appraise, Argue, Assess, Attach, Choose, Compare, Conclude, Contrast, Defend, Describe, Discriminate, Estimate, Evaluate, Explain, Judge, Justify, Interpret, Relate, Predict, Rate, Select, Summarize, Support, Value'
  }
];

type FormulationApproach = 'bloom' | 'tuning';
type CognitiveDomain = 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
type EQFDimension = 'knowledge' | 'skills' | 'responsibility';
type CompetenceDimension = 'knowledge' | 'skills' | 'responsibility_autonomy';

interface LearningOutcome {
  id: string;
  approach?: FormulationApproach;
  // Bloom fields
  cognitiveDomain?: CognitiveDomain;
  activeVerb?: string;
  outcomeText?: string;
  eqfDimension?: EQFDimension; // User-confirmed EQF dimension for Bloom outcomes
  // Tuning fields
  competenceFocus?: string;
  contextOfApplication?: string;
  keyActions?: string;
  expectedResult?: string;
  composedOutcome?: string;
  competenceDimensions?: CompetenceDimension[];
  // Common
  successCriteria?: string;
  measurementMethod?: string;
  // Composite provenance (locked outcomes inherited from standalone sources)
  _sourceTitles?: string[];
}

interface LearningOutcomesFormProps {
  data: {
    learningOutcomes?: LearningOutcome[];
    formulationApproach?: FormulationApproach;
  };
  onChange: (data: { learningOutcomes: LearningOutcome[]; formulationApproach?: FormulationApproach }) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  onBreakCompositeIntegrity?: () => void;
  basedOnSingleSource?: boolean;
  onBreakSingleSourceIntegrity?: () => void;
  standaloneSources?: Array<{ workingTitle?: string; documentId?: string; fileName?: string; data?: Record<string, any> }>;
}

const COGNITIVE_DOMAINS: { value: CognitiveDomain; label: string }[] = [
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'comprehension', label: 'Comprehension' },
  { value: 'application', label: 'Application' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'synthesis', label: 'Synthesis' },
  { value: 'evaluation', label: 'Evaluation' },
];

const VERBS_BY_DOMAIN: Record<CognitiveDomain, string[]> = {
  knowledge: [
    'Arrange', 'Define', 'Describe', 'Duplicate', 'Identify', 'Label', 'List', 'Match',
    'Memorize', 'Name', 'Order', 'Outline', 'Recognize', 'Relate', 'Recall', 'Repeat',
    'Reproduce', 'Select', 'State'
  ],
  comprehension: [
    'Classify', 'Convert', 'Defend', 'Describe', 'Discuss', 'Distinguish', 'Estimate',
    'Explain', 'Express', 'Extend', 'Generalize', 'Give examples', 'Identify', 'Indicate',
    'Infer', 'Locate', 'Paraphrase', 'Predict', 'Recognize', 'Rewrite', 'Review', 'Select',
    'Summarize', 'Translate'
  ],
  application: [
    'Apply', 'Change', 'Choose', 'Compute', 'Demonstrate', 'Discover', 'Dramatize',
    'Employ', 'Illustrate', 'Interpret', 'Manipulate', 'Modify', 'Operate', 'Practice',
    'Predict', 'Prepare', 'Produce', 'Relate', 'Schedule', 'Show', 'Sketch', 'Solve',
    'Use', 'Write'
  ],
  analysis: [
    'Analyze', 'Appraise', 'Breakdown', 'Calculate', 'Categorize', 'Compare', 'Contrast',
    'Criticize', 'Diagram', 'Differentiate', 'Discriminate', 'Distinguish', 'Examine',
    'Experiment', 'Identify', 'Illustrate', 'Infer', 'Model', 'Outline', 'Point out',
    'Question', 'Relate', 'Select', 'Separate', 'Subdivide', 'Test'
  ],
  synthesis: [
    'Arrange', 'Assemble', 'Categorize', 'Collect', 'Combine', 'Comply', 'Compose',
    'Construct', 'Create', 'Design', 'Develop', 'Devise', 'Explain', 'Formulate',
    'Generate', 'Plan', 'Prepare', 'Rearrange', 'Reconstruct', 'Relate', 'Reorganize',
    'Revise', 'Rewrite', 'Set up', 'Summarize', 'Synthesize', 'Tell', 'Write'
  ],
  evaluation: [
    'Appraise', 'Argue', 'Assess', 'Attach', 'Choose', 'Compare', 'Conclude', 'Contrast',
    'Defend', 'Describe', 'Discriminate', 'Estimate', 'Evaluate', 'Explain', 'Judge',
    'Justify', 'Interpret', 'Relate', 'Predict', 'Rate', 'Select', 'Summarize', 'Support',
    'Value'
  ],
};

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

const COMPETENCE_DIMENSIONS: { value: CompetenceDimension; label: string }[] = [
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'skills', label: 'Skills' },
  { value: 'responsibility_autonomy', label: 'Responsibility and autonomy' },
];

const COMPETENCE_TO_EQF: Record<CompetenceDimension, EQFDimension> = {
  knowledge: 'knowledge',
  skills: 'skills',
  responsibility_autonomy: 'responsibility',
};

// Detect Bloom verbs in free text for Tuning outcomes
const ALL_BLOOM_VERBS = Object.values(VERBS_BY_DOMAIN).flat();

const detectBloomVerbs = (text: string): { verb: string; domain: CognitiveDomain }[] => {
  const found: { verb: string; domain: CognitiveDomain }[] = [];
  const lowerText = text.toLowerCase();
  for (const [domain, verbs] of Object.entries(VERBS_BY_DOMAIN)) {
    for (const verb of verbs) {
      if (lowerText.includes(verb.toLowerCase())) {
        found.push({ verb, domain: domain as CognitiveDomain });
      }
    }
  }
  return found;
};

const inferEQFDimension = (text: string): EQFDimension => {
  const detected = detectBloomVerbs(text);
  if (detected.length === 0) return 'skills'; // default
  // Use highest-level domain found
  const domainOrder: CognitiveDomain[] = ['evaluation', 'synthesis', 'analysis', 'application', 'comprehension', 'knowledge'];
  for (const d of domainOrder) {
    if (detected.some(v => v.domain === d)) return BLOOM_TO_EQF[d];
  }
  return 'skills';
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const isOutcomeComplete = (outcome: LearningOutcome): boolean => {
  if (outcome.approach === 'tuning') {
    if (outcome.composedOutcome && outcome.composedOutcome.trim().length > 0) return true;
    // Also consider complete if competence focus is filled (draft can be generated)
    return !!(outcome.competenceFocus && outcome.competenceFocus.trim().length > 0);
  }
  return !!(
    outcome.cognitiveDomain &&
    outcome.activeVerb &&
    outcome.outcomeText &&
    outcome.outcomeText.trim().length > 0
  );
};

const getOutcomeText = (outcome: LearningOutcome): string => {
  if (outcome.approach === 'tuning') {
    if (outcome.composedOutcome) return outcome.composedOutcome;
    // Fall back to composing from fields
    const parts: string[] = [];
    if (outcome.competenceFocus) {
      let s = `The learner can ${outcome.competenceFocus}`;
      if (outcome.contextOfApplication) s += ` ${outcome.contextOfApplication}`;
      parts.push(s);
    }
    if (outcome.keyActions) parts.push(outcome.keyActions);
    if (outcome.expectedResult) parts.push(`in order to ${outcome.expectedResult}`);
    return parts.length > 0 ? parts.join(', ') + '.' : '';
  }
  return outcome.outcomeText || '';
};

const LearningOutcomesForm: React.FC<LearningOutcomesFormProps> = ({
  data,
  onChange,
  courseType,
  onBreakCompositeIntegrity,
  basedOnSingleSource,
  onBreakSingleSourceIntegrity,
  standaloneSources,
}) => {
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  
  const [approach, setApproach] = useState<FormulationApproach | undefined>(
    data.formulationApproach
  );
  
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>(
    data.learningOutcomes && data.learningOutcomes.length > 0 
      ? data.learningOutcomes 
      : [{ id: generateId() }]
  );
  
  const [showEQFSummary, setShowEQFSummary] = useState(false);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [removalDialogStep, setRemovalDialogStep] = useState<'warning' | 'confirm' | null>(null);

  const integrityGuardActive = courseType === 'composite-micro-credential' || basedOnSingleSource === true;

  useEffect(() => {
    if (data.learningOutcomes && data.learningOutcomes.length > 0) {
      setOutcomes(data.learningOutcomes);
    }
  }, [data.learningOutcomes]);

  useEffect(() => {
    if (data.formulationApproach) {
      setApproach(data.formulationApproach);
    }
  }, [data.formulationApproach]);

  const hasAtLeastOneCompleteOutcome = useMemo(() => {
    return outcomes.some(isOutcomeComplete);
  }, [outcomes]);

  const eqfGroupedOutcomes = useMemo(() => {
    const completeOutcomes = outcomes.filter(isOutcomeComplete);
    
    const grouped: Record<EQFDimension, { text: string }[]> = {
      knowledge: [],
      skills: [],
      responsibility: [],
    };
    
    completeOutcomes.forEach((outcome) => {
      const text = getOutcomeText(outcome);
      if (outcome.approach === 'tuning') {
        const dims = outcome.competenceDimensions && outcome.competenceDimensions.length > 0
          ? outcome.competenceDimensions
          : null;
        if (dims) {
          dims.forEach(d => {
            grouped[COMPETENCE_TO_EQF[d]].push({ text });
          });
        } else {
          const dim = inferEQFDimension(text);
          grouped[dim].push({ text });
        }
      } else if (outcome.cognitiveDomain) {
        const eqfDimension = outcome.eqfDimension || BLOOM_TO_EQF[outcome.cognitiveDomain];
        grouped[eqfDimension].push({ text });
      }
    });
    
    return grouped;
  }, [outcomes]);

  const handleApproachChange = (value: FormulationApproach) => {
    setApproach(value);
    // Reset outcomes with the new approach
    const newOutcomes = [{ id: generateId(), approach: value }];
    setOutcomes(newOutcomes);
    onChange({ learningOutcomes: newOutcomes, formulationApproach: value });
  };

  const updateOutcome = (id: string, updates: Partial<LearningOutcome>) => {
    const updated = outcomes.map(outcome => 
      outcome.id === id ? { ...outcome, ...updates } : outcome
    );
    setOutcomes(updated);
    onChange({ learningOutcomes: updated, formulationApproach: approach });
  };

  const addOutcome = () => {
    const newOutcome: LearningOutcome = { id: generateId(), approach };
    const updated = [...outcomes, newOutcome];
    setOutcomes(updated);
    onChange({ learningOutcomes: updated, formulationApproach: approach });
  };

  const removeOutcome = (id: string) => {
    if (outcomes.length > 1) {
      if (integrityGuardActive) {
        setPendingRemovalId(id);
        setRemovalDialogStep('warning');
        return;
      }

      const updated = outcomes.filter(o => o.id !== id);
      setOutcomes(updated);
      onChange({ learningOutcomes: updated, formulationApproach: approach });
    }
  };

  const confirmRemoveOutcome = () => {
    if (!pendingRemovalId) return;

    const updated = outcomes.filter((o) => o.id !== pendingRemovalId);
    setOutcomes(updated);
    onChange({ learningOutcomes: updated, formulationApproach: approach });
    if (courseType === 'composite-micro-credential') {
      onBreakCompositeIntegrity?.();
    } else if (basedOnSingleSource) {
      onBreakSingleSourceIntegrity?.();
    }
    setPendingRemovalId(null);
    setRemovalDialogStep(null);
  };

  const getOutcomePrefix = (verb?: string) => {
    if (!verb) return 'The learner must...';
    return `The learner must ${verb.toLowerCase()}`;
  };

  const composeTuningOutcome = (outcome: LearningOutcome): string => {
    if (!outcome.competenceFocus) return '';
    const parts: string[] = [`The learner can ${outcome.competenceFocus}`];
    if (outcome.contextOfApplication) parts[0] += ` ${outcome.contextOfApplication}`;
    if (outcome.keyActions) parts.push(outcome.keyActions);
    if (outcome.expectedResult) parts.push(`in order to ${outcome.expectedResult}`);
    return parts.join(', ') + '.';
  };

  // ──────────── Approach Selector ────────────
  const renderApproachSelector = () => (
    <Card className="p-6 space-y-5 border-primary/30 bg-primary/[0.02]">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Defining Learning Outcomes</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Learning outcomes express what the learner must be able to do by the end of the {courseLabel}. Before you begin formulating outcomes, select the approach that best fits the nature of your learning offer.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">
          Which approach will you use to formulate the learning outcomes?
        </Label>

        <RadioGroup
          value={approach || ''}
          onValueChange={(v) => handleApproachChange(v as FormulationApproach)}
          className="space-y-4"
        >
          {/* Bloom option */}
          <label
            htmlFor="approach-bloom"
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              approach === 'bloom'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <RadioGroupItem value="bloom" id="approach-bloom" className="mt-0.5" />
            <div className="space-y-1">
              <span className="font-medium text-foreground">Structured learning outcomes (Bloom approach)</span>
              <p className="text-sm text-muted-foreground">
                Recommended when learning outcomes can be expressed as discrete and measurable actions. This approach guides you through selecting a cognitive domain and an active verb from Bloom's taxonomy, then formulating each outcome as a single observable action. You can change the suggested active verbs if they do not match your intended learning outcome.
              </p>
            </div>
          </label>

          {/* Tuning option */}
          <label
            htmlFor="approach-tuning"
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              approach === 'tuning'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <RadioGroupItem value="tuning" id="approach-tuning" className="mt-0.5" />
            <div className="space-y-1">
              <span className="font-medium text-foreground">Competence-based learning outcomes (Tuning approach)</span>
              <p className="text-sm text-muted-foreground">
                Recommended when learning outcomes describe complex competences integrating several cognitive processes. This approach guides you through describing the competence focus, context, key actions and expected result, which are then combined into a single coherent statement.
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">How are the two approaches related?</p>
        <p>
          Bloom's taxonomy functions as an analytical reference in both approaches. In the structured approach, you select a single domain and verb explicitly. In the competence-based approach, the system may still detect Bloom verbs automatically to support EQF mapping. Regardless of the chosen approach, all outcomes must remain assessable and measurable.
        </p>
      </div>
    </Card>
  );

  // ──────────── Bloom Outcome Card ────────────
  const renderBloomOutcome = (outcome: LearningOutcome, index: number) => (
    <div key={outcome.id} className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Learning outcome {index + 1}
        </span>
        {outcomes.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeOutcome(outcome.id)}
            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {/* Cognitive Domain Dropdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Select cognitive domain</Label>
          <Dialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <button className="text-primary hover:text-primary/80">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Bloom's taxonomy definitions and action verbs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Bloom's taxonomy and action verbs</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Bloom's taxonomy helps you construct learning outcomes that are observable, measurable and aligned with the intended level of cognitive complexity.
                </p>
                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px] font-semibold">Domain</TableHead>
                        <TableHead className="w-[200px] font-semibold">Definition</TableHead>
                        <TableHead className="font-semibold">Verbs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {BLOOM_TAXONOMY_DATA.map((item) => (
                        <TableRow key={item.domain}>
                          <TableCell className="font-medium align-top">{item.domain}</TableCell>
                          <TableCell className="text-sm align-top">{item.definition}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.verbs}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Select
          value={outcome.cognitiveDomain || ''}
          onValueChange={(value) => {
            const domain = value as CognitiveDomain;
            updateOutcome(outcome.id, {
              cognitiveDomain: domain,
              activeVerb: undefined,
              eqfDimension: BLOOM_TO_EQF[domain],
            });
          }}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select a cognitive domain" />
          </SelectTrigger>
          <SelectContent>
            {COGNITIVE_DOMAINS.map((domain) => (
              <SelectItem key={domain.value} value={domain.value}>
                {domain.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Verb Dropdown */}
      {outcome.cognitiveDomain && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select active verb</Label>
          <Select
            value={outcome.activeVerb || ''}
            onValueChange={(value) => updateOutcome(outcome.id, { activeVerb: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select an active verb" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="__define_own__" className="font-bold">
                DEFINE OWN
              </SelectItem>
              {VERBS_BY_DOMAIN[outcome.cognitiveDomain].map((verb) => (
                <SelectItem key={verb} value={verb}>
                  {verb}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Outcome Text */}
      {outcome.activeVerb && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Formulate the learning outcome the learner will be measured against</Label>
          {outcome.activeVerb !== '__define_own__' && (
            <p className="text-xs text-muted-foreground mb-2">
              (You can use the starter sentence below if you like, but remember to keep the selected active verb)
            </p>
          )}
          <Textarea
            value={outcome.outcomeText || (outcome.activeVerb === '__define_own__' ? 'The learner must ' : getOutcomePrefix(outcome.activeVerb))}
            onChange={(e) => updateOutcome(outcome.id, { outcomeText: e.target.value })}
            placeholder={outcome.activeVerb === '__define_own__' ? 'The learner must ' : getOutcomePrefix(outcome.activeVerb)}
            className="min-h-[80px] bg-background"
          />
        </div>
      )}

      {/* EQF Competence Dimension Selector */}
      {outcome.cognitiveDomain && outcome.activeVerb && (
        <div className="space-y-2 border-t border-border pt-4">
          <Label className="text-sm font-medium">Suggested competence dimension</Label>
          <p className="text-xs text-muted-foreground">
            The suggested dimension is based on the selected Bloom domain and verb. As there is no one-to-one mapping between Bloom's taxonomy and EQF, you should select the best fit based on the intended learning outcome.
          </p>
          <RadioGroup
            value={outcome.eqfDimension || (outcome.cognitiveDomain ? BLOOM_TO_EQF[outcome.cognitiveDomain] : '')}
            onValueChange={(value) => updateOutcome(outcome.id, { eqfDimension: value as EQFDimension })}
            className="flex flex-row flex-wrap gap-2 mt-1"
          >
            {(['knowledge', 'skills', 'responsibility'] as EQFDimension[]).map((dim) => {
              const isSuggested = outcome.cognitiveDomain && BLOOM_TO_EQF[outcome.cognitiveDomain] === dim;
              return (
                <label
                  key={dim}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors text-sm ${
                    isSuggested
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <RadioGroupItem value={dim} />
                  <span>{EQF_DIMENSION_LABELS[dim]}</span>
                  {isSuggested && (
                    <span className="text-xs text-primary ml-1">suggested</span>
                  )}
                </label>
              );
            })}
          </RadioGroup>
        </div>
      )}
    </div>
  );

  // ──────────── Tuning Field Help Dialogs ────────────
  const renderFieldHelp = (field: 'competenceFocus' | 'context' | 'keyActions' | 'expectedResult') => {
    const content = {
      competenceFocus: {
        title: 'How to define the competence focus',
        body: (
          <div className="space-y-3">
            <p>Describe the central capability the learner should demonstrate. Focus on what the learner will be able to do in practice.</p>
            <p>Use clear and observable action verbs to make the outcome assessable. You may draw inspiration from Bloom's taxonomy, but you are not limited to a single domain.</p>
            <div>
              <p className="font-medium">Avoid vague formulations such as:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>understand</li><li>know</li><li>be familiar with</li><li>appreciate</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Examples of useful verbs:</p>
              <div className="mt-1 space-y-1 text-muted-foreground">
                <p><span className="font-medium text-foreground">Knowledge & understanding:</span> describe, explain, define, identify, outline, illustrate, discuss</p>
                <p><span className="font-medium text-foreground">Application:</span> apply, use, demonstrate, perform, implement, solve</p>
                <p><span className="font-medium text-foreground">Analysis:</span> analyse, compare, distinguish, examine, critique</p>
                <p><span className="font-medium text-foreground">Synthesis / creation:</span> design, develop, construct, formulate, create, organise</p>
                <p><span className="font-medium text-foreground">Evaluation:</span> evaluate, assess, judge, recommend, justify, defend</p>
              </div>
            </div>
            <div>
              <p className="font-medium">Examples:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>Manage the design of sustainability transition strategies</li>
                <li>Develop and evaluate data-driven solutions</li>
              </ul>
            </div>
          </div>
        ),
      },
      context: {
        title: 'How to describe the context',
        body: (
          <div className="space-y-3">
            <p>Describe the situation, environment, or level of complexity in which the competence is applied. This helps define the level and scope of the learning outcome.</p>
            <div>
              <p className="font-medium">Consider:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>Complexity (simple vs complex situations)</li>
                <li>Setting (organisational, societal, technical)</li>
                <li>Degree of uncertainty or autonomy</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Examples:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>In complex and context-dependent sustainability challenges</li>
                <li>In interdisciplinary project environments</li>
                <li>In real-world organisational or policy contexts</li>
                <li>Under conditions of uncertainty and multiple stakeholders</li>
              </ul>
            </div>
          </div>
        ),
      },
      keyActions: {
        title: 'How to describe key actions or processes',
        body: (
          <div className="space-y-3">
            <p>Describe the main processes, practices, or activities that characterise the competence in action. Multiple actions are expected and should reflect how the competence is applied in practice.</p>
            <div>
              <p className="font-medium">You may include combinations of:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>analysis</li><li>design</li><li>collaboration</li><li>implementation</li><li>evaluation</li>
              </ul>
            </div>
            <p className="text-muted-foreground">Avoid reducing the competence to a single action.</p>
            <div>
              <p className="font-medium">Examples:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>Conduct contextual analysis and develop solution scenarios</li>
                <li>Collaborate with stakeholders and integrate multiple perspectives</li>
                <li>Evaluate strategic options and adapt solutions</li>
                <li>Combine data analysis with co-creation processes</li>
              </ul>
            </div>
          </div>
        ),
      },
      expectedResult: {
        title: 'How to define the expected result or impact',
        body: (
          <div className="space-y-3">
            <p>Describe what the learner ultimately achieves by applying the competence. This reflects the value, contribution, or outcome of their actions.</p>
            <div>
              <p className="font-medium">Focus on:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>impact</li><li>contribution</li><li>change created</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Examples:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>Contribute to sustainable organisational change</li>
                <li>Enable effective decision-making in complex environments</li>
                <li>Support innovation and development in professional practice</li>
                <li>Improve processes, outcomes, or stakeholder collaboration</li>
              </ul>
            </div>
          </div>
        ),
      },
    };

    const c = content[field];
    return (
      <Dialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <button type="button" className="text-warning hover:text-warning/80">
                  <Lightbulb className="h-4 w-4" />
                </button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent><p>View guidance and examples</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{c.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="text-sm pr-4">{c.body}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  const renderTuningBookIcon = () => (
    <ReadMorePopover>
      <ReadMorePopoverTrigger asChild>
        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          <BookOpen className="h-4 w-4" />
        </button>
      </ReadMorePopoverTrigger>
      <ReadMorePopoverContent className="w-80 text-sm space-y-3">
        <p>You can read more about the Tuning approach and how to formulate degree programme profiles in:</p>
        <p className="font-medium">A Tuning Guide to Formulating Degree Programme Profiles</p>
        <p>
          A Guide to Formulating Degree Programme Profiles can be found on this resource page:{' '}
          <a
            href="https://tuningacademy.org/publications/tuning-general-publications/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            Tuning General Publications – Tuning Academy
          </a>
        </p>
      </ReadMorePopoverContent>
    </ReadMorePopover>
  );

  // ──────────── Tuning Outcome Card ────────────
  const renderTuningOutcome = (outcome: LearningOutcome, index: number) => {
    const draft = composeTuningOutcome(outcome);
    const detectedVerbs = draft ? detectBloomVerbs(draft) : [];

    return (
      <div key={outcome.id} className="border border-border rounded-lg p-4 space-y-5 bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Learning outcome {index + 1}
          </span>
          {outcomes.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeOutcome(outcome.id)}
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>

        {/* 1. Competence Focus */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
           <Label className="text-sm font-medium">Competence focus</Label>
            {renderFieldHelp('competenceFocus')}
          </div>
          <p className="text-xs text-muted-foreground">What capability should the learner demonstrate? Describe the central capability or professional competence the learner should develop.</p>
          <Textarea
            value={outcome.competenceFocus || ''}
            onChange={(e) => updateOutcome(outcome.id, { competenceFocus: e.target.value })}
            placeholder="e.g. manage the design of a sustainability transition"
            className="min-h-[60px] bg-background"
          />
        </div>

        {/* 2. Context of Application */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Context of application</Label>
            {renderFieldHelp('context')}
          </div>
          <p className="text-xs text-muted-foreground">In what context or situation should the competence be applied? Describe the context, conditions, or complexity of the situation.</p>
          <Textarea
            value={outcome.contextOfApplication || ''}
            onChange={(e) => updateOutcome(outcome.id, { contextOfApplication: e.target.value })}
            placeholder="e.g. in complex and context-dependent sustainability challenges"
            className="min-h-[60px] bg-background"
          />
        </div>

        {/* 3. Key Actions or Processes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Key actions or processes</Label>
            {renderFieldHelp('keyActions')}
          </div>
          <p className="text-xs text-muted-foreground">Which actions or processes may be involved? Describe relevant processes that may contribute to the competence. Multiple processes are allowed.</p>
          <Textarea
            value={outcome.keyActions || ''}
            onChange={(e) => updateOutcome(outcome.id, { keyActions: e.target.value })}
            placeholder="e.g. drawing on contextual analysis and co-creation with stakeholders"
            className="min-h-[60px] bg-background"
          />
        </div>

        {/* 4. Expected Result or Impact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Expected result or impact</Label>
            {renderFieldHelp('expectedResult')}
            
          </div>
          <p className="text-xs text-muted-foreground">What should the learner ultimately be able to achieve? Describe the expected outcome, value, or impact of applying the competence.</p>
          <Textarea
            value={outcome.expectedResult || ''}
            onChange={(e) => updateOutcome(outcome.id, { expectedResult: e.target.value })}
            placeholder="e.g. contribute to sustainable organisational change"
            className="min-h-[60px] bg-background"
          />
        </div>

        {/* Draft learning outcome section */}
        <div className="space-y-3 pt-2 border-t border-border">
          <Label className="text-sm font-medium">Draft learning outcome</Label>
          <Textarea
            value={outcome.composedOutcome ?? (draft || '')}
            onChange={(e) => updateOutcome(outcome.id, { composedOutcome: e.target.value })}
            placeholder="The draft learning outcome will appear here as you fill in the fields above."
            className="min-h-[100px] bg-background"
          />
          <p className="text-xs text-muted-foreground">
            This draft is composed automatically from the fields above. Review and refine the wording to ensure it accurately reflects the intended competence.
          </p>
        </div>

        {/* Optional competence dimension multi-select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Competence dimension <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <p className="text-xs text-muted-foreground">
            Select the competence dimension(s) addressed by this learning outcome. Multiple selections are allowed.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMPETENCE_DIMENSIONS.map((dim) => {
              const selected = (outcome.competenceDimensions || []).includes(dim.value);
              return (
                <button
                  key={dim.value}
                  type="button"
                  onClick={() => {
                    const current = outcome.competenceDimensions || [];
                    const updated = selected
                      ? current.filter(d => d !== dim.value)
                      : [...current, dim.value];
                    updateOutcome(outcome.id, { competenceDimensions: updated });
                  }}
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {dim.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detected Bloom verbs */}
        {(outcome.composedOutcome || draft) && detectedVerbs.length > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
            <span className="font-medium">Detected Bloom verbs:</span>
            {detectedVerbs.slice(0, 6).map((v, i) => (
              <span key={i} className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5">
                {v.verb} <span className="text-muted-foreground/60 ml-1">({v.domain})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ──────────── Main outcomes section (after approach selected) ────────────
  const renderOutcomesSection = () => (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            How should the learning outcomes for this {courseLabel} be defined?
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
                  Learning outcomes define the specific and observable actions that the learner must perform. Well-formulated learning outcomes support the assessment design and ensure transparency.
                </p>
                {approach === 'bloom' ? (
                  <>
                    <p className="font-medium">Examples of Bloom-structured outcomes:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>"The learner must analyze stakeholder feedback to identify recurring patterns."</li>
                      <li>"The learner must apply ethical guidelines when evaluating case scenarios."</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Example of a competence-based outcome:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>"You will manage the design of an impactful sustainability transition for one or more complex issues in a resilient, context-dependent manner, drawing on contextual analysis and co-creation with stakeholders."</li>
                    </ul>
                  </>
                )}
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
                {approach === 'bloom' ? (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Select the cognitive domain that best reflects the required performance.</li>
                    <li>Choose one active verb from Bloom's taxonomy appropriate for the selected domain.</li>
                    <li>Write only one clear and observable action per learning outcome.</li>
                    <li>Keep the language concrete and avoid abstract phrasing.</li>
                    <li>Use the starter sentence to maintain consistency across all outcomes.</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Start with the capability the learner should demonstrate after completing the course.</li>
                    <li>Describe the context or situation in which the competence applies.</li>
                    <li>Identify the key actions or cognitive processes involved (these may span multiple Bloom domains).</li>
                    <li>Specify the expected result or impact of the competence.</li>
                    <li>Combine these elements into one coherent statement that remains assessable.</li>
                  </ul>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {approach === 'bloom' && (
            <ReadMorePopover>
              <ReadMorePopoverTrigger asChild>
                <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  <BookOpen className="h-4 w-4" />
                </button>
              </ReadMorePopoverTrigger>
              <ReadMorePopoverContent className="w-96 text-sm space-y-2">
                <p>You can explore the theoretical foundation of the revised Bloom's taxonomy in:</p>
                <p className="italic">
                  Krathwohl, D. R. (2002). A Revision of Bloom's Taxonomy: An Overview.
                </p>
                <p>
                  DOI:{' '}
                  <a
                    href="https://doi.org/10.1207/s15430421tip4104_2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                  >
                    10.1207/s15430421tip4104_2
                  </a>
                </p>
                <p>This article provides a conceptual understanding of the taxonomy and its categories.</p>
                <p>You may also search for additional explanations and interpretations here:</p>
                <a
                  href="https://www.google.com/search?q=Blooms+taxononomy+reviesed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                >
                  Search: Bloom's taxonomy revised
                </a>
                <p className="text-xs text-muted-foreground italic">
                  Note: A general search link is provided to reduce the risk of outdated or broken external links.
                </p>
              </ReadMorePopoverContent>
            </ReadMorePopover>
          )}
          {approach === 'tuning' && renderTuningBookIcon()}
        </div>

        {approach === 'bloom' && (
          <div className="text-sm text-muted-foreground space-y-2 max-w-2xl">
            <p>
              In this step, you define learning outcomes using Bloom's taxonomy as a structured classification framework. You will select a cognitive domain and an active verb to formulate each learning outcome as a clear, observable action.
            </p>
            <p>
              Bloom's taxonomy helps distinguish between different levels of cognitive complexity (e.g. application, analysis, evaluation) and ensures that learning outcomes are aligned with the intended level of learning.
            </p>
            <p>
              The selected cognitive classification will later be used to support and validate how your learning outcomes are formulated and structured when they are generated.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs rounded-full border border-border bg-muted px-2.5 py-0.5 text-muted-foreground">
            {(() => {
              const hasBloom = outcomes.some(o => o.approach === 'bloom');
              const hasTuning = outcomes.some(o => o.approach === 'tuning');
              if (hasBloom && hasTuning) return 'Mixed (Bloom + Tuning)';
              return approach === 'bloom' ? 'Bloom structured' : 'Competence-based (Tuning)';
            })()}
          </span>
          {courseType !== 'composite-micro-credential' && (
            <button
              onClick={() => {
                const hasContent = outcomes.some(
                  (o) =>
                    (o.outcomeText && o.outcomeText.trim()) ||
                    (o.composedOutcome && o.composedOutcome.trim()) ||
                    (o.competenceFocus && o.competenceFocus.trim())
                );
                if (hasContent) {
                  const confirmed = window.confirm(
                    'Changing the approach will discard the current learning outcomes. Continue?'
                  );
                  if (!confirmed) return;
                }
                setApproach(undefined);
                setOutcomes([{ id: generateId() }]);
                onChange({ learningOutcomes: [], formulationApproach: undefined });
                if (integrityGuardActive && basedOnSingleSource) {
                  onBreakSingleSourceIntegrity?.();
                }
              }}
              className="text-xs text-primary hover:underline"
            >
              Change approach
            </button>
          )}
        </div>
      </div>

      {/* Outcomes list — composite MC: locked read-only with source provenance.
          Standalone & MC: each outcome rendered using its own approach. */}
      {courseType === 'composite-micro-credential' ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
            <Lock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              Learning outcomes are inherited from the standalone courses that compose this micro-credential. They are locked here to preserve the integrity of the original quality-assured units. Each outcome shows which standalone course it comes from.
            </p>
          </div>
          <div className="space-y-2">
            {outcomes.map((outcome, index) => {
              const text = (() => {
                if (outcome.approach === 'tuning') {
                  return outcome.composedOutcome?.trim() || composeTuningOutcome(outcome);
                }
                const verb = outcome.activeVerb ? `${outcome.activeVerb} ` : '';
                const body = outcome.outcomeText?.trim() || '';
                return body ? `The learner must ${verb}${body}` : '';
              })();
              const titles = Array.isArray(outcome._sourceTitles) ? outcome._sourceTitles.filter(Boolean) : [];
              return (
                <div
                  key={outcome.id}
                  className="rounded-md border border-border bg-muted/40 p-3 space-y-1.5 opacity-90"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-muted-foreground mt-0.5">
                      {index + 1}.
                    </span>
                    <p className="text-sm text-foreground flex-1">
                      {text || <span className="italic text-muted-foreground">(no outcome text)</span>}
                    </p>
                  </div>
                  {titles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {titles.map((t, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] rounded-full border border-border bg-background px-2 py-0.5 text-muted-foreground"
                        >
                          <BookOpen className="h-3 w-3" />
                          From: {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {outcomes.map((outcome, index) => {
              const effectiveApproach = outcome.approach || approach;
              return effectiveApproach === 'bloom'
                ? renderBloomOutcome(outcome, index)
                : renderTuningOutcome(outcome, index);
            })}
          </div>

          {/* Add Another */}
          <Button
            type="button"
            variant="outline"
            onClick={addOutcome}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add another learning outcome
          </Button>
        </>
      )}
      {/* EQF Summary */}
      {hasAtLeastOneCompleteOutcome && (
        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setShowEQFSummary(!showEQFSummary);
                // Re-propagate current outcomes to ensure all downstream summaries update
                onChange({ learningOutcomes: outcomes, formulationApproach: approach });
              }}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              All learning outcomes have been defined
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:text-primary/80">
                  <Info className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>About the EQF Summary</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <p>
                    This overview groups your learning outcomes into the three EQF dimensions.
                    {approach === 'bloom'
                      ? ' Mapping is based on the Bloom cognitive domain you selected for each outcome.'
                      : ' For competence-based outcomes, Bloom verbs are detected automatically to infer the most relevant EQF dimension.'}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {showEQFSummary && (
            <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Summary of learning outcomes</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your learning outcomes grouped by EQF dimensions.
                </p>
              </div>
              
              {(['knowledge', 'skills', 'responsibility'] as EQFDimension[]).map((dimension) => (
                <div key={dimension} className="space-y-2">
                  <h4 className="text-base font-semibold text-foreground border-b border-border pb-2">
                    {EQF_DIMENSION_LABELS[dimension]}
                  </h4>
                  {eqfGroupedOutcomes[dimension].length > 0 ? (
                    <Table>
                      <TableBody>
                        {eqfGroupedOutcomes[dimension].map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{item.text}</TableCell>
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
          )}
        </div>
      )}
    </Card>
  );

  // Show outcomes section if approach is set OR if any outcomes already exist with their own approach
  // (handles composite-MC merges where outcomes from multiple sources may have mixed approaches)
  const hasExistingOutcomes = outcomes.some(o => !!o.approach);
  // Build a read-only reference list of learning outcomes from the uploaded
  // source files (only used in the "new MC from uploaded files" flow).
  // For composite MCs the source outcomes are merged into the form itself, so
  // we only show this reference when the courseType is a regular MC.
  const sourceReferenceOutcomes = useMemo(() => {
    if (!standaloneSources || standaloneSources.length === 0) return [];
    if (courseType === 'composite-micro-credential') return [];
    return standaloneSources
      .map((src) => {
        const node = src.data?.['3.5'] || {};
        const inter = (node as any).interdisciplinaryData || node;
        const los: LearningOutcome[] = Array.isArray(inter?.learningOutcomes)
          ? inter.learningOutcomes
          : [];
        return {
          title: src.workingTitle || src.fileName || src.documentId || 'Uploaded source',
          documentId: src.documentId,
          outcomes: los.filter((lo) => isOutcomeComplete(lo)),
        };
      })
      .filter((s) => s.outcomes.length > 0);
  }, [standaloneSources, courseType]);

  return (
    <>
      {sourceReferenceOutcomes.length > 0 && (
        <Collapsible defaultOpen={false} className="mb-4">
          <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/30">
            <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 p-4 text-left group">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Learning outcomes from uploaded source files
                </span>
                <span className="text-xs text-muted-foreground">
                  (read-only reference — for inspiration only)
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  These learning outcomes come from the files you uploaded. Define your own learning outcomes for this new micro-credential below — you may use these as inspiration, but they are not copied into your draft.
                </p>
                {sourceReferenceOutcomes.map((src, idx) => (
                  <div key={src.documentId || idx} className="space-y-2">
                    <div className="text-sm font-semibold text-foreground border-b border-border pb-1">
                      {src.title}
                    </div>
                    <ul className="space-y-1">
                      {src.outcomes.map((lo) => (
                        <li
                          key={lo.id}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary mt-0.5">•</span>
                          <span>{getOutcomeText(lo)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <div className="space-y-4">
        {(!approach && !hasExistingOutcomes) ? renderApproachSelector() : renderOutcomesSection()}
      </div>

      <AlertDialog
        open={removalDialogStep === 'warning'}
        onOpenChange={(open) => {
          if (!open) {
            setRemovalDialogStep((curr) => {
              if (curr === 'confirm') return curr;
              setPendingRemovalId(null);
              return null;
            });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove learning outcome?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {courseType === 'composite-micro-credential' ? (
                  <>
                    <p>
                      This composite micro-credential will no longer remain a combined micro-credential based on independent standalone courses if you continue.
                    </p>
                    <p>
                      Instead, the imported standalone courses will be treated as one combined standalone course that can be edited as a single whole, because the teaching content was designed with the explicit purpose of meeting these learning outcomes.
                    </p>
                    <p>
                      This is required because the standalone courses used here are packaged and quality-assured as independent units, and changes to learning outcomes must break that original structure.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      This micro-credential is currently based directly on a single existing standalone course. If you remove a learning outcome, it will no longer be a faithful representation of that source course.
                    </p>
                    <p>
                      It will be converted back into a single combined standalone course that can be edited as a whole, because the teaching content was designed with the explicit purpose of meeting these learning outcomes.
                    </p>
                    <p>
                      This is required because the source standalone course is packaged and quality-assured as an independent unit.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setRemovalDialogStep('confirm')}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removalDialogStep === 'confirm'}
        onOpenChange={(open) => {
          if (!open) setRemovalDialogStep('warning');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemovalDialogStep('warning')}>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveOutcome}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LearningOutcomesForm;
