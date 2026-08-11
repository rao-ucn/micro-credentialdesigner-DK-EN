import React from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Check, AlertCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

interface SupplementaryConsiderationsFormProps {
  multimodalData: {
    activeEngagement?: string[];
    applicationTransfer?: string[];
  };
  value: {
    plenaryDecision?: 'incorporate' | 'leave-out';
    explorationDecision?: 'incorporate' | 'leave-out';
    reflectionDecision?: 'incorporate' | 'leave-out';
    challengeDecision?: 'incorporate' | 'leave-out';
    realWorldDecision?: 'incorporate' | 'leave-out';
    // Feedback literacy
    feedbackLiteracy?: 'yes' | 'no';
    feedbackLiteracyDescription?: string;
    feedbackLiteracyReconsider?: 'leave-out' | 'reconsider';
    // Final confirmation
    finalConfirmation?: 'yes' | 'partly' | 'no';
    finalConfirmationComment?: string;
  };
  onChange: (newValue: SupplementaryConsiderationsFormProps['value']) => void;
  onIncorporate: (field: string, checkField: string, checkValue: string) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  basedOnSingleSource?: boolean;
}

const SupplementaryConsiderationsForm: React.FC<SupplementaryConsiderationsFormProps> = ({
  multimodalData,
  value,
  onChange,
  onIncorporate,
  courseType,
  basedOnSingleSource,
}) => {
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const isLocked = courseType === 'composite-micro-credential' || basedOnSingleSource === true;

  // Conditional reflection configuration
  const CONSIDERATIONS = [
    {
      id: 'exploration',
      field: 'explorationDecision' as const,
      checkField: 'activeEngagement' as const,
      checkValue: 'exploration',
      rationale: lt.scExplorationRationale,
      incorporateLabel: lt.scExplorationIncorporate,
      leaveOutLabel: lt.scExplorationLeaveOut,
    },
    {
      id: 'reflection',
      field: 'reflectionDecision' as const,
      checkField: 'activeEngagement' as const,
      checkValue: 'reflection',
      rationale: lt.scReflectionRationale,
      incorporateLabel: lt.scReflectionIncorporate,
      leaveOutLabel: lt.scReflectionLeaveOut,
    },
    {
      id: 'challenge',
      field: 'challengeDecision' as const,
      checkField: 'activeEngagement' as const,
      checkValue: 'challenge-based',
      rationale: lt.scChallengeRationale,
      incorporateLabel: lt.scChallengeIncorporate,
      leaveOutLabel: lt.scChallengeLeaveOut,
    },
    {
      id: 'realWorld',
      field: 'realWorldDecision' as const,
      checkField: 'applicationTransfer' as const,
      checkValue: 'real-world',
      rationale: lt.scRealWorldRationale,
      incorporateLabel: lt.scRealWorldIncorporate,
      leaveOutLabel: lt.scRealWorldLeaveOut,
    },
  ];

  // Determine which considerations to show (only those NOT already selected in multimodal)
  const getApplicableConsiderations = () => {
    return CONSIDERATIONS.filter(consideration => {
      const selectedOptions = multimodalData[consideration.checkField] || [];
      return !selectedOptions.includes(consideration.checkValue);
    });
  };

  const applicableConsiderations = getApplicableConsiderations();

  const handleDecisionChange = (
    field: keyof typeof value, 
    decision: 'incorporate' | 'leave-out',
    consideration: typeof CONSIDERATIONS[0]
  ) => {
    const updated = { ...value, [field]: decision };
    onChange(updated);

    // If incorporating, also update the multimodal data
    if (decision === 'incorporate') {
      onIncorporate(field, consideration.checkField, consideration.checkValue);
    }
  };

  // Check already selected items for display
  const getAlreadySelectedItems = () => {
    const items: string[] = [];
    const activeEngagement = multimodalData.activeEngagement || [];
    const applicationTransfer = multimodalData.applicationTransfer || [];
    
    if (activeEngagement.includes('exploration')) items.push(lt.scAlreadySelectedExploration);
    if (activeEngagement.includes('reflection')) items.push(lt.scAlreadySelectedReflection);
    if (activeEngagement.includes('challenge-based')) items.push(lt.scAlreadySelectedChallenge);
    if (applicationTransfer.includes('real-world')) items.push(lt.scAlreadySelectedRealWorld);
    
    return items;
  };

  const alreadySelectedItems = getAlreadySelectedItems();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-2xl font-bold text-foreground">{lt.scTitle}</h2>
      </div>

      {isLocked && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{lt.scLocked}</span>{' '}
            {courseType === 'composite-micro-credential'
              ? lt.scLockedCompositeText
              : lt.scLockedSingleText}
          </p>
        </div>
      )}

      {/* Meta text */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lt.scMeta}
        </p>
      </Card>

      {/* Already selected from multimodal */}
      {alreadySelectedItems.length > 0 && (
        <Card className="p-6 space-y-3 border-primary bg-muted/30">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">{lt.scAlreadyIncludedTitle}</h3>
          </div>
          <ul className="space-y-1 pl-7">
            {alreadySelectedItems.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Considerations for items NOT selected */}
      {applicableConsiderations.length > 0 ? (
        <div className="space-y-4">
          <div className="border-l-4 border-primary pl-4">
            <h3 className="text-lg font-semibold text-foreground">{lt.scConsiderationsTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {lt.scConsiderationsIntro}
            </p>
          </div>

          {applicableConsiderations.map((consideration) => (
            <Card key={consideration.id} className="p-6 space-y-4 border-muted bg-muted/30">
              <p className="text-sm text-foreground leading-relaxed">
                {consideration.rationale}
              </p>
              
              <RadioGroup
                value={value[consideration.field] || ''}
                onValueChange={(decision) => handleDecisionChange(
                  consideration.field, 
                  decision as 'incorporate' | 'leave-out',
                  consideration
                )}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="incorporate" id={`${consideration.id}-incorporate`}  disabled={isLocked} />
                  <Label htmlFor={`${consideration.id}-incorporate`} className="font-normal cursor-pointer">
                    {consideration.incorporateLabel}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="leave-out" id={`${consideration.id}-leave`}  disabled={isLocked} />
                  <Label htmlFor={`${consideration.id}-leave`} className="font-normal cursor-pointer">
                    {consideration.leaveOutLabel}
                  </Label>
                </div>
              </RadioGroup>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 border-primary bg-muted/30">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            <p className="text-sm text-foreground">
              {lt.scAllAddressed}
            </p>
          </div>
        </Card>
      )}

      {/* Completion indicator */}
      {applicableConsiderations.length > 0 && (
        <Card className="p-4 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              {lt.scAddressedCount
                .replace('{addressed}', String(applicableConsiderations.filter(c => value[c.field]).length))
                .replace('{total}', String(applicableConsiderations.length))}
            </span>
          </div>
        </Card>
      )}

      {/* Feedback Literacy Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{lt.scFeedbackTitle}</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{lt.scFeedbackWhatTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {lt.scFeedbackWhatText1}
                </p>
                <p>
                  {lt.scFeedbackWhatText2}
                </p>
                <p>
                  {lt.scFeedbackWhatText3}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm text-foreground">
          {lt.scFeedbackQuestion.replace(/{course}/g, courseType === 'micro-credential' ? lt.scCourseMicroCredential : lt.scCourseGeneric)}
        </p>

        <RadioGroup
          value={value.feedbackLiteracy || ''}
          onValueChange={(val) => onChange({ ...value, feedbackLiteracy: val as 'yes' | 'no', feedbackLiteracyReconsider: undefined })}
          className="space-y-2"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="yes" id="feedback-yes"  disabled={isLocked} />
            <Label htmlFor="feedback-yes" className="font-normal cursor-pointer">
              {lt.scFeedbackYes}
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="no" id="feedback-no"  disabled={isLocked} />
            <Label htmlFor="feedback-no" className="font-normal cursor-pointer">
              {lt.scFeedbackNo}
            </Label>
          </div>
        </RadioGroup>

        {/* Conditional: If YES - show description field */}
        {value.feedbackLiteracy === 'yes' && (
          <div className="space-y-2 pl-6 border-l-2 border-primary/30">
            <Label htmlFor="feedback-description" className="text-sm font-medium">
              {lt.scFeedbackDescriptionLabel}
            </Label>
            <Textarea disabled={isLocked}
              id="feedback-description"
              value={value.feedbackLiteracyDescription || ''}
              onChange={(e) => onChange({ ...value, feedbackLiteracyDescription: e.target.value })}
              placeholder={lt.scFeedbackDescriptionPlaceholder}
              className="min-h-[100px]"
            />
          </div>
        )}

        {/* Conditional: If NO - show reflection box */}
        {value.feedbackLiteracy === 'no' && (
          <div className="space-y-4 pl-6 border-l-2 border-muted">
            <Card className="p-4 bg-muted/30 border-muted">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lt.scFeedbackNoText}
              </p>
            </Card>

            <RadioGroup
              value={value.feedbackLiteracyReconsider || ''}
              onValueChange={(val) => {
                if (val === 'reconsider') {
                  onChange({ ...value, feedbackLiteracy: 'yes', feedbackLiteracyReconsider: undefined });
                } else {
                  onChange({ ...value, feedbackLiteracyReconsider: val as 'leave-out' | 'reconsider' });
                }
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="leave-out" id="feedback-leave-out"  disabled={isLocked} />
                <Label htmlFor="feedback-leave-out" className="font-normal cursor-pointer">
                  {lt.scFeedbackLeaveOut}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="reconsider" id="feedback-reconsider"  disabled={isLocked} />
                <Label htmlFor="feedback-reconsider" className="font-normal cursor-pointer">
                  {lt.scFeedbackReconsider}
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </Card>

    </div>
  );
};

export default SupplementaryConsiderationsForm;
