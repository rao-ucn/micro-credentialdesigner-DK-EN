import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StandaloneSource } from '@/types/heroes';
import { importFromJSON } from '@/lib/storage';
import { Upload, X, FileText, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface NewMcUploadFormProps {
  onComplete: (sources: StandaloneSource[]) => void;
  onBack: () => void;
}

/**
 * Upload form for "New Micro-Credential based on one or multiple existing files".
 * Mirrors the CompositeUploadForm UX (per-file validation, restricted-skip,
 * progress, list view), but allows 1+ file. All accepted files are later merged
 * into a single, fully editable Micro-Credential (with one associated standalone
 * element) by the parent's onComplete handler.
 */
export function NewMcUploadForm({ onComplete, onBack }: NewMcUploadFormProps) {
  const { toast } = useToast();
  const [sources, setSources] = useState<StandaloneSource[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, fileName: '' });

  const handleFileUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      const fileArray = Array.from(files);
      setIsProcessing(true);
      setProgress({ current: 0, total: fileArray.length, fileName: '' });

      const newSources: StandaloneSource[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setProgress({ current: i, total: fileArray.length, fileName: file.name });
        try {
          const text = await file.text();
          const imported = importFromJSON(text);

          const reuseCondition = imported.data?.['6.5']?.contentReuseData?.reuseCondition;

          // Composite MCs cannot be used as a starting point — they're a composition of other sources.
          if (imported.courseType === 'composite-micro-credential') {
            toast({
              title: 'Composite files cannot be used here',
              description: `"${file.name}" is a composite micro-credential and cannot be used as a starting point for a new MC. Please upload its original standalone (or MC) source files instead.`,
              variant: 'destructive',
            });
            continue;
          }

          // Only accept standalone and micro-credential
          if (
            imported.courseType !== 'standalone' &&
            imported.courseType !== 'micro-credential'
          ) {
            toast({
              title: 'Skipped: Unsupported File',
              description: `"${file.name}" is not a recognised HEROES course file.`,
              variant: 'destructive',
            });
            continue;
          }

          if (reuseCondition === 'no') {
            toast({
              title: 'Skipped: Reuse Restricted',
              description: `"${file.name}" cannot be loaded because reuse of learning content within the alliance is marked as No.`,
              variant: 'destructive',
            });
            continue;
          }

          // Duplicate by source documentId
          const isDuplicate =
            sources.some((s) => s.documentId === imported.documentId) ||
            newSources.some((s) => s.documentId === imported.documentId);
          if (isDuplicate) {
            toast({
              title: 'Duplicate Skipped',
              description: `"${file.name}" has already been added (Document ID: ${imported.documentId}).`,
              variant: 'destructive',
            });
            continue;
          }

          const workingTitle =
            imported.data?.['2.1']?.workingTitle ||
            `${imported.courseType === 'standalone' ? 'Standalone' : 'MC'} ${imported.documentId}`;

          newSources.push({
            fileName: file.name,
            documentId: imported.documentId,
            workingTitle,
            courseType: 'standalone',
            data: imported.data,
            originalCourseType: imported.courseType,
          });
        } catch (error) {
          toast({
            title: 'Invalid File',
            description: `"${file.name}" is not a valid HEROES export file.`,
            variant: 'destructive',
          });
        }
      }

      setProgress({ current: fileArray.length, total: fileArray.length, fileName: '' });
      setIsProcessing(false);

      if (newSources.length > 0) {
        setSources((prev) => [...prev, ...newSources]);
        toast({
          title: 'Files Added',
          description: `${newSources.length} file(s) imported successfully.`,
        });
      }
    };

    input.click();
  }, [sources, toast]);

  const removeSource = (index: number) => {
    const shouldContinue = window.confirm('Remove this file from the merge?');
    if (!shouldContinue) return;
    setSources((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = sources.length >= 1;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold mb-2 block text-primary">
          Upload one or more existing files
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Upload one or more existing course or MC JSON files as a starting point.
          All accepted files will be merged into <strong>one new Micro-Credential</strong> with
          one associated standalone element — every field can be freely edited afterwards.
          A new unique document ID and security code will be generated, and the original files are not modified.
          Files marked with <strong>No</strong> under reuse of learning content within the alliance cannot be loaded and will be skipped automatically.
        </p>
      </div>

      <Button
        onClick={handleFileUpload}
        variant="outline"
        disabled={isProcessing}
        className="w-full border-dashed border-2 h-24 flex flex-col gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <span className="text-muted-foreground">Processing files…</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-muted-foreground">Click to upload one or more course/MC JSON files</span>
          </>
        )}
      </Button>

      {isProcessing && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 min-w-0 mr-2">
              {progress.fileName ? `Reading: ${progress.fileName}` : 'Finalizing…'}
            </span>
            <span className="text-muted-foreground flex-shrink-0">
              {progress.current} / {progress.total}
            </span>
          </div>
          <Progress value={(progress.current / progress.total) * 100} />
        </div>
      )}

      {sources.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Uploaded Files ({sources.length})
          </Label>
          {sources.map((source, index) => (
            <Card key={source.documentId} className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{source.workingTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Source Document ID: {source.documentId}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    File: {source.fileName}
                    {source.originalCourseType && source.originalCourseType !== 'standalone' && (
                      <span className="ml-2 text-muted-foreground">({source.originalCourseType})</span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => removeSource(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {canProceed && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-md">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>
            Ready! {sources.length} file{sources.length === 1 ? '' : 's'} will be merged into a new Micro-Credential
            (with one associated standalone element). All fields will be fully editable.
          </span>
        </div>
      )}

      {canProceed && (
        <Button onClick={() => onComplete(sources)} className="w-full" size="lg">
          Create new MC from {sources.length} file{sources.length === 1 ? '' : 's'}
        </Button>
      )}

      <Button onClick={onBack} variant="outline" className="w-full">
        Back
      </Button>
    </div>
  );
}
