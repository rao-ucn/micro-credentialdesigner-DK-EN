import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

interface MultimodalLearningFormProps {
  data: {
    contentRepresentation?: string[];
    contentRepresentationOther?: string;
    activeEngagement?: string[];
    activeEngagementOther?: string;
    applicationTransfer?: string[];
    applicationTransferOther?: string;
    // Final confirmation
    finalConfirmation?: 'yes' | 'partly' | 'no';
    finalConfirmationComment?: string;
  };
  onChange: (data: MultimodalLearningFormProps['data']) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
  basedOnSingleSource?: boolean;
}

const MultimodalLearningForm: React.FC<MultimodalLearningFormProps> = ({
  data,
  onChange,
  courseType,
  basedOnSingleSource,
}) => {
  const { language } = useLanguage();
  const lt = forms34Translations[language];

  const CONTENT_REPRESENTATION_OPTIONS = [
    { id: 'written', label: lt.mlContentWritten },
    { id: 'visual', label: lt.mlContentVisual },
    { id: 'video', label: lt.mlContentVideo },
    { id: 'audio', label: lt.mlContentAudio },
    { id: 'interactive', label: lt.mlContentInteractive },
    { id: 'demonstrations', label: lt.mlContentDemonstrations },
    { id: 'other', label: lt.mlContentOther },
  ];

  const ACTIVE_ENGAGEMENT_OPTIONS = [
    { id: 'plenary', label: lt.mlEngagementPlenary },
    { id: 'peer-learning', label: lt.mlEngagementPeerLearning },
    { id: 'exercises', label: lt.mlEngagementExercises },
    { id: 'exploration', label: lt.mlEngagementExploration },
    { id: 'reflection', label: lt.mlEngagementReflection },
    { id: 'challenge-based', label: lt.mlEngagementChallengeBased },
    { id: 'independent-work', label: lt.mlEngagementIndependentWork },
    { id: 'other', label: lt.mlEngagementOther },
  ];

  const APPLICATION_TRANSFER_OPTIONS = [
    { id: 'practice-tasks', label: lt.mlTransferPracticeTasks },
    { id: 'simulations', label: lt.mlTransferSimulations },
    { id: 'project-portfolio', label: lt.mlTransferProjectPortfolio },
    { id: 'real-world', label: lt.mlTransferRealWorld },
    { id: 'other', label: lt.mlTransferOther },
  ];

  const isLocked = courseType === 'composite-micro-credential' || basedOnSingleSource === true;
  const [formData, setFormData] = useState({
    contentRepresentation: data.contentRepresentation || [],
    contentRepresentationOther: data.contentRepresentationOther || '',
    activeEngagement: data.activeEngagement || [],
    activeEngagementOther: data.activeEngagementOther || '',
    applicationTransfer: data.applicationTransfer || [],
    applicationTransferOther: data.applicationTransferOther || '',
    finalConfirmation: data.finalConfirmation || '',
    finalConfirmationComment: data.finalConfirmationComment || '',
  });

  useEffect(() => {
    setFormData({
      contentRepresentation: data.contentRepresentation || [],
      contentRepresentationOther: data.contentRepresentationOther || '',
      activeEngagement: data.activeEngagement || [],
      activeEngagementOther: data.activeEngagementOther || '',
      applicationTransfer: data.applicationTransfer || [],
      applicationTransferOther: data.applicationTransferOther || '',
      finalConfirmation: data.finalConfirmation || '',
      finalConfirmationComment: data.finalConfirmationComment || '',
    });
  }, [data]);

  const updateField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated as MultimodalLearningFormProps['data']);
  };

  const toggleCheckbox = (field: 'contentRepresentation' | 'activeEngagement' | 'applicationTransfer', optionId: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    updateField(field, updated);
  };

  // Check if primary choices meet minimum requirements
  const hasMinimumContentRepresentation = formData.contentRepresentation.length >= 2;
  const hasActiveEngagement = formData.activeEngagement.length > 0;
  const hasApplicationTransfer = formData.applicationTransfer.length > 0;
  const allSectionsComplete = hasMinimumContentRepresentation && hasActiveEngagement && hasApplicationTransfer;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-2xl font-bold text-foreground">{lt.mlTitle}</h2>
      </div>

      {isLocked && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{lt.mlLocked}</span>{' '}
            {courseType === 'composite-micro-credential'
              ? lt.mlLockedCompositeText
              : lt.mlLockedSingleText}
          </p>
        </div>
      )}

      {/* Meta text */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lt.mlMeta}
        </p>
      </Card>

      {/* Block 1: Content Representation */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{lt.mlBlock1Title}</h3>
        <p className="text-sm text-muted-foreground">
          {lt.mlBlock1Question}
        </p>
        <p className="text-xs text-muted-foreground">
          {lt.mlBlock1MinNote.replace(/{count}/g, String(formData.contentRepresentation.length))}
        </p>

        <div className="space-y-3">
          {CONTENT_REPRESENTATION_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center space-x-3">
              <Checkbox
                id={`content-${option.id}`}
                checked={formData.contentRepresentation.includes(option.id)}
                onCheckedChange={() => toggleCheckbox('contentRepresentation', option.id)}
                disabled={isLocked}
              />
              <Label htmlFor={`content-${option.id}`} className="font-normal cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        {formData.contentRepresentation.includes('other') && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="content-other-text" className="text-sm font-medium">
              {lt.mlSpecify}
            </Label>
            <Input
              id="content-other-text"
              value={formData.contentRepresentationOther}
              onChange={(e) => updateField('contentRepresentationOther', e.target.value)}
              placeholder={lt.mlOtherFormatPlaceholder}
              className="max-w-md"
              disabled={isLocked}
            />
          </div>
        )}
      </Card>

      {/* Block 2: Active Engagement */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{lt.mlBlock2Title}</h3>
        <p className="text-sm text-muted-foreground">
          {lt.mlBlock2Question}
        </p>

        <div className="space-y-3">
          {ACTIVE_ENGAGEMENT_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center space-x-3">
              <Checkbox
                id={`engagement-${option.id}`}
                checked={formData.activeEngagement.includes(option.id)}
                onCheckedChange={() => toggleCheckbox('activeEngagement', option.id)}
                disabled={isLocked}
              />
              <Label htmlFor={`engagement-${option.id}`} className="font-normal cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        {formData.activeEngagement.includes('other') && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="engagement-other-text" className="text-sm font-medium">
              {lt.mlSpecify}
            </Label>
            <Input
              id="engagement-other-text"
              value={formData.activeEngagementOther}
              onChange={(e) => updateField('activeEngagementOther', e.target.value)}
              placeholder={lt.mlOtherEngagementPlaceholder}
              className="max-w-md"
              disabled={isLocked}
            />
          </div>
        )}
      </Card>

      {/* Block 3: Application and Transfer */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{lt.mlBlock3Title}</h3>
        <p className="text-sm text-muted-foreground">
          {lt.mlBlock3Question}
        </p>

        <div className="space-y-3">
          {APPLICATION_TRANSFER_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center space-x-3">
              <Checkbox
                id={`transfer-${option.id}`}
                checked={formData.applicationTransfer.includes(option.id)}
                onCheckedChange={() => toggleCheckbox('applicationTransfer', option.id)}
                disabled={isLocked}
              />
              <Label htmlFor={`transfer-${option.id}`} className="font-normal cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        {formData.applicationTransfer.includes('other') && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="transfer-other-text" className="text-sm font-medium">
              {lt.mlSpecify}
            </Label>
            <Input
              id="transfer-other-text"
              value={formData.applicationTransferOther}
              onChange={(e) => updateField('applicationTransferOther', e.target.value)}
              placeholder={lt.mlOtherTransferPlaceholder}
              className="max-w-md"
              disabled={isLocked}
            />
          </div>
        )}
      </Card>

    </div>
  );
};

export default MultimodalLearningForm;
