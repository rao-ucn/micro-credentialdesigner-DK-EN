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
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

// Bloom's taxonomy verb lists (kept in English as authoritative reference terms; domain/definition translated via lt in component)

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

const VERBS_BY_DOMAIN_DA: Record<CognitiveDomain, string[]> = {
  knowledge: [
    'Ordne', 'Definere', 'Beskrive', 'Kopiere', 'Identificere', 'Mærke', 'Opliste', 'Matche',
    'Memorere', 'Navngive', 'Sortere', 'Skitsere', 'Genkende', 'Relatere', 'Genkalde', 'Gentage',
    'Reproducere', 'Vælge', 'Angive'
  ],
  comprehension: [
    'Klassificere', 'Omforme', 'Forsvare', 'Beskrive', 'Diskutere', 'Skelne', 'Estimere',
    'Forklare', 'Udtrykke', 'Udvide', 'Generalisere', 'Give eksempler', 'Identificere', 'Indikere',
    'Udlede', 'Lokalisere', 'Omformulere', 'Forudsige', 'Genkende', 'Omskrive', 'Gennemgå', 'Vælge',
    'Opsummere', 'Oversætte'
  ],
  application: [
    'Anvende', 'Ændre', 'Vælge', 'Beregne', 'Demonstrere', 'Opdage', 'Dramatisere',
    'Bruge', 'Illustrere', 'Fortolke', 'Manipulere', 'Modificere', 'Betjene', 'Øve',
    'Forudsige', 'Forberede', 'Producere', 'Relatere', 'Planlægge', 'Vise', 'Skitsere', 'Løse',
    'Udnytte', 'Skrive'
  ],
  analysis: [
    'Analysere', 'Vurdere', 'Nedbryde', 'Beregne', 'Kategorisere', 'Sammenligne', 'Kontrastere',
    'Kritisere', 'Diagrammere', 'Differentiere', 'Skelne', 'Adskille', 'Undersøge',
    'Eksperimentere', 'Identificere', 'Illustrere', 'Udlede', 'Modellere', 'Skitsere', 'Påpege',
    'Stille spørgsmål', 'Relatere', 'Vælge', 'Separere', 'Opdele', 'Teste'
  ],
  synthesis: [
    'Ordne', 'Samle', 'Kategorisere', 'Indsamle', 'Kombinere', 'Efterkomme', 'Komponere',
    'Konstruere', 'Skabe', 'Designe', 'Udvikle', 'Opfinde', 'Forklare', 'Formulere',
    'Generere', 'Planlægge', 'Forberede', 'Omarrangere', 'Rekonstruere', 'Relatere', 'Reorganisere',
    'Revidere', 'Omskrive', 'Opstille', 'Opsummere', 'Syntetisere', 'Fortælle', 'Skrive'
  ],
  evaluation: [
    'Vurdere', 'Argumentere', 'Bedømme', 'Tillægge', 'Vælge', 'Sammenligne', 'Konkludere', 'Kontrastere',
    'Forsvare', 'Beskrive', 'Skelne', 'Estimere', 'Evaluere', 'Forklare', 'Dømme',
    'Begrunde', 'Fortolke', 'Relatere', 'Forudsige', 'Prioritere', 'Vælge', 'Opsummere', 'Understøtte',
    'Værdisætte'
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
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const verbsByDomain = language === 'da' ? VERBS_BY_DOMAIN_DA : VERBS_BY_DOMAIN;
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : lt.courseLabelMicroCredential;

  const COGNITIVE_DOMAINS: { value: CognitiveDomain; label: string }[] = [
    { value: 'knowledge', label: lt.loBloomKnowledgeDomain },
    { value: 'comprehension', label: lt.loBloomComprehensionDomain },
    { value: 'application', label: lt.loBloomApplicationDomain },
    { value: 'analysis', label: lt.loBloomAnalysisDomain },
    { value: 'synthesis', label: lt.loBloomSynthesisDomain },
    { value: 'evaluation', label: lt.loBloomEvaluationDomain },
  ];

  const EQF_DIMENSION_LABELS: Record<EQFDimension, string> = {
    knowledge: lt.daKnowledge,
    skills: lt.daSkills,
    responsibility: lt.daResponsibility,
  };

  const COMPETENCE_DIMENSIONS: { value: CompetenceDimension; label: string }[] = [
    { value: 'knowledge', label: lt.daKnowledge },
    { value: 'skills', label: lt.daSkills },
    { value: 'responsibility_autonomy', label: lt.daResponsibility },
  ];

  const BLOOM_TAXONOMY_DATA = [
    { domain: lt.loBloomKnowledgeDomain, definition: lt.loBloomKnowledgeDef, verbs: verbsByDomain.knowledge.join(', ') },
    { domain: lt.loBloomComprehensionDomain, definition: lt.loBloomComprehensionDef, verbs: verbsByDomain.comprehension.join(', ') },
    { domain: lt.loBloomApplicationDomain, definition: lt.loBloomApplicationDef, verbs: verbsByDomain.application.join(', ') },
    { domain: lt.loBloomAnalysisDomain, definition: lt.loBloomAnalysisDef, verbs: verbsByDomain.analysis.join(', ') },
    { domain: lt.loBloomSynthesisDomain, definition: lt.loBloomSynthesisDef, verbs: verbsByDomain.synthesis.join(', ') },
    { domain: lt.loBloomEvaluationDomain, definition: lt.loBloomEvaluationDef, verbs: verbsByDomain.evaluation.join(', ') },
  ];
  
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
    if (!verb) return `${lt.loOutcomeTextDefault}...`;
    return `${lt.loOutcomeTextDefault}${verb.toLowerCase()}`;
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
        <h2 className="text-2xl font-bold text-foreground">{lt.loSelectorTitle}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {lt.loSelectorIntro.replace(/{course}/g, courseLabel)}
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">
          {lt.loApproachQuestion}
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
              <span className="font-medium text-foreground">{lt.loBloomOptionTitle}</span>
              <p className="text-sm text-muted-foreground">
                {lt.loBloomOptionText}
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
              <span className="font-medium text-foreground">{lt.loTuningOptionTitle}</span>
              <p className="text-sm text-muted-foreground">
                {lt.loTuningOptionText}
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">{lt.loRelationTitle}</p>
        <p>
          {lt.loRelationText}
        </p>
      </div>
    </Card>
  );

  // ──────────── Bloom Outcome Card ────────────
  const renderBloomOutcome = (outcome: LearningOutcome, index: number) => (
    <div key={outcome.id} className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {lt.loOutcomeLabel.replace("{index}", String(index + 1))}
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
            {lt.loRemove}
          </Button>
        )}
      </div>

      {/* Cognitive Domain Dropdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{lt.loSelectDomain}</Label>
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
                  <p>{lt.loViewBloomTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{lt.loBloomDialogTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {lt.loBloomDialogIntro}
                </p>
                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px] font-semibold">{lt.loTableDomain}</TableHead>
                        <TableHead className="w-[200px] font-semibold">{lt.loTableDefinition}</TableHead>
                        <TableHead className="font-semibold">{lt.loTableVerbs}</TableHead>
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
            <SelectValue placeholder={lt.loSelectDomainPlaceholder} />
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
          <Label className="text-sm font-medium">{lt.loSelectVerb}</Label>
          <Select
            value={outcome.activeVerb || ''}
            onValueChange={(value) => updateOutcome(outcome.id, { activeVerb: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder={lt.loSelectVerbPlaceholder} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="__define_own__" className="font-bold">
                {lt.loDefineOwn}
              </SelectItem>
              {verbsByDomain[outcome.cognitiveDomain].map((verb) => (
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
          <Label className="text-sm font-medium">{lt.loFormulateOutcome}</Label>
          {outcome.activeVerb !== '__define_own__' && (
            <p className="text-xs text-muted-foreground mb-2">
              {lt.loStarterSentenceHint}
            </p>
          )}
          <Textarea
            value={outcome.outcomeText || (outcome.activeVerb === '__define_own__' ? lt.loOutcomeTextDefault : getOutcomePrefix(outcome.activeVerb))}
            onChange={(e) => updateOutcome(outcome.id, { outcomeText: e.target.value })}
            placeholder={outcome.activeVerb === '__define_own__' ? lt.loOutcomeTextDefault : getOutcomePrefix(outcome.activeVerb)}
            className="min-h-[80px] bg-background"
          />
        </div>
      )}

      {/* EQF Competence Dimension Selector */}
      {outcome.cognitiveDomain && outcome.activeVerb && (
        <div className="space-y-2 border-t border-border pt-4">
          <Label className="text-sm font-medium">{lt.loSuggestedDimension}</Label>
          <p className="text-xs text-muted-foreground">
            {lt.loSuggestedDimensionHelp}
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
                    <span className="text-xs text-primary ml-1">{lt.loSuggested}</span>
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
        title: lt.loFieldHelpCompetenceFocusTitle,
        body: (
          <div className="space-y-3">
            <p>{lt.loFieldHelpCompetenceFocusBody1}</p>
            <p>{lt.loFieldHelpCompetenceFocusBody2}</p>
            <div>
              <p className="font-medium">{lt.loFieldHelpAvoidTitle}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>{lt.loFieldHelpAvoid1}</li><li>{lt.loFieldHelpAvoid2}</li><li>{lt.loFieldHelpAvoid3}</li><li>{lt.loFieldHelpAvoid4}</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">{lt.loFieldHelpVerbsTitle}</p>
              <div className="mt-1 space-y-1 text-muted-foreground">
                <p><span className="font-medium text-foreground">{lt.loFieldHelpVerbsKnowledge}</span> {lt.loFieldHelpVerbsKnowledgeList}</p>
                <p><span className="font-medium text-foreground">{lt.loFieldHelpVerbsApplication}</span> {lt.loFieldHelpVerbsApplicationList}</p>
                <p><span className="font-medium text-foreground">{lt.loFieldHelpVerbsAnalysis}</span> {lt.loFieldHelpVerbsAnalysisList}</p>
                <p><span className="font-medium text-foreground">{lt.loFieldHelpVerbsSynthesis}</span> {lt.loFieldHelpVerbsSynthesisList}</p>
                <p><span className="font-medium text-foreground">{lt.loFieldHelpVerbsEvaluation}</span> {lt.loFieldHelpVerbsEvaluationList}</p>
              </div>
            </div>
            <div>
              <p className="font-medium">{lt.loFieldHelpExamplesTitle}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>{lt.loFieldHelpCompetenceFocusExample1}</li>
                <li>{lt.loFieldHelpCompetenceFocusExample2}</li>
              </ul>
            </div>
          </div>
        ),
      },
      context: {
        title: lt.loFieldHelpContextTitle,
        body: (
          <div className="space-y-3">
            <p>{lt.loFieldHelpContextBody}</p>
            <div>
              <p className="font-medium">{lt.loFieldHelpConsiderTitle}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>{lt.loFieldHelpContextConsider1}</li>
                <li>{lt.loFieldHelpContextConsider2}</li>
                <li>{lt.loFieldHelpContextConsider3}</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">{lt.loFieldHelpExamplesTitle}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>{lt.loFieldHelpContextExample1}</li>
                <li>{lt.loFieldHelpContextExample2}</li>
                <li>{lt.loFieldHelpContextExample3}</li>
                <li>{lt.loFieldHelpContextExample4}</li>
              </ul>
            </div>
          </div>
        ),
      },
      keyActions: {
        title: lt.loFieldHelpKeyActionsTitle,
        body: (
          <div className="space-y-3">
            <p>{lt.loFieldHelpKeyActionsBody}</p>
            <div>
              <p className="font-medium">{lt.loFieldHelpKeyActionsCombineTitle}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>{lt.loFieldHelpKeyActionsCombine1}</li><li>{lt.loFieldHelpKeyActionsCombine2}</li><li>{lt.loFieldHelpKeyActionsCombine3}</li><li>{lt.loFieldHelpKeyActionsCombine4}</li><li>{lt.loFieldHelpKeyActionsCombine5}</li>
              </ul>
            </div>
            <p className="text-muted-foreground">{lt.loFieldHelpKeyActionsAvoid}</p>
            <div>
              <p className="font-medium">{lt.loFieldHelpExamplesTitle}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>{lt.loFieldHelpKeyActionsExample1}</li>
                <li>{lt.loFieldHelpKeyActionsExample2}</li>
                <li>{lt.loFieldHelpKeyActionsExample3}</li>
                <li>{lt.loFieldHelpKeyActionsExample4}</li>
              </ul>
            </div>
          </div>
        ),
      },
      expectedResult: {
        title: lt.loFieldHelpExpectedResultTitle,
        body: (
          <div className="space-y-3">
            <p>{lt.loFieldHelpExpectedResultBody}</p>
            <div>
              <p className="font-medium">{lt.loFieldHelpExpectedResultFocusTitle}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>{lt.loFieldHelpExpectedResultFocus1}</li><li>{lt.loFieldHelpExpectedResultFocus2}</li><li>{lt.loFieldHelpExpectedResultFocus3}</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">{lt.loFieldHelpExamplesTitle}</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-muted-foreground">
                <li>{lt.loFieldHelpExpectedResultExample1}</li>
                <li>{lt.loFieldHelpExpectedResultExample2}</li>
                <li>{lt.loFieldHelpExpectedResultExample3}</li>
                <li>{lt.loFieldHelpExpectedResultExample4}</li>
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
            <TooltipContent><p>{lt.loFieldHelpTooltip}</p></TooltipContent>
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
        <p>{lt.loTuningReadMore1}</p>
        <p className="font-medium">{lt.loTuningReadMoreGuideTitle}</p>
        <p>
          {lt.loTuningReadMore2}{' '}
          <a
            href="https://tuningacademy.org/publications/tuning-general-publications/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {lt.loTuningReadMoreLinkText}
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
            {lt.loOutcomeLabel.replace("{index}", String(index + 1))}
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
              {lt.loRemove}
            </Button>
          )}
        </div>

        {/* 1. Competence Focus */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
           <Label className="text-sm font-medium">{lt.loCompetenceFocusLabel}</Label>
            {renderFieldHelp('competenceFocus')}
          </div>
          <p className="text-xs text-muted-foreground">{lt.loCompetenceFocusHelp}</p>
          <Textarea
            value={outcome.competenceFocus || ''}
            onChange={(e) => updateOutcome(outcome.id, { competenceFocus: e.target.value })}
            placeholder={lt.loCompetenceFocusPlaceholder}
            className="min-h-[60px] bg-background"
          />
        </div>

        {/* 2. Context of Application */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{lt.loContextLabel}</Label>
            {renderFieldHelp('context')}
          </div>
          <p className="text-xs text-muted-foreground">{lt.loContextHelp}</p>
          <Textarea
            value={outcome.contextOfApplication || ''}
            onChange={(e) => updateOutcome(outcome.id, { contextOfApplication: e.target.value })}
            placeholder={lt.loContextPlaceholder}
            className="min-h-[60px] bg-background"
          />
        </div>

        {/* 3. Key Actions or Processes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{lt.loKeyActionsLabel}</Label>
            {renderFieldHelp('keyActions')}
          </div>
          <p className="text-xs text-muted-foreground">{lt.loKeyActionsHelp}</p>
          <Textarea
            value={outcome.keyActions || ''}
            onChange={(e) => updateOutcome(outcome.id, { keyActions: e.target.value })}
            placeholder={lt.loKeyActionsPlaceholder}
            className="min-h-[60px] bg-background"
          />
        </div>

        {/* 4. Expected Result or Impact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{lt.loExpectedResultLabel}</Label>
            {renderFieldHelp('expectedResult')}
            
          </div>
          <p className="text-xs text-muted-foreground">{lt.loExpectedResultHelp}</p>
          <Textarea
            value={outcome.expectedResult || ''}
            onChange={(e) => updateOutcome(outcome.id, { expectedResult: e.target.value })}
            placeholder={lt.loExpectedResultPlaceholder}
            className="min-h-[60px] bg-background"
          />
        </div>

        {/* Draft learning outcome section */}
        <div className="space-y-3 pt-2 border-t border-border">
          <Label className="text-sm font-medium">{lt.loDraftLabel}</Label>
          <Textarea
            value={outcome.composedOutcome ?? (draft || '')}
            onChange={(e) => updateOutcome(outcome.id, { composedOutcome: e.target.value })}
            placeholder={lt.loDraftPlaceholder}
            className="min-h-[100px] bg-background"
          />
          <p className="text-xs text-muted-foreground">
            {lt.loDraftHelp}
          </p>
        </div>

        {/* Optional competence dimension multi-select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{lt.loCompetenceDimensionLabel} <span className="text-muted-foreground font-normal">{lt.loOptional}</span></Label>
          <p className="text-xs text-muted-foreground">
            {lt.loCompetenceDimensionHelp}
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
            <span className="font-medium">{lt.loDetectedVerbs}</span>
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
            {lt.loOutcomesQuestion.replace(/{course}/g, courseLabel)}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.loWhy}</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <p>
                  {lt.loWhyText}
                </p>
                {approach === 'bloom' ? (
                  <>
                    <p className="font-medium">{lt.loWhyBloomExamplesTitle}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>{lt.loWhyBloomExample1}</li>
                      <li>{lt.loWhyBloomExample2}</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-medium">{lt.loWhyTuningExampleTitle}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>{lt.loWhyTuningExample1}</li>
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
                <DialogTitle>{lt.loInspiration}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                {approach === 'bloom' ? (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>{lt.loInspireBloom1}</li>
                    <li>{lt.loInspireBloom2}</li>
                    <li>{lt.loInspireBloom3}</li>
                    <li>{lt.loInspireBloom4}</li>
                    <li>{lt.loInspireBloom5}</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>{lt.loInspireTuning1}</li>
                    <li>{lt.loInspireTuning2}</li>
                    <li>{lt.loInspireTuning3}</li>
                    <li>{lt.loInspireTuning4}</li>
                    <li>{lt.loInspireTuning5}</li>
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
                <p>{lt.loBloomReadMore1}</p>
                <p className="italic">
                  {lt.loBloomReadMoreCitation}
                </p>
                <p>
                  {lt.loBloomReadMoreDoiLabel}{' '}
                  <a
                    href="https://doi.org/10.1207/s15430421tip4104_2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                  >
                    10.1207/s15430421tip4104_2
                  </a>
                </p>
                <p>{lt.loBloomReadMore2}</p>
                <p>{lt.loBloomReadMore3}</p>
                <a
                  href="https://www.google.com/search?q=Blooms+taxononomy+reviesed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                >
                  {lt.loBloomReadMoreSearchText}
                </a>
                <p className="text-xs text-muted-foreground italic">
                  {lt.loBloomReadMoreNote}
                </p>
              </ReadMorePopoverContent>
            </ReadMorePopover>
          )}
          {approach === 'tuning' && renderTuningBookIcon()}
        </div>

        {approach === 'bloom' && (
          <div className="text-sm text-muted-foreground space-y-2 max-w-2xl">
            <p>
              {lt.loBloomIntro1}
            </p>
            <p>
              {lt.loBloomIntro2}
            </p>
            <p>
              {lt.loBloomIntro3}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs rounded-full border border-border bg-muted px-2.5 py-0.5 text-muted-foreground">
            {(() => {
              const hasBloom = outcomes.some(o => o.approach === 'bloom');
              const hasTuning = outcomes.some(o => o.approach === 'tuning');
              if (hasBloom && hasTuning) return lt.loMixedBadge;
              return approach === 'bloom' ? lt.loBloomBadge : lt.loTuningBadge;
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
                    lt.loChangeApproachConfirm
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
              {lt.loChangeApproach}
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
              {lt.loCompositeLocked}
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
                return body ? `${lt.loOutcomeTextDefault}${verb}${body}` : '';
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
                      {text || <span className="italic text-muted-foreground">{lt.loNoOutcomeText}</span>}
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
                          {lt.loFrom} {t}
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
            {lt.loAddAnother}
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
              {lt.loAllDefined}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:text-primary/80">
                  <Info className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{lt.loEqfAboutTitle}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <p>
                    {lt.loEqfAboutText1}
                    {approach === 'bloom'
                      ? lt.loEqfAboutBloom
                      : lt.loEqfAboutTuning}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {showEQFSummary && (
            <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{lt.loEqfSummaryTitle}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {lt.loEqfSummaryHelp}
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
                      {lt.loNoOutcomesForDimension}
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
          title: src.workingTitle || src.fileName || src.documentId || lt.loUploadedSourceFallback,
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
                  {lt.loSourceRefTitle}
                </span>
                <span className="text-xs text-muted-foreground">
                  {lt.loSourceRefNote}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  {lt.loSourceRefHelp}
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
            <AlertDialogTitle>{lt.loRemoveOutcomeTitle}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {courseType === 'composite-micro-credential' ? (
                  <>
                    <p>
                      {lt.loRemoveCompositeText1}
                    </p>
                    <p>
                      {lt.loRemoveCompositeText2}
                    </p>
                    <p>
                      {lt.loRemoveCompositeText3}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      {lt.loRemoveSingleText1}
                    </p>
                    <p>
                      {lt.loRemoveSingleText2}
                    </p>
                    <p>
                      {lt.loRemoveSingleText3}
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lt.loCancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => setRemovalDialogStep('confirm')}>{lt.loContinue}</AlertDialogAction>
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
            <AlertDialogTitle>{lt.loAreYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {lt.loCannotBeUndone}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemovalDialogStep('warning')}>{lt.loGoBack}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveOutcome}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lt.loYesContinue}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LearningOutcomesForm;
