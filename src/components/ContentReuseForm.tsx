import { useEffect, useState, useCallback } from 'react';
import { CourseType } from '@/types/heroes';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Info, MapPin, Calendar, ChevronDown, ChevronUp, Clock, Plus, X, Pencil, Check, Sparkles, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningActivity {
  id: string;
  activity: string;
  timeStructure: string;
  deliveryMode: string;
  participationForm: string;
  notes: string;
}

interface ESCOSkill {
  uri: string;
  title: string;
}

interface AlignedSkill {
  id: string;
  title: string;
  source: 'market' | 'additional';
}

interface Instructor {
  id: string;
  name: string;
  title: string;
  institution: string;
  additionalInfo?: string;
}

interface SourceInstructor {
  name: string;
  title: string;
  institution: string;
  additionalInfo?: string;
  sourceTitle: string;
}

interface ContentReuseFormProps {
  data: {
    reuseCondition?: 'open-access' | 'by-request' | 'no';
    physicalDays?: number;
    teachingLocations?: string;
    courseDurationMode?: 'async' | 'time-bound';
    estimatedWeeks?: number;
    alignedSkills?: AlignedSkill[];
    additionalAlignedSkills?: string[];
    instructors?: Instructor[];
    confirmedTitle?: string;
    additionalPrerequisites?: Array<{ id: string; description: string }>;
    administrativeNotes?: Array<{ id: string; description: string }>;
    _sourceInstructorsImported?: boolean;
  };
  onChange: (data: ContentReuseFormProps['data']) => void;
  courseType: CourseType;
  learningActivitiesData?: {
    activities?: LearningActivity[];
    isComplete?: boolean;
  };
  marketNeedsData?: {
    escoCompetences?: ESCOSkill[];
    additionalCompetences?: string;
  };
  workingTitle?: string;
  sourceInstructors?: SourceInstructor[];
}

export default function ContentReuseForm({ data, onChange, courseType, learningActivitiesData, marketNeedsData, workingTitle, sourceInstructors }: ContentReuseFormProps) {
  const [physicalSectionOpen, setPhysicalSectionOpen] = useState(true);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkillText, setEditingSkillText] = useState('');
  const [newSkillText, setNewSkillText] = useState('');
  
  // ESCO search state
  const [escoSearchOpen, setEscoSearchOpen] = useState(false);
  const [escoSearchValue, setEscoSearchValue] = useState('');
  const [escoResults, setEscoResults] = useState<ESCOSkill[]>([]);
  const [isSearchingEsco, setIsSearchingEsco] = useState(false);
  const [escoSearchError, setEscoSearchError] = useState<string | null>(null);

  // Debounced ESCO API search
  const searchESCO = useCallback(async (query: string) => {
    if (query.length < 2) {
      setEscoResults([]);
      return;
    }

    setIsSearchingEsco(true);
    setEscoSearchError(null);

    try {
      const response = await fetch(
        `https://ec.europa.eu/esco/api/search?text=${encodeURIComponent(query)}&language=en&type=skill&limit=20`
      );

      if (!response.ok) {
        throw new Error('ESCO API request failed');
      }

      const result = await response.json();
      
      const skills: ESCOSkill[] = (result._embedded?.results || []).map((item: any) => ({
        uri: item.uri,
        title: item.title,
      }));

      setEscoResults(skills);
    } catch (error) {
      console.error('ESCO search error:', error);
      setEscoSearchError('Unable to search ESCO. Please try again.');
      setEscoResults([]);
    } finally {
      setIsSearchingEsco(false);
    }
  }, []);

  // Debounce ESCO search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (escoSearchValue) {
        searchESCO(escoSearchValue);
      } else {
        setEscoResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [escoSearchValue, searchESCO]);

  // Auto-import instructors from standalone sources (composite or single-source MC) once
  useEffect(() => {
    if (!sourceInstructors || sourceInstructors.length === 0) return;
    if (data._sourceInstructorsImported) return;

    const existing = data.instructors || [];
    const keyOf = (n?: string, inst?: string) =>
      `${(n || '').trim().toLowerCase()}|${(inst || '').trim().toLowerCase()}`;
    const existingKeys = new Set(existing.map((i) => keyOf(i.name, i.institution)));

    const imported: Instructor[] = [];
    sourceInstructors.forEach((s) => {
      if (!s.name && !s.institution) return;
      const k = keyOf(s.name, s.institution);
      if (existingKeys.has(k)) return;
      existingKeys.add(k);
      imported.push({
        id: crypto.randomUUID(),
        name: s.name,
        title: s.title,
        institution: s.institution,
        additionalInfo: s.additionalInfo || (s.sourceTitle ? `From source: ${s.sourceTitle}` : ''),
      });
    });

    if (imported.length === 0) {
      onChange({ ...data, _sourceInstructorsImported: true });
      return;
    }

    onChange({
      ...data,
      instructors: [...existing, ...imported],
      _sourceInstructorsImported: true,
    });
  }, [sourceInstructors, data, onChange]);

  const handleAddEscoSkill = (skill: ESCOSkill) => {
    // Check if skill already exists
    const existingSkills = [...alignedSkills.map(s => s.title), ...additionalAlignedSkills];
    if (!existingSkills.includes(skill.title)) {
      onChange({
        ...data,
        additionalAlignedSkills: [...(data.additionalAlignedSkills || []), skill.title],
      });
    }
    setEscoSearchOpen(false);
    setEscoSearchValue('');
    setEscoResults([]);
  };

  const handleReuseChange = (value: 'open-access' | 'by-request' | 'no') => {
    onChange({
      ...data,
      reuseCondition: value,
    });
  };

  // Initialize aligned skills from market needs if not already set
  useEffect(() => {
    if (!data.alignedSkills && marketNeedsData) {
      const escoSkills: AlignedSkill[] = (marketNeedsData.escoCompetences || []).map((skill) => ({
        id: skill.uri,
        title: skill.title,
        source: 'market' as const,
      }));
      
      // Parse additional competences (split by newlines or commas)
      const additionalText = marketNeedsData.additionalCompetences || '';
      const additionalSkills: AlignedSkill[] = additionalText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((title, index) => ({
          id: `additional-${index}`,
          title,
          source: 'market' as const,
        }));
      
      if (escoSkills.length > 0 || additionalSkills.length > 0) {
        onChange({
          ...data,
          alignedSkills: [...escoSkills, ...additionalSkills],
          additionalAlignedSkills: data.additionalAlignedSkills || [],
        });
      }
    }
  }, [marketNeedsData]);

  // Check if any learning activities require physical presence
  const activities = learningActivitiesData?.activities || [];
  const physicalOrHybridActivities = activities.filter(
    (a) => a.deliveryMode === 'physical' || a.deliveryMode === 'hybrid'
  );
  const hasPhysicalRequirements = physicalOrHybridActivities.length > 0;

  // Check if any learning activities have synchronous time structure
  const synchronousActivities = activities.filter(
    (a) => a.timeStructure === 'synchronous'
  );
  const hasSynchronousActivities = synchronousActivities.length > 0;

  // Async option is disabled if there are physical/hybrid or synchronous activities
  const isAsyncDisabled = hasPhysicalRequirements || hasSynchronousActivities;

  // Auto-collapse if no physical requirements
  useEffect(() => {
    if (!hasPhysicalRequirements) {
      setPhysicalSectionOpen(false);
    } else {
      setPhysicalSectionOpen(true);
    }
  }, [hasPhysicalRequirements]);

  // Clear async selection if it becomes invalid
  useEffect(() => {
    if (isAsyncDisabled && data.courseDurationMode === 'async') {
      onChange({ ...data, courseDurationMode: undefined });
    }
  }, [isAsyncDisabled, data.courseDurationMode]);

  const physicalDays = data.physicalDays ?? '';
  const teachingLocations = data.teachingLocations ?? '';
  const requiresLocations = typeof data.physicalDays === 'number' && data.physicalDays > 0;
  const estimatedWeeks = data.estimatedWeeks ?? '';
  
  // Skills alignment helpers
  const alignedSkills = data.alignedSkills || [];
  const additionalAlignedSkills = data.additionalAlignedSkills || [];
  
  const handleRemoveSkill = (skillId: string) => {
    onChange({
      ...data,
      alignedSkills: alignedSkills.filter((s) => s.id !== skillId),
    });
  };
  
  const handleStartEditSkill = (skill: AlignedSkill) => {
    setEditingSkillId(skill.id);
    setEditingSkillText(skill.title);
  };
  
  const handleSaveEditSkill = () => {
    if (editingSkillId && editingSkillText.trim()) {
      onChange({
        ...data,
        alignedSkills: alignedSkills.map((s) =>
          s.id === editingSkillId ? { ...s, title: editingSkillText.trim() } : s
        ),
      });
    }
    setEditingSkillId(null);
    setEditingSkillText('');
  };
  
  const handleAddAdditionalSkill = () => {
    if (newSkillText.trim()) {
      onChange({
        ...data,
        additionalAlignedSkills: [...additionalAlignedSkills, newSkillText.trim()],
      });
      setNewSkillText('');
    }
  };
  
  const handleRemoveAdditionalSkill = (index: number) => {
    onChange({
      ...data,
      additionalAlignedSkills: additionalAlignedSkills.filter((_, i) => i !== index),
    });
  };
  
  // Combined final skills list
  const finalSkillsList = [
    ...alignedSkills.map((s) => s.title),
    ...additionalAlignedSkills,
  ];

  return (
    <div className="space-y-8">
      {/* ============ SECTION: Additional prerequisites (top, highlighted) ============ */}
      <div className="space-y-6">
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Additional prerequisites {courseType === 'standalone' ? 'for the standalone course' : 'beyond standalone courses'}
              </h3>
              <p className="text-sm text-muted-foreground">
                List any special requirements the learner must fulfil before being eligible for the {courseType === 'standalone' ? 'standalone course' : 'standalone course or assessment'}. Examples: documented laboratory safety certificate, valid driver's license, vaccination record, prior professional experience, signed ethics declaration, etc.
              </p>
            </div>

            {(data.additionalPrerequisites || []).map((prereq, idx) => (
              <div key={prereq.id} className="flex gap-2 items-start">
                <Textarea
                  value={prereq.description}
                  onChange={(e) => {
                    const updated = (data.additionalPrerequisites || []).map(p =>
                      p.id === prereq.id ? { ...p, description: e.target.value } : p
                    );
                    onChange({ ...data, additionalPrerequisites: updated });
                  }}
                  placeholder={`Prerequisite ${idx + 1} — e.g. "Documented laboratory safety certificate from accredited provider"`}
                  className="flex-1 min-h-[60px] text-sm bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = (data.additionalPrerequisites || []).filter(p => p.id !== prereq.id);
                    onChange({ ...data, additionalPrerequisites: updated });
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = data.additionalPrerequisites || [];
                onChange({
                  ...data,
                  additionalPrerequisites: [
                    ...current,
                    { id: `prereq-${Date.now()}`, description: '' },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add prerequisite
            </Button>

            {(data.additionalPrerequisites || []).length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No additional prerequisites added. Click "Add prerequisite" if there are special requirements{courseType === 'standalone' ? ' for this course' : ' beyond the standalone courses'}.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ SECTION 1: Reuse of Learning Content ============ */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Reuse of learning content within the alliance</h3>
          <p className="text-sm text-muted-foreground">
            Indicate whether the learning content and materials developed for this micro-credential may be reused by other course developers within the alliance. This information supports collaboration, responsible reuse, and clarity about how content may be adapted or shared in other educational contexts.
          </p>
        </div>

        {/* Main Question Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Question Header with Info Icon */}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Label className="text-base font-medium">
                  Under which conditions may the learning content and materials be reused by other course developers within the alliance?
                  <span className="text-destructive ml-1">*</span>
                </Label>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                    aria-label="More information about reuse of learning content"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reuse of learning content</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      This question concerns internal reuse within the alliance.
                    </p>
                    <p>
                      It does not replace formal copyright or licensing agreements, but clarifies how other course developers may engage with and build upon the content.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Dropdown Select */}
            <Select
              value={data.reuseCondition || ''}
              onValueChange={handleReuseChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select reuse condition..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open-access">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Open access</span>
                    <span className="text-xs text-muted-foreground">All content may be reused and re-didactised</span>
                  </div>
                </SelectItem>
                <SelectItem value="by-request">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">By request</span>
                    <span className="text-xs text-muted-foreground">Reuse possible after dialogue with lead designer</span>
                  </div>
                </SelectItem>
                <SelectItem value="no">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">No</span>
                    <span className="text-xs text-muted-foreground">Materials restricted to this micro-credential</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Validation Message */}
            {!data.reuseCondition && (
              <p className="text-sm text-muted-foreground italic">
                Please select one option.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ SECTION 2: Physical Presence Requirements ============ */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Section Header */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Physical presence requirements</h3>
            <p className="text-sm text-muted-foreground">
              This section clarifies whether the micro-credential requires physical attendance.
              The information is derived from the delivery modes defined earlier and ensures transparency for learners, institutions, and planners.
            </p>
          </div>

          {/* Conditional display based on learning activities */}
          {!hasPhysicalRequirements ? (
            <Collapsible open={physicalSectionOpen} onOpenChange={setPhysicalSectionOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full text-left py-3 px-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 flex-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">No physical attendance required based on current learning activity design.</span>
                </div>
                {physicalSectionOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  <p>
                    Based on your learning activity design in Phase 5, no activities are marked as "Physical" or "Hybrid".
                    If this changes, this section will become mandatory.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div className="space-y-6">
              {/* Physical days field */}
              <div className="space-y-3">
                <Label htmlFor="physicalDays" className="text-base font-medium">
                  Number of physical teaching days
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Based on the learning activities that require physical presence, indicate the total number of days learners must attend in person.
                </p>
                <Input
                  id="physicalDays"
                  type="number"
                  min={0}
                  value={physicalDays}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    onChange({ ...data, physicalDays: value });
                  }}
                  placeholder="Enter number of days"
                  className="max-w-xs"
                />
                
                {/* Show count of physical/hybrid activities */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {physicalOrHybridActivities.length} learning {physicalOrHybridActivities.length === 1 ? 'activity requires' : 'activities require'} physical or hybrid delivery
                  </span>
                </div>
              </div>

              {/* Teaching locations field */}
              <div className={cn("space-y-3", !requiresLocations && "opacity-50")}>
                <Label htmlFor="teachingLocations" className="text-base font-medium">
                  Teaching locations
                  {requiresLocations && <span className="text-destructive ml-1">*</span>}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Specify the location(s) where physical teaching will take place.
                </p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-3" />
                  <Textarea
                    id="teachingLocations"
                    value={teachingLocations}
                    onChange={(e) => onChange({ ...data, teachingLocations: e.target.value })}
                    placeholder={"Campus X, Building A\nPartner institution Y, City, Country"}
                    disabled={!requiresLocations}
                    className="min-h-[100px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter one location per line
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ SECTION 3: Course Duration and Learning Period ============ */}
      <div className="space-y-6">
        {/* Section Header / Meta Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Course duration and learning period</h3>
          <p className="text-sm text-muted-foreground">
            This step clarifies the temporal structure of the micro-credential.
            The available options depend on the delivery modes defined earlier.
            Fully asynchronous access is only possible if no physical or synchronous elements are included.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Overall course duration field */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                How is the learning period for this micro-credential structured?
                <span className="text-destructive ml-1">*</span>
              </Label>

              <RadioGroup
                value={data.courseDurationMode || ''}
                onValueChange={(value: 'async' | 'time-bound') => {
                  onChange({
                    ...data,
                    courseDurationMode: value,
                    // Clear weeks if switching to async
                    estimatedWeeks: value === 'async' ? undefined : data.estimatedWeeks,
                  });
                }}
                className="space-y-3"
              >
                {/* Option A: Fully asynchronous */}
                <div className={cn(
                  "flex items-start space-x-3 rounded-lg border p-4",
                  isAsyncDisabled && "opacity-50 cursor-not-allowed bg-muted/30"
                )}>
                  <RadioGroupItem
                    value="async"
                    id="async"
                    disabled={isAsyncDisabled}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="async"
                      className={cn(
                        "text-sm font-medium cursor-pointer",
                        isAsyncDisabled && "cursor-not-allowed"
                      )}
                    >
                      Fully asynchronous, self-paced (access anytime)
                    </Label>
                    {isAsyncDisabled && (
                      <p className="text-xs text-muted-foreground">
                        This option is unavailable because the course includes physical or synchronous learning activities.
                      </p>
                    )}
                  </div>
                </div>

                {/* Option B: Time-bound */}
                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <RadioGroupItem
                    value="time-bound"
                    id="time-bound"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="time-bound" className="text-sm font-medium cursor-pointer">
                      Time-bound learning period
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional content based on selection */}
            {data.courseDurationMode === 'async' && (
              <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg border">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Learners may start and complete the course independently without a fixed time window.
                </p>
              </div>
            )}

            {data.courseDurationMode === 'time-bound' && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Label htmlFor="estimatedWeeks" className="text-base font-medium">
                      Estimated duration of the learning period
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Indicate the approximate length of the learning period.
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                        aria-label="More information about estimated duration"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Estimated duration</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 text-muted-foreground">
                        <p>
                          Provide an approximate duration. This should reflect the overall learning timeline, not detailed scheduling.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input
                    id="estimatedWeeks"
                    type="number"
                    min={1}
                    value={estimatedWeeks}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      onChange({ ...data, estimatedWeeks: value });
                    }}
                    placeholder="Enter number"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground font-medium">weeks</span>
                </div>
              </div>
            )}

            {/* Validation Message */}
            {!data.courseDurationMode && (
              <p className="text-sm text-muted-foreground italic">
                Please select one option.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ SECTION 4: Alignment with Market-Relevant Skills ============ */}
      <div className="space-y-6">
        {/* Section Header / Meta Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Alignment with market-relevant skills</h3>
          <p className="text-sm text-muted-foreground">
            In Phase 3, market and stakeholder needs were used to identify a set of relevant skills.
            This step ensures alignment between those identified market-relevant skills and the actual skills learners will develop through this micro-credential.
          </p>
          <p className="text-sm text-muted-foreground">
            You may confirm, remove, or extend the skill set to reflect what the course genuinely delivers.
            The final list represents the skills that this micro-credential credibly awards.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Subsection 1: Market-identified skills */}
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Label className="text-base font-medium">
                    Market-identified skills (from Phase 3)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    These skills were identified based on external or market needs. Review whether they are actually achieved through the learning activities and assessment design of this course.
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                      aria-label="More information about market-identified skills"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Market-identified skills</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        These skills were identified based on external or market needs. Review whether they are actually achieved through the learning activities and assessment design of this course.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {alignedSkills.length > 0 ? (
                <div className="space-y-2">
                  {alignedSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                    >
                      {editingSkillId === skill.id ? (
                        <>
                          <Input
                            value={editingSkillText}
                            onChange={(e) => setEditingSkillText(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveEditSkill}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSkillId(null);
                              setEditingSkillText('');
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="flex-1 text-sm">{skill.title}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditSkill(skill)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSkill(skill.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">
                    No skills were identified in Phase 3. You can add skills in the section below.
                  </p>
                </div>
              )}
            </div>

            {/* Subsection 2: Additional skills */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Label className="text-base font-medium">
                    Additional skills developed through the course
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Are there additional skills that learners will develop through this micro-credential that were not identified as market needs?
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                      aria-label="More information about additional skills"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Additional skills</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        Include skills that are meaningfully developed and assessed through the course, even if they were not part of the initial market analysis.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* List of additional skills */}
              {additionalAlignedSkills.length > 0 && (
                <div className="space-y-2">
                  {additionalAlignedSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-background"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-sm">{skill}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdditionalSkill(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* ESCO Search */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Search ESCO skills</Label>
                <Popover open={escoSearchOpen} onOpenChange={setEscoSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Search className="h-4 w-4" />
                      Search ESCO skills and competences...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 z-[9999] bg-popover" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type to search ESCO..."
                        value={escoSearchValue}
                        onValueChange={setEscoSearchValue}
                      />
                      <CommandList>
                        {isSearchingEsco && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">Searching ESCO...</span>
                          </div>
                        )}
                        {escoSearchError && (
                          <div className="py-6 text-center text-sm text-destructive">{escoSearchError}</div>
                        )}
                        {!isSearchingEsco && !escoSearchError && escoResults.length === 0 && escoSearchValue.length >= 2 && (
                          <CommandEmpty>No skills found. Try a different search term.</CommandEmpty>
                        )}
                        {!isSearchingEsco && !escoSearchError && escoSearchValue.length < 2 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            Enter at least 2 characters to search
                          </div>
                        )}
                        {!isSearchingEsco && escoResults.length > 0 && (
                          <CommandGroup heading="ESCO Skills & Competences">
                            {escoResults.map((skill) => (
                              <CommandItem
                                key={skill.uri}
                                value={skill.uri}
                                onSelect={() => handleAddEscoSkill(skill)}
                                className="cursor-pointer"
                              >
                                <span className="line-clamp-2">{skill.title}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Manual skill input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Or add a custom skill</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    placeholder="Enter a skill manually..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAdditionalSkill();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAdditionalSkill}
                    disabled={!newSkillText.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Subsection 3: Final skills alignment check */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Final skills alignment check
                </Label>
                <p className="text-sm text-muted-foreground">
                  Check that the skills listed below accurately represent the skills learners will achieve by completing this {courseType === 'standalone' ? 'standalone course' : 'micro-credential'} — otherwise delete them above.
                </p>
              </div>

              {finalSkillsList.length > 0 ? (
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="flex flex-wrap gap-2">
                    {finalSkillsList.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="py-1.5 px-3">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">
                    No skills have been confirmed. Please add or retain at least one skill.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============ SECTION 5b: Course Instructors ============ */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Who will lead the course</h3>
              <p className="text-sm text-muted-foreground">
                Add the instructors or course leaders below. This is optional, but recording this information early can simplify administrative and communication processes later.
              </p>
              {sourceInstructors && sourceInstructors.length > 0 && (
                <div className="mt-2 p-3 rounded-md border border-primary/20 bg-primary/5 text-sm text-foreground">
                  Instructors from the underlying standalone {sourceInstructors.length === 1 ? 'source' : 'sources'} have been pre-filled below. You can edit, remove, or add additional instructors.
                </div>
              )}
            </div>

            {(data.instructors || []).map((instructor, idx) => (
              <div key={instructor.id} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Instructor {idx + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = (data.instructors || []).filter(i => i.id !== instructor.id);
                      onChange({ ...data, instructors: updated });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm">Name</Label>
                    <Input
                      value={instructor.name}
                      onChange={(e) => {
                        const updated = (data.instructors || []).map(i =>
                          i.id === instructor.id ? { ...i, name: e.target.value } : i
                        );
                        onChange({ ...data, instructors: updated });
                      }}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Title</Label>
                    <Input
                      value={instructor.title}
                      onChange={(e) => {
                        const updated = (data.instructors || []).map(i =>
                          i.id === instructor.id ? { ...i, title: e.target.value } : i
                        );
                        onChange({ ...data, instructors: updated });
                      }}
                      placeholder="e.g. Associate Professor"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Institution</Label>
                    <Input
                      value={instructor.institution}
                      onChange={(e) => {
                        const updated = (data.instructors || []).map(i =>
                          i.id === instructor.id ? { ...i, institution: e.target.value } : i
                        );
                        onChange({ ...data, instructors: updated });
                      }}
                      placeholder="e.g. University of..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Additional information <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    value={instructor.additionalInfo || ''}
                    onChange={(e) => {
                      const updated = (data.instructors || []).map(i =>
                        i.id === instructor.id ? { ...i, additionalInfo: e.target.value } : i
                      );
                      onChange({ ...data, instructors: updated });
                    }}
                    placeholder="e.g. contact email, area of expertise..."
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() => {
                const newInstructor: Instructor = {
                  id: crypto.randomUUID(),
                  name: '',
                  title: '',
                  institution: '',
                };
                onChange({ ...data, instructors: [...(data.instructors || []), newInstructor] });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add instructor
            </Button>
          </CardContent>
        </Card>
      </div>



      {/* ============ SECTION 6: Title Confirmation ============ */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Confirm title</h3>
              <p className="text-sm text-muted-foreground">
                Review and confirm the final title for this {courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential'}. 
                The working title from Phase 2 is shown below. You may revise it if needed.
              </p>
            </div>

            {workingTitle && (
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-1">Working title from Phase 2:</p>
                <p className="font-medium">{workingTitle}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmedTitle" className="text-base font-medium">
                Final title
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="confirmedTitle"
                value={data.confirmedTitle || workingTitle || ''}
                onChange={(e) => onChange({ ...data, confirmedTitle: e.target.value })}
                placeholder="Enter the final title..."
                className="max-w-xl"
              />
              <p className="text-sm text-muted-foreground italic">
                This title will appear on the final credential and in official documentation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============ SECTION: Administrative / delivery notes (bottom, highlighted) ============ */}
      <div className="space-y-6">
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Additional information regarding this learning unit
              </h3>
              <p className="text-sm text-muted-foreground">
                This is a free-text field. Add any information about this learning unit that hasn't found its place elsewhere in the framework — for example details about delivery, administration, handover between institutions, special arrangements, historical context, or anything else worth documenting. Add as many entries as you need.
              </p>
            </div>

            {(data.administrativeNotes || []).map((note, idx) => (
              <div key={note.id} className="flex gap-2 items-start">
                <Textarea
                  value={note.description}
                  onChange={(e) => {
                    const updated = (data.administrativeNotes || []).map(n =>
                      n.id === note.id ? { ...n, description: e.target.value } : n
                    );
                    onChange({ ...data, administrativeNotes: updated });
                  }}
                  placeholder={`Note ${idx + 1} — e.g. "Delivered jointly with partner institution X every spring semester"`}
                  className="flex-1 min-h-[60px] text-sm bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = (data.administrativeNotes || []).filter(n => n.id !== note.id);
                    onChange({ ...data, administrativeNotes: updated });
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = data.administrativeNotes || [];
                onChange({
                  ...data,
                  administrativeNotes: [
                    ...current,
                    { id: `adminnote-${Date.now()}`, description: '' },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add information
            </Button>

            {(data.administrativeNotes || []).length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No additional information added. This is optional — only add an entry if you have something extra worth documenting.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
