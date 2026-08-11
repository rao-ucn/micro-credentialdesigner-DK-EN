import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

interface OverallAimFormProps {
  data: {
    overallAim?: string;
  };
  onChange: (data: { overallAim?: string }) => void;
  courseType: 'standalone' | 'micro-credential' | 'composite-micro-credential';
}

const OverallAimForm: React.FC<OverallAimFormProps> = ({
  data,
  onChange,
  courseType,
}) => {
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : lt.courseLabelMicroCredential;
  const defaultText = courseType === 'standalone'
    ? lt.oaDefaultStandalone
    : lt.oaDefaultMicroCredential;

  const handleAimChange = (value: string) => {
    onChange({ overallAim: value });
  };

  return (
    <Card className="p-6 space-y-4">
      {/* Metatext */}
      <p className="text-sm text-muted-foreground">
        {lt.oaIntro.replace(/{course}/g, courseLabel)}
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            {lt.oaQLabel.replace(/{course}/g, courseLabel)}
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{lt.oaWhy}</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <p>
                  {lt.oaWhyText}
                </p>
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
                <DialogTitle>{lt.oaInspiration}</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <ul className="list-disc pl-5 space-y-2">
                  <li>{lt.oaInspireItem1}</li>
                  <li>{lt.oaInspireItem2}</li>
                  <li>{lt.oaInspireItem3}</li>
                  <li>{lt.oaInspireItem4}</li>
                  <li>{lt.oaInspireItem5}</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Textarea input */}
      <Textarea
        value={data.overallAim ?? defaultText}
        onChange={(e) => handleAimChange(e.target.value)}
        placeholder={defaultText}
        className="min-h-[120px]"
      />
      <p className="text-xs text-muted-foreground">
        {lt.oaHelp.replace(/{course}/g, courseLabel)}
      </p>
    </Card>
  );
};

export default OverallAimForm;
