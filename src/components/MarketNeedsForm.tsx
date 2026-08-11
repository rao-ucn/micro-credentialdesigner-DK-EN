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
import { CourseType } from '@/types/course';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

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
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : lt.courseLabelMicroCredential;
  
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
      setSearchError(lt.mnEscoError);
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
        <h3 className="text-lg font-semibold">{lt.mnTitle}</h3>
        <p className="text-sm text-muted-foreground">
          {lt.mnIntro.replace(/{course}/g, courseLabel)}
        </p>
      </div>

      {/* Section A - Labour Market Need */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              {lt.mnQ1Label} <span className="text-destructive">*</span>
            </Label>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:text-primary/80">
                  <Info className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{lt.mnWhy}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <p>
                    {lt.mnQ1Why.replace(/{course}/g, courseLabel)}
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
                  <DialogTitle>{lt.mnInspiration}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>{lt.mnQ1InspireItem1}</li>
                    <li>{lt.mnQ1InspireItem2}</li>
                    <li>{lt.mnQ1InspireItem3}</li>
                    <li>{lt.mnQ1InspireItem4}</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            {lt.mnQ1Help}
          </p>
        </div>
        <Textarea
          value={data.labourMarketNeed}
          onChange={(e) => onChange({ ...data, labourMarketNeed: e.target.value })}
          placeholder={lt.mnQ1Placeholder}
          rows={5}
          required
        />
        
        {/* Note about appendices */}
        <p className="text-xs text-muted-foreground italic">
          {lt.mnAppendixNote}
        </p>

        {!data.labourMarketNeed && (
          <p className="text-xs text-muted-foreground">{lt.mnQ1Validation}</p>
        )}
      </Card>

      {/* Section B - Long-term Relevance */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              {lt.mnQ2Label} <span className="text-destructive">*</span>
            </Label>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:text-primary/80">
                  <Info className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{lt.mnWhy}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <p>
                    {lt.mnQ2Why}
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
                  <DialogTitle>{lt.mnInspiration}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>{lt.mnQ2InspireItem1}</li>
                    <li>{lt.mnQ2InspireItem2}</li>
                    <li>{lt.mnQ2InspireItem3}</li>
                    <li>{lt.mnQ2InspireItem4}</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            {lt.mnQ2Help}
          </p>
        </div>
        <Textarea
          value={data.longTermRelevance}
          onChange={(e) => onChange({ ...data, longTermRelevance: e.target.value })}
          placeholder={lt.mnQ2Placeholder}
          rows={5}
          required
        />
        {!data.longTermRelevance && (
          <p className="text-xs text-muted-foreground">{lt.mnQ2Validation}</p>
        )}
      </Card>

      {/* Section C - Competences */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              {lt.mnQ3Label} <span className="text-destructive">*</span>
            </Label>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:text-primary/80">
                  <Info className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{lt.mnWhy}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <p>
                    {lt.mnQ3Why}
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
                  <DialogTitle>{lt.mnInspiration}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>{lt.mnQ3InspireItem1}</li>
                    <li>{lt.mnQ3InspireItem2}</li>
                    <li>{lt.mnQ3InspireItem3}</li>
                    <li>{lt.mnQ3InspireItem4}</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
            <ReadMorePopover>
              <ReadMorePopoverTrigger asChild>
                <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs font-medium">{lt.mnReadMore}</span>
                </button>
              </ReadMorePopoverTrigger>
              <ReadMorePopoverContent className="w-80 text-sm space-y-2">
                <p>{lt.mnReadMoreText1}</p>
                <p>{lt.mnReadMoreText2}</p>
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
            {lt.mnQ3Help}
          </p>
        </div>

        {/* ESCO Search */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">{lt.mnEscoLabel}</Label>
          <p className="text-sm text-muted-foreground">
            {lt.mnEscoHelp}
          </p>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Search className="h-4 w-4" />
                {lt.mnEscoSearchButton}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={lt.mnEscoSearchPlaceholder}
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  {isSearching && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">{lt.mnEscoSearching}</span>
                    </div>
                  )}
                  {searchError && (
                    <div className="py-6 text-center text-sm text-destructive">{searchError}</div>
                  )}
                  {!isSearching && !searchError && escoResults.length === 0 && searchValue.length >= 2 && (
                    <CommandEmpty>{lt.mnEscoNoResults}</CommandEmpty>
                  )}
                  {!isSearching && !searchError && searchValue.length < 2 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {lt.mnEscoMinChars}
                    </div>
                  )}
                  {!isSearching && escoResults.length > 0 && (
                    <CommandGroup heading={lt.mnEscoGroupHeading}>
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
          <Label className="text-sm font-medium">{lt.mnAdditionalLabel}</Label>
          <Textarea
            value={data.additionalCompetences}
            onChange={(e) => onChange({ ...data, additionalCompetences: e.target.value })}
            placeholder={lt.mnAdditionalPlaceholder}
            rows={3}
          />
        </div>

        {!hasAtLeastOneCompetence && (
          <p className="text-xs text-muted-foreground">{lt.mnCompetenceValidation}</p>
        )}
      </Card>
    </div>
  );
};
