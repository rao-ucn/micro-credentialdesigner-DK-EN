import { CourseType } from '@/types/course';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms56cTranslations } from '@/lib/translations/forms56c';

interface EvaluationPlanFormProps {
  data: {
    learningDeliveryReview?: string;
    assessmentCalibration?: string;
  };
  onChange: (data: any) => void;
  courseType: CourseType;
}

export default function EvaluationPlanForm({ data, onChange, courseType }: EvaluationPlanFormProps) {
  const { language, t } = useLanguage();
  const lt = forms56cTranslations[language];
  return (
    <div className="space-y-8">

      {/* Section 1: Review of learning delivery and content */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{lt.epReviewSectionTitle}</h3>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label={lt.epReviewInfoAria}
                >
                  <Info className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{lt.epReviewDialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-muted-foreground">
                  <p>{lt.epReviewDialogP1}</p>
                  <p>{lt.epReviewDialogP2}</p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-warning hover:text-warning/80 transition-colors flex-shrink-0"
                  aria-label={lt.epReviewInspirationAria}
                >
                  <Lightbulb className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{lt.epReviewInspirationTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-muted-foreground">
                  <p className="font-medium">{lt.epYouMayConsider}</p>
                  <ul className="space-y-2 list-disc list-inside pl-2">
                    <li>{lt.epReviewBullet1}</li>
                    <li>{lt.epReviewBullet2}</li>
                    <li>{lt.epReviewBullet3}</li>
                    <li>{lt.epReviewBullet4}</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningDeliveryReview" className="text-base">
              {lt.epReviewQuestion}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="learningDeliveryReview"
              value={data.learningDeliveryReview || ''}
              onChange={(e) => onChange({ ...data, learningDeliveryReview: e.target.value })}
              placeholder={lt.epReviewPlaceholder}
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
            <h3 className="text-lg font-semibold">{lt.epCalibrationSectionTitle}</h3>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label={lt.epReviewInfoAria}
                >
                  <Info className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{lt.epCalibrationDialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-muted-foreground">
                  <p>{lt.epCalibrationDialogP1}</p>
                  <p>{lt.epCalibrationDialogP2}</p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-warning hover:text-warning/80 transition-colors flex-shrink-0"
                  aria-label={lt.epCalibrationInspirationAria}
                >
                  <Lightbulb className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{lt.epCalibrationInspirationTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-muted-foreground">
                  <p className="font-medium">{lt.epYouMayConsider}</p>
                  <ul className="space-y-2 list-disc list-inside pl-2">
                    <li>{lt.epCalibrationBullet1}</li>
                    <li>{lt.epCalibrationBullet2}</li>
                    <li>{lt.epCalibrationBullet3}</li>
                    <li>{lt.epCalibrationBullet4}</li>
                    <li>{lt.epCalibrationBullet5}</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessmentCalibration" className="text-base">
              {lt.epCalibrationQuestion}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="assessmentCalibration"
              value={data.assessmentCalibration || ''}
              onChange={(e) => onChange({ ...data, assessmentCalibration: e.target.value })}
              placeholder={lt.epCalibrationPlaceholder}
              rows={5}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
