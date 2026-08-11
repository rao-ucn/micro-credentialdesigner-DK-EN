import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Info, Lightbulb } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CourseType } from '@/types/heroes';

interface AudienceFormProps {
  value: any;
  onChange: (value: any) => void;
  courseType?: CourseType;
}

export const AudienceForm = ({ value = {}, onChange, courseType = 'micro-credential' }: AudienceFormProps) => {
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  
  const data = {
    primaryLearners: value.primaryLearners || '',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Audience</h3>
        <p className="text-sm text-muted-foreground">
          Audience defines who the {courseLabel} is developed for. The purpose is to identify the primary learner group precisely enough for level, content and learning design to match those who actually need the competence. A clear audience profile ensures that the {courseLabel} is designed for one coherent 'model learner', a realistic representation of the learner who will take the course.
        </p>
      </div>

      {/* Primary Learners Question */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">
              Who are the primary learners for this {courseLabel}? <span className="text-destructive">*</span>
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
                    This step provides your first reflection on who the {courseLabel} is intended for. The aim is to establish a clear and realistic model learner, which ensures alignment between the learners' context and the {courseLabel}'s level, learning outcomes and learning activities.
                  </p>
                  <p>
                    This step does not define formal admission requirements or eligibility criteria. Those will be described later in the process. Here the focus is on understanding the model learner through their work tasks, experience, prerequisites and competence gaps.
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
                    <li>Who is the intended learner for this {courseLabel} (for example learners, early-career professionals or experienced practitioners)?</li>
                    <li>What are the typical educational backgrounds and professional experiences of the target learners?</li>
                    <li>What are the learners' motivations and learning needs?</li>
                    <li>Are there specific groups of learners the {courseLabel} aims to support (for example underrepresented groups or career changers)?</li>
                    <li>What prior knowledge, skills or competences are expected from learners before starting the course?</li>
                    <li>What potential barriers to participation (for example time, cost or digital access) should be considered in the course design?</li>
                    <li>How can the structure and content of the {courseLabel} be adapted to support the needs and expectations of the primary audience?</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            Describe the primary learner group by outlining their work tasks, experience, prerequisites and typical competence gaps. This is your first reflection on who the {courseLabel} is aimed at. The goal is to establish a coherent and realistic model learner. Formal admission requirements and eligibility criteria will be defined later in the process.
          </p>
        </div>
        <Textarea
          value={data.primaryLearners}
          onChange={(e) => onChange({ ...data, primaryLearners: e.target.value })}
          placeholder="Describe the model learner clearly and as one coherent learner profile…"
          rows={6}
          required
        />
        {!data.primaryLearners && (
          <p className="text-xs text-muted-foreground">Must describe one clear, concrete and realistic model learner.</p>
        )}
      </Card>
    </div>
  );
};
