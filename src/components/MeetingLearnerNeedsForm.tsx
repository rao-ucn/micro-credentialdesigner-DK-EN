import { CourseType } from '@/types/heroes';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';

interface MeetingLearnerNeedsFormProps {
  data: {
    learnerFacingDescription?: string;
    modularityConfirmed?: boolean;
  };
  onChange: (data: MeetingLearnerNeedsFormProps['data']) => void;
  courseType: CourseType;
  assessmentAccessModel?: 'open' | 'fixed' | 'partially-fixed';
  hasEitherOrGroups?: boolean;
}

export default function MeetingLearnerNeedsForm({ data, onChange, courseType, assessmentAccessModel, hasEitherOrGroups }: MeetingLearnerNeedsFormProps) {
  const isComposite = courseType === 'composite-micro-credential';
  const showCompositeScaffoldingReminder = isComposite;
  const showFixedReminder = isComposite && assessmentAccessModel === 'fixed';
  const showEitherOrReminder = isComposite && assessmentAccessModel === 'partially-fixed' && !!hasEitherOrGroups;

  return (
    <div className="space-y-8">

      {/* Main input: Learner-facing description */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">
              How can learners organise, pace, and adapt their participation in this micro-credential?
              <span className="text-destructive ml-1">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              This description may be visible to learners.
              Write directly to the learner (e.g. "you can", "you are expected to").
              Focus on how learning activities, deadlines, and participation can be adapted or planned in practice.
            </p>
          </div>

          {showCompositeScaffoldingReminder && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-semibold">
                  Recommend how learners should work through the standalone courses.
                </p>
                <p className="text-muted-foreground">
                  Regardless of the access model (Open, Fixed, or Partially fixed), describe a
                  <span className="font-medium text-foreground"> recommended way of progressing
                  through the standalone courses</span> so learners are best scaffolded towards
                  the final assessment — e.g. which parts to engage with first, how they build on
                  each other, and which prepare key knowledge or skills needed for assessment.
                </p>
              </div>
            </div>
          )}

          {showFixedReminder && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-semibold">
                  You selected a Fixed learning pathway for this composite.
                </p>
                <p className="text-muted-foreground">
                  Because all standalone parts must be completed, we recommend you also state here
                  whether there is a <span className="font-medium text-foreground">recommended order
                  or sequence</span> for taking them — for example if some parts build on prerequisites
                  from earlier parts. This helps learners plan their progression.
                </p>
              </div>
            </div>
          )}

          {showEitherOrReminder && (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-3 flex gap-2">
              <Info className="h-4 w-4 text-warning-foreground flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-semibold">
                  You have defined "Either / or" alternatives in the assessment design.
                </p>
                <p className="text-muted-foreground">
                  With a <span className="font-medium text-foreground">Partially fixed</span> pathway
                  containing either/or groups, learners will not be assessed in every learning
                  outcome of the micro-credential — only in those covered by the standalone courses
                  they actually choose. We strongly recommend you
                  <span className="font-medium text-foreground"> state this explicitly to the
                  learner here</span>: explain that their choice between alternatives determines
                  which learning outcomes will be assessed, and encourage them to choose the
                  combination that best matches their goals.
                </p>
              </div>
            </div>
          )}

          <Textarea
            value={data.learnerFacingDescription || ''}
            onChange={(e) => onChange({ ...data, learnerFacingDescription: e.target.value })}
            placeholder="E.g. 'You can progress through this micro-credential at your own pace within the overall learning period. You are expected to complete all required activities, but you may choose the order in which you engage with optional materials...'"
            className="min-h-[150px]"
          />

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-foreground font-medium">
              Important: The text entered in this section may be shown directly to learners.
              Write in clear, learner-facing language and address the learner directly where appropriate.
            </p>
          </div>

          {!data.learnerFacingDescription && (
            <p className="text-sm text-muted-foreground italic">
              Please provide a learner-facing description.
            </p>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
