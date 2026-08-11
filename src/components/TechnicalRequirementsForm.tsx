import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Plus, X, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CourseType } from '@/types/course';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms56bTranslations } from '@/lib/translations/forms56b';

const getAccessibilityChecklist = (lt: typeof forms56bTranslations['en']) => [
  {
    key: 'multipleEngagement',
    label: lt.trChecklistMultipleEngagementLabel,
    link: 'https://www.cast.org/what-we-do/universal-design-for-learning/',
    info: lt.trChecklistMultipleEngagementInfo,
  },
  {
    key: 'multipleRepresentation',
    label: lt.trChecklistMultipleRepresentationLabel,
    link: 'https://www.cast.org/what-we-do/universal-design-for-learning/',
    info: lt.trChecklistMultipleRepresentationInfo,
  },
  {
    key: 'multipleAction',
    label: lt.trChecklistMultipleActionLabel,
    link: 'https://www.cast.org/what-we-do/universal-design-for-learning/',
    info: lt.trChecklistMultipleActionInfo,
  },
  {
    key: 'perceivable',
    label: lt.trChecklistPerceivableLabel,
    link: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    info: lt.trChecklistPerceivableInfo,
  },
  {
    key: 'operable',
    label: lt.trChecklistOperableLabel,
    link: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    info: lt.trChecklistOperableInfo,
  },
  {
    key: 'understandable',
    label: lt.trChecklistUnderstandableLabel,
    link: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    info: lt.trChecklistUnderstandableInfo,
  },
  {
    key: 'robust',
    label: lt.trChecklistRobustLabel,
    link: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    info: lt.trChecklistRobustInfo,
  },
];

interface TechnicalRequirementsFormProps {
  value: any;
  onChange: (value: any) => void;
  courseType?: CourseType;
  learningResources?: string[];
}

export const TechnicalRequirementsForm = ({ 
  value = {}, 
  onChange, 
  courseType = 'micro-credential',
  learningResources = []
}: TechnicalRequirementsFormProps) => {
  const { language } = useLanguage();
  const lt = forms56bTranslations[language];
  const courseLabel = courseType === 'standalone' ? lt.trStandaloneLabel : lt.trMicroCredentialLabel;
  const accessibilityChecklist = getAccessibilityChecklist(lt);
  
  const data = {
    platforms: value.platforms || [''],
    platformsCompleted: value.platformsCompleted || false,
    requiresSoftwarePurchase: value.requiresSoftwarePurchase || '',
    selectedPurchaseResources: value.selectedPurchaseResources || [],
    accessibilityChecklist: value.accessibilityChecklist || {},
  };

  const completedPlatforms = data.platforms.filter((p: string) => p.trim() !== '');
  const canCompletePlatforms = completedPlatforms.length > 0;

  const handleChange = (field: string, fieldValue: any) => {
    onChange({ ...data, [field]: fieldValue });
  };

  const handlePlatformChange = (index: number, newValue: string) => {
    const updated = [...data.platforms];
    updated[index] = newValue;
    handleChange('platforms', updated);
  };

  const addPlatform = () => {
    handleChange('platforms', [...data.platforms, '']);
  };

  const removePlatform = (index: number) => {
    if (data.platforms.length > 1) {
      const updated = data.platforms.filter((_: string, i: number) => i !== index);
      handleChange('platforms', updated);
    }
  };

  const handleResourceToggle = (resource: string) => {
    const current = data.selectedPurchaseResources;
    const updated = current.includes(resource)
      ? current.filter((r: string) => r !== resource)
      : [...current, resource];
    handleChange('selectedPurchaseResources', updated);
  };

  const handleAccessibilityItem = (key: string, val: string) => {
    handleChange('accessibilityChecklist', { ...data.accessibilityChecklist, [key]: val });
  };

  return (
    <div className="space-y-6">
      {/* Header with info icon */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{lt.trHeading}</h3>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.trDialogTitle}</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <p>
                  {lt.trDialogIntro.replace('{courseLabel}', courseLabel)}
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{lt.trDialogBullet1}</li>
                  <li>{lt.trDialogBullet2}</li>
                  <li>{lt.trDialogBullet3}</li>
                </ul>
                <p>
                  {lt.trDialogOutro}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          {lt.trDescription.replace('{courseLabel}', courseLabel)}
        </p>
      </div>

      {/* Item 1: Digital platforms and external tools */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            {lt.trPlatformsLabel}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{lt.trPlatformsDialogTitle}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.trPlatformsDialogText.replace('{courseLabel}', courseLabel)}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-2">
          {data.platforms.map((platform: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={platform}
                onChange={(e) => handlePlatformChange(index, e.target.value)}
                placeholder={lt.trPlatformPlaceholder}
                className="flex-1"
              />
              {data.platforms.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlatform(index)}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {!data.platformsCompleted && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPlatform}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {lt.trAddPlatform}
            </Button>
            
            {canCompletePlatforms && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleChange('platformsCompleted', true)}
              >
                {lt.trComplete}
              </Button>
            )}
          </div>
        )}

        {data.platformsCompleted && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {lt.trPlatformsDefined.replace(/{count}/g, String(completedPlatforms.length)).replace(/{plural}/g, completedPlatforms.length !== 1 ? 'e' : '')}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleChange('platformsCompleted', false)}
                className="text-primary"
              >
                {lt.trEdit}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {completedPlatforms.map((platform: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-muted rounded-md text-sm">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Item 2: Software purchase requirement */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            {lt.trSoftwareLabel.replace('{courseLabel}', courseLabel)}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{lt.trSoftwareDialogTitle}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  {lt.trSoftwareDialogText}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <RadioGroup
          value={data.requiresSoftwarePurchase}
          onValueChange={(val) => handleChange('requiresSoftwarePurchase', val)}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="software-yes" />
            <Label htmlFor="software-yes" className="font-normal cursor-pointer">{lt.yes}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="software-no" />
            <Label htmlFor="software-no" className="font-normal cursor-pointer">{lt.no}</Label>
          </div>
        </RadioGroup>

        {data.requiresSoftwarePurchase === 'yes' && data.platformsCompleted && completedPlatforms.length > 0 && (
          <div className="mt-4 space-y-3">
            <Label className="text-sm font-medium">{lt.trSelectPurchaseResources}</Label>
            <div className="space-y-2">
              {completedPlatforms.map((platform: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-purchase-${index}`}
                    checked={data.selectedPurchaseResources.includes(platform)}
                    onCheckedChange={() => handleResourceToggle(platform)}
                  />
                  <Label htmlFor={`platform-purchase-${index}`} className="font-normal cursor-pointer">
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.requiresSoftwarePurchase === 'yes' && (!data.platformsCompleted || completedPlatforms.length === 0) && (
          <p className="text-sm text-muted-foreground mt-2">
            {lt.trCompletePlatformsFirst}
          </p>
        )}
      </Card>

      {/* Accessibility checklist */}
      <Card className="p-6 space-y-5">
        <div className="space-y-1">
          <Label className="text-base font-medium">
            {lt.trAccessibilityLabel}
          </Label>
          <p className="text-sm text-muted-foreground">
            {lt.trAccessibilityDescription}
          </p>
        </div>

        <div className="space-y-4">
          {accessibilityChecklist.map((item) => (
            <div key={item.key} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium leading-snug">
                  {item.label}
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-primary hover:text-primary/80 shrink-0">
                      <Info className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{item.label}</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm">
                      <p>{item.info}</p>
                    </div>
                  </DialogContent>
                </Dialog>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-primary hover:text-primary/80 shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 text-sm">
                    <p>
                      {lt.trReadMoreInfo}
                    </p>
                    {item.link.includes('w3.org') && (
                      <p className="mt-1">
                        {lt.trReadMoreW3}
                      </p>
                    )}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline mt-2 inline-block"
                    >
                      {lt.trReadMoreLink}
                    </a>
                  </PopoverContent>
                </Popover>
              </div>
              <RadioGroup
                value={data.accessibilityChecklist[item.key] || ''}
                onValueChange={(val) => handleAccessibilityItem(item.key, val)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`${item.key}-yes`} />
                  <Label htmlFor={`${item.key}-yes`} className="font-normal cursor-pointer">{lt.yes}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${item.key}-no`} />
                  <Label htmlFor={`${item.key}-no`} className="font-normal cursor-pointer">{lt.no}</Label>
                </div>
              </RadioGroup>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};