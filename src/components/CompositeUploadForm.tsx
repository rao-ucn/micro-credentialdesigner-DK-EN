import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StandaloneSource } from '@/types/course';
import { importFromJSON } from '@/lib/storage';
import { Upload, X, FileText, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// Assessment-related item IDs that should be stripped when importing from MCs
const ASSESSMENT_ITEM_IDS = ['3.10', '5.5'];

interface CompositeUploadFormProps {
  onComplete: (sources: StandaloneSource[]) => void;
  onBack: () => void;
}

/**
 * Strips assessment-related data from an MC import,
 * keeping only the standalone-relevant fields.
 */
function stripAssessmentData(data: Record<string, any>): Record<string, any> {
  const stripped = { ...data };
  for (const key of ASSESSMENT_ITEM_IDS) {
    delete stripped[key];
  }
  return stripped;
}

export function CompositeUploadForm({ onComplete, onBack }: CompositeUploadFormProps) {
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

          // Only accept standalone and micro-credential types
          if (imported.courseType !== 'standalone' && imported.courseType !== 'micro-credential') {
            const isComposite = imported.courseType === 'composite-micro-credential';
            toast({
              title: isComposite ? 'Composite files cannot be used as a source' : 'Skipped: Unsupported Course Type',
              description: isComposite
                ? `"${file.name}" is a composite micro-credential and cannot be nested inside another composite. A composite must be built directly from its individual standalone courses (and/or micro-credentials) — please upload those original source files instead.`
                : `"${file.name}" is a ${imported.courseType}. Only standalone courses and micro-credentials can be used as sources.`,
              variant: 'destructive',
            });
            continue;
          }

          if (reuseCondition === 'no') {
            toast({
              title: 'Skipped: Reuse Restricted',
              description: `"${file.name}" cannot be loaded into a composite micro-credential because reuse of learning content is marked as No.`,
              variant: 'destructive',
            });
            continue;
          }

          // Check for duplicates
          const isDuplicate = sources.some(s => s.documentId === imported.documentId) ||
            newSources.some(s => s.documentId === imported.documentId);
          if (isDuplicate) {
            toast({
              title: 'Duplicate Skipped',
              description: `"${file.name}" has already been added (Document ID: ${imported.documentId}).`,
              variant: 'destructive',
            });
            continue;
          }

          const workingTitle = imported.data['2.1']?.workingTitle || `${imported.courseType === 'micro-credential' ? 'MC' : 'Standalone'} ${imported.documentId}`;

          // For MCs, strip assessment data — only keep standalone-relevant fields
          const importedData = imported.courseType === 'micro-credential'
            ? stripAssessmentData(imported.data)
            : imported.data;

          newSources.push({
            fileName: file.name,
            documentId: imported.documentId,
            workingTitle,
            courseType: 'standalone', // Treated as standalone content regardless of source type
            data: importedData,
            originalCourseType: imported.courseType, // Track where it came from
          });
        } catch (error) {
          toast({
            title: 'Invalid File',
            description: `"${file.name}" is not a valid export file.`,
            variant: 'destructive',
          });
        }
      }

      setProgress({ current: fileArray.length, total: fileArray.length, fileName: '' });
      setIsProcessing(false);

      if (newSources.length > 0) {
        setSources(prev => [...prev, ...newSources]);
        toast({
          title: 'Files Added',
          description: `${newSources.length} course(s) imported successfully.`,
        });
      }
    };

    input.click();
  }, [sources, toast]);

  const removeSource = (index: number) => {
    const shouldContinue = window.confirm('Are you sure you want to remove this source file?');
    if (!shouldContinue) return;

    setSources(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = sources.length >= 2;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold mb-2 block text-primary">
          Upload Courses
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Upload at least 2 course JSON files (standalone or micro-credential). These will be combined into a new composite micro-credential.
          For micro-credential files, only the standalone-relevant data will be imported — assessment sections (Define assessment, Design assessment) will be excluded and must be defined anew.
          Files marked with <strong>No</strong> under reuse of learning content within the alliance cannot be loaded.
          <br /><br />
          <strong>Note:</strong> Existing composite micro-credential files cannot be uploaded here — a composite cannot contain another composite. If you want to reuse content from an existing composite, please upload its original individual standalone (or MC) source files instead.
        </p>

        <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 p-3 rounded-md mb-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Important: Source content is quality-assured and locked</p>
            <p>
              The uploaded standalone courses are kept intact to preserve their quality assurance. As long as you don't modify their content, the micro-credential remains a true composition of the original sources.
            </p>
            <p className="mt-2">
              <strong>If you edit any of the locked source content</strong>, the micro-credential is automatically converted into a micro-credential with a single, unified standalone course — the link to the original sources is then broken, and the result is treated as one coherent course rather than a composition.
            </p>
          </div>
        </div>
      </div>

      {/* Upload button */}
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
            <span className="text-muted-foreground">Click to upload course JSON files (standalone or MC)</span>
          </>
        )}
      </Button>

      {/* Progress indicator */}
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

      {/* Uploaded files list */}
      {sources.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Uploaded Courses ({sources.length})
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
                    Document ID: {source.documentId}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    File: {source.fileName}
                    {source.originalCourseType === 'micro-credential' && (
                      <span className="ml-2 text-amber-600">(MC — assessment data excluded)</span>
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

      {/* Minimum warning */}
      {sources.length > 0 && sources.length < 2 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>You need at least 2 courses to create a composite micro-credential.</span>
        </div>
      )}

      {/* Summary when ready */}
      {canProceed && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-md">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Ready! {sources.length} courses will be combined into a composite micro-credential.</span>
        </div>
      )}

      {/* Action buttons */}
      {canProceed && (
        <Button
          onClick={() => onComplete(sources)}
          className="w-full"
          size="lg"
        >
          Continue with {sources.length} Courses
        </Button>
      )}

      <Button onClick={onBack} variant="outline" className="w-full">
        Back
      </Button>
    </div>
  );
}