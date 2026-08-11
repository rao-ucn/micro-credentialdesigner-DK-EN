import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Info, Lightbulb } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CourseType } from '@/types/course';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

interface AudienceFormProps {
  value: any;
  onChange: (value: any) => void;
  courseType?: CourseType;
}

export const AudienceForm = ({ value = {}, onChange, courseType = 'micro-credential' }: AudienceFormProps) => {
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : lt.courseLabelMicroCredential;

  const data = {
    primaryLearners: value.primaryLearners || '',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{lt.audTitle}</h3>
        <p className="text-sm text-muted-foreground">
          {lt.audIntro.replaceAll('{course}', courseLabel)}
        </p>
      </div>

      {/* Primary Learners Question */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              {lt.audQLabel.replaceAll('{course}', courseLabel)} <span className="text-destructive">*</span>
            </Label>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:text-primary/80">
                  <Info className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{lt.audWhy}</DialogTitle>
                </DialogHeader>
                <div className="text-sm space-y-3">
                  <p>{lt.audWhyText1.replaceAll('{course}', courseLabel)}</p>
                  <p>{lt.audWhyText2}</p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-warning hover:text-warning/80">
                  <Lightbulb className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{lt.audInspiration}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>{lt.audInspireItem1.replaceAll('{course}', courseLabel)}</li>
                    <li>{lt.audInspireItem2}</li>
                    <li>{lt.audInspireItem3}</li>
                    <li>{lt.audInspireItem4.replaceAll('{course}', courseLabel)}</li>
                    <li>{lt.audInspireItem5}</li>
                    <li>{lt.audInspireItem6}</li>
                    <li>{lt.audInspireItem7.replaceAll('{course}', courseLabel)}</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            {lt.audHelp.replaceAll('{course}', courseLabel)}
          </p>
        </div>
        <Textarea
          value={data.primaryLearners}
          onChange={(e) => onChange({ ...data, primaryLearners: e.target.value })}
          placeholder={lt.audPlaceholder}
          rows={6}
          required
        />
        {!data.primaryLearners && (
          <p className="text-xs text-muted-foreground">{lt.audValidation}</p>
        )}
      </Card>
    </div>
  );
};
