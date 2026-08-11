import { useState, useEffect, useCallback, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Info, Lightbulb, X, Search, Loader2, Upload, FileText, BookOpen } from 'lucide-react';
import {
  Popover as ReadMorePopover,
  PopoverContent as ReadMorePopoverContent,
  PopoverTrigger as ReadMorePopoverTrigger,
} from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { CourseType } from '@/types/heroes';

interface ESCOSkill {
  uri: string;
  title: string;
}

interface MarketNeedsFormProps {
  value: any;
  onChange: (value: any) => void;
  courseType?: CourseType;
}

export const MarketNeedsForm = ({ value = {}, onChange, courseType = 'micro-credential' }: MarketNeedsFormProps) => {
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [escoResults, setEscoResults] = useState<ESCOSkill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  

  const data = {
    labourMarketNeed: value.labourMarketNeed || '',
    longTermRelevance: value.longTermRelevance || '',
    escoCompetences: value.escoCompetences || [] as ESCOSkill[],
    additionalCompetences: value.additionalCompetences || '',
    
  };

  // Debounced ESCO API search
  const searchESCO = useCallback(async (query: string) => {
    if (query.length < 2) {
      setEscoResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

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
      setSearchError('Unable to search ESCO. Please try again.');
      setEscoResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue) {
        searchESCO(searchValue);
      } else {
        setEscoResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, searchESCO]);

  const handleAddCompetence = (skill: ESCOSkill) => {
    if (!data.escoCompetences.find((s: ESCOSkill) => s.uri === skill.uri)) {
      onChange({ ...data, escoCompetences: [...data.escoCompetences, skill] });
    }
    setOpen(false);
    setSearchValue('');
    setEscoResults([]);
  };

  const handleRemoveCompetence = (uri: string) => {
    onChange({
      ...data,
      escoCompetences: data.escoCompetences.filter((s: ESCOSkill) => s.uri !== uri),
    });
  };

  const hasAtLeastOneCompetence = data.escoCompetences.length > 0 || data.additionalCompetences.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Market needs</h3>
        <p className="text-sm text-muted-foreground">
          Market needs is the first analytical step in developing a {courseLabel}. In this phase, you document whether a real and well-defined labour-market need exists. The analysis covers three connected dimensions: the short-term need organisations experience now, the long-term labour-market and career relevance of that need, and how these needs translate into concrete competences that learners must acquire.
        </p>
      </div>

      {/* Section A - Labour Market Need */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              What is the labour-market need you are addressing? <span className="text-destructive">*</span>
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
                <div className="text-sm">
                  <p>
                    This step uncovers what is being demanded right now. The purpose is to identify current and emerging labour-market needs and understand which problems or competence gaps organisations experience. It is a short-term, need-oriented analysis that ensures the {courseLabel} is grounded in actual, documented labour-market demand.
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
                    <li>Use job postings, employer surveys and competence-gap analyses</li>
                    <li>Identify concrete problems organisations are trying to solve</li>
                    <li>Include early signals and short-term trends</li>
                    <li>Explain how you know the need exists (dialogue, data, systematic analysis)</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            Describe the immediate or emerging labour-market need and the specific problems or competence gaps organisations currently experience. Also indicate how you know the need exists.
          </p>
        </div>
        <Textarea
          value={data.labourMarketNeed}
          onChange={(e) => onChange({ ...data, labourMarketNeed: e.target.value })}
          placeholder="Describe the labour-market need clearly and specifically..."
          rows={5}
          required
        />
        
        {/* Note about appendices */}
        <p className="text-xs text-muted-foreground italic">
          If you have produced any analyses, studies, or other supporting material, you are encouraged to keep them as appendices to this work.
        </p>

        {!data.labourMarketNeed && (
          <p className="text-xs text-muted-foreground">The need must be described clearly and supported by evidence.</p>
        )}
      </Card>

      {/* Section B - Long-term Relevance */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              Why is this need relevant in a long-term labour-market and career perspective? <span className="text-destructive">*</span>
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
                <div className="text-sm">
                  <p>
                    This step evaluates why the need is relevant beyond short-term fluctuations. It requires analysing job profiles, qualification structures, career pathways and labour-market trends to ensure that the need has lasting career and labour-market relevance. This is a long-term, structural analysis.
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
                    <li>Use projections, labour-market reports and sector analyses</li>
                    <li>Connect the need to evolving job roles and qualifications</li>
                    <li>Show how the need persists over time</li>
                    <li>Link short-term signals to longer structural trends</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            Explain why this need has long-term relevance by connecting it to job roles, qualification frameworks, career pathways or labour-market structures.
          </p>
        </div>
        <Textarea
          value={data.longTermRelevance}
          onChange={(e) => onChange({ ...data, longTermRelevance: e.target.value })}
          placeholder="Explain the long-term relevance using labour-market evidence..."
          rows={5}
          required
        />
        {!data.longTermRelevance && (
          <p className="text-xs text-muted-foreground">Must reference long-term labour-market evidence.</p>
        )}
      </Card>

      {/* Section C - Competences */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              Which competences or skills are required to meet this need? <span className="text-destructive">*</span>
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
                <div className="text-sm">
                  <p>
                    This step addresses how the identified need is transformed into measurable competences. The goal is to ensure traceability from documented need to specific learning outcomes.
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
                    <li>Map competences using ESCO</li>
                    <li>Validate with sector representatives</li>
                    <li>Add emerging competences not yet represented in frameworks</li>
                    <li>Ensure direct alignment with identified need</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
            <ReadMorePopover>
              <ReadMorePopoverTrigger asChild>
                <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs font-medium">Read more</span>
                </button>
              </ReadMorePopoverTrigger>
              <ReadMorePopoverContent className="w-80 text-sm space-y-2">
                <p>You can explore the full ESCO classification of skills, competences, and occupations to better understand how to select relevant entries.</p>
                <p>Visit the official ESCO database here:</p>
                <a
                  href="https://esco.ec.europa.eu/en/classification/skill_main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                >
                  https://esco.ec.europa.eu/en/classification/skill_main
                </a>
              </ReadMorePopoverContent>
            </ReadMorePopover>
          </div>
          <p className="text-sm text-muted-foreground">
            Translate the identified need into concrete competences that learners must acquire.
          </p>
        </div>

        {/* ESCO Search */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">ESCO competences</Label>
          <p className="text-sm text-muted-foreground">
            Use the search field below to find and select competences from the European Skills, Competences, Qualifications and Occupations (ESCO) classification. ESCO provides a standardised terminology across the EU, making it easier to align your micro-credential with recognised labour-market competences.
          </p>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Search className="h-4 w-4" />
                Search ESCO skills and competences...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Type to search ESCO..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  {isSearching && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Searching ESCO...</span>
                    </div>
                  )}
                  {searchError && (
                    <div className="py-6 text-center text-sm text-destructive">{searchError}</div>
                  )}
                  {!isSearching && !searchError && escoResults.length === 0 && searchValue.length >= 2 && (
                    <CommandEmpty>No competences found. Try a different search term.</CommandEmpty>
                  )}
                  {!isSearching && !searchError && searchValue.length < 2 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Enter at least 2 characters to search
                    </div>
                  )}
                  {!isSearching && escoResults.length > 0 && (
                    <CommandGroup heading="ESCO Skills & Competences">
                      {escoResults.map((skill) => (
                        <CommandItem
                          key={skill.uri}
                          value={skill.uri}
                          onSelect={() => handleAddCompetence(skill)}
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

          {data.escoCompetences.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.escoCompetences.map((skill: ESCOSkill) => (
                <Badge key={skill.uri} variant="secondary" className="gap-1 py-1.5 px-3">
                  <span className="max-w-[200px] truncate">{skill.title}</span>
                  <button
                    onClick={() => handleRemoveCompetence(skill.uri)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Additional Competences */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Additional competences not covered by ESCO (optional)</Label>
          <Textarea
            value={data.additionalCompetences}
            onChange={(e) => onChange({ ...data, additionalCompetences: e.target.value })}
            placeholder="Describe any additional competences or skills not found in ESCO..."
            rows={3}
          />
        </div>

        {!hasAtLeastOneCompetence && (
          <p className="text-xs text-muted-foreground">At least one competence must be provided.</p>
        )}
      </Card>
    </div>
  );
};
