import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CourseData, CourseType, StandaloneSource } from '@/types/course';
import { getPhases } from '@/data/phases';
import { PhaseNavigator } from '@/components/PhaseNavigator';
import { ItemForm } from '@/components/ItemForm';
import { generateSecurityCode, hashSecurityCode, verifySecurityCode } from '@/lib/crypto';
import { saveCourseData, loadCourseData, deleteCourseData, documentExists, exportToJSON, importFromJSON, saveImportedData, getNextDocumentId } from '@/lib/storage';
import { generatePDF } from '@/lib/pdf';
import { generateDidacticalGuidePDF } from '@/lib/didactical-guide-pdf';
import { Download, Upload, FileText, Save, Lock, Unlock, Trash2, ChevronLeft, ChevronRight, FileDown, Check, Layers, Loader2, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CompositeUploadForm } from '@/components/CompositeUploadForm';
import { NewMcUploadForm } from '@/components/NewMcUploadForm';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { indexPageTranslations } from '@/lib/translations/indexPage';
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

// Helper: composite-micro-credential should be treated as micro-credential for MC-only logic
const isMCType = (ct: CourseType) => ct === 'micro-credential' || ct === 'composite-micro-credential';

const Index = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const lt = indexPageTranslations[language];
  const phases = getPhases(language);
  const [welcomeStep, setWelcomeStep] = useState<'initial' | 'courseType' | 'compositeUpload' | 'newFromFileUpload' | 'loadExisting' | null>('initial');
  const [loadDocumentId, setLoadDocumentId] = useState('');
  
  const [selectedCourseType, setSelectedCourseType] = useState<CourseType | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [securityCode, setSecurityCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSecurityCodeDialog, setShowSecurityCodeDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showPhaseTransitionModal, setShowPhaseTransitionModal] = useState(false);
  const [jsonDownloaded, setJsonDownloaded] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [completionJsonDownloaded, setCompletionJsonDownloaded] = useState(false);
  const [completionPdfDownloaded, setCompletionPdfDownloaded] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isImportedDocument, setIsImportedDocument] = useState(false); // Track if document was just imported from JSON
  const [pendingImport, setPendingImport] = useState<CourseData | null>(null); // Detected import awaiting user confirmation
  const [overwriteWarning, setOverwriteWarning] = useState<{ data: CourseData; code: string } | null>(null);

  // Session restore key - kept only for the tab's lifetime so a manual refresh
  // doesn't dump the user back to the welcome screen.
  const SESSION_KEY = 'mcd:active-session';

  // Restore active session on mount (after a browser refresh)
  useEffect(() => {
    const restore = async () => {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return;
        const { documentId, code } = JSON.parse(raw) as { documentId: string; code: string };
        if (!documentId || !code) return;
        const data = await loadCourseData(documentId, code);
        setCourseData(data);
        setSecurityCode(code);
        setIsLocked(false);
        setWelcomeStep(null);
      } catch (err) {
        console.error('Session restore failed:', err);
        sessionStorage.removeItem(SESSION_KEY);
      }
    };
    restore();
  }, []);

  // Persist active session for refresh recovery
  useEffect(() => {
    if (courseData && !isLocked && securityCode) {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ documentId: courseData.documentId, code: securityCode })
      );
    }
  }, [courseData?.documentId, isLocked, securityCode]);

  // Auto-save on data change
  useEffect(() => {
    if (courseData && !isLocked && securityCode) {
      const timer = setTimeout(async () => {
        setAutoSaving(true);
        try {
          await saveCourseData(courseData, securityCode);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
        setAutoSaving(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [courseData, isLocked, securityCode]);

  const createNewDocument = async () => {
    if (!selectedCourseType) return;
    
    const documentId = await getNextDocumentId();
    const code = generateSecurityCode();
    const hashedCode = await hashSecurityCode(code);

    const newData: CourseData = {
      documentId,
      securityCode: hashedCode,
      displaySecurityCode: code,
      courseType: selectedCourseType,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentPhaseId: 'phase2', // Start at Phase 2
      currentItemIndex: 0,
      data: {
        '1.2': { selectedCourseType }
      },
    };

    setCourseData(newData);
    setSecurityCode(code);
    setIsLocked(false);
    setWelcomeStep(null);
    setShowSecurityCodeDialog(true);
    // Document ID stored in React state only, no URL manipulation
  };

  /**
   * Creates a brand-new Micro-Credential by merging 1+ uploaded source files
   * using the SAME prefill logic as the composite-MC flow — but without
   * source-locking, integrity contract, or _compositeSources viewer metadata.
   * Every field is freely editable afterwards.
   */
  const createMcFromUploadedSources = async (sources: StandaloneSource[]) => {
    if (sources.length === 0) return;

    // Build composite-style merged data, then strip composite-only metadata
    // and unblank MC-unique items by pulling values from the first source.
    const composite = await createCompositeDocument(sources, { commit: false });
    if (!composite) return;

    const mergedData: Record<string, any> = JSON.parse(JSON.stringify(composite.data));

    // Strip composite source-viewer metadata so nothing is locked/displayed as composite.
    for (const key of Object.keys(mergedData)) {
      const node = mergedData[key];
      if (node && typeof node === 'object' && '_compositeSources' in node) {
        delete node._compositeSources;
      }
    }

    // Restore MC-unique items (2.1 working title, 3.10/5.5 assessment).
    // For a SINGLE source we prefill from that source as a sensible starting point.
    // For MULTIPLE sources, assessment items (3.10 Define + 5.5 Design) MUST be
    // blank — same principle as composite — since assessment must be authored
    // anew for the merged MC. 2.1 is handled separately below.
    const MC_UNIQUE_ITEMS = ['2.1', '3.10', '5.5'];
    const firstSource = sources[0];
    for (const itemId of MC_UNIQUE_ITEMS) {
      if (sources.length > 1 && (itemId === '3.10' || itemId === '5.5')) {
        delete mergedData[itemId];
        continue;
      }
      const fromFirst = firstSource.data?.[itemId];
      if (fromFirst && typeof fromFirst === 'object') {
        mergedData[itemId] = JSON.parse(JSON.stringify(fromFirst));
      }
    }

    // For item 2.1: keep project classification from the first source,
    // but DO NOT prefill developers / external developers.
    // The working title MUST always be blank — even with a single source —
    // since the new MC is a brand-new project that needs its own title.
    if (!mergedData['2.1']) mergedData['2.1'] = {};
    mergedData['2.1'].developers = [];
    mergedData['2.1'].externalDevelopers = [];
    mergedData['2.1'].workingTitle = '';
    // The academic field (ISCED-F 2013) must be chosen fresh for the new MC.
    mergedData['2.1'].iscedBroadField = '';
    mergedData['2.1'].iscedNarrowField = '';
    mergedData['2.1'].iscedDetailedField = '';

    // Learning outcomes must NOT be prefilled in this flow — the user defines
    // them themselves (choosing Bloom or Tuning approach) just like in a
    // normal MC. The uploaded sources' learning outcomes are still shown to
    // them via a collapsible reference list inside LearningOutcomesForm.
    if (mergedData['3.5'] && typeof mergedData['3.5'] === 'object') {
      const interdisciplinary = mergedData['3.5'].interdisciplinaryData;
      if (interdisciplinary && typeof interdisciplinary === 'object') {
        interdisciplinary.learningOutcomes = [];
        delete interdisciplinary.formulationApproach;
      }
      // Some legacy shapes store fields directly under 3.5 — clear those too.
      if ('learningOutcomes' in mergedData['3.5']) mergedData['3.5'].learningOutcomes = [];
      if ('formulationApproach' in mergedData['3.5']) delete mergedData['3.5'].formulationApproach;
    }

    // EQF level (6.4) must NOT be prefilled — the user defines it themselves
    // for the new MC. Uploaded sources' EQF levels are shown as a read-only
    // reference via the standaloneSources prop on EQFLevelForm.
    if (mergedData['6.4'] && typeof mergedData['6.4'] === 'object') {
      delete mergedData['6.4'];
    }

    mergedData['1.2'] = { selectedCourseType: 'micro-credential' };

    const documentId = await getNextDocumentId();
    const code = generateSecurityCode();
    const hashedCode = await hashSecurityCode(code);

    const newDoc: CourseData = {
      documentId,
      securityCode: hashedCode,
      displaySecurityCode: code,
      courseType: 'micro-credential',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentPhaseId: 'phase2',
      currentItemIndex: 0,
      basedOnSingleSource: sources.length === 1,
      singleSourceDocumentId: sources.length === 1 ? sources[0].documentId : undefined,
      // Keep the uploaded sources attached so editing forms can show them
      // as read-only reference (e.g. learning outcomes from the originals).
      standaloneSources: sources,
      data: mergedData,
    };

    setCourseData(newDoc);
    setSecurityCode(code);
    setIsLocked(false);
    setWelcomeStep(null);
    setShowSecurityCodeDialog(true);

    toast({
      title: lt.newMcCreatedTitle,
      description:
        sources.length === 1
          ? lt.newMcCreatedSingleDesc
          : lt.newMcCreatedMultiDesc.replace('{count}', String(sources.length)),
    });
  };

  const createCompositeDocument = async (
    sources: StandaloneSource[],
    options: { commit?: boolean } = { commit: true }
  ): Promise<CourseData | null> => {
    const commit = options.commit !== false;
    const documentId = await getNextDocumentId();
    const code = generateSecurityCode();
    const hashedCode = await hashSecurityCode(code);

    // Build merged data for composite MC.
    // RULES:
    //  - Items that are MC-unique (working title 2.1 + assessment 3.10/5.5) MUST be blank
    //    on a new composite — assessment must be authored anew for each MC, and a working
    //    title must always be entered fresh on new objects.
    //  - All other (standalone) items are pre-filled from the source data and locked.
    //    When multiple sources have data for the same item, the FIRST source provides the
    //    pre-filled values and ALL sources are attached as _compositeSources so the viewer
    //    can render every source side-by-side for reference.
    const MC_UNIQUE_ITEMS = new Set(['2.1', '3.10', '5.5']);

    // Items where MC must be authored fresh, but specific sub-fields should still
    // be merged from all sources for reference/aggregation.
    type MergeStrategy =
      | 'array-by-uri'
      | 'array'
      | 'text-join'
      | 'array-unique-strings'
      | 'learning-outcomes'
      | 'learning-activities'
      | 'glossary-entries'
      | 'ects-activities'
      | 'first-non-empty'
      | 'consensus'
      | 'object-consensus'
      | 'first-non-empty-object';

    const BLANK_WITH_SOURCE_VIEWER_ITEMS = new Set(['3.4', '6.5', '6.8', '6.10']);

    const PARTIAL_MERGE_ITEMS: Record<string, { dataKey: string; mergeFields: Record<string, MergeStrategy> }> = {
      '4.11': {
        dataKey: 'glossaryData',
        mergeFields: {
          entries: 'glossary-entries',
        },
      },
      '5.1': {
        dataKey: 'learningActivitiesData',
        mergeFields: {
          activities: 'learning-activities',
        },
      },
      '3.1': {
        dataKey: 'marketNeedsData',
        mergeFields: {
          escoCompetences: 'array-by-uri',
          additionalCompetences: 'text-join',
        },
      },
      '3.5': {
        dataKey: 'interdisciplinaryData',
        mergeFields: {
          learningOutcomes: 'learning-outcomes',
          formulationApproach: 'first-non-empty',
        },
      },
      '4.1': {
        dataKey: 'topicsData',
        mergeFields: {
          themes: 'array-unique-strings',
        },
      },
      '4.4': {
        dataKey: 'multimodalLearningData',
        mergeFields: {
          contentRepresentation: 'array-unique-strings',
          activeEngagement: 'array-unique-strings',
          applicationTransfer: 'array-unique-strings',
          contentRepresentationOther: 'text-join',
          activeEngagementOther: 'text-join',
          applicationTransferOther: 'text-join',
        },
      },
      '6.1': {
        dataKey: 'technicalRequirementsData',
        mergeFields: {
          platforms: 'array-unique-strings',
          requiresSoftwarePurchase: 'consensus',
          selectedPurchaseResources: 'array-unique-strings',
          accessibilityChecklist: 'object-consensus',
        },
      },
      '6.2': {
        dataKey: 'technicalRequirementsData',
        mergeFields: {
          platforms: 'array-unique-strings',
          requiresSoftwarePurchase: 'consensus',
          selectedPurchaseResources: 'array-unique-strings',
          accessibilityChecklist: 'object-consensus',
        },
      },
      '6.3': {
        dataKey: 'ectsData',
        mergeFields: {
          learningActivities: 'ects-activities',
        },
      },
      '6.4': { dataKey: 'eqfLevelData', mergeFields: { __all__: 'first-non-empty-object' } },
    };

    const createStableCompositeId = (prefix: string, sourceIndex: number, itemIndex: number) =>
      `${prefix}-${sourceIndex}-${itemIndex}`;

    const isMeaningfulObject = (value: any): boolean => {
      if (!value || typeof value !== 'object') return false;
      if (Array.isArray(value)) return value.length > 0;
      return Object.values(value).some((entry) => {
        if (Array.isArray(entry)) return entry.length > 0;
        if (entry && typeof entry === 'object') return Object.keys(entry).length > 0;
        return entry !== undefined && entry !== null && String(entry).trim() !== '';
      });
    };

    const getConsensusValue = (values: any[]) => {
      const normalized = values
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
        .map((value) => String(value).trim());

      if (normalized.length === 0) return undefined;
      const unique = new Set(normalized);
      return unique.size === 1 ? normalized[0] : undefined;
    };

    const getObjectConsensus = (objects: any[]) => {
      const keys = new Set<string>();
      objects.forEach((obj) => {
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          Object.keys(obj).forEach((key) => keys.add(key));
        }
      });

      const result: Record<string, any> = {};
      for (const key of keys) {
        const consensus = getConsensusValue(objects.map((obj) => obj?.[key]));
        if (consensus !== undefined) {
          result[key] = consensus;
        }
      }

      return result;
    };

    const mergedData: Record<string, any> = {
      '1.2': { selectedCourseType: 'composite-micro-credential' },
    };

    // Collect the set of all itemIds that any source touches (excluding phase 1)
    const allItemIds = new Set<string>();
    for (const source of sources) {
      for (const itemId of Object.keys(source.data)) {
        if (itemId.startsWith('1.')) continue;
        allItemIds.add(itemId);
      }
    }

    for (const itemId of allItemIds) {
      // MC-unique items stay completely blank — no prefill, no source viewer.
      if (MC_UNIQUE_ITEMS.has(itemId)) {
        continue;
      }

      // Collect all sources that have data for this item
      const sourcesForItem: Array<{
        sourceIndex: number;
        sourceTitle: string;
        sourceDocumentId: string;
        data: any;
      }> = [];
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const itemData = source.data[itemId];
        if (itemData === undefined) continue;
        sourcesForItem.push({
          sourceIndex: i,
          sourceTitle: source.workingTitle,
          sourceDocumentId: source.documentId,
          data: itemData,
        });
      }

      if (sourcesForItem.length === 0) continue;

      if (BLANK_WITH_SOURCE_VIEWER_ITEMS.has(itemId)) {
        mergedData[itemId] = {
          _compositeSources: sourcesForItem,
        };
        continue;
      }

      // PARTIAL MERGE: keep most fields blank but aggregate specific sub-fields across all sources
      const partialConfig = PARTIAL_MERGE_ITEMS[itemId];
      if (partialConfig) {
        // Special case: '__all__' with 'first-non-empty-object' copies the entire nested
        // dataKey object from the first source that has a non-empty value for it.
        const allEntry = partialConfig.mergeFields['__all__'];
        if (allEntry === 'first-non-empty-object') {
          let chosen: any = undefined;
          for (const src of sourcesForItem) {
            const nested = src.data?.[partialConfig.dataKey];
            if (nested && typeof nested === 'object' && Object.keys(nested).length > 0) {
              chosen = nested;
              break;
            }
          }
          mergedData[itemId] = {
            [partialConfig.dataKey]: chosen ?? {},
            _compositeSources: sourcesForItem,
          };
          continue;
        }

        const aggregated: Record<string, any> = {};
        for (const [fieldName, strategy] of Object.entries(partialConfig.mergeFields)) {
          if (strategy === 'array-by-uri') {
            const seen = new Set<string>();
            const merged: any[] = [];
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const arr = Array.isArray(nested?.[fieldName]) ? nested[fieldName] : [];
              for (const item of arr) {
                const key = item?.uri || JSON.stringify(item);
                if (!seen.has(key)) {
                  seen.add(key);
                  merged.push(item);
                }
              }
            }
            aggregated[fieldName] = merged;
          } else if (strategy === 'array') {
            const merged: any[] = [];
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const arr = Array.isArray(nested?.[fieldName]) ? nested[fieldName] : [];
              merged.push(...arr);
            }
            aggregated[fieldName] = merged;
          } else if (strategy === 'array-unique-strings') {
            const seen = new Set<string>();
            const merged: string[] = [];
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const arr = Array.isArray(nested?.[fieldName]) ? nested[fieldName] : [];
              for (const item of arr) {
                const value = String(item || '').trim();
                if (!value) continue;
                const key = value.toLowerCase();
                if (!seen.has(key)) {
                  seen.add(key);
                  merged.push(value);
                }
              }
            }
            aggregated[fieldName] = merged;
          } else if (strategy === 'learning-outcomes') {
            const seen = new Map<string, number>();
            const merged: any[] = [];
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const arr = Array.isArray(nested?.[fieldName]) ? nested[fieldName] : [];
              for (let index = 0; index < arr.length; index++) {
                const item = arr[index];
                if (!item || typeof item !== 'object') continue;
                const { id: _ignoredId, _sourceTitles: _ignoredTitles, _sourceTitle: _ignoredTitle, ...rest } = item as any;
                const key = JSON.stringify(rest);
                if (!seen.has(key)) {
                  seen.set(key, merged.length);
                  merged.push({
                    ...rest,
                    id: `${src.sourceIndex}-${index}-${Math.random().toString(36).slice(2, 8)}`,
                    _sourceTitles: [src.sourceTitle],
                  });
                } else {
                  const existingIdx = seen.get(key)!;
                  const existing = merged[existingIdx];
                  const titles: string[] = Array.isArray(existing._sourceTitles) ? existing._sourceTitles : [];
                  if (!titles.includes(src.sourceTitle)) {
                    titles.push(src.sourceTitle);
                  }
                  existing._sourceTitles = titles;
                }
              }
            }
            aggregated[fieldName] = merged;
          } else if (strategy === 'learning-activities') {
            const seen = new Set<string>();
            const merged: any[] = [];
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const arr = Array.isArray(nested?.[fieldName]) ? nested[fieldName] : [];
              for (let index = 0; index < arr.length; index++) {
                const item = arr[index];
                if (!item || typeof item !== 'object') continue;
                const { id: _ignoredId, ...rest } = item;
                const key = JSON.stringify(rest);
                if (!seen.has(key)) {
                  seen.add(key);
                  merged.push({
                    ...rest,
                    id: createStableCompositeId('activity', src.sourceIndex, index),
                    _sourceTitle: src.sourceTitle,
                  });
                }
              }
            }
            aggregated[fieldName] = merged;
          } else if (strategy === 'glossary-entries') {
            const seen = new Set<string>();
            const merged: any[] = [];
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const arr = Array.isArray(nested?.[fieldName]) ? nested[fieldName] : [];
              for (let index = 0; index < arr.length; index++) {
                const item = arr[index];
                const term = String(item?.term || '').trim();
                const explanation = String(item?.explanation || '').trim();
                if (!term || !explanation) continue;
                const key = `${term.toLowerCase()}::${explanation.toLowerCase()}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  merged.push({
                    id: createStableCompositeId('glossary', src.sourceIndex, index),
                    term,
                    explanation,
                  });
                }
              }
            }
            aggregated[fieldName] = merged;
          } else if (strategy === 'ects-activities') {
            const seen = new Set<string>();
            const merged: any[] = [];
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const arr = Array.isArray(nested?.[fieldName]) ? nested[fieldName] : [];
              for (let index = 0; index < arr.length; index++) {
                const item = arr[index];
                const name = String(item?.name || '').trim();
                const hours = String(item?.hours || '').trim();
                if (!name && !hours) continue;
                const key = `${name.toLowerCase()}::${hours}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  merged.push({
                    ...item,
                    id: createStableCompositeId('ects', src.sourceIndex, index),
                    name,
                    hours,
                    isPredefined: fieldName === 'learningActivities' ? true : item?.isPredefined,
                  });
                }
              }
            }
            aggregated[fieldName] = merged;
          } else if (strategy === 'first-non-empty') {
            let chosen: any = undefined;
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const value = nested?.[fieldName];
              if (value !== undefined && value !== null && String(value).trim() !== '') {
                chosen = value;
                break;
              }
            }
            aggregated[fieldName] = chosen;
          } else if (strategy === 'consensus') {
            const values = sourcesForItem.map((src) => src.data?.[partialConfig.dataKey]?.[fieldName]);
            aggregated[fieldName] = getConsensusValue(values);
          } else if (strategy === 'object-consensus') {
            const objects = sourcesForItem.map((src) => src.data?.[partialConfig.dataKey]?.[fieldName]);
            aggregated[fieldName] = getObjectConsensus(objects);
          } else if (strategy === 'text-join') {
            const parts: string[] = [];
            for (const src of sourcesForItem) {
              const nested = src.data?.[partialConfig.dataKey];
              const txt = (nested?.[fieldName] || '').toString().trim();
              if (txt) parts.push(`[${src.sourceTitle}]\n${txt}`);
            }
            aggregated[fieldName] = parts.join('\n\n');
          }
        }

        if (itemId === '4.11') {
          aggregated.isComplete = Array.isArray(aggregated.entries) && aggregated.entries.length > 0;
        }

        if (itemId === '5.1') {
          aggregated.isComplete = Array.isArray(aggregated.activities) && aggregated.activities.length > 0;
        }

        if (itemId === '6.1' || itemId === '6.2') {
          aggregated.platformsCompleted = Array.isArray(aggregated.platforms) && aggregated.platforms.length > 0;
        }

        if (itemId === '6.3') {
          aggregated.results = undefined;
          aggregated.confirmedECTS = undefined;
        }

        mergedData[itemId] = {
          [partialConfig.dataKey]: isMeaningfulObject(aggregated) ? aggregated : {},
          _compositeSources: sourcesForItem,
        };
        continue;
      }

      // Pre-fill from the FIRST source's data (locked), and attach ALL sources for reference
      const firstSourceData = sourcesForItem[0].data;
      const prefilled =
        firstSourceData && typeof firstSourceData === 'object' && !Array.isArray(firstSourceData)
          ? { ...firstSourceData }
          : {};

      mergedData[itemId] = {
        ...prefilled,
        _compositeSources: sourcesForItem,
      };
    }

    const newData: CourseData = {
      documentId,
      securityCode: hashedCode,
      displaySecurityCode: code,
      courseType: 'composite-micro-credential',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentPhaseId: 'phase2',
      currentItemIndex: 0,
      data: mergedData,
      standaloneSources: sources,
    };

    if (!commit) {
      return newData;
    }

    setCourseData(newData);
    setSecurityCode(code);
    setIsLocked(false);
    setWelcomeStep(null);
    setShowSecurityCodeDialog(true);
    return newData;
  };

  const unlockDocument = async () => {
    // Normalize input by removing dashes and converting to uppercase
    const normalizedCode = inputCode.replace(/-/g, '').toUpperCase();
    if (!courseData || !inputCode || normalizedCode.length !== 12) {
      toast({
        title: lt.invalidCodeTitle,
        description: lt.invalidCodeDesc,
        variant: 'destructive',
      });
      return;
    }
    // Format the code consistently with dashes
    const formattedCode = `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4, 8)}-${normalizedCode.slice(8, 12)}`;

    setIsUnlocking(true);
    // Yield to browser so the spinner/progress bar paints BEFORE the heavy
    // PBKDF2 key derivation blocks the main thread.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 0));
    const startTime = Date.now();
    try {
      // If this is an imported document that's not yet in localStorage
      if (isImportedDocument) {
        // Note: we skip the separate verifySecurityCode hash check here.
        // The actual decryption inside saveImportedData/loadCourseData will
        // fail if the code is wrong, and skipping this avoids running PBKDF2
        // twice (which can take several seconds on slower devices).
        
        // Before overwriting, check if a different document with the same ID
        // already exists on this device (could happen if user imports an old
        // export while a newer document has reused that ID).
        const existsLocally = await documentExists(courseData.documentId);
        if (existsLocally) {
          // Pause here and ask the user what to do.
          setOverwriteWarning({
            data: courseData,
            code: formattedCode,
          });
          return;
        }

        // Save the imported data locally with the provided security code
        await saveImportedData(courseData, formattedCode);
        setSecurityCode(formattedCode);
        setIsLocked(false);
        setInputCode('');
        setIsImportedDocument(false);
        
        toast({
          title: lt.unlockedSavedTitle,
          description: lt.unlockedSavedDesc,
        });
      } else {
        // Normal unlock from localStorage
        const loadedData = await loadCourseData(courseData.documentId, formattedCode);
        setCourseData(loadedData);
        setSecurityCode(formattedCode);
        setIsLocked(false);
        setInputCode('');
        
        toast({
          title: lt.unlockedTitle,
          description: lt.unlockedDesc,
        });
      }
    } catch (error) {
      toast({
        title: lt.incorrectCodeTitle,
        description: lt.incorrectCodeDesc,
        variant: 'destructive',
      });
    } finally {
      const elapsed = Date.now() - startTime;
      const minDisplay = 800;
      if (elapsed < minDisplay) {
        await new Promise((r) => setTimeout(r, minDisplay - elapsed));
      }
      setIsUnlocking(false);
    }
  };

  const handleSave = async () => {
    if (!courseData || !securityCode) return;

    try {
      const updated = { ...courseData, updatedAt: new Date().toISOString() };
      await saveCourseData(updated, securityCode);
      setCourseData(updated);
      
      toast({
        title: lt.savedTitle,
        description: lt.savedDesc,
      });
    } catch (error) {
      toast({
        title: lt.saveFailedTitle,
        description: lt.saveFailedDesc,
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    if (!courseData) return;

    const json = exportToJSON(courseData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Use working title from Phase 2.1 if available, sanitized for filename
    const workingTitle = courseData.data['2.1']?.workingTitle;
    const sanitizedTitle = workingTitle 
      ? workingTitle.replace(/[^a-zA-Z0-9æøåÆØÅäöüÄÖÜ\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 50)
      : null;
    const filename = sanitizedTitle 
      ? `${sanitizedTitle}.json`
      : `course_${courseData.documentId.slice(0, 8)}.json`;
    
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: lt.exportedTitle,
      description: lt.exportedDesc,
    });
  };

  const [importMode, setImportModeState] = useState<'continue' | 'new-from-file'>('continue');

  const handleImport = (mode: 'continue' | 'new-from-file' = 'continue') => {
    setImportModeState(mode);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    if (mode === 'new-from-file') {
      input.multiple = true;
    }
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) {
        document.body.removeChild(input);
        return;
      }

      try {
        if (mode === 'new-from-file' && files.length > 1) {
          // Parse all files
          const importedAll = await Promise.all(
            files.map(async (f) => importFromJSON(await f.text()))
          );

          // Merge: base = first file. For each phase-item key in data, concat arrays
          // (deduping by id when present), and keep first file's scalar/object values.
          const base = importedAll[0];
          const others = importedAll.slice(1);

          const mergedData: Record<string, any> = JSON.parse(JSON.stringify(base.data || {}));

          const dedupeById = (arr: any[]) => {
            const seen = new Set<string>();
            const out: any[] = [];
            for (const entry of arr) {
              const key = entry && typeof entry === 'object' && entry.id
                ? String(entry.id)
                : JSON.stringify(entry);
              if (!seen.has(key)) {
                seen.add(key);
                out.push(entry);
              }
            }
            return out;
          };

          for (const other of others) {
            const otherData = other.data || {};
            for (const itemKey of Object.keys(otherData)) {
              const otherItem = otherData[itemKey];
              if (!otherItem || typeof otherItem !== 'object') continue;

              if (!mergedData[itemKey]) {
                mergedData[itemKey] = JSON.parse(JSON.stringify(otherItem));
                continue;
              }

              for (const fieldKey of Object.keys(otherItem)) {
                const baseVal = mergedData[itemKey][fieldKey];
                const otherVal = otherItem[fieldKey];

                if (Array.isArray(baseVal) && Array.isArray(otherVal)) {
                  mergedData[itemKey][fieldKey] = dedupeById([...baseVal, ...otherVal]);
                } else if (Array.isArray(otherVal) && (baseVal === undefined || baseVal === null)) {
                  mergedData[itemKey][fieldKey] = [...otherVal];
                } else if (
                  baseVal &&
                  typeof baseVal === 'object' &&
                  !Array.isArray(baseVal) &&
                  otherVal &&
                  typeof otherVal === 'object' &&
                  !Array.isArray(otherVal)
                ) {
                  // Nested object: also concat any array fields inside
                  for (const nestedKey of Object.keys(otherVal)) {
                    const bn = baseVal[nestedKey];
                    const on = otherVal[nestedKey];
                    if (Array.isArray(bn) && Array.isArray(on)) {
                      baseVal[nestedKey] = dedupeById([...bn, ...on]);
                    } else if (bn === undefined || bn === null || bn === '') {
                      baseVal[nestedKey] = on;
                    }
                  }
                } else if (baseVal === undefined || baseVal === null || baseVal === '') {
                  mergedData[itemKey][fieldKey] = otherVal;
                }
                // else: keep base file's value
              }
            }
          }

          // Blank out assessment items so the user must (re-)author them for the
          // newly merged MC. Same principle as composite flow — assessment from
          // any single source rarely fits the merged learning outcomes.
          if (mergedData['3.10']) mergedData['3.10'] = {};
          if (mergedData['5.5']) mergedData['5.5'] = {};

          setPendingImport({
            ...base,
            data: mergedData,
            // remember how many sources were merged for the confirmation dialog
            _mergedSourceCount: files.length,
            _mergedSourceNames: files.map((f) => f.name),
          } as any);
        } else {
          const text = await files[0].text();
          const imported = importFromJSON(text);
          setPendingImport(imported);
        }
      } catch (error) {
        toast({
          title: lt.importFailedTitle,
          description: lt.importFailedDesc,
          variant: 'destructive',
        });
      } finally {
        document.body.removeChild(input);
      }
    };
    
    input.click();
  };

  const confirmImport = async () => {
    if (!pendingImport) return;

    if (importMode === 'new-from-file') {
      // Block files marked as "No" for reuse within the alliance — same rule as composite flow
      const reuseCondition = pendingImport.data?.['6.5']?.contentReuseData?.reuseCondition;
      if (reuseCondition === 'no') {
        toast({
          title: lt.reuseRestrictedTitle,
          description: lt.reuseRestrictedDesc,
          variant: 'destructive',
        });
        setPendingImport(null);
        return;
      }

      // Create a brand-new MC based on the uploaded file: new ID, new security code, MC type
      const documentId = await getNextDocumentId();
      const code = generateSecurityCode();
      const hashedCode = await hashSecurityCode(code);

      const cloned: CourseData = {
        ...pendingImport,
        documentId,
        securityCode: hashedCode,
        displaySecurityCode: code,
        courseType: 'micro-credential',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentPhaseId: 'phase2',
        currentItemIndex: 0,
        basedOnSingleSource: true,
        singleSourceDocumentId: pendingImport.documentId,
        standaloneSources: [{
          fileName: (pendingImport as any)?._sourceFileName || 'source.json',
          documentId: pendingImport.documentId,
          workingTitle: pendingImport.data?.['2.1']?.workingTitle || '',
          courseType: pendingImport.courseType,
          data: pendingImport.data,
        }] as any,
        data: {
          ...pendingImport.data,
          '1.2': { selectedCourseType: 'micro-credential' },
        },
      };

      setCourseData(cloned);
      setSecurityCode(code);
      setIsLocked(false);
      setWelcomeStep(null);
      setPendingImport(null);
      setShowSecurityCodeDialog(true);

      toast({
        title: lt.newMcCreatedTitle,
        description: lt.newMcFromUploadDesc,
      });
      return;
    }

    setCourseData(pendingImport);
    setIsLocked(true);
    setIsImportedDocument(true);
    setWelcomeStep(null);
    setPendingImport(null);
    toast({
      title: lt.importedTitle,
      description: lt.importedDesc,
    });
  };

  const importConfirmationDialog = (
    <AlertDialog open={!!pendingImport} onOpenChange={(open) => { if (!open) setPendingImport(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {importMode === 'new-from-file'
              ? ((pendingImport as any)?._mergedSourceCount > 1
                  ? lt.createNewMcFromFilesTitle.replace('{count}', String((pendingImport as any)._mergedSourceCount))
                  : lt.createNewMcFromFileTitle)
              : lt.importDetectedTitle}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 pt-2">
              {(pendingImport as any)?._mergedSourceCount > 1 ? (
                <>
                  <p>
                    {lt.detectedFilesMergedPrefix} <strong>{(pendingImport as any)._mergedSourceCount} {lt.standaloneCourseLabel ? '' : ''}</strong>{lt.detectedFilesMergedSuffix}
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                    {((pendingImport as any)._mergedSourceNames || []).map((n: string, i: number) => (
                      <li key={i} className="font-mono">{n}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p>
                    {lt.detectedTypePrefix} <strong>
                      {pendingImport?.courseType === 'standalone' && lt.standaloneCourseLabel}
                      {pendingImport?.courseType === 'micro-credential' && lt.microCredentialLabel}
                      {pendingImport?.courseType === 'composite-micro-credential' && lt.compositeMcLabel}
                    </strong> {lt.detectedTypeSuffix}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lt.sourceDocumentIdLabel} <span className="font-mono">{pendingImport?.documentId}</span>
                  </p>
                </>
              )}
              {importMode === 'new-from-file' ? (
                <div className="text-sm space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <p className="font-semibold text-foreground">
                    {lt.newMcWillBeCreated}
                  </p>
                  <p className="text-muted-foreground">
                    {(pendingImport as any)?._mergedSourceCount > 1
                      ? lt.mergeFilesNote
                      : lt.singleFileNote}
                  </p>
                </div>
              ) : (
                <p className="text-sm">
                  {lt.continueEditingQuestion}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingImport(null)}>{lt.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={confirmImport}>
            {importMode === 'new-from-file' ? lt.createNewMc : lt.continueLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const overwriteWarningDialog = (
    <AlertDialog open={!!overwriteWarning} onOpenChange={(open) => { if (!open) setOverwriteWarning(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{lt.documentAlreadySavedTitle}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                {lt.docIdSavedPrefix} <strong>{overwriteWarning?.data.documentId}</strong> {lt.docIdSavedSuffix}
              </p>
              <p>
                {lt.lastUpdatedPrefix}{' '}
                <strong>
                  {overwriteWarning?.data.updatedAt
                    ? new Date(overwriteWarning.data.updatedAt).toLocaleString()
                    : lt.unknownWord}
                </strong>.
              </p>
              <p>
                {lt.differentVersionsPrefix}{' '}
                <strong>{lt.permanentlyReplace}</strong> {lt.differentVersionsSuffix}
              </p>
              <p>
                {lt.alternativelyPrefix} <strong>{lt.newIdWord}</strong> {lt.alternativelySuffix}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => setOverwriteWarning(null)}>
            {lt.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (!overwriteWarning) return;
              const { data, code } = overwriteWarning;
              try {
                const newId = await getNextDocumentId();
                const newData = { ...data, documentId: newId, updatedAt: new Date().toISOString() };
                await saveImportedData(newData, code);
                setCourseData(newData);
                setSecurityCode(code);
                setIsLocked(false);
                setInputCode('');
                setIsImportedDocument(false);
                setOverwriteWarning(null);
                toast({
                  title: lt.savedAsNewTitle,
                  description: lt.savedAsNewDesc.replace('{newId}', String(newId)),
                });
              } catch (e) {
                console.error('Save as new document failed:', e);
                toast({
                  title: lt.saveFailedGenericTitle,
                  description: e instanceof Error ? e.message : lt.saveAsNewFailedDesc,
                  variant: 'destructive',
                });
              }
            }}
          >
            {lt.continueWithNewId}
          </AlertDialogAction>
          <AlertDialogAction
            onClick={async () => {
              if (!overwriteWarning) return;
              const { data, code } = overwriteWarning;
              try {
                await saveImportedData(data, code);
                setSecurityCode(code);
                setIsLocked(false);
                setInputCode('');
                setIsImportedDocument(false);
                setOverwriteWarning(null);
                toast({
                  title: lt.overwrittenTitle,
                  description: lt.overwrittenDesc,
                });
              } catch (e) {
                toast({
                  title: lt.saveFailedGenericTitle,
                  description: lt.overwriteFailedDesc,
                  variant: 'destructive',
                });
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {lt.overwriteSavedVersion}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const handleGeneratePDF = async () => {
    if (!courseData) return;

    try {
      // Save before generating (non-fatal — local storage may be full)
      if (securityCode) {
        try {
          const updated = { ...courseData, updatedAt: new Date().toISOString() };
          await saveCourseData(updated, securityCode);
          setCourseData(updated);
        } catch (saveErr) {
          console.warn('Pre-PDF save failed (continuing with PDF generation):', saveErr);
        }
      }
      // Include the plain text security code for PDF display
      const dataForPDF = {
        ...courseData,
        displaySecurityCode: securityCode
      };
      await generatePDF(dataForPDF, language);
      toast({
        title: lt.pdfGeneratedTitle,
        description: lt.pdfGeneratedDesc,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: lt.pdfFailedTitle,
        description: error instanceof Error ? error.message : lt.pdfFailedDescFallback,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = () => {
    if (!courseData) return;
    deleteCourseData(courseData.documentId);
    sessionStorage.removeItem(SESSION_KEY);
    setCourseData(null);
    setSecurityCode('');
    setIsLocked(true);
    setIsImportedDocument(false);
    setWelcomeStep('initial');
    setShowDeleteDialog(false);
    
    toast({
      title: lt.deletedTitle,
      description: lt.deletedDesc,
    });
  };

  const handleFieldChange = (itemId: string, fieldName: string, value: any) => {
    if (!courseData) return;

    // Special handling for course type selection in Phase 1
    if (itemId === '1.2' && fieldName === 'selectedCourseType') {
      const requestedType = value as CourseType;
      if (courseData.courseType === 'composite-micro-credential' || requestedType === 'composite-micro-credential') {
        return;
      }

      setCourseData({
        ...courseData,
        courseType: requestedType,
        data: {
          ...courseData.data,
          [itemId]: {
            ...courseData.data[itemId],
            [fieldName]: requestedType,
          },
        },
      });
      return;
    }

    // Special handling for Technical Requirements (6.1 and 6.2 share data under '6.1')
    if ((itemId === '6.1' || itemId === '6.2') && fieldName === 'technicalRequirementsData') {
      setCourseData({
        ...courseData,
        data: {
          ...courseData.data,
          '6.1': {
            ...courseData.data['6.1'],
            [fieldName]: value,
          },
        },
      });
      return;
    }

    setCourseData({
      ...courseData,
      data: {
        ...courseData.data,
        [itemId]: {
          ...courseData.data[itemId],
          [fieldName]: value,
        },
      },
    });
  };

  const navigateToItem = (phaseId: string, itemIndex: number) => {
    if (!courseData) return;

    setCourseData({
      ...courseData,
      currentPhaseId: phaseId,
      currentItemIndex: itemIndex,
    });
  };

  const handleBreakCompositeIntegrity = () => {
    setCourseData((prev) => {
      if (!prev || prev.courseType !== 'composite-micro-credential') return prev;

      return {
        ...prev,
        courseType: 'micro-credential',
        compositeIntegrityBroken: true,
        data: {
          ...prev.data,
          '1.2': {
            ...prev.data['1.2'],
            selectedCourseType: 'micro-credential',
          },
        },
      };
    });
  };

  const handleBreakSingleSourceIntegrity = () => {
    setCourseData((prev) => {
      if (!prev || !prev.basedOnSingleSource) return prev;
      return {
        ...prev,
        basedOnSingleSource: false,
      };
    });
  };

  // Scroll to top when navigating to a new item
  useEffect(() => {
    if (courseData) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [courseData?.currentPhaseId, courseData?.currentItemIndex]);

  const isCurrentItemValid = () => {
    if (!courseData) return false;
    
    const currentPhase = phases.find(p => p.id === courseData.currentPhaseId);
    if (!currentPhase) return false;
    
    const currentItem = currentPhase.items[courseData.currentItemIndex];
    if (!currentItem) return false;
    
    return isItemValid(currentItem);
  };

  const isItemValid = (item: any) => {
    if (!courseData) return false;
    
    // Skip MC-only items if standalone
    if (item.mcOnly && !isMCType(courseData.courseType)) return true;
    
    // Special validation for Phase 2.1
    if (item.id === '2.1') {
      const data = courseData.data[item.id] || {};
      const developers = data.developers || [];

      // Approved-activity structure: at least one developing institution
      if (developers.length < 1) return false;

      // Academic field of study (ISCED-F 2013): broad field is mandatory
      if (!data.iscedBroadField) return false;

      return true;
    }
    
    // Special validation for Phase 3.4 (Audience)
    if (item.id === '3.4') {
      const data = courseData.data[item.id] || {};
      const audienceData = data.audienceData || {};
      return !!(audienceData.primaryLearners && audienceData.primaryLearners.trim());
    }
    
    // Special validation for Phase 3.5 (Interdisciplinary Perspectives)
    if (item.id === '3.5') {
      const data = courseData.data[item.id] || {};
      const interdisciplinaryData = data.interdisciplinaryData || {};
      
      // Overall aim must be filled (and not just the placeholder)
      const overallAim = interdisciplinaryData.overallAim || '';
      const placeholders = [
        'This micro-credential aims to enable learners to…',
        'This standalone course aims to enable learners to…'
      ];
      const isAimValid = overallAim.trim() !== '' && 
        !placeholders.includes(overallAim.trim());
      
      if (!isAimValid) return false;
      
      // If "none" is selected, it's valid
      if (interdisciplinaryData.hasPerspectives === 'none') return true;
      
      // If "yes" is selected, at least one perspective must be entered
      if (interdisciplinaryData.hasPerspectives === 'yes') {
        const perspectives = interdisciplinaryData.perspectives || [];
        return perspectives.some((p: string) => p && p.trim() !== '');
      }
      
      // No selection made yet for perspectives
      return false;
    }
    
    // Special validation for Phase 4.1 (Topics and Themes)
    if (item.id === '4.1') {
      const data = courseData.data[item.id] || {};
      const topicsData = data.topicsData || {};
      const themes = topicsData.themes || [];
      // At least one theme must be filled
      return themes.some((t: string) => t && t.trim().length > 0);
    }
    
    // Special validation for Phase 4.3 (Constructive Alignment)
    if (item.id === '4.3') {
      const data = courseData.data[item.id] || {};
      const alignmentData = data.constructiveAlignmentData || {};
      // Must have confirmed alignment (either aligned or misaligned with note)
      return !!alignmentData.alignmentConfirmed;
    }
    
    // Special validation for Phase 4.4 (Multimodal Learning Resources)
    if (item.id === '4.4') {
      const data = courseData.data[item.id] || {};
      const multimodalData = data.multimodalLearningData || {};
      
      // Must have at least 2 content representation selections
      const contentRep = multimodalData.contentRepresentation || [];
      if (contentRep.length < 2) return false;
      
      // Must have at least 1 active engagement
      const activeEngagement = multimodalData.activeEngagement || [];
      if (activeEngagement.length < 1) return false;
      
      // Must have at least 1 application/transfer
      const applicationTransfer = multimodalData.applicationTransfer || [];
      if (applicationTransfer.length < 1) return false;
      
      return true;
    }
    
    // Special validation for Phase 4.5 (Supplementary Learning Considerations)
    if (item.id === '4.5') {
      const multimodalItemData = courseData.data['4.4'] || {};
      const multimodalData = multimodalItemData.multimodalLearningData || {};
      const data = courseData.data[item.id] || {};
      const supplementaryData = data.supplementaryData || {};
      
      // Check which considerations need to be answered
      const checkConsiderations = [
        { field: 'explorationDecision', checkField: 'activeEngagement', checkValue: 'exploration' },
        { field: 'reflectionDecision', checkField: 'activeEngagement', checkValue: 'reflection' },
        { field: 'challengeDecision', checkField: 'activeEngagement', checkValue: 'challenge-based' },
        { field: 'realWorldDecision', checkField: 'applicationTransfer', checkValue: 'real-world' },
      ];
      
      for (const consideration of checkConsiderations) {
        const selectedOptions = multimodalData[consideration.checkField] || [];
        // If option was NOT selected in multimodal, the decision must be made here
        if (!selectedOptions.includes(consideration.checkValue)) {
          if (!supplementaryData[consideration.field]) return false;
        }
      }
      
      // Must have feedback literacy decision
      if (!supplementaryData.feedbackLiteracy) return false;
      
      // If "no" is selected, must have reconsider decision
      if (supplementaryData.feedbackLiteracy === 'no' && !supplementaryData.feedbackLiteracyReconsider) return false;
      
      return true;
    }
    
    // Special validation for Phase 4.11 (Glossary)
    if (item.id === '4.11') {
      const data = courseData.data[item.id] || {};
      const glossaryData = data.glossaryData || {};
      return glossaryData.isComplete === true;
    }
    
    // Special validation for Phase 5.1 (Develop Learning Activities)
    if (item.id === '5.1') {
      const data = courseData.data[item.id] || {};
      const activitiesData = data.learningActivitiesData || {};
      
      // Must be marked as complete AND multimodal confirmation must be checked
      return activitiesData.isComplete === true && activitiesData.multimodalConfirmed === true;
    }
    
    // Special validation for Phase 3.10 (Define Assessment)
    if (item.id === '3.10') {
      const data = courseData.data[item.id] || {};
      const assessmentData = data.defineAssessmentData || {};
      
      // All four questions must be answered
      const baseFieldsComplete = !!(
        assessmentData.assessmentType &&
        assessmentData.individualOrGroup &&
        assessmentData.deliveryMode &&
        assessmentData.activityTypes?.length > 0 &&
        assessmentData.activityDescription?.trim()
      );
      
      if (!baseFieldsComplete) return false;
      
      return true;
    }
    
    // Special validation for Phase 6.3 (ECTS Calculator)
    if (item.id === '6.3') {
      const data = courseData.data[item.id] || {};

      if (courseData.courseType === 'composite-micro-credential') {
        const compositeEctsData = data.compositeEctsData || {};
        const confirmed = Number(compositeEctsData.confirmedECTS);
        return Number.isFinite(confirmed) && confirmed >= 1;
      }

      const ectsData = data.ectsData || {};
      
      // Must have calculated results
      if (!ectsData.results) return false;
      
      // For micro-credentials, must also have confirmed ECTS value
      if (isMCType(courseData.courseType)) {
        if (!ectsData.confirmedECTS) return false;
        // Must be at least 1 ECTS
        if (ectsData.confirmedECTS < 1) return false;
      }
      
      return true;
    }
    
    // Special validation for Phase 6.1 and 6.2 (Technical Requirements - shared form)
    // Both items share the same data stored under '6.1'
    if (item.id === '6.1' || item.id === '6.2') {
      const data = courseData.data['6.1'] || {};
      const techData = data.technicalRequirementsData || {};
      
      // Platforms must be completed
      if (!techData.platformsCompleted) return false;
      
      // Must have at least one platform
      const platforms = techData.platforms || [];
      const completedPlatforms = platforms.filter((p: string) => p && p.trim() !== '');
      if (completedPlatforms.length === 0) return false;
      
      // Software purchase must be answered
      if (!techData.requiresSoftwarePurchase) return false;
      
      // All accessibility checklist items must be answered
      const checklist = techData.accessibilityChecklist || {};
      const requiredKeys = [
        'multipleEngagement', 'multipleRepresentation', 'multipleAction',
        'perceivable', 'operable', 'understandable', 'robust'
      ];
      const allAnswered = requiredKeys.every(key => checklist[key] === 'yes' || checklist[key] === 'no');
      if (!allAnswered) return false;
      
      return true;
    }
    
    // Special validation for Phase 6.5 (Content Reuse + Physical Presence + Course Duration)
    if (item.id === '6.5') {
      const data = courseData.data[item.id] || {};
      const contentData = data.contentReuseData || {};
      
      // Must have reuse condition selected
      if (!contentData.reuseCondition) return false;
      
      // Get learning activities to check if physical presence is required
      const learningActivitiesData = courseData.data['5.1']?.learningActivitiesData || {};
      const activities = learningActivitiesData.activities || [];
      const hasPhysicalRequirements = activities.some((a: any) => 
        a.deliveryMode === 'physical' || a.deliveryMode === 'hybrid'
      );
      const hasSynchronousActivities = activities.some((a: any) =>
        a.timeStructure === 'synchronous'
      );
      
      // If physical requirements exist, must have physical days filled
      if (hasPhysicalRequirements) {
        if (typeof contentData.physicalDays !== 'number') return false;
        
        // If physical days > 0, must have locations
        if (contentData.physicalDays > 0 && (!contentData.teachingLocations || contentData.teachingLocations.trim() === '')) {
          return false;
        }
      }
      
      // Must have course duration mode selected
      if (!contentData.courseDurationMode) return false;
      
      // If async is selected but physical/synchronous activities exist, invalid
      if (contentData.courseDurationMode === 'async' && (hasPhysicalRequirements || hasSynchronousActivities)) {
        return false;
      }
      
      // If time-bound is selected, must have estimated weeks
      if (contentData.courseDurationMode === 'time-bound') {
        if (typeof contentData.estimatedWeeks !== 'number' || contentData.estimatedWeeks < 1) {
          return false;
        }
      }
      
      return true;
    }

    // Special validation for Phase 6.8 (Meeting Learner Needs)
    if (item.id === '6.8') {
      const data = courseData.data[item.id] || {};
      const learnerNeedsData = data.meetingLearnerNeedsData || {};
      
      // Must have learner-facing description
      if (!learnerNeedsData.learnerFacingDescription || learnerNeedsData.learnerFacingDescription.trim() === '') {
        return false;
      }
      
      return true;
    }

    // Special validation for Phase 6.10 (Evaluation Plan)
    if (item.id === '6.10') {
      const data = courseData.data[item.id] || {};
      const evaluationData = data.evaluationPlanData || {};
      
      // Must have learning delivery review
      if (!evaluationData.learningDeliveryReview || evaluationData.learningDeliveryReview.trim() === '') {
        return false;
      }
      
      // Must have assessment calibration
      if (!evaluationData.assessmentCalibration || evaluationData.assessmentCalibration.trim() === '') {
        return false;
      }
      
      return true;
    }
    
    // Special validation for Phase 6.4 (EQF Level)
    if (item.id === '6.4') {
      const data = courseData.data[item.id] || {};
      const eqfData = data.eqfLevelData || {};
      
      // Must have selected a level mode
      if (!eqfData.levelMode) return false;
      
      if (eqfData.levelMode === 'single') {
        // Must have selected and confirmed a single level
        return !!eqfData.singleLevel && !!eqfData.singleLevelConfirmed;
      }
      
      if (eqfData.levelMode === 'multiple') {
        // Must have final level confirmed
        if (!eqfData.finalLevel) return false;
        // If final differs from suggested, must have reasoning
        if (eqfData.finalLevel !== eqfData.suggestedLevel && !eqfData.reasoning) return false;
        return true;
      }
      
      return false;
    }

    // Default validation for other items
    const itemData = courseData.data[item.id] || {};
    for (const field of item.fields) {
      if (field.required && !field.mcOnly) {
        if (!itemData[field.name]) return false;
      }
      if (field.required && field.mcOnly && isMCType(courseData.courseType)) {
        if (!itemData[field.name]) return false;
      }
    }
    
    return true;
  };

  const getCompletedPhases = (): Set<string> => {
    if (!courseData) return new Set();
    
    const completed = new Set<string>();
    
    for (const phase of phases) {
      // Get visible items for this phase based on course type
      const visibleItems = phase.items.filter(item => 
        isMCType(courseData.courseType) || !item.mcOnly
      );
      
      // Check if all visible items are valid
      const allValid = visibleItems.every(item => isItemValid(item));
      
      if (allValid && visibleItems.length > 0) {
        completed.add(phase.id);
      }
    }
    
    return completed;
  };

  const getCompletedSubPhases = (): Set<string> => {
    if (!courseData) return new Set();
    
    const completed = new Set<string>();
    
    for (const phase of phases) {
      if (!phase.subPhases) continue;
      
      const visibleSubPhases = phase.subPhases.filter(sp => 
        isMCType(courseData.courseType) || !sp.mcOnly
      );
      
      for (const subPhase of visibleSubPhases) {
        // Get items for this sub-phase
        const subPhaseItems = phase.items.filter(item => 
          subPhase.itemIds.includes(item.id) &&
          (isMCType(courseData.courseType) || !item.mcOnly)
        );
        
        // Check if all items in this sub-phase are valid
        const allValid = subPhaseItems.every(item => isItemValid(item));
        
        if (allValid && subPhaseItems.length > 0) {
          completed.add(subPhase.id);
        }
      }
    }
    
    return completed;
  };

  // Get list of incomplete items for completion dialog
  const getIncompleteItems = (): { phase: string; item: string; itemId: string }[] => {
    if (!courseData) return [];
    
    const incomplete: { phase: string; item: string; itemId: string }[] = [];
    
    for (const phase of phases) {
      const visibleItems = phase.items.filter(item => 
        isMCType(courseData.courseType) || !item.mcOnly
      );
      
      for (const item of visibleItems) {
        if (!isItemValid(item)) {
          incomplete.push({
            phase: `Phase ${phase.number}: ${phase.title}`,
            item: item.title,
            itemId: item.id
          });
        }
      }
    }
    
    return incomplete;
  };

  // Check if we're at the very last item
  const isAtLastItem = (): boolean => {
    if (!courseData) return false;
    
    const lastPhase = phases[phases.length - 1];
    if (!lastPhase || courseData.currentPhaseId !== lastPhase.id) return false;
    
    const visibleIds = lastPhase.subPhases
      ? lastPhase.subPhases
          .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
          .flatMap(sp => sp.itemIds)
      : lastPhase.items.map(i => i.id);
    
    const currentItemId = lastPhase.items[courseData.currentItemIndex]?.id;
    const visibleIndex = visibleIds.indexOf(currentItemId);
    
    return visibleIndex === visibleIds.length - 1;
  };

  // Handle clicking the finish button
  const handleFinishClick = () => {
    setCompletionJsonDownloaded(false);
    setCompletionPdfDownloaded(false);
    setShowCompletionDialog(true);
  };

  // Check if current position is at the last item of phase4
  const isAtEndOfPhase4 = (): boolean => {
    if (!courseData || courseData.currentPhaseId !== 'phase4') return false;
    const phase4 = phases.find(p => p.id === 'phase4');
    if (!phase4) return false;
    const visibleIds = phase4.subPhases
      ? phase4.subPhases
          .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
          .flatMap(sp => sp.itemIds)
      : phase4.items.map(i => i.id);
    const currentItemId = phase4.items[courseData.currentItemIndex]?.id;
    const visibleIndex = visibleIds.indexOf(currentItemId);
    return visibleIndex === visibleIds.length - 1;
  };

  const proceedToPhase5 = () => {
    if (!courseData) return;
    setShowPhaseTransitionModal(false);
    const phase5 = phases.find(p => p.id === 'phase5');
    if (!phase5) return;
    const phaseVisibleIds = phase5.subPhases
      ? phase5.subPhases
          .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
          .flatMap(sp => sp.itemIds)
      : phase5.items.map(i => i.id);
    if (phaseVisibleIds.length > 0) {
      const firstId = phaseVisibleIds[0];
      const idx = phase5.items.findIndex(i => i.id === firstId);
      navigateToItem('phase5', Math.max(0, idx));
    }
  };

  const navigateNext = () => {
    if (!courseData) return;

    // Intercept transition from Phase 4 → Phase 5 (skip for composite MCs)
    if (isAtEndOfPhase4() && courseData.courseType !== 'composite-micro-credential') {
      setJsonDownloaded(false);
      setPdfDownloaded(false);
      setShowPhaseTransitionModal(true);
      return;
    }

    const currentPhase = phases.find(p => p.id === courseData.currentPhaseId);
    if (!currentPhase) return;

    const visibleIds = currentPhase.subPhases
      ? currentPhase.subPhases
          .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
          .flatMap(sp => sp.itemIds)
      : currentPhase.items.map(i => i.id);

    const currentItemId = currentPhase.items[courseData.currentItemIndex]?.id;
    const visibleIndex = visibleIds.indexOf(currentItemId);

    if (visibleIndex < visibleIds.length - 1) {
      const nextId = visibleIds[visibleIndex + 1];
      const nextIdx = currentPhase.items.findIndex(i => i.id === nextId);
      navigateToItem(courseData.currentPhaseId, Math.max(0, nextIdx));
    } else {
      const currentPhaseIndex = phases.findIndex(p => p.id === courseData.currentPhaseId);
      for (let p = currentPhaseIndex + 1; p < phases.length; p++) {
        const phase = phases[p];
        const phaseVisibleIds = phase.subPhases
          ? phase.subPhases
              .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
              .flatMap(sp => sp.itemIds)
          : phase.items.map(i => i.id);
        if (phaseVisibleIds.length > 0) {
          const firstId = phaseVisibleIds[0];
          const idx = phase.items.findIndex(i => i.id === firstId);
          navigateToItem(phase.id, Math.max(0, idx));
          return;
        }
      }
    }
  };

  const navigatePrevious = () => {
    if (!courseData) return;

    const currentPhase = phases.find(p => p.id === courseData.currentPhaseId);
    if (!currentPhase) return;

    const visibleIds = currentPhase.subPhases
      ? currentPhase.subPhases
          .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
          .flatMap(sp => sp.itemIds)
      : currentPhase.items.map(i => i.id);

    const currentItemId = currentPhase.items[courseData.currentItemIndex]?.id;
    const visibleIndex = visibleIds.indexOf(currentItemId);

    if (visibleIndex > 0) {
      const prevId = visibleIds[visibleIndex - 1];
      const prevIdx = currentPhase.items.findIndex(i => i.id === prevId);
      navigateToItem(courseData.currentPhaseId, Math.max(0, prevIdx));
    } else {
      // Move to previous phase's last visible item
      const currentPhaseIndex = phases.findIndex(p => p.id === courseData.currentPhaseId);
      for (let p = currentPhaseIndex - 1; p >= 0; p--) {
        const phase = phases[p];
        const phaseVisibleIds = phase.subPhases
          ? phase.subPhases
              .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
              .flatMap(sp => sp.itemIds)
          : phase.items.map(i => i.id);
        if (phaseVisibleIds.length > 0) {
          const lastId = phaseVisibleIds[phaseVisibleIds.length - 1];
          const idx = phase.items.findIndex(i => i.id === lastId);
          navigateToItem(phase.id, Math.max(0, idx));
          return;
        }
      }
    }
  };

  const currentPhase = courseData ? phases.find(p => p.id === courseData.currentPhaseId) : null;
  const currentItem = currentPhase ? currentPhase.items[courseData!.currentItemIndex] : null;
  
  // Find the current sub-phase metatext for the current item
  const currentSubPhaseMetatext = (() => {
    if (!currentPhase || !currentItem) return undefined;
    const subPhase = currentPhase.subPhases?.find(sp => sp.itemIds.includes(currentItem.id));
    return subPhase?.metatext;
  })();

  // Ensure currentItem is visible for the selected course type; if not, jump to first visible
  useEffect(() => {
    if (!courseData) return;
    const phase = phases.find(p => p.id === courseData.currentPhaseId);
    if (!phase) return;
    const visibleIds = phase.subPhases
      ? phase.subPhases
          .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
          .flatMap(sp => sp.itemIds)
      : phase.items.map(i => i.id);
    const curId = phase.items[courseData.currentItemIndex]?.id;
    if (!curId || !visibleIds.includes(curId)) {
      const firstId = visibleIds[0];
      const idx = phase.items.findIndex(i => i.id === firstId);
      if (idx >= 0) {
        setCourseData({ ...courseData, currentItemIndex: idx });
      }
    }
  }, [courseData?.currentPhaseId, courseData?.courseType]);

  // Welcome screen - multi-step flow
  if (welcomeStep !== null) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center p-4 relative">
          <div className="fixed top-4 right-4 z-10">
            <LanguageToggle />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="About this designer"
                className="fixed bottom-4 right-4 w-7 h-7 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center shadow-sm transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="max-w-xs text-xs leading-relaxed">
              {t.aboutText1}<a href="mailto:rao@ucn.dk" className="text-primary underline">rao@ucn.dk</a>{t.aboutText2}
            </PopoverContent>
          </Popover>
          <Card className="max-w-2xl w-full p-8 shadow-xl border-t-4 border-t-primary">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <div className="w-10 h-10 bg-primary rounded-full"></div>
              </div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                {t.appTitle}
              </h1>
              <p className="text-muted-foreground">
                {t.welcomeTagline}
              </p>
            </div>

            <div className="space-y-6">
              {welcomeStep === 'initial' && (
                <>
                  <Button onClick={() => setWelcomeStep('courseType')} className="w-full" size="lg">
                    {t.startNew}
                  </Button>

                  <div className="pt-6 border-t border-border space-y-3">
                    <Button onClick={() => setWelcomeStep('loadExisting')} variant="outline" className="w-full" size="lg">
                      <Lock className="mr-2 h-5 w-5" />
                      {t.continueSaved}
                    </Button>
                    <div className="text-center text-xs uppercase tracking-wider text-muted-foreground">{t.or}</div>
                    <Button onClick={() => handleImport('continue')} variant="outline" className="w-full" size="lg">
                      <Upload className="mr-2 h-5 w-5" />
                      {t.continueJson}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center px-2">
                      {t.continueNote}
                    </p>
                  </div>
                </>
              )}

            {welcomeStep === 'loadExisting' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="docId">{t.documentId}</Label>
                    <Input
                      id="docId"
                      placeholder="e.g. 000-000-001"
                      value={loadDocumentId}
                      onChange={(e) => setLoadDocumentId(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t.findDocId}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secCode">{t.securityCode}</Label>
                    <Input
                      id="secCode"
                      placeholder="XXXX-XXXX-XXXX"
                      maxLength={14}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                      className="font-mono text-xl tracking-widest text-center"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t.codeHint}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={async () => {
                    const normalizedCode = inputCode.replace(/-/g, '').toUpperCase();
                    if (!loadDocumentId.trim() || normalizedCode.length !== 12) {
                      toast({
                        title: t.missingInfo,
                        description: t.missingInfoDesc,
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    const formattedCode = `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4, 8)}-${normalizedCode.slice(8, 12)}`;
                    
                    const exists = await documentExists(loadDocumentId.trim());
                    if (!exists) {
                      toast({
                        title: lt.documentNotFoundTitle,
                        description: lt.documentNotFoundDesc,
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    try {
                      const loadedData = await loadCourseData(loadDocumentId.trim(), formattedCode);
                      setCourseData(loadedData);
                      setSecurityCode(formattedCode);
                      setIsLocked(false);
                      setWelcomeStep(null);
                      setInputCode('');
                      setLoadDocumentId('');
                      
                      toast({
                        title: lt.documentLoadedTitle,
                        description: lt.documentLoadedDesc,
                      });
                    } catch (error) {
                      toast({
                        title: lt.incorrectCodeTitle,
                        description: lt.incorrectCodeDesc,
                        variant: 'destructive',
                      });
                    }
                  }} 
                  className="w-full" 
                  size="lg"
                  disabled={!loadDocumentId.trim() || inputCode.replace(/-/g, '').length !== 12}
                >
                  <Unlock className="mr-2 h-5 w-5" />
                  {lt.loadDocumentButton}
                </Button>

                <Button onClick={() => { setWelcomeStep('initial'); setLoadDocumentId(''); setInputCode(''); }} variant="outline" className="w-full">
                  {lt.backButton}
                </Button>
              </div>
            )}

            {welcomeStep === 'courseType' && (
              <div className="space-y-6">


                <div>
                  <Label className="text-lg font-semibold mb-4 block text-primary">{lt.chooseWhatFitsYou}</Label>
                  <RadioGroup value={selectedCourseType || ''} onValueChange={(value) => setSelectedCourseType(value as CourseType)} className="gap-8">

                    {/* Section 1 — Create new from scratch */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        {lt.createFromScratch}
                      </div>
                      <Card className="p-4 cursor-pointer hover:border-primary hover:shadow-[0_0_0_2px_hsl(var(--primary)/0.15)] transition-all duration-200">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="standalone" id="standalone" className="mt-1" />
                          <Label htmlFor="standalone" className="cursor-pointer flex-1 space-y-1">
                            <div className="font-medium text-base">{lt.standaloneTitle}</div>
                            <div className="text-sm text-muted-foreground font-normal">
                              {lt.standaloneDesc}
                            </div>
                          </Label>
                        </div>
                      </Card>

                      <Card className="p-4 cursor-pointer hover:border-primary hover:shadow-[0_0_0_2px_hsl(var(--primary)/0.15)] transition-all duration-200">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="micro-credential" id="micro-credential" className="mt-1" />
                          <Label htmlFor="micro-credential" className="cursor-pointer flex-1 space-y-1">
                            <div className="font-medium text-base">{lt.microCredentialTitle}</div>
                            <div className="text-sm text-muted-foreground font-normal">
                              {lt.microCredentialDesc}
                            </div>
                          </Label>
                        </div>
                      </Card>
                    </div>

                    {/* Section 2 — Build a new MC based on existing work */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        {lt.buildOnExisting}
                      </div>
                      <Card className="p-4 cursor-pointer hover:border-primary hover:shadow-[0_0_0_2px_hsl(var(--primary)/0.15)] transition-all duration-200">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="__new_from_file__" id="new-from-file" className="mt-1" />
                          <Label htmlFor="new-from-file" className="cursor-pointer flex-1 space-y-1">
                            <div className="font-medium text-base flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              {lt.newMcFromFilesTitle}
                            </div>
                            <div className="text-sm text-muted-foreground font-normal">
                              {lt.newMcFromFilesDesc.split('{bold1}')[0]}<strong>{lt.newMcFromFilesBold1}</strong>{lt.newMcFromFilesDesc.split('{bold1}')[1].split('{bold2}')[0]}<strong>{lt.newMcFromFilesBold2}</strong>{lt.newMcFromFilesDesc.split('{bold2}')[1]}
                            </div>
                          </Label>
                        </div>
                      </Card>

                      <Card className="p-4 cursor-pointer hover:border-primary hover:shadow-[0_0_0_2px_hsl(var(--primary)/0.15)] transition-all duration-200">
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="composite-micro-credential" id="composite-mc" className="mt-1" />
                          <Label htmlFor="composite-mc" className="cursor-pointer flex-1 space-y-1">
                            <div className="font-medium text-base flex items-center gap-2">
                              <Layers className="h-4 w-4 text-primary" />
                              {lt.compositeMcTitle}
                            </div>
                            <div className="text-sm text-muted-foreground font-normal">
                              {lt.compositeMcDesc}
                            </div>
                          </Label>
                        </div>
                      </Card>
                    </div>
                  </RadioGroup>
                </div>

                {selectedCourseType && selectedCourseType !== 'composite-micro-credential' && (selectedCourseType as string) !== '__import__' && (selectedCourseType as string) !== '__new_from_file__' && (
                  <Button onClick={createNewDocument} className="w-full" size="lg">
                    {lt.continueButton}
                  </Button>
                )}

                {selectedCourseType === 'composite-micro-credential' && (
                  <Button onClick={() => setWelcomeStep('compositeUpload')} className="w-full" size="lg">
                    {lt.continueToMultiUpload}
                  </Button>
                )}

                {(selectedCourseType as string) === '__import__' && (
                  <Button onClick={() => handleImport('continue')} className="w-full" size="lg">
                    <Upload className="mr-2 h-5 w-5" />
                    {lt.chooseJsonToContinue}
                  </Button>
                )}

                {(selectedCourseType as string) === '__new_from_file__' && (
                  <Button onClick={() => setWelcomeStep('newFromFileUpload')} className="w-full" size="lg">
                    <Upload className="mr-2 h-5 w-5" />
                    {lt.continueToFileUploads}
                  </Button>
                )}

                {/* Footer — pointer back to landing page for continuing existing work */}
                <div className="pt-6 mt-2 border-t border-border space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    {lt.continueExistingWork}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground">
                    <p className="mb-3 leading-relaxed">
                      {lt.continueExistingWorkDesc.split('{loadExisting}')[0]}<span className="text-foreground">{lt.loadExistingDocumentLabel}</span>{lt.continueExistingWorkDesc.split('{loadExisting}')[1]}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedCourseType(null); setWelcomeStep('initial'); }}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      {lt.backToWelcomeScreen}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {welcomeStep === 'compositeUpload' && (
              <CompositeUploadForm
                onComplete={createCompositeDocument}
                onBack={() => setWelcomeStep('courseType')}
              />
            )}

            {welcomeStep === 'newFromFileUpload' && (
              <NewMcUploadForm
                onComplete={createMcFromUploadedSources}
                onBack={() => setWelcomeStep('courseType')}
              />
            )}
            </div>
          </Card>
        </div>
        {importConfirmationDialog}
        {overwriteWarningDialog}
      </>
    );
  }

  // Locked screen - need security code
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{lt.documentLocked}</h2>
            <p className="text-muted-foreground text-sm">
              {lt.enterCodeToUnlock}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {lt.documentIdLabel} {courseData.documentId.slice(0, 8)}...
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="code">{lt.securityCodeLabel}</Label>
              <Input
                id="code"
                type="text"
                maxLength={14}
                placeholder="XXXX-XXXX-XXXX"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && !isUnlocking && unlockDocument()}
                className="text-center text-xl tracking-widest font-mono"
                autoFocus
                disabled={isUnlocking}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {lt.findCodeHint}
              </p>
            </div>

            {isUnlocking && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{lt.verifyingCode}</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                  <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary animate-[indeterminate_1.2s_ease-in-out_infinite]" />
                </div>
              </div>
            )}

            <Button onClick={unlockDocument} className="w-full" size="lg" disabled={isUnlocking}>
              {isUnlocking ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {lt.unlocking}
                </>
              ) : (
                <>
                  <Unlock className="mr-2 h-5 w-5" />
                  {lt.unlockButton}
                </>
              )}
            </Button>

            <Button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setCourseData(null); setIsLocked(true); setWelcomeStep('initial'); }} variant="outline" className="w-full" disabled={isUnlocking}>
              {lt.cancelButton}
            </Button>
          </div>
        </Card>

        {overwriteWarningDialog}

        {/* Security Code Display */}
        {securityCode && !isLocked && (
          <div className="mt-4 max-w-2xl w-full">
            <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{lt.securityCodeSaveThis}</p>
                  <p className="font-mono font-semibold text-sm">{securityCode}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main application
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t.appTitle}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">{t.type}:</span>
                  {courseData.compositeIntegrityBroken ? (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded border border-primary/20 font-medium">
                      {t.compositeInspired}
                    </span>
                  ) : courseData.courseType === 'composite-micro-credential' ? (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded border border-primary/20 font-medium">
                      {t.compositeMC}
                    </span>
                  ) : (
                    <select
                      value={courseData.courseType}
                      onChange={(e) => {
                        const newType = e.target.value as CourseType;
                        if (newType === 'composite-micro-credential') return;

                        const updated = {
                          ...courseData,
                          courseType: newType,
                          data: {
                            ...courseData.data,
                            '1.2': {
                              ...courseData.data['1.2'],
                              selectedCourseType: newType,
                            },
                          },
                        };
                        setCourseData(updated);

                        const currentPhase = phases.find(p => p.id === updated.currentPhaseId);
                        if (currentPhase) {
                          const currentItem = currentPhase.items[updated.currentItemIndex];
                          if (currentItem?.mcOnly && newType === 'standalone') {
                            const visibleIds = currentPhase.subPhases
                              ? currentPhase.subPhases
                                  .filter(sp => !sp.mcOnly)
                                  .flatMap(sp => sp.itemIds)
                              : currentPhase.items.filter(i => !i.mcOnly).map(i => i.id);

                            if (visibleIds.length > 0) {
                              const firstId = visibleIds[0];
                              const idx = currentPhase.items.findIndex(i => i.id === firstId);
                              setCourseData({
                                ...updated,
                                currentItemIndex: Math.max(0, idx),
                              });
                            }
                          }
                        }

                        toast({
                          title: t.courseTypeChanged,
                          description: `${t.switchedTo} ${newType === 'micro-credential' ? t.microCredential : t.standalone}`,
                        });
                      }}
                      className="bg-primary/10 text-primary px-3 py-1 rounded border border-primary/20 font-medium cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      <option value="standalone">{t.standaloneLong}</option>
                      <option value="micro-credential">{t.microCredentialLong}</option>
                    </select>
                  )}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="font-semibold">ID:</span>
                  <span className="font-mono text-xs">{courseData.documentId}</span>
                </span>
                {autoSaving && (
                  <span className="text-primary animate-pulse">{t.saving}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Button onClick={handleSave} variant="default" size="sm">
                <Save className="mr-2 h-4 w-4" />
                {t.save}
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t.export}
              </Button>
              <Button onClick={handleGeneratePDF} variant="default" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                {t.generatePdf}
              </Button>
              <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                {t.delete}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Phase Navigator */}
      <PhaseNavigator
        phases={phases}
        currentPhaseId={courseData.currentPhaseId}
        currentItemIndex={courseData.currentItemIndex}
        courseType={courseData.courseType}
        completedPhases={getCompletedPhases()}
        completedSubPhases={getCompletedSubPhases()}
        courseData={courseData.data}
        onPhaseSelect={(phaseId, itemIndex) => {
          const phase = phases.find(p => p.id === phaseId);
          if (!phase) return;

          // Determine visible item ids for this phase based on course type
          const visibleIds = (phase.subPhases
            ? phase.subPhases
                .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
                .flatMap(sp => sp.itemIds)
            : phase.items.map(i => i.id));

          // Honor the requested itemIndex if it's visible; otherwise fall back to first visible
          let targetIndex = itemIndex;
          const requestedId = phase.items[itemIndex]?.id;
          if (!requestedId || !visibleIds.includes(requestedId)) {
            if (visibleIds.length > 0) {
              const firstId = visibleIds[0];
              const idx = phase.items.findIndex(i => i.id === firstId);
              targetIndex = Math.max(0, idx);
            } else {
              targetIndex = 0;
            }
          }

          navigateToItem(phaseId, targetIndex);
        }}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Sub-phase intro - rendered outside the card */}
        {currentSubPhaseMetatext && (() => {
          const subPhase = currentPhase?.subPhases?.find(sp => sp.itemIds.includes(currentItem?.id || ''));
          const subPhaseTitle = subPhase?.label || '';
          return (
            <div className="space-y-3 mb-6">
              <h2 className="text-2xl font-bold text-foreground">{subPhaseTitle}</h2>
              {currentSubPhaseMetatext.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          );
        })()}

        {/* Phase 4 intro notes for item 4.1 */}
        {courseData.currentPhaseId === 'phase4' && currentItem?.id === '4.1' && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-1.5">{lt.topicsAndSkillsTitle}</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{lt.topicsAndSkillsP1}</p>
                <p>{lt.topicsAndSkillsP2}</p>
                <p>{lt.topicsAndSkillsP3}</p>
              </div>
            </div>
            <hr className="border-primary/20" />
            <div>
              <h3 className="text-sm font-semibold text-primary mb-1.5">{lt.forwardRefTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {lt.forwardRefDesc}
              </p>
            </div>
          </div>
        )}

        <Card className="p-8 shadow-md">
          {currentItem && (
            <>
              <ItemForm
                item={currentItem}
                courseType={courseData.courseType}
                values={courseData.data[currentItem.id] || {}}
                onChange={(fieldName, value) => handleFieldChange(currentItem.id, fieldName, value)}
                onUpdateOtherItem={(itemId, fieldName, value) => handleFieldChange(itemId, fieldName, value)}
                allData={courseData.data}
                compositeIntegrityBroken={courseData.compositeIntegrityBroken}
                onBreakCompositeIntegrity={handleBreakCompositeIntegrity}
                basedOnSingleSource={courseData.basedOnSingleSource}
                onBreakSingleSourceIntegrity={handleBreakSingleSourceIntegrity}
                standaloneSources={courseData.standaloneSources}
                onGoToLearningActivities={() => {
                  const phase5 = phases.find(p => p.id === 'phase5');
                  if (!phase5) return;
                  const idx = phase5.items.findIndex(i => i.id === '5.1');
                  navigateToItem('phase5', Math.max(0, idx));
                }}
              />
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-8 border-t border-border">
            <Button
              onClick={navigatePrevious}
              variant="outline"
              size="lg"
              disabled={(() => {
                const currentPhase = phases.find(p => p.id === courseData.currentPhaseId);
                if (!currentPhase) return false;
                const visibleIds = currentPhase.subPhases
                  ? currentPhase.subPhases
                      .filter(sp => isMCType(courseData.courseType) || !sp.mcOnly)
                      .flatMap(sp => sp.itemIds)
                  : currentPhase.items.map(i => i.id);
                const currentItemId = currentPhase.items[courseData.currentItemIndex]?.id;
                const visibleIndex = visibleIds.indexOf(currentItemId);
                const atFirstVisibleInFirstPhase =
                  phases.findIndex(p => p.id === courseData.currentPhaseId) === 0 && visibleIndex === 0;
                return atFirstVisibleInFirstPhase;
              })()}
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              {lt.previousItem}
            </Button>

            <div className="flex items-center gap-3">
              {/* Come back later button for learning activities (5.1) */}
              {courseData?.currentPhaseId === 'phase5' && phases.find(p => p.id === 'phase5')?.items[courseData.currentItemIndex]?.id === '5.1' && !isCurrentItemValid() && (
                <Button
                  onClick={navigateNext}
                  variant="outline"
                  size="lg"
                >
                  {lt.comeBackLater}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}

              {isAtLastItem() ? (
                <Button
                  onClick={handleFinishClick}
                  variant="default"
                  size="lg"
                  disabled={!isCurrentItemValid()}
                >
                  {lt.completeDesign}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={navigateNext}
                  variant="default"
                  size="lg"
                  disabled={!isCurrentItemValid()}
                >
                  {lt.nextItem}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lt.deleteLocalCopyTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {lt.deleteLocalCopyDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lt.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {lt.deleteButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Security Code Dialog */}
      <AlertDialog open={showSecurityCodeDialog} onOpenChange={setShowSecurityCodeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lt.documentCreatedTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  {lt.startingDevelopmentPrefix}{' '}
                  <span className="font-semibold">
                    {courseData?.courseType === 'micro-credential' ? lt.microCredentialLabel : lt.standaloneCourseLabel}
                  </span>.
                </p>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="font-semibold mb-2">{lt.yourSecurityCodeIs}</p>
                  <p className="text-3xl font-mono text-center bg-background px-4 py-3 rounded border-2 border-primary">
                    {securityCode}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {lt.saveCodeSecurely}
                  </p>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-amber-800 flex items-center gap-2">
                    {lt.importantSaveWork}
                  </p>
                  <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                    <li>
                      <strong>{lt.exportJsonRegularly}</strong> {lt.exportJsonRegularlyRest}
                    </li>
                    <li>
                      {lt.jsonContainsAllInfo}
                    </li>
                    <li>
                      {lt.canGeneratePdfAnytime}
                    </li>
                    <li>
                      <strong>{lt.incompleteDocsDeleted}</strong> {lt.incompleteDocsDeletedRest}
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleGeneratePDF}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {lt.downloadPdfButton}
            </Button>
            <AlertDialogAction onClick={() => setShowSecurityCodeDialog(false)}>
              {lt.continueAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {getIncompleteItems().length > 0 ? lt.incompleteItemsTitle : lt.designCompleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {getIncompleteItems().length > 0 ? (
                  <>
                    <p>{lt.incompleteItemsIntro}</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {getIncompleteItems().map((item, idx) => (
                        <div 
                          key={idx} 
                          className="bg-muted/50 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => {
                            // Find the phase and item index
                            const phase = phases.find(p => p.items.some(i => i.id === item.itemId));
                            if (phase) {
                              const itemIndex = phase.items.findIndex(i => i.id === item.itemId);
                              navigateToItem(phase.id, itemIndex);
                              setShowCompletionDialog(false);
                            }
                          }}
                        >
                          <p className="text-sm font-medium text-foreground">{item.item}</p>
                          <p className="text-xs text-muted-foreground">{item.phase}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lt.clickItemToNavigate}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-foreground">
                      {lt.congratsComplete}
                    </p>
                    
                    {/* JSON Export - Primary backup */}
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-3">
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        {lt.step1Title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>{lt.step1Desc.split('!')[0]}!</strong>{lt.step1Desc.split('!')[1]}
                      </p>
                      <Button onClick={() => {
                        handleExport();
                        setCompletionJsonDownloaded(true);
                      }} className={`w-full ${!completionJsonDownloaded ? 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] ring-2 ring-primary/50' : ''}`} size="lg">
                        <Download className="mr-2 h-5 w-5" />
                        {lt.downloadJsonBackup}
                      </Button>
                    </div>

                    {/* PDF Export - Documentation */}
                    <div className={`rounded-lg p-4 space-y-3 border ${completionPdfDownloaded ? 'bg-emerald-50 border-emerald-300' : completionJsonDownloaded ? 'bg-muted/50 border-border' : 'bg-muted/30 border-border opacity-60'}`}>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        {completionPdfDownloaded ? <Check className="h-5 w-5 text-emerald-600" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                        {lt.step2Title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lt.step2Desc}
                      </p>
                      <Button onClick={async () => {
                        await handleGeneratePDF();
                        setCompletionPdfDownloaded(true);
                      }} variant="outline" className={`w-full ${completionJsonDownloaded && !completionPdfDownloaded ? 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] ring-2 ring-primary/50' : ''}`} disabled={!completionJsonDownloaded || completionPdfDownloaded}>
                        <FileText className="mr-2 h-4 w-4" />
                        {completionPdfDownloaded ? lt.pdfGeneratedCheck : lt.generatePdfButton}
                      </Button>
                    </div>

                    {/* Step 3: Review PDF */}
                    <div className={`rounded-lg p-4 space-y-3 ${completionJsonDownloaded && completionPdfDownloaded ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 border border-border opacity-60'}`}>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-primary" />
                        {lt.step3Title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lt.step3Desc}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      {lt.onlySavedInBrowser}
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            {getIncompleteItems().length > 0 ? (
              <AlertDialogCancel>{lt.closeButton}</AlertDialogCancel>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setShowCompletionDialog(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  {lt.continueEditing}
                </Button>
                <Button
                  onClick={() => {
                    setShowCompletionDialog(false);
                    sessionStorage.removeItem(SESSION_KEY);
                    setCourseData(null);
                    setSecurityCode('');
                    setIsLocked(true);
                    setInputCode('');
                    setSelectedCourseType(null);
                    setCompletionJsonDownloaded(false);
                    setCompletionPdfDownloaded(false);
                    setJsonDownloaded(false);
                    setPdfDownloaded(false);
                    setWelcomeStep('initial');
                  }}
                  className={`w-full transition-colors ${completionJsonDownloaded && completionPdfDownloaded ? 'bg-primary hover:bg-primary/90' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  disabled={!(completionJsonDownloaded && completionPdfDownloaded)}
                >
                  {lt.closeTemplateDesigner}
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirmation Dialog */}
      {importConfirmationDialog}
      {overwriteWarningDialog}
      </div>

      {/* Phase 4 → 5 Transition Modal */}
      <Dialog open={showPhaseTransitionModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl">{lt.enteringDevelopmentPhase}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-foreground">
                  {lt.movingToDevelopment}
                </p>
                <p className="text-sm text-foreground">
                  {lt.manyDevelopersPause}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {lt.recommendSaveCheckpoint}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={proceedToPhase5}
              size="lg"
              className={`w-full transition-colors ${jsonDownloaded && pdfDownloaded ? 'bg-primary hover:bg-primary/90' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {lt.continueToDevelopmentPhase}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button onClick={() => { handleExport(); setJsonDownloaded(true); }} variant="outline" className={`flex-1 ${!jsonDownloaded ? 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] ring-2 ring-primary/50' : ''}`}>
                <Download className="mr-2 h-4 w-4" />
                {lt.downloadJson}
              </Button>
              <Button onClick={() => { handleGeneratePDF(); setPdfDownloaded(true); }} variant="outline" className={`flex-1 ${!pdfDownloaded ? 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] ring-2 ring-primary/50' : ''}`}>
                <FileText className="mr-2 h-4 w-4" />
                {lt.downloadPdfSummary}
              </Button>
            </div>
            {courseData?.courseType !== 'composite-micro-credential' && (
              <>
                <p className="text-xs text-muted-foreground text-center">
                  {lt.didacticalGuideNote}
                </p>
                <Button
                  onClick={async () => {
                    if (!courseData) return;
                    try {
                      await generateDidacticalGuidePDF(courseData);
                      toast({ title: lt.didacticalGeneratedTitle, description: lt.didacticalGeneratedDesc });
                    } catch (error) {
                      toast({ title: lt.didacticalFailedTitle, description: lt.didacticalFailedDesc, variant: 'destructive' });
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {lt.downloadDidacticalGuide}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {securityCode && (
        <footer className="bg-muted/30 border-t border-border py-2 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{lt.securityCodeFooter}</span>
            <span className="font-mono text-xs font-semibold">{securityCode}</span>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Index;
