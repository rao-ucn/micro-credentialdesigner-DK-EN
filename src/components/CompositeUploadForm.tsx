import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StandaloneSource } from '@/types/course';
import { importFromJSON } from '@/lib/storage';
import { Upload, X, FileText, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { coreuiTranslations } from '@/lib/translations/coreui';

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

          // Only accept standalone and micro-credential types
          if (imported.courseType !== 'standalone' && imported.courseType !== 'micro-credential') {
            const isComposite = imported.courseType === 'composite-micro-credential';
            toast({
              title: isComposite ? lt.compositeFilesUnsupportedTitle : lt.unsupportedCourseTypeTitle,
              description: isComposite
                ? lt.compositeFilesUnsupportedDescription.replace('{fileName}', file.name)
                : lt.unsupportedCourseTypeDescription.replace('{fileName}', file.name).replace('{courseType}', imported.courseType),
              variant: 'destructive',
            });
            continue;
          }

          if (reuseCondition === 'no') {
            toast({
              title: lt.reuseRestrictedTitle,
              description: lt.reuseRestrictedCompositeDescription.replace('{fileName}', file.name),
              variant: 'destructive',
            });
            continue;
          }

          // Check for duplicates
          const isDuplicate = sources.some(s => s.documentId === imported.documentId) ||
            newSources.some(s => s.documentId === imported.documentId);
          if (isDuplicate) {
            toast({
              title: lt.duplicateSkippedTitle,
              description: lt.duplicateSkippedDescription.replace('{fileName}', file.name).replace('{id}', imported.documentId),
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
            title: lt.invalidFileTitle,
            description: lt.invalidFileDescription.replace('{fileName}', file.name),
            variant: 'destructive',
          });
        }
      }

      setProgress({ current: fileArray.length, total: fileArray.length, fileName: '' });
      setIsProcessing(false);

      if (newSources.length > 0) {
        setSources(prev => [...prev, ...newSources]);
        toast({
          title: lt.filesAddedTitle,
          description: lt.filesAddedDescription.replace('{count}', String(newSources.length)),
        });
      }
    };

    input.click();
  }, [sources, toast, lt]);

  const removeSource = (index: number) => {
    const shouldContinue = window.confirm(lt.removeSourceConfirm);
    if (!shouldContinue) return;

    setSources(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = sources.length >= 2;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold mb-2 block text-primary">
          {lt.uploadCoursesLabel}
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          {lt.compositeUploadDescription}
          <br /><br />
          <strong>{lt.compositeUploadNote}</strong>
        </p>

        <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 p-3 rounded-md mb-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">{lt.lockedNoticeTitle}</p>
            <p>
              {lt.lockedNoticeBody1}
            </p>
            <p className="mt-2">
              <strong>{lt.lockedNoticeBody2}</strong>
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
            <span className="text-muted-foreground">{lt.processingFiles}</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-muted-foreground">{lt.clickToUploadComposite}</span>
          </>
        )}
      </Button>

      {/* Progress indicator */}
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

      {/* Uploaded files list */}
      {sources.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {lt.uploadedCoursesLabel.replace('{count}', String(sources.length))}
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
                    {lt.documentIdLabel.replace('{id}', source.documentId)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lt.fileLabel.replace('{name}', source.fileName)}
                    {source.originalCourseType === 'micro-credential' && (
                      <span className="ml-2 text-amber-600">{lt.mcAssessmentExcluded}</span>
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
          <span>{lt.minimumCoursesWarning}</span>
        </div>
      )}

      {/* Summary when ready */}
      {canProceed && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-md">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>{lt.readyCompositeSummary.replace('{count}', String(sources.length))}</span>
        </div>
      )}

      {/* Action buttons */}
      {canProceed && (
        <Button
          onClick={() => onComplete(sources)}
          className="w-full"
          size="lg"
        >
          {lt.continueWithCourses.replace('{count}', String(sources.length))}
        </Button>
      )}

      <Button onClick={onBack} variant="outline" className="w-full">
        {lt.backButton}
      </Button>
    </div>
  );
}
