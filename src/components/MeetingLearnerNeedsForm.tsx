import { CourseType } from '@/types/course';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms56cTranslations } from '@/lib/translations/forms56c';

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
  const { language, t } = useLanguage();
  const lt = forms56cTranslations[language];
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
              {lt.mlnQuestion}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              {lt.mlnDesc}
            </p>
          </div>

          {showCompositeScaffoldingReminder && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-semibold">
                  {lt.mlnScaffoldingTitle}
                </p>
                <p className="text-muted-foreground">
                  {lt.mlnScaffoldingBodyPre}
                  <span className="font-medium text-foreground">{lt.mlnScaffoldingBodyStrong}</span>
                  {lt.mlnScaffoldingBodyPost}
                </p>
              </div>
            </div>
          )}

          {showFixedReminder && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-semibold">
                  {lt.mlnFixedTitle}
                </p>
                <p className="text-muted-foreground">
                  {lt.mlnFixedBodyPre}
                  <span className="font-medium text-foreground">{lt.mlnFixedBodyStrong}</span>
                  {lt.mlnFixedBodyPost}
                </p>
              </div>
            </div>
          )}

          {showEitherOrReminder && (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-3 flex gap-2">
              <Info className="h-4 w-4 text-warning-foreground flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-semibold">
                  {lt.mlnEitherOrTitle}
                </p>
                <p className="text-muted-foreground">
                  {lt.mlnEitherOrBodyPre}
                  <span className="font-medium text-foreground">{lt.mlnEitherOrBodyStrongPartiallyFixed}</span>
                  {lt.mlnEitherOrBodyMid}
                  <span className="font-medium text-foreground">{lt.mlnEitherOrBodyStrongStateExplicitly}</span>
                  {lt.mlnEitherOrBodyPost}
                </p>
              </div>
            </div>
          )}

          <Textarea
            value={data.learnerFacingDescription || ''}
            onChange={(e) => onChange({ ...data, learnerFacingDescription: e.target.value })}
            placeholder={lt.mlnTextareaPlaceholder}
            className="min-h-[150px]"
          />

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-foreground font-medium">
              {lt.mlnImportantNote}
            </p>
          </div>

          {!data.learnerFacingDescription && (
            <p className="text-sm text-muted-foreground italic">
              {lt.mlnPleaseProvide}
            </p>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
