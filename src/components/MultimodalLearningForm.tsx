import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check } from 'lucide-react';

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

const CONTENT_REPRESENTATION_OPTIONS = [
  { id: 'written', label: 'Written materials (texts, PDFs, articles)' },
  { id: 'visual', label: 'Visual materials (slides, diagrams, infographics)' },
  { id: 'video', label: 'Video materials (presentation videos)' },
  { id: 'audio', label: 'Audio explanations (podcasts)' },
  { id: 'interactive', label: 'Interactive digital content' },
  { id: 'demonstrations', label: 'Demonstrations or walkthroughs' },
  { id: 'other', label: 'Other format' },
];

const ACTIVE_ENGAGEMENT_OPTIONS = [
  { id: 'plenary', label: 'Discussions in plenary' },
  { id: 'peer-learning', label: 'Peer-learning interaction' },
  { id: 'exercises', label: 'Practical exercises or applied tasks' },
  { id: 'exploration', label: 'Exploration and experiencing together' },
  { id: 'reflection', label: 'Reflection activities' },
  { id: 'challenge-based', label: 'Challenge-based learning' },
  { id: 'independent-work', label: 'Independent work / individual study' },
  { id: 'other', label: 'Other' },
];

const APPLICATION_TRANSFER_OPTIONS = [
  { id: 'practice-tasks', label: 'Practice-oriented tasks' },
  { id: 'simulations', label: 'Simulations or scenarios' },
  { id: 'project-portfolio', label: 'Project or portfolio elements' },
  { id: 'real-world', label: 'Real-world or workplace-related activities' },
  { id: 'other', label: 'Other' },
];

const MultimodalLearningForm: React.FC<MultimodalLearningFormProps> = ({
  data,
  onChange,
  courseType,
  basedOnSingleSource,
}) => {
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
        <h2 className="text-2xl font-bold text-foreground">Use multimodal learning resources</h2>
      </div>

      {isLocked && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Locked.</span>{' '}
            {courseType === 'composite-micro-credential'
              ? 'These choices are inherited from the underlying standalone course(s) and cannot be edited here. All formats and activities used by any of the source courses are pre-selected.'
              : 'These choices are inherited from the underlying standalone course and cannot be edited here.'}
          </p>
        </div>
      )}

      {/* Meta text */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Learning outcomes are realised through content and activity. In this step, you define how learners encounter content, actively work with it, and apply it in practice. Start by making your own design choices. You will later be invited to reflect on whether additional modalities could strengthen learning.
        </p>
      </Card>

      {/* Block 1: Content Representation */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Content representation</h3>
        <p className="text-sm text-muted-foreground">
          How will core concepts and themes be presented to learners?
        </p>
        <p className="text-xs text-muted-foreground">
          Select at least 2 formats ({formData.contentRepresentation.length}/2 selected)
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
              Please specify:
            </Label>
            <Input
              id="content-other-text"
              value={formData.contentRepresentationOther}
              onChange={(e) => updateField('contentRepresentationOther', e.target.value)}
              placeholder="Describe other format..."
              className="max-w-md"
              disabled={isLocked}
            />
          </div>
        )}
      </Card>

      {/* Block 2: Active Engagement */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Active engagement with content</h3>
        <p className="text-sm text-muted-foreground">
          How will learners actively work with and process the content?
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
              Please specify:
            </Label>
            <Input
              id="engagement-other-text"
              value={formData.activeEngagementOther}
              onChange={(e) => updateField('activeEngagementOther', e.target.value)}
              placeholder="Describe other engagement method..."
              className="max-w-md"
              disabled={isLocked}
            />
          </div>
        )}
      </Card>

      {/* Block 3: Application and Transfer */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Application and transfer of learning</h3>
        <p className="text-sm text-muted-foreground">
          How will learners apply what they have learned in meaningful ways?
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
              Please specify:
            </Label>
            <Input
              id="transfer-other-text"
              value={formData.applicationTransferOther}
              onChange={(e) => updateField('applicationTransferOther', e.target.value)}
              placeholder="Describe other application method..."
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
