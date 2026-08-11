import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StandaloneSource } from '@/types/course';
import { importFromJSON } from '@/lib/storage';
import { Upload, X, FileText, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { coreuiTranslations } from '@/lib/translations/coreui';

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
  const { language } = useLanguage();
  const lt = coreuiTranslations[language];
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
              title: lt.compositeCannotBeUsedTitle,
              description: lt.compositeCannotBeUsedDescription.replace('{fileName}', file.name),
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
              title: lt.unsupportedFileTitle,
              description: lt.unsupportedFileDescription.replace('{fileName}', file.name),
              variant: 'destructive',
            });
            continue;
          }

          if (reuseCondition === 'no') {
            toast({
              title: lt.reuseRestrictedTitle,
              description: lt.reuseRestrictedNewMcDescription.replace('{fileName}', file.name),
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
              title: lt.duplicateSkippedTitle,
              description: lt.duplicateSkippedDescription.replace('{fileName}', file.name).replace('{id}', imported.documentId),
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
            title: lt.invalidFileTitle,
            description: lt.invalidFileDescription.replace('{fileName}', file.name),
            variant: 'destructive',
          });
        }
      }

      setProgress({ current: fileArray.length, total: fileArray.length, fileName: '' });
      setIsProcessing(false);

      if (newSources.length > 0) {
        setSources((prev) => [...prev, ...newSources]);
        toast({
          title: lt.filesAddedTitle,
          description: lt.filesAddedDescriptionGeneric.replace('{count}', String(newSources.length)),
        });
      }
    };

    input.click();
  }, [sources, toast, lt]);

  const removeSource = (index: number) => {
    const shouldContinue = window.confirm(lt.removeFileConfirm);
    if (!shouldContinue) return;
    setSources((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = sources.length >= 1;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold mb-2 block text-primary">
          {lt.uploadExistingFilesLabel}
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          {lt.newMcUploadDescription}
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
            <span className="text-muted-foreground">{lt.processingFiles}</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-muted-foreground">{lt.clickToUploadNewMc}</span>
          </>
        )}
      </Button>

      {isProcessing && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 min-w-0 mr-2">
              {progress.fileName ? lt.readingFile.replace('{fileName}', progress.fileName) : lt.finalizing}
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
            {lt.uploadedFilesLabel.replace('{count}', String(sources.length))}
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
                    {lt.sourceDocumentIdLabel.replace('{id}', source.documentId)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lt.fileLabel.replace('{name}', source.fileName)}
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
            {lt.readyMergeSummary
              .replace('{count}', String(sources.length))
              .replace('{plural}', sources.length === 1 ? '' : 's')}
          </span>
        </div>
      )}

      {canProceed && (
        <Button onClick={() => onComplete(sources)} className="w-full" size="lg">
          {lt.createNewMcFromFiles
            .replace('{count}', String(sources.length))
            .replace('{plural}', sources.length === 1 ? '' : 's')}
        </Button>
      )}

      <Button onClick={onBack} variant="outline" className="w-full">
        {lt.backButton}
      </Button>
    </div>
  );
}
