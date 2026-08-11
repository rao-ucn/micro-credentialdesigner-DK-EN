import { CourseType } from '@/types/heroes';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Lightbulb } from 'lucide-react';

interface EvaluationPlanFormProps {
  data: {
    learningDeliveryReview?: string;
    assessmentCalibration?: string;
  };
  onChange: (data: any) => void;
  courseType: CourseType;
}

export default function EvaluationPlanForm({ data, onChange, courseType }: EvaluationPlanFormProps) {
  return (
    <div className="space-y-8">

      {/* Section 1: Review of learning delivery and content */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Review of learning delivery and content</h3>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="Why this matters"
                >
                  <Info className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Why review learning delivery and content?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Reviewing learning delivery and content over time ensures that the micro-credential 
                    remains relevant, accurate, and aligned with current professional practices and 
                    labour-market needs.
                  </p>
                  <p>
                    Regular review helps identify opportunities for improvement and ensures the 
                    learning experience continues to meet learner expectations.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-warning hover:text-warning/80 transition-colors flex-shrink-0"
                  aria-label="Inspiration for reviewing learning delivery"
                >
                  <Lightbulb className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inspiration: Reviewing learning delivery and content</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-muted-foreground">
                  <p className="font-medium">You may consider:</p>
                  <ul className="space-y-2 list-disc list-inside pl-2">
                    <li>Learner feedback after course completion</li>
                    <li>Relevance to current professional or labour-market needs</li>
                    <li>Periodic academic or programme-level review</li>
                    <li>Triggers for updating content (e.g. changes in practice, regulation, or technology)</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningDeliveryReview" className="text-base">
              How will the learning format and academic content be reviewed over time?
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="learningDeliveryReview"
              value={data.learningDeliveryReview || ''}
              onChange={(e) => onChange({ ...data, learningDeliveryReview: e.target.value })}
              placeholder="Describe how you plan to review, update, or validate the learning format and content after delivery."
              rows={5}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Review and calibration of assessment practices */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Review and calibration of assessment practices</h3>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="Why this matters"
                >
                  <Info className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Why review and calibrate assessment practices?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Calibrating assessment practices ensures that grading remains consistent, fair, 
                    and reliable across different assessors and course runs.
                  </p>
                  <p>
                    Regular calibration helps maintain the credibility and recognition value of 
                    the micro-credential over time.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-warning hover:text-warning/80 transition-colors flex-shrink-0"
                  aria-label="Inspiration for assessment calibration"
                >
                  <Lightbulb className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inspiration: Assessment calibration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-muted-foreground">
                  <p className="font-medium">You may consider:</p>
                  <ul className="space-y-2 list-disc list-inside pl-2">
                    <li>Use of shared criteria or rubrics</li>
                    <li>Review of sample or exemplar assessments</li>
                    <li>Dialogue or moderation between assessors</li>
                    <li>Periodic review of assessment outcomes</li>
                    <li>Adjustments based on feedback or identified inconsistencies</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessmentCalibration" className="text-base">
              How will assessment practices be reviewed and calibrated over time?
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="assessmentCalibration"
              value={data.assessmentCalibration || ''}
              onChange={(e) => onChange({ ...data, assessmentCalibration: e.target.value })}
              placeholder="Describe how you will ensure consistent, fair, and reliable assessment across assessors and course runs."
              rows={5}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
