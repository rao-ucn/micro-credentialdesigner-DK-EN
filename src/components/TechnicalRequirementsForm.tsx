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

const accessibilityChecklist = [
  {
    key: 'multipleEngagement',
    label: 'Does your learning material offer multiple means of engagement?',
    link: 'https://www.cast.org/what-we-do/universal-design-for-learning/',
    info: 'Examples: offering choice of topics or formats, using real-world cases, allowing different pacing, including interactive elements.',
  },
  {
    key: 'multipleRepresentation',
    label: 'Does your content provide multiple means of representation?',
    link: 'https://www.cast.org/what-we-do/universal-design-for-learning/',
    info: 'Examples: combining text, video, audio, diagrams; providing captions or transcripts; using clear structure and visuals.',
  },
  {
    key: 'multipleAction',
    label: 'Do learners have multiple means of action and expression?',
    link: 'https://www.cast.org/what-we-do/universal-design-for-learning/',
    info: 'Examples: allowing written, oral, or visual submissions; offering different tools for completing tasks; flexible formats for demonstrating learning.',
  },
  {
    key: 'perceivable',
    label: 'Is all information perceivable?',
    link: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    info: 'Examples: captions on videos, transcripts for audio, alt-text for images, sufficient contrast, readable fonts, and documents that are OCR-processed and readable by assistive technologies.',
  },
  {
    key: 'operable',
    label: 'Is the user interface fully operable?',
    link: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    info: 'Examples: navigation via keyboard, clear and consistent interface elements, and use of established learning platforms (e.g. Teams, Moodle, Rise) that support standard accessibility features. Ensure that any additional tools or custom elements introduced do not reduce operability.',
  },
  {
    key: 'understandable',
    label: 'Is the content understandable?',
    link: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    info: 'Examples: clear instructions, consistent layout, simple language, predictable navigation.',
  },
  {
    key: 'robust',
    label: 'Is the content robust and compatible with assistive technologies?',
    link: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    info: 'Examples: compatibility with screen readers, proper HTML structure, use of standard formats.',
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
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  
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
          <h3 className="text-lg font-semibold">Technical requirements and platform compatibility</h3>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Technical requirements and accessibility</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <p>
                  The purpose of this step is to confirm that all technical aspects of the {courseLabel} function reliably. Developers should ensure that the chosen platforms, tools and learning resources:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>do not require unexpected costs for learners</li>
                  <li>meet basic accessibility principles such as UDL and WCAG</li>
                  <li>do not create barriers for participation</li>
                </ul>
                <p>
                  This confirmation prevents technical obstacles that may limit learning and engagement.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          This step ensures that the {courseLabel} can be completed without technical barriers. The developer must identify which digital platforms and tools are used, whether any additional software costs apply, and whether all learning resources comply with basic accessibility principles.
        </p>
      </div>

      {/* Item 1: Digital platforms and external tools */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            Which digital learning platforms or external tools will be used?
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Digital platforms and tools</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  List all digital learning platforms or external tools required for the {courseLabel} (e.g. Moodle, Teams, Canva, Rise, Miro, simulation tools).
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
                placeholder="Enter platform or tool name..."
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
              Add another platform/tool
            </Button>
            
            {canCompletePlatforms && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleChange('platformsCompleted', true)}
              >
                Complete
              </Button>
            )}
          </div>
        )}

        {data.platformsCompleted && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {completedPlatforms.length} platform{completedPlatforms.length !== 1 ? 's' : ''}/tool{completedPlatforms.length !== 1 ? 's' : ''} defined
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleChange('platformsCompleted', false)}
                className="text-primary"
              >
                Edit
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
            Must learners purchase any software to complete the {courseLabel}?
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Software purchase requirement</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <p>
                  If learners must pay for third-party software, specify it clearly and link it to the learning activities that require it.
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
            <Label htmlFor="software-yes" className="font-normal cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="software-no" />
            <Label htmlFor="software-no" className="font-normal cursor-pointer">No</Label>
          </div>
        </RadioGroup>

        {data.requiresSoftwarePurchase === 'yes' && data.platformsCompleted && completedPlatforms.length > 0 && (
          <div className="mt-4 space-y-3">
            <Label className="text-sm font-medium">Select the platforms/tools requiring additional purchase:</Label>
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
            Please complete the platforms/tools list above first.
          </p>
        )}
      </Card>

      {/* Accessibility checklist */}
      <Card className="p-6 space-y-5">
        <div className="space-y-1">
          <Label className="text-base font-medium">
            Accessibility and Universal Design checklist
          </Label>
          <p className="text-sm text-muted-foreground">
            Confirm that your learning resources meet the following UDL and WCAG principles. All items must be answered.
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
                      You can read more about this principle and how to apply it by following the link.
                    </p>
                    {item.link.includes('w3.org') && (
                      <p className="mt-1">
                        You may also search for relevant keywords on the page (e.g. perceivable, understandable, assistive) to quickly find the specific guideline.
                      </p>
                    )}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline mt-2 inline-block"
                    >
                      Read more →
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
                  <Label htmlFor={`${item.key}-yes`} className="font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${item.key}-no`} />
                  <Label htmlFor={`${item.key}-no`} className="font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};