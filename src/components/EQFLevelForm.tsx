import { useState, useEffect, useMemo, useRef } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, Lightbulb, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms56bTranslations } from '@/lib/translations/forms56b';

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

const BLOOM_TO_EQF: Record<CognitiveDomain, EQFDimension> = {
  knowledge: 'knowledge',
  comprehension: 'knowledge',
  application: 'skills',
  analysis: 'responsibility',
  synthesis: 'responsibility',
  evaluation: 'responsibility'
};

const COMPETENCE_TO_EQF: Record<CompetenceDimension, EQFDimension> = {
  knowledge: 'knowledge',
  skills: 'skills',
  responsibility_autonomy: 'responsibility',
};

interface EQFLevelFormProps {
  value: any;
  onChange: (value: any) => void;
  courseType?: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  learningOutcomes?: LearningOutcome[];
  compositeSources?: Array<{ data: Record<string, any> }>;
  standaloneSources?: Array<{ workingTitle?: string; documentId?: string; fileName?: string; data?: Record<string, any> }>;
}

const eqfDescriptors = [
  {
    level: 1,
    knowledge: 'basic general knowledge',
    skills: 'basic skills required to carry out simple tasks',
    autonomy: 'work or study under direct supervision in a structured context'
  },
  {
    level: 2,
    knowledge: 'basic factual knowledge',
    skills: 'basic cognitive and practical skills required to use relevant information in order to carry out tasks and to solve routine problems',
    autonomy: 'work or study under supervision with some autonomy'
  },
  {
    level: 3,
    knowledge: 'knowledge of facts, principles, processes and general concepts in a field of work or study',
    skills: 'a range of cognitive and practical skills required to accomplish tasks and solve problems by selecting and applying basic methods, tools, materials and information',
    autonomy: 'take responsibility for completion of tasks; adapt behaviour to circumstances in solving problems'
  },
  {
    level: 4,
    knowledge: 'factual and theoretical knowledge in broad contexts within a field of work or study',
    skills: 'a range of cognitive and practical skills required to generate solutions to specific problems in a field of work or study',
    autonomy: 'exercise self-management; supervise the routine work of others and take some responsibility for evaluating and improving work or study activities'
  },
  {
    level: 5,
    knowledge: 'comprehensive, specialised, factual and theoretical knowledge within a field of work or study, and an awareness of the boundaries of that knowledge',
    skills: 'a comprehensive range of cognitive and practical skills required to develop creative solutions to abstract problems',
    autonomy: 'exercise management and supervision in contexts where there is unpredictable change; review and develop performance of self and others'
  },
  {
    level: 6,
    knowledge: 'advanced knowledge of a field of work or study, involving a critical understanding of theories and principles',
    skills: 'advanced skills, demonstrating mastery and innovation, required to solve complex and unpredictable problems in a specialised field',
    autonomy: 'manage complex technical or professional activities or projects; take responsibility for decision-making; manage professional development of individuals and groups'
  },
  {
    level: 7,
    knowledge: 'highly specialised knowledge, some of which is at the forefront of knowledge in a field and at the interface between different fields',
    skills: 'specialised problem-solving skills required in research and/or innovation to develop new knowledge and procedures and to integrate knowledge from different fields',
    autonomy: 'manage and transform complex, unpredictable contexts; take responsibility for strategic decisions; contribute to professional knowledge and practice'
  },
  {
    level: 8,
    knowledge: 'knowledge at the most advanced frontier of a field of work or study and at the interface between fields',
    skills: 'the most advanced and specialised skills and techniques, including synthesis and evaluation, required to solve critical problems in research and/or innovation and to extend and redefine existing knowledge or professional practice',
    autonomy: 'demonstrate substantial authority, autonomy, scholarly and professional integrity, and sustained commitment to developing new ideas or processes at the forefront of work or study contexts'
  }
];

export function EQFLevelForm({ value, onChange, courseType = 'standalone', learningOutcomes = [], compositeSources = [], standaloneSources = [] }: EQFLevelFormProps) {
  const { language } = useLanguage();
  const lt = forms56bTranslations[language];
  const courseLabel = courseType === 'standalone' ? lt.eqfStandaloneLabel : lt.eqfMicroCredentialLabel;
  const [levelMode, setLevelMode] = useState<'single' | 'multiple' | ''>(value?.levelMode || '');
  const [singleLevel, setSingleLevel] = useState(value?.singleLevel || '');
  const [singleLevelConfirmed, setSingleLevelConfirmed] = useState(!!value?.singleLevelConfirmed);
  const [descriptorMatches, setDescriptorMatches] = useState({
    knowledge: value?.descriptorMatches?.knowledge || '',
    skills: value?.descriptorMatches?.skills || '',
    responsibilityAutonomy: value?.descriptorMatches?.responsibilityAutonomy || ''
  });
  
  const [suggestedLevel, setSuggestedLevel] = useState(value?.suggestedLevel || '');
  const [finalLevel, setFinalLevel] = useState(value?.finalLevel || '');
  const [reasoning, setReasoning] = useState(value?.reasoning || '');

  const compositeSourceLevels = useMemo(() => {
    if (courseType !== 'composite-micro-credential') return [] as string[];

    const levels = compositeSources
      .map((source) => {
        const eqf = source?.data?.eqfLevelData;
        if (!eqf) return '';
        if (eqf.levelMode === 'multiple') return eqf.finalLevel || eqf.suggestedLevel || 'multiple';
        return eqf.singleLevel || '';
      })
      .filter((level): level is string => !!level);

    return Array.from(new Set(levels));
  }, [compositeSources, courseType]);

  const singleLevelLockedForComposite = courseType === 'composite-micro-credential' && compositeSourceLevels.length > 1;

  // Read-only EQF reference from uploaded source files (only in "new MC from uploaded files" flow).
  // For composite MCs the EQF data is merged into the form itself, so this is only shown for regular MCs.
  const sourceReferenceLevels = useMemo(() => {
    if (!standaloneSources || standaloneSources.length === 0) return [];
    if (courseType === 'composite-micro-credential') return [];
    return standaloneSources
      .map((src) => {
        const eqf = src?.data?.['6.4']?.eqfLevelData || src?.data?.eqfLevelData;
        if (!eqf) return null;
        let levelLabel = '';
        if (eqf.levelMode === 'multiple') {
          levelLabel = eqf.finalLevel || eqf.suggestedLevel
            ? lt.eqfMultiLevelLabel.replace('{level}', String(eqf.finalLevel || eqf.suggestedLevel))
            : lt.eqfMultipleLevels;
        } else if (eqf.singleLevel) {
          levelLabel = lt.eqfLevelLabel.replace('{level}', String(eqf.singleLevel));
        }
        if (!levelLabel) return null;
        return {
          title: src.workingTitle || src.fileName || src.documentId || lt.eqfUploadedSourceFallback,
          documentId: src.documentId,
          levelLabel,
          reasoning: eqf.reasoning || '',
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [standaloneSources, courseType]);

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

  const isOComplete = (o: LearningOutcome): boolean => {
    if (o.approach === 'tuning') return !!(o.composedOutcome?.trim() || o.competenceFocus?.trim());
    return !!(o.cognitiveDomain && o.outcomeText?.trim());
  };

  // Group learning outcomes by EQF dimension
  const groupedOutcomes = useMemo(() => {
    const groups: Record<EQFDimension, { id: string; text: string }[]> = {
      knowledge: [],
      skills: [],
      responsibility: []
    };

    learningOutcomes.filter(isOComplete).forEach(outcome => {
      const text = getOText(outcome);
      if (outcome.approach === 'tuning') {
        const dims = outcome.competenceDimensions?.length ? outcome.competenceDimensions : null;
        if (dims) {
          dims.forEach(d => groups[COMPETENCE_TO_EQF[d]].push({ id: outcome.id, text }));
        } else {
          groups['skills'].push({ id: outcome.id, text });
        }
      } else if (outcome.cognitiveDomain) {
        const eqfDimension = BLOOM_TO_EQF[outcome.cognitiveDomain];
        groups[eqfDimension].push({ id: outcome.id, text });
      }
    });

    return groups;
  }, [learningOutcomes]);

  // Automatically calculate suggested level when descriptors change
  useEffect(() => {
    const { knowledge, skills, responsibilityAutonomy } = descriptorMatches;
    
    if (knowledge && skills && responsibilityAutonomy) {
      const levels = [
        parseInt(knowledge),
        parseInt(skills),
        parseInt(responsibilityAutonomy)
      ];
      
      // Count occurrences of each level
      const levelCounts: Record<number, number> = {};
      levels.forEach(level => {
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });
      
      // Find the most frequent level
      const maxCount = Math.max(...Object.values(levelCounts));
      const mostCommonLevels = Object.keys(levelCounts)
        .filter(level => levelCounts[parseInt(level)] === maxCount)
        .map(level => parseInt(level));
      
      let suggested: number;
      
      if (mostCommonLevels.length === 1) {
        // One level is most frequent
        suggested = mostCommonLevels[0];
      } else if (mostCommonLevels.length === 3) {
        // All three are different - choose the middle level
        const sortedLevels = [...levels].sort((a, b) => a - b);
        suggested = sortedLevels[1];
      } else {
        // Two levels tied - take the average rounded
        suggested = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
      }
      
      setSuggestedLevel(suggested.toString());
    }
  }, [descriptorMatches]);

  // Sync state with parent
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current({
      levelMode,
      singleLevel,
      singleLevelConfirmed,
      descriptorMatches,
      suggestedLevel,
      finalLevel,
      reasoning
    });
  }, [levelMode, singleLevel, singleLevelConfirmed, descriptorMatches, suggestedLevel, finalLevel, reasoning]);

  useEffect(() => {
    if (!singleLevelLockedForComposite || levelMode !== 'single') return;

    setLevelMode('multiple');
    setSingleLevel('');
    setSingleLevelConfirmed(false);
  }, [singleLevelLockedForComposite, levelMode]);

  const updateDescriptor = (dimension: 'knowledge' | 'skills' | 'responsibilityAutonomy', level: string) => {
    setDescriptorMatches(prev => ({
      ...prev,
      [dimension]: level
    }));
  };

  return (
    <div className="space-y-6">
      {sourceReferenceLevels.length > 0 && (
        <Collapsible defaultOpen={false}>
          <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/30">
            <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 p-4 text-left group">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {lt.eqfSourceReferenceLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {lt.eqfSourceReferenceReadonly}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {lt.eqfSourceReferenceHint}
                </p>
                {sourceReferenceLevels.map((src, idx) => (
                  <div key={src.documentId || idx} className="space-y-1 border-b border-border pb-2 last:border-b-0 last:pb-0">
                    <div className="text-sm font-semibold text-foreground">{src.title}</div>
                    <div className="text-sm text-muted-foreground">{src.levelLabel}</div>
                    {src.reasoning && (
                      <div className="text-xs text-muted-foreground italic">{src.reasoning}</div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{lt.eqfHeading}</h3>
        <p className="text-sm text-muted-foreground">
          {lt.eqfHeadingDescription.replace('{courseLabel}', courseLabel)}
        </p>
      </div>

      {/* Multi-source EQF mismatch warning (only when 2+ uploaded sources have different EQF levels) */}
      {sourceReferenceLevels.length > 1 &&
        new Set(sourceReferenceLevels.map((s) => s.levelLabel)).size > 1 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <strong>{lt.eqfMismatchWarningPrefix}</strong> {lt.eqfMismatchWarningText}
          </div>
        )}

      {/* Info and Inspiration Buttons */}
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <Info className="h-4 w-4" />
              {lt.eqfWhatIsEqf}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{lt.eqfWhatIsEqfDialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p>
                {lt.eqfWhatIsEqfP1}
              </p>
              <p>
                {lt.eqfWhatIsEqfP2}
              </p>
              <p>
                {lt.eqfWhatIsEqfP3}
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1 text-sm text-warning hover:text-warning/80">
              <Lightbulb className="h-4 w-4" />
              {lt.eqfInspiration}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{lt.eqfInspirationDialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="font-medium">{lt.eqfInspirationPromptsTitle}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{lt.eqfInspiration1}</li>
                <li>{lt.eqfInspiration2}</li>
                <li>{lt.eqfInspiration3}</li>
                <li>{lt.eqfInspiration4}</li>
                <li>{lt.eqfInspiration5}</li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>

        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <BookOpen className="h-4 w-4" />
              {lt.eqfReadMore}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm space-y-2">
            <p>
              {lt.eqfReadMoreText}
            </p>
            <p>
              {lt.eqfReadMoreLinkText}{' '}
              <a
                href="https://europass.europa.eu/en/description-eight-eqf-levels"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                https://europass.europa.eu/en/description-eight-eqf-levels
              </a>
            </p>
          </PopoverContent>
        </Popover>
      </div>

      {/* Level Mode Question */}
      <Card className="p-6 space-y-4">
        <Label className="text-base font-medium">
          {lt.eqfLevelModeQuestion.replace('{courseLabel}', courseLabel)} <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          {lt.eqfLevelModeHint.replace(/{courseLabel}/g, courseLabel)}
        </p>
        <RadioGroup value={levelMode} onValueChange={(val) => {
          if (val === 'single' && singleLevelLockedForComposite) return;
          setLevelMode(val as 'single' | 'multiple');
        }} className="space-y-4">
          <label
            htmlFor="eqf-single"
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              singleLevelLockedForComposite
                ? 'border-border/60 bg-muted/40 opacity-60 cursor-not-allowed'
                : levelMode === 'single'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <RadioGroupItem value="single" id="eqf-single" className="mt-0.5" disabled={singleLevelLockedForComposite} />
            <div className="space-y-1">
              <span className="font-medium text-foreground">{lt.eqfSingleLevelOption.replace('{courseLabel}', courseLabel)}</span>
              <p className="text-sm text-muted-foreground">
                {singleLevelLockedForComposite
                  ? lt.eqfSingleLevelDisabledHint
                  : lt.eqfSingleLevelHint}
              </p>
            </div>
          </label>

          <label
            htmlFor="eqf-multiple"
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              levelMode === 'multiple'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <RadioGroupItem value="multiple" id="eqf-multiple" className="mt-0.5" />
            <div className="space-y-1">
              <span className="font-medium text-foreground">{lt.eqfMultipleLevelOption.replace('{courseLabel}', courseLabel)}</span>
              <p className="text-sm text-muted-foreground">
                {lt.eqfMultipleLevelHint}
              </p>
            </div>
          </label>
        </RadioGroup>
      </Card>

      {/* Single EQF Level - card-based selection */}
      {levelMode === 'single' && (
        <div className="space-y-6">
          {/* Blue info box with learning outcomes */}
          {(groupedOutcomes.knowledge.length > 0 || groupedOutcomes.skills.length > 0 || groupedOutcomes.responsibility.length > 0) && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                {lt.eqfDefinedOutcomesIntro.replace('{courseLabel}', courseLabel)}
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {[...groupedOutcomes.knowledge, ...groupedOutcomes.skills, ...groupedOutcomes.responsibility]
                  .filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i)
                  .map((outcome, idx) => (
                    <li key={outcome.id}>{idx + 1}. {outcome.text}</li>
                  ))}
              </ul>
            </div>
          )}

          <Card className="p-6 space-y-4">
            <Label className="text-base font-medium">
              {lt.eqfSelectBestFitLabel.replace('{courseLabel}', courseLabel)} <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              {lt.eqfSelectBestFitHint}
            </p>

            <div className="space-y-3">
              {eqfDescriptors.map((desc) => (
                <button
                  key={`single-card-${desc.level}`}
                  type="button"
                  onClick={() => setSingleLevel(desc.level.toString())}
                  className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                    singleLevel === desc.level.toString()
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <p className="font-semibold text-foreground mb-3">{lt.eqfLevelWord} {desc.level}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{lt.eqfKnowledgeLabel}</p>
                      <p className="text-sm text-foreground capitalize">{desc.knowledge}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{lt.eqfSkillsLabel}</p>
                      <p className="text-sm text-foreground capitalize">{desc.skills}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{lt.eqfResponsibilityAutonomyLabel}</p>
                      <p className="text-sm text-foreground capitalize">{desc.autonomy}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {singleLevel && (
            <>
              <Card className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">{lt.eqfSelectedLevelLabel}</Label>
                  <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
                    <span className="text-2xl font-semibold">{lt.eqfLevelWord} {singleLevel}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {lt.eqfSelectedLevelConfirmText.replace('{level}', singleLevel).replace('{courseLabel}', courseLabel)}
                </p>
                <label className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer">
                  <Checkbox
                    checked={singleLevelConfirmed}
                    onCheckedChange={(checked) => setSingleLevelConfirmed(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <span className="font-medium text-foreground">{lt.eqfConfirmCheckboxLabel.replace('{level}', singleLevel)}</span>
                    <p className="text-sm text-muted-foreground">
                      {lt.eqfConfirmCheckboxHint}
                    </p>
                  </div>
                </label>
              </Card>

              {singleLevelConfirmed && (
                <div className="p-6 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm leading-relaxed">
                    {lt.eqfCompletionText.replace(/{courseLabel}/g, courseLabel)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Multiple EQF Levels - existing descriptor interface */}
      {levelMode === 'multiple' && (
        <>
          <div className="space-y-6">
            <Card className="p-6 space-y-6">
              {/* Knowledge Dropdown */}
              <div className="space-y-3">
                <Label htmlFor="knowledge-select" className="text-base font-medium">
                  {lt.eqfKnowledgeQuestion.replace('{courseLabel}', courseLabel)}
                </Label>
                {groupedOutcomes.knowledge.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      {lt.eqfDefinedOutcomesIntro.replace('{courseLabel}', courseLabel)}
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      {groupedOutcomes.knowledge.map((outcome, idx) => (
                        <li key={outcome.id}>
                          {idx + 1}. {outcome.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Select value={descriptorMatches.knowledge} onValueChange={(val) => updateDescriptor('knowledge', val)}>
                  <SelectTrigger id="knowledge-select">
                    <SelectValue placeholder={lt.eqfSelectKnowledgePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {eqfDescriptors.map((desc) => (
                      <SelectItem key={`knowledge-${desc.level}`} value={desc.level.toString()}>
                        Level {desc.level}: {desc.knowledge}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skills Dropdown */}
              <div className="space-y-3">
                <Label htmlFor="skills-select" className="text-base font-medium">
                  {lt.eqfSkillsQuestion.replace('{courseLabel}', courseLabel)}
                </Label>
                {groupedOutcomes.skills.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      {lt.eqfDefinedOutcomesIntro.replace('{courseLabel}', courseLabel)}
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      {groupedOutcomes.skills.map((outcome, idx) => (
                        <li key={outcome.id}>
                          {idx + 1}. {outcome.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Select value={descriptorMatches.skills} onValueChange={(val) => updateDescriptor('skills', val)}>
                  <SelectTrigger id="skills-select">
                    <SelectValue placeholder={lt.eqfSelectSkillsPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {eqfDescriptors.map((desc) => (
                      <SelectItem key={`skills-${desc.level}`} value={desc.level.toString()}>
                        Level {desc.level}: {desc.skills}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Responsibility/Autonomy Dropdown */}
              <div className="space-y-3">
                <Label htmlFor="autonomy-select" className="text-base font-medium">
                  {lt.eqfAutonomyQuestion.replace('{courseLabel}', courseLabel)}
                </Label>
                {groupedOutcomes.responsibility.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      {lt.eqfDefinedOutcomesIntro.replace('{courseLabel}', courseLabel)}
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      {groupedOutcomes.responsibility.map((outcome, idx) => (
                        <li key={outcome.id}>
                          {idx + 1}. {outcome.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Select value={descriptorMatches.responsibilityAutonomy} onValueChange={(val) => updateDescriptor('responsibilityAutonomy', val)}>
                  <SelectTrigger id="autonomy-select">
                    <SelectValue placeholder={lt.eqfSelectAutonomyPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {eqfDescriptors.map((desc) => (
                      <SelectItem key={`autonomy-${desc.level}`} value={desc.level.toString()}>
                        Level {desc.level}: {desc.autonomy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>

          {/* Suggested Level and Manual Confirmation */}
          {suggestedLevel && (
            <>
              <Card className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">{lt.eqfSuggestedLevelLabel}</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="inline-flex items-center text-primary hover:text-primary/80 transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{lt.eqfSuggestedLevelDialogTitle}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-sm">
                          <p className="font-medium">{lt.eqfCalcMethodTitle}</p>
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium">{lt.eqfCalcRule1Title}</p>
                              <p className="text-muted-foreground pl-4">{lt.eqfCalcRule1Text}</p>
                              <p className="text-muted-foreground pl-4 italic">{lt.eqfCalcRule1Example}</p>
                            </div>
                            <div>
                              <p className="font-medium">{lt.eqfCalcRule2Title}</p>
                              <p className="text-muted-foreground pl-4">{lt.eqfCalcRule2Text}</p>
                              <p className="text-muted-foreground pl-4 italic">{lt.eqfCalcRule2Example1}</p>
                              <p className="text-muted-foreground pl-4 italic">{lt.eqfCalcRule2Example2}</p>
                            </div>
                            <div>
                              <p className="font-medium">{lt.eqfCalcRule3Title}</p>
                              <p className="text-muted-foreground pl-4">{lt.eqfCalcRule3Text}</p>
                              <p className="text-muted-foreground pl-4 italic">{lt.eqfCalcRule3Example}</p>
                            </div>
                          </div>
                          <p className="pt-2">
                            {lt.eqfCalcMethodOutro}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
                    <span className="text-2xl font-semibold">{lt.eqfLevelWord} {suggestedLevel}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="final-level" className="text-base font-medium">
                    {lt.eqfFinalLevelLabel} <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {lt.eqfFinalLevelHint}
                  </p>
                  <Select value={finalLevel} onValueChange={setFinalLevel}>
                    <SelectTrigger id="final-level">
                      <SelectValue placeholder={lt.eqfSelectFinalLevelPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {lt.eqfLevelWord} {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {finalLevel && finalLevel !== suggestedLevel && (
                  <div className="space-y-2">
                    <Label htmlFor="reasoning" className="text-base font-medium">
                      {lt.eqfReasoningLabel} <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {lt.eqfReasoningHint}
                    </p>
                    <Textarea
                      id="reasoning"
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      placeholder={lt.eqfReasoningPlaceholder}
                      rows={5}
                      required
                    />
                  </div>
                )}
              </Card>

              {finalLevel && ((finalLevel === suggestedLevel) || (finalLevel !== suggestedLevel && reasoning)) && (
                <div className="p-6 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm leading-relaxed">
                    {lt.eqfCompletionTextMultiple.replace(/{courseLabel}/g, courseLabel)}
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
