import { useState } from 'react';
import { CourseType } from '@/types/heroes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Plus, Trash2, GripVertical, AlertTriangle, CheckCircle2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningActivity {
  id: string;
  activity: string;
  timeStructure: string;
  deliveryMode: string;
  participationForm: string;
  notes: string;
  _sourceTitle?: string;
}

interface ParticipationConstraints {
  minimumRequired: 'no' | 'yes';
  minimumNumber?: number;
  maximumRequired: 'no' | 'yes';
  maximumNumber?: number;
  openAccess: boolean;
}

interface LearningActivitiesFormProps {
  data: {
    activities?: LearningActivity[];
    confirmProceedWithoutCoverage?: boolean;
    isComplete?: boolean;
    multimodalConfirmed?: boolean;
    participationConstraints?: ParticipationConstraints;
  };
  onChange: (data: LearningActivitiesFormProps['data']) => void;
  courseType: CourseType;
  multimodalData?: {
    contentRepresentation?: string[];
    activeEngagement?: string[];
    applicationTransfer?: string[];
  };
  onBreakCompositeIntegrity?: () => void;
  basedOnSingleSource?: boolean;
  onBreakSingleSourceIntegrity?: () => void;
}

const TIME_STRUCTURE_OPTIONS = [
  { value: 'synchronous', label: 'Synchronous' },
  { value: 'asynchronous', label: 'Asynchronous' },
];

const DELIVERY_MODE_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'physical', label: 'Physical' },
  { value: 'hybrid', label: 'Hybrid' },
];

const PARTICIPATION_OPTIONS = [
  { value: 'individual', label: 'Individual (self-paced)' },
  { value: 'group', label: 'Group' },
  { value: 'whole-class', label: 'Whole class' },
];

export default function LearningActivitiesForm({
  data,
  onChange,
  courseType,
  multimodalData = {},
  onBreakCompositeIntegrity,
  basedOnSingleSource,
  onBreakSingleSourceIntegrity,
}: LearningActivitiesFormProps) {
  const [showCoverageDialog, setShowCoverageDialog] = useState(false);
  const [showActivityInfoDialog, setShowActivityInfoDialog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number | null>(null);
  const [pendingAddActivity, setPendingAddActivity] = useState(false);
  const [removalDialogStep, setRemovalDialogStep] = useState<'warning' | 'confirm' | null>(null);
  const [addDialogStep, setAddDialogStep] = useState<'warning' | 'confirm' | null>(null);

  const activities = data.activities || [];

  const updateData = (updates: Partial<LearningActivitiesFormProps['data']>) => {
    onChange({ ...data, ...updates });
  };

  const integrityGuardActive = courseType === 'composite-micro-credential' || basedOnSingleSource === true;

  const triggerBreakIntegrity = () => {
    if (courseType === 'composite-micro-credential') {
      onBreakCompositeIntegrity?.();
    } else if (basedOnSingleSource) {
      onBreakSingleSourceIntegrity?.();
    }
  };

  const addActivity = () => {
    if (integrityGuardActive) {
      setPendingAddActivity(true);
      setAddDialogStep('warning');
      return;
    }

    const newActivity: LearningActivity = {
      id: `activity-${Date.now()}`,
      activity: '',
      timeStructure: '',
      deliveryMode: '',
      participationForm: '',
      notes: '',
    };
    updateData({ activities: [...activities, newActivity] });
  };

  const confirmAddActivity = () => {
    const newActivity: LearningActivity = {
      id: `activity-${Date.now()}`,
      activity: '',
      timeStructure: '',
      deliveryMode: '',
      participationForm: '',
      notes: '',
    };

    updateData({ activities: [...activities, newActivity] });
    triggerBreakIntegrity();
    setPendingAddActivity(false);
    setAddDialogStep(null);
  };

  const updateActivity = (index: number, updates: Partial<LearningActivity>) => {
    const updated = activities.map((a, i) =>
      i === index ? { ...a, ...updates } : a
    );
    updateData({ activities: updated });
  };

  const removeActivity = (index: number) => {
    if (integrityGuardActive) {
      setPendingRemovalIndex(index);
      setRemovalDialogStep('warning');
      return;
    }

    updateData({ activities: activities.filter((_, i) => i !== index) });
  };

  const openFinalRemovalConfirmation = () => setRemovalDialogStep('confirm');

  const confirmRemoveActivity = () => {
    if (pendingRemovalIndex === null) return;

    updateData({ activities: activities.filter((_, i) => i !== pendingRemovalIndex) });
    triggerBreakIntegrity();
    setPendingRemovalIndex(null);
    setRemovalDialogStep(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newActivities = [...activities];
    const [draggedItem] = newActivities.splice(draggedIndex, 1);
    newActivities.splice(index, 0, draggedItem);
    updateData({ activities: newActivities });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get multimodal selections for display
  const hasMultimodalSelections = 
    (multimodalData.contentRepresentation?.length || 0) > 0 ||
    (multimodalData.activeEngagement?.length || 0) > 0 ||
    (multimodalData.applicationTransfer?.length || 0) > 0;

  // Check if an activity is complete (all required fields filled)
  const isActivityComplete = (activity: LearningActivity) => {
    return (
      activity.activity.trim() !== '' &&
      activity.timeStructure !== '' &&
      activity.deliveryMode !== '' &&
      activity.participationForm !== ''
    );
  };

  // Check if we can complete the section
  const hasAtLeastOneCompleteActivity = activities.some(isActivityComplete);
  const allFilledActivitiesComplete = activities.filter(a => 
    a.activity.trim() !== '' || a.timeStructure || a.deliveryMode || a.participationForm
  ).every(isActivityComplete);
  
  const canComplete = hasAtLeastOneCompleteActivity && allFilledActivitiesComplete;
  const isComplete = data.isComplete || false;
  
  // Participation constraints with defaults
  const participationConstraints: ParticipationConstraints = data.participationConstraints || {
    minimumRequired: 'no',
    maximumRequired: 'no',
    openAccess: false,
  };
  
  // Check if any activity uses synchronous time structure while open access is enabled
  const hasSynchronousWithOpenAccess = participationConstraints.openAccess && 
    activities.some(a => a.timeStructure === 'synchronous');

  // Check if Next Item should be enabled (multimodal must be confirmed when complete)
  const canProceedToNext = isComplete && (data.multimodalConfirmed || false);

  const handleComplete = () => {
    if (canComplete) {
      updateData({ isComplete: true });
    }
  };

  const handleEdit = () => {
    updateData({ isComplete: false });
  };

  // Get label for participation form
  const getParticipationLabel = (value: string) => {
    const option = PARTICIPATION_OPTIONS.find(o => o.value === value);
    return option?.label || value;
  };

  // Get label for time structure
  const getTimeStructureLabel = (value: string) => {
    const option = TIME_STRUCTURE_OPTIONS.find(o => o.value === value);
    return option?.label || value;
  };

  // Get label for delivery mode
  const getDeliveryModeLabel = (value: string) => {
    const option = DELIVERY_MODE_OPTIONS.find(o => o.value === value);
    return option?.label || value;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-2xl font-bold text-foreground">Develop learning activities</h2>
        </div>

        {/* Meta text */}
        <div className="text-muted-foreground space-y-2">
          <p>
            Learning activities define how learners engage with content over time.
            In this section, you will design a progressive sequence of learning activities that operationalise the learning outcomes and reflect the multimodal learning approaches you selected earlier.
          </p>
          <p>Each activity should have a clear purpose and contribute meaningfully to the learner's progression.</p>
        </div>

        {/* Multimodal Learning Reference (Permanent Reminder) */}
        {hasMultimodalSelections && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-sm font-medium text-foreground">
                  Multimodal learning reference
                </p>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                You previously defined how learning should be supported through multimodal learning resources.
                As you design learning activities, ensure that these approaches are reflected across the learning journey.
              </p>
              
              <div className="space-y-3">
                {multimodalData.contentRepresentation && multimodalData.contentRepresentation.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Content representation</p>
                    <div className="flex flex-wrap gap-1.5">
                      {multimodalData.contentRepresentation.map((item) => (
                        <span key={item} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {multimodalData.activeEngagement && multimodalData.activeEngagement.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Active engagement with content</p>
                    <div className="flex flex-wrap gap-1.5">
                      {multimodalData.activeEngagement.map((item) => (
                        <span key={item} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {multimodalData.applicationTransfer && multimodalData.applicationTransfer.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Application and transfer of learning</p>
                    <div className="flex flex-wrap gap-1.5">
                      {multimodalData.applicationTransfer.map((item) => (
                        <span key={item} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary instruction */}
        <p className="font-medium text-foreground">
          Build your learning activities as a progressive flow. Add activities one by one in the order learners will experience them.
        </p>


        {/* Activities Table - only show when not complete */}
        {activities.length > 0 && !isComplete && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      Learning activity
                      <button
                        type="button"
                        onClick={() => setShowActivityInfoDialog(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Info about learning activities"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[140px]">Time structure</TableHead>
                  <TableHead className="w-[130px]">Delivery mode</TableHead>
                  <TableHead className="w-[160px]">Participation form</TableHead>
                  <TableHead className="min-w-[150px]">Notes (optional)</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity, index) => (
                  <TableRow
                    key={activity.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'transition-all',
                      draggedIndex === index && 'opacity-50 bg-muted'
                    )}
                  >
                    <TableCell className="cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={activity.activity}
                        onChange={(e) => updateActivity(index, { activity: e.target.value })}
                        placeholder="Describe the learning activity..."
                        className="min-w-[180px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={activity.timeStructure}
                        onValueChange={(value) => updateActivity(index, { timeStructure: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_STRUCTURE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={activity.deliveryMode}
                        onValueChange={(value) => updateActivity(index, { deliveryMode: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={activity.participationForm}
                        onValueChange={(value) => updateActivity(index, { participationForm: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PARTICIPATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={activity.notes}
                        onChange={(e) => updateActivity(index, { notes: e.target.value })}
                        placeholder="Optional notes..."
                        className="min-w-[130px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(index)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Activity Button - only show when not complete */}
        {!isComplete && (
          <Button onClick={addActivity} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add learning activity
          </Button>
        )}

        {activities.length === 0 && !isComplete && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
            <p>No learning activities added yet.</p>
            <p className="text-sm">Click "Add learning activity" to begin designing your learner journey.</p>
          </div>
        )}

        {/* Complete/Edit Button */}
        {!isComplete ? (
          <TooltipProvider>
            <div className="pt-4 border-t">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      onClick={handleComplete}
                      disabled={!canComplete}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete learning activities
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canComplete && (
                  <TooltipContent>
                    <p>Add at least one complete learning activity to continue.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </TooltipProvider>
        ) : (
          <>
            {/* Summary View */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Learning activities overview</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  You have defined {activities.filter(isActivityComplete).length} learning {activities.filter(isActivityComplete).length === 1 ? 'activity' : 'activities'} for this micro-credential.
                </p>

                <div className="space-y-3">
                  {activities.filter(isActivityComplete).map((activity, index) => (
                    <div key={activity.id} className="bg-background rounded-lg p-3 border">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground mb-1">
                            {activity.activity}
                            {activity._sourceTitle && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                (from: {activity._sourceTitle})
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {getTimeStructureLabel(activity.timeStructure)}
                            </span>
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {getDeliveryModeLabel(activity.deliveryMode)}
                            </span>
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {getParticipationLabel(activity.participationForm)}
                            </span>
                          </div>
                          {activity.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Multimodal Confirmation Section */}
            <Card className="border-muted">
              <CardContent className="pt-4">
                <h3 className="font-semibold text-foreground mb-2">Multimodal learning confirmation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You previously defined how learning should be supported through multimodal learning resources.
                  Before continuing, please confirm that the learning activities defined above collectively address the selected multimodal approaches.
                </p>
                <div className="flex items-center gap-3">
                  <Switch
                    id="multimodal-confirm"
                    checked={data.multimodalConfirmed || false}
                    onCheckedChange={(checked) => updateData({ multimodalConfirmed: checked })}
                  />
                  <Label htmlFor="multimodal-confirm" className="text-sm cursor-pointer">
                    I have checked that the learning activities cover the multimodal learning approaches defined earlier and listed above.
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Participation Constraints Section */}
            <Card className="border-muted">
              <CardContent className="pt-4">
                <h3 className="font-semibold text-foreground mb-2">Participation constraints</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Specify whether the delivery of this micro-credential depends on a minimum or maximum number of participants, or whether it can run without limitations.
                </p>
                
                <div className="space-y-6">
                  {/* Warning: Synchronous activity with open access */}
                  {hasSynchronousWithOpenAccess && (
                    <Alert variant="destructive" className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-500/30">
                      <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
                      <AlertDescription className="ml-2">
                        <strong>OBS:</strong> One or more of your learning activities are set to <strong>Synchronous</strong>, which requires learners to participate at a specific time. This conflicts with the fully asynchronous, open-access nature of your course design.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Open Access Checkbox */}
                  <div className="flex items-start gap-3 pb-4 border-b">
                    <Checkbox
                      id="open-access"
                      checked={participationConstraints.openAccess}
                      onCheckedChange={(checked) => 
                        updateData({ 
                          participationConstraints: { 
                            ...participationConstraints, 
                            openAccess: checked as boolean,
                            minimumRequired: checked ? 'no' : participationConstraints.minimumRequired,
                            maximumRequired: checked ? 'no' : participationConstraints.maximumRequired,
                          } 
                        })
                      }
                    />
                    <Label htmlFor="open-access" className="text-sm cursor-pointer leading-relaxed">
                      This course is fully asynchronous and can run with open access, anytime and anywhere
                    </Label>
                  </div>

                  {/* Minimum Participants */}
                  <div className={cn("space-y-3", participationConstraints.openAccess && "opacity-50 pointer-events-none")}>
                    <Label className="text-sm font-medium">
                      Is a minimum number of participants required for the course to run?
                    </Label>
                    <Select
                      value={participationConstraints.minimumRequired}
                      onValueChange={(value: 'no' | 'yes') => 
                        updateData({ 
                          participationConstraints: { 
                            ...participationConstraints, 
                            minimumRequired: value,
                            minimumNumber: value === 'no' ? undefined : participationConstraints.minimumNumber
                          } 
                        })
                      }
                      disabled={participationConstraints.openAccess}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No minimum requirement</SelectItem>
                        <SelectItem value="yes">Yes – specify minimum number</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {participationConstraints.minimumRequired === 'yes' && !participationConstraints.openAccess && (
                      <div className="flex items-center gap-3">
                        <Label htmlFor="min-number" className="text-sm whitespace-nowrap">
                          Minimum participants required:
                        </Label>
                        <Input
                          id="min-number"
                          type="number"
                          min={1}
                          value={participationConstraints.minimumNumber || ''}
                          onChange={(e) => 
                            updateData({ 
                              participationConstraints: { 
                                ...participationConstraints, 
                                minimumNumber: e.target.value ? parseInt(e.target.value) : undefined 
                              } 
                            })
                          }
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>

                  {/* Maximum Participants */}
                  <div className={cn("space-y-3", participationConstraints.openAccess && "opacity-50 pointer-events-none")}>
                    <Label className="text-sm font-medium">
                      Is there a maximum number of participants due to capacity or pedagogical constraints?
                    </Label>
                    <Select
                      value={participationConstraints.maximumRequired}
                      onValueChange={(value: 'no' | 'yes') => 
                        updateData({ 
                          participationConstraints: { 
                            ...participationConstraints, 
                            maximumRequired: value,
                            maximumNumber: value === 'no' ? undefined : participationConstraints.maximumNumber
                          } 
                        })
                      }
                      disabled={participationConstraints.openAccess}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No maximum limit</SelectItem>
                        <SelectItem value="yes">Yes – specify maximum number</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {participationConstraints.maximumRequired === 'yes' && !participationConstraints.openAccess && (
                      <div className="flex items-center gap-3">
                        <Label htmlFor="max-number" className="text-sm whitespace-nowrap">
                          Maximum participants allowed:
                        </Label>
                        <Input
                          id="max-number"
                          type="number"
                          min={1}
                          value={participationConstraints.maximumNumber || ''}
                          onChange={(e) => 
                            updateData({ 
                              participationConstraints: { 
                                ...participationConstraints, 
                                maximumNumber: e.target.value ? parseInt(e.target.value) : undefined 
                              } 
                            })
                          }
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Learning Activity Info Dialog */}
        <Dialog open={showActivityInfoDialog} onOpenChange={setShowActivityInfoDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Learning activity</DialogTitle>
              <DialogDescription className="sr-only">
                Guidance on writing learning activities
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Describe the activity from the learner's perspective. Focus on what the learner actively does, not on the teaching format or material type.
              </p>
              <div>
                <p className="font-medium text-foreground mb-2">A learning activity should:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>describe a concrete learner action</li>
                  <li>show how the learner engages with content, others, or practice</li>
                  <li>support progression towards the learning outcomes</li>
                </ul>
              </div>
              <p>
                Avoid listing formats alone (e.g. "video", "group work"). Instead, describe the learner's action in relation to the format.
              </p>
              <div>
                <p className="font-medium text-foreground mb-2">Examples of well-formulated learning activities:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Watch a short video and identify key concepts</li>
                  <li>Read a case and analyse the main challenge using the framework</li>
                  <li>Participate in a discussion to compare alternative solutions</li>
                  <li>Apply the method to a new scenario individually</li>
                  <li>Collaborate in a group to develop a shared solution</li>
                  <li>Complete a quiz to check understanding</li>
                  <li>Present findings and receive peer feedback</li>
                  <li>Reflect in writing on how the concept applies to own practice</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Coverage Dialog */}
        <Dialog open={showCoverageDialog} onOpenChange={setShowCoverageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Multimodal approach coverage
              </DialogTitle>
              <DialogDescription className="sr-only">
                Some multimodal approaches are not reflected in your activities
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Based on your earlier selections for multimodal learning resources, some approaches are not yet reflected in the learning activities.
                You may revise the activities now or continue and address this later.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowCoverageDialog(false)}
              >
                Revise learning activities
              </Button>
              <Button
                onClick={() => {
                  updateData({ confirmProceedWithoutCoverage: true });
                  setShowCoverageDialog(false);
                }}
              >
                Continue anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={removalDialogStep === 'warning'}
          onOpenChange={(open) => {
            if (!open) {
              setRemovalDialogStep((curr) => {
                if (curr === 'confirm') return curr;
                setPendingRemovalIndex(null);
                return null;
              });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Remove learning activity?
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 text-sm">
                  {courseType === 'composite-micro-credential' ? (
                    <>
                      <p>
                        This composite micro-credential will no longer remain a combined micro-credential based on independent standalone courses if you continue.
                      </p>
                      <p>
                        Instead, the imported standalone courses will be treated as one combined standalone course that can be edited as a single whole.
                      </p>
                      <p>
                        This is required because the standalone courses used here are packaged and quality-assured as independent units, and changes to imported learning activities must break that original structure.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This micro-credential is currently based directly on a single existing standalone course. If you remove a learning activity, it will no longer be a faithful representation of that source course.
                      </p>
                      <p>
                        It will be treated as an independent micro-credential going forward, and the link to the original standalone course will be considered modified.
                      </p>
                      <p>
                        This is required because the source standalone course is packaged and quality-assured as an independent unit.
                      </p>
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setPendingRemovalIndex(null); setRemovalDialogStep(null); }}>
                Cancel
              </Button>
              <Button onClick={openFinalRemovalConfirmation}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={removalDialogStep === 'confirm'}
          onOpenChange={(open) => {
            setRemovalDialogStep(open ? 'confirm' : 'warning');
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Are you sure?
              </DialogTitle>
              <DialogDescription>
                This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setRemovalDialogStep('warning')}>
                Go back
              </Button>
              <Button
                onClick={confirmRemoveActivity}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={addDialogStep === 'warning'}
          onOpenChange={(open) => {
            if (!open) {
              setAddDialogStep((curr) => {
                if (curr === 'confirm') return curr;
                setPendingAddActivity(false);
                return null;
              });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Add learning activity?
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 text-sm">
                  {courseType === 'composite-micro-credential' ? (
                    <>
                      <p>
                        This composite micro-credential will no longer remain a combined micro-credential based on independent standalone courses if you continue.
                      </p>
                      <p>
                        Instead, the imported standalone courses will be treated as one combined standalone course that can be edited as a single whole.
                      </p>
                      <p>
                        This is required because the standalone courses used here are packaged and quality-assured as independent units, and changes to imported learning activities must break that original structure.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This micro-credential is currently based directly on a single existing standalone course. If you add a new learning activity, it will no longer be a faithful representation of that source course.
                      </p>
                      <p>
                        It will be treated as an independent micro-credential going forward, and the link to the original standalone course will be considered modified.
                      </p>
                      <p>
                        This is required because the source standalone course is packaged and quality-assured as an independent unit.
                      </p>
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setPendingAddActivity(false); setAddDialogStep(null); }}>
                Cancel
              </Button>
              <Button onClick={() => setAddDialogStep('confirm')}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={addDialogStep === 'confirm'}
          onOpenChange={(open) => {
            setAddDialogStep(open ? 'confirm' : 'warning');
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Are you sure?
              </DialogTitle>
              <DialogDescription>
                This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setAddDialogStep('warning')}>
                Go back
              </Button>
              <Button
                onClick={confirmAddActivity}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
