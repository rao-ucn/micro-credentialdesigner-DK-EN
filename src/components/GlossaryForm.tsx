import { useState } from 'react';
import { CourseType } from '@/types/heroes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GlossaryEntry {
  id: string;
  term: string;
  explanation: string;
}

interface GlossaryFormData {
  entries: GlossaryEntry[];
  isComplete: boolean;
}

interface GlossaryFormProps {
  data: GlossaryFormData;
  onChange: (data: GlossaryFormData) => void;
  courseType: CourseType;
  onBreakCompositeIntegrity?: () => void;
  basedOnSingleSource?: boolean;
  onBreakSingleSourceIntegrity?: () => void;
}

export default function GlossaryForm({ data, onChange, courseType, onBreakCompositeIntegrity, basedOnSingleSource, onBreakSingleSourceIntegrity }: GlossaryFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editDialogStep, setEditDialogStep] = useState<'warning' | 'confirm' | null>(null);

  const integrityGuardActive = courseType === 'composite-micro-credential' || basedOnSingleSource === true;

  // Initialize with one empty row if no entries exist
  const entries: GlossaryEntry[] = data.entries?.length > 0 
    ? data.entries 
    : [{ id: crypto.randomUUID(), term: '', explanation: '' }];

  const updateEntries = (newEntries: GlossaryEntry[]) => {
    setValidationError(null);
    onChange({
      ...data,
      entries: newEntries,
      isComplete: false, // Reset completion when entries change
    });
  };

  const handleEntryChange = (id: string, field: 'term' | 'explanation', value: string) => {
    const newEntries = entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    updateEntries(newEntries);
  };

  const addEntry = () => {
    const newEntries = [...entries, { id: crypto.randomUUID(), term: '', explanation: '' }];
    updateEntries(newEntries);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return; // Keep at least one row
    const newEntries = entries.filter(entry => entry.id !== id);
    updateEntries(newEntries);
  };

  const handleComplete = () => {
    // Validation: At least one entry with both term and explanation
    const validEntries = entries.filter(e => e.term.trim() && e.explanation.trim());
    
    if (validEntries.length === 0) {
      setValidationError('Please ensure that each glossary entry includes both a term and a clear explanation.');
      return;
    }

    // Check if any visible row has incomplete data
    const incompleteEntries = entries.filter(e => 
      (e.term.trim() && !e.explanation.trim()) || (!e.term.trim() && e.explanation.trim())
    );

    if (incompleteEntries.length > 0) {
      setValidationError('Please ensure that each glossary entry includes both a term and a clear explanation.');
      return;
    }

    setValidationError(null);
    onChange({
      ...data,
      entries: entries.filter(e => e.term.trim() || e.explanation.trim()), // Remove completely empty rows
      isComplete: true,
    });
  };

  const handleEdit = () => {
    if (integrityGuardActive) {
      setEditDialogStep('warning');
      return;
    }
    onChange({
      ...data,
      isComplete: false,
    });
  };

  const confirmEdit = () => {
    onChange({
      ...data,
      isComplete: false,
    });
    if (courseType === 'composite-micro-credential') {
      onBreakCompositeIntegrity?.();
    } else if (basedOnSingleSource) {
      onBreakSingleSourceIntegrity?.();
    }
    setEditDialogStep(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-2xl font-bold text-foreground">Glossary</h2>
      </div>

      {/* Metatext */}
      <div className="bg-muted/30 rounded-lg p-4 text-muted-foreground space-y-3">
        <p>
          This step ensures that all learners share a clear and consistent understanding of key terms used throughout the micro-credential.
          The glossary supports accessibility, transparency, and academic clarity, especially where specialised or technical terminology is involved.
        </p>
        <p>
          The glossary is a reference tool. It is not a repetition of learning content, but a clarification of language learners are expected to understand and use.
        </p>
      </div>

      {/* Glossary Table */}
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-muted/50 p-3 border-b">
            <Label className="font-semibold text-foreground">Term / Concept</Label>
            <Label className="font-semibold text-foreground">Explanation</Label>
            <div className="w-10" /> {/* Spacer for delete button */}
          </div>

          {/* Table Rows */}
          <div className="divide-y">
            {entries.map((entry) => (
              <div 
                key={entry.id} 
                className={cn(
                  "grid grid-cols-[1fr_1fr_auto] gap-2 p-3 items-start",
                  data.isComplete && "bg-muted/20"
                )}
              >
                <Input
                  value={entry.term}
                  onChange={(e) => handleEntryChange(entry.id, 'term', e.target.value)}
                  placeholder="Enter term..."
                  disabled={data.isComplete}
                  className="transition-all duration-200"
                />
                <Textarea
                  value={entry.explanation}
                  onChange={(e) => handleEntryChange(entry.id, 'explanation', e.target.value)}
                  placeholder="Enter explanation..."
                  disabled={data.isComplete}
                  className="transition-all duration-200 min-h-[80px] resize-y"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(entry.id)}
                  disabled={entries.length <= 1 || data.isComplete}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove entry"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Term Button */}
        {!data.isComplete && (
          <Button
            type="button"
            variant="outline"
            onClick={addEntry}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add term
          </Button>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{validationError}</p>
          </div>
        )}

        {/* Complete/Edit Button */}
        <div className="pt-4">
          {!data.isComplete ? (
            <Button
              type="button"
              onClick={handleComplete}
              className="gap-2"
            >
              Complete glossary
            </Button>
          ) : (
            <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Glossary completed</span>
            </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleEdit}
                size="sm"
              >
                Edit glossary
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={editDialogStep === 'warning'}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogStep((curr) => (curr === 'confirm' ? curr : null));
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit glossary?</AlertDialogTitle>
            <AlertDialogDescription asChild>
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
                      This is required because the standalone courses used here are packaged and quality-assured as independent units, and changes to the glossary must break that original structure.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      This micro-credential is currently based directly on a single existing standalone course. If you edit the glossary, it will no longer be a faithful representation of that source course.
                    </p>
                    <p>
                      It will be converted back into a single combined standalone course that can be edited as a whole.
                    </p>
                    <p>
                      This is required because the source standalone course is packaged and quality-assured as an independent unit.
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setEditDialogStep('confirm')}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={editDialogStep === 'confirm'}
        onOpenChange={(open) => {
          if (!open) setEditDialogStep('warning');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditDialogStep('warning')}>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEdit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
