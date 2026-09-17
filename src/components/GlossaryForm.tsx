import { useState } from 'react';
import { CourseType } from '@/types/course';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { forms34Translations } from '@/lib/translations/forms34';

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
  const { language } = useLanguage();
  const lt = forms34Translations[language];
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editDialogStep, setEditDialogStep] = useState<'warning' | 'confirm' | null>(null);

  // Only a composite micro-credential is protected: editing converts it into a
  // regular micro-credential. MCs built from existing files are freely editable.
  const integrityGuardActive = courseType === 'composite-micro-credential';

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
      setValidationError(lt.glValidationError);
      return;
    }

    // Check if any visible row has incomplete data
    const incompleteEntries = entries.filter(e => 
      (e.term.trim() && !e.explanation.trim()) || (!e.term.trim() && e.explanation.trim())
    );

    if (incompleteEntries.length > 0) {
      setValidationError(lt.glValidationError);
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
        <h2 className="text-2xl font-bold text-foreground">{lt.glTitle}</h2>
      </div>

      {/* Metatext */}
      <div className="bg-muted/30 rounded-lg p-4 text-muted-foreground space-y-3">
        <p>
          {lt.glMeta1}
        </p>
        <p>
          {lt.glMeta2}
        </p>
      </div>

      {/* Glossary Table */}
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-muted/50 p-3 border-b">
            <Label className="font-semibold text-foreground">{lt.glTermHeader}</Label>
            <Label className="font-semibold text-foreground">{lt.glExplanationHeader}</Label>
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
                  placeholder={lt.glTermPlaceholder}
                  disabled={data.isComplete}
                  className="transition-all duration-200"
                />
                <Textarea
                  value={entry.explanation}
                  onChange={(e) => handleEntryChange(entry.id, 'explanation', e.target.value)}
                  placeholder={lt.glExplanationPlaceholder}
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
                  aria-label={lt.glRemoveAria}
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
            {lt.glAddTerm}
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
              {lt.glComplete}
            </Button>
          ) : (
            <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{lt.glCompleted}</span>
            </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleEdit}
                size="sm"
              >
                {lt.glEdit}
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={editDialogStep !== null}
        onOpenChange={(open) => {
          if (!open) setEditDialogStep(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lt.glEditDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>{lt.glEditCompositeText1}</p>
                <p>{lt.glEditCompositeText2}</p>
                <p>{lt.glEditCompositeText3}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lt.glCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEdit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lt.glYesContinue}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
