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

// Conditional reflection configuration
const CONSIDERATIONS = [
  {
    id: 'exploration',
    field: 'explorationDecision' as const,
    checkField: 'activeEngagement' as const,
    checkValue: 'exploration',
    rationale: 'Joint exploration and shared experiences can support situated learning and the development of shared reference points among learners.',
    incorporateLabel: 'I want to incorporate exploration and shared experiences',
    leaveOutLabel: 'I intentionally leave exploration out',
  },
  {
    id: 'reflection',
    field: 'reflectionDecision' as const,
    checkField: 'activeEngagement' as const,
    checkValue: 'reflection',
    rationale: 'Reflection activities support consolidation of learning and help learners connect new insights to prior knowledge and experience.',
    incorporateLabel: 'I want to incorporate reflection activities',
    leaveOutLabel: 'I intentionally leave reflection activities out',
  },
  {
    id: 'challenge',
    field: 'challengeDecision' as const,
    checkField: 'activeEngagement' as const,
    checkValue: 'challenge-based',
    rationale: 'Challenge-based learning can support problem-solving, integration of knowledge and transfer to complex situations.',
    incorporateLabel: 'I want to incorporate challenge-based learning',
    leaveOutLabel: 'I intentionally leave challenge-based learning out',
  },
  {
    id: 'realWorld',
    field: 'realWorldDecision' as const,
    checkField: 'applicationTransfer' as const,
    checkValue: 'real-world',
    rationale: 'Real-world or workplace-related activities can support transfer of learning beyond the course context and strengthen relevance to professional practice.',
    incorporateLabel: 'I want to incorporate real-world activities',
    leaveOutLabel: 'I intentionally leave real-world activities out',
  },
];

const SupplementaryConsiderationsForm: React.FC<SupplementaryConsiderationsFormProps> = ({
  multimodalData,
  value,
  onChange,
  onIncorporate,
  courseType,
  basedOnSingleSource,
}) => {
  const isLocked = courseType === 'composite-micro-credential' || basedOnSingleSource === true;
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
    
    if (activeEngagement.includes('exploration')) items.push('Exploration and experiencing together');
    if (activeEngagement.includes('reflection')) items.push('Reflection activities');
    if (activeEngagement.includes('challenge-based')) items.push('Challenge-based learning');
    if (applicationTransfer.includes('real-world')) items.push('Real-world or workplace-related activities');
    
    return items;
  };

  const alreadySelectedItems = getAlreadySelectedItems();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-2xl font-bold text-foreground">Supplementary learning considerations</h2>
      </div>

      {isLocked && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Locked.</span>{' '}
            {courseType === 'composite-micro-credential'
              ? 'These choices are inherited from the underlying standalone course(s) and cannot be edited here.'
              : 'These choices are inherited from the underlying standalone course and cannot be edited here.'}
          </p>
        </div>
      )}

      {/* Meta text */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Supplementary learning considerations address cross-cutting aspects that can strengthen learning quality without being mandatory design elements.
          The purpose of this section is to prompt reflection on whether additional pedagogical considerations should be addressed to support learners' ability to engage meaningfully with the learning process.
        </p>
      </Card>

      {/* Already selected from multimodal */}
      {alreadySelectedItems.length > 0 && (
        <Card className="p-6 space-y-3 border-primary bg-muted/30">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Already included in your design</h3>
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
            <h3 className="text-lg font-semibold text-foreground">Considerations</h3>
            <p className="text-sm text-muted-foreground">
              The following modalities were not selected. Please consider each and make an explicit decision.
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
              All supplementary learning considerations have been addressed in your multimodal learning design.
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
              {applicableConsiderations.filter(c => value[c.field]).length} of {applicableConsiderations.length} considerations addressed
            </span>
          </div>
        </Card>
      )}

      {/* Feedback Literacy Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Feedback literacy</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>What is feedback literacy?</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Feedback literacy refers to learners' ability to understand, interpret and use feedback to improve their learning.
                </p>
                <p>
                  This includes recognising feedback, making sense of it, and acting on it during the learning process.
                </p>
                <p>
                  Addressing feedback literacy can support deeper learning, self-regulation and progression, even when assessment is primarily summative.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm text-foreground">
          Do you intend to explicitly support learners' feedback literacy in this {courseType === 'micro-credential' ? 'micro-credential' : 'course'}?
        </p>

        <RadioGroup
          value={value.feedbackLiteracy || ''}
          onValueChange={(val) => onChange({ ...value, feedbackLiteracy: val as 'yes' | 'no', feedbackLiteracyReconsider: undefined })}
          className="space-y-2"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="yes" id="feedback-yes"  disabled={isLocked} />
            <Label htmlFor="feedback-yes" className="font-normal cursor-pointer">
              Yes, feedback literacy is explicitly supported
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="no" id="feedback-no"  disabled={isLocked} />
            <Label htmlFor="feedback-no" className="font-normal cursor-pointer">
              No, feedback literacy is not explicitly addressed
            </Label>
          </div>
        </RadioGroup>

        {/* Conditional: If YES - show description field */}
        {value.feedbackLiteracy === 'yes' && (
          <div className="space-y-2 pl-6 border-l-2 border-primary/30">
            <Label htmlFor="feedback-description" className="text-sm font-medium">
              Briefly describe how learners will be supported in understanding, interpreting or using feedback during the learning process.
            </Label>
            <Textarea disabled={isLocked}
              id="feedback-description"
              value={value.feedbackLiteracyDescription || ''}
              onChange={(e) => onChange({ ...value, feedbackLiteracyDescription: e.target.value })}
              placeholder="For example through formative feedback, peer feedback, guidance on using feedback, or opportunities to revise work."
              className="min-h-[100px]"
            />
          </div>
        )}

        {/* Conditional: If NO - show reflection box */}
        {value.feedbackLiteracy === 'no' && (
          <div className="space-y-4 pl-6 border-l-2 border-muted">
            <Card className="p-4 bg-muted/30 border-muted">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Feedback literacy is increasingly recognised as a key factor in meaningful learning.
                Even limited opportunities for feedback during learning activities can help learners understand expectations and improve their work.
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
                  I have considered this and intentionally leave it out
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="reconsider" id="feedback-reconsider"  disabled={isLocked} />
                <Label htmlFor="feedback-reconsider" className="font-normal cursor-pointer">
                  I would like to reconsider and address feedback literacy
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
