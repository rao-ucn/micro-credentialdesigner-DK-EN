import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Lightbulb } from 'lucide-react';

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
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  const defaultText = courseType === 'standalone'
    ? 'This standalone course aims to enable learners to…'
    : courseType === 'composite-micro-credential'
      ? 'This micro-credential aims to enable learners to…'
      : 'This micro-credential aims to enable learners to…';

  const handleAimChange = (value: string) => {
    onChange({ overallAim: value });
  };

  return (
    <Card className="p-6 space-y-4">
      {/* Metatext */}
      <p className="text-sm text-muted-foreground">
        This section defines the overall aim of the {courseLabel}. The aim is a short functional introduction of 3-5 lines that explains the purpose of the {courseLabel} and how it responds to the identified labour-market need. It helps the learner understand the direction and intention behind the {courseLabel}. The aim functions as the wide opening of a funnel: later in the design process the learning outcomes will become much more concrete, specific and assessable. This broad aim therefore prepares the ground for the detailed outcomes that follow.
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            What is the overall aim of this {courseLabel}?
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:text-primary/80">
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Why?</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <p>
                  A clearly formulated aim helps the learner understand the overall purpose before encountering detailed learning outcomes. It ensures that all later decisions remain coherent. The aim sets the direction, and the upcoming learning outcomes will narrow and specify this direction step by step.
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
                <DialogTitle>Inspiration</DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Write 3-5 lines capturing the core purpose in clear and accessible language.</li>
                  <li>Focus on the change or competence the learner should be able to demonstrate after completion.</li>
                  <li>Keep the aim broad but not vague.</li>
                  <li>Do not describe activities or content; express purpose and intended results.</li>
                  <li>Ensure alignment with the labour-market need identified earlier.</li>
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
        Write a short and coherent aim (3-5 lines) that introduces the purpose of the {courseLabel} and connects to the identified labour-market need.
      </p>
    </Card>
  );
};

export default OverallAimForm;
