import { Item, CourseType } from '@/types/course';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProjectClassification } from './ProjectClassification';
import { MarketNeedsForm } from './MarketNeedsForm';
import { EQFLevelForm } from './EQFLevelForm';
import { AudienceForm } from './AudienceForm';
import InterdisciplinaryPerspectivesForm from './InterdisciplinaryPerspectivesForm';
import ECTSCalculatorForm from './ECTSCalculatorForm';
import CompositeECTSCalculatorForm from './CompositeECTSCalculatorForm';
import DefineAssessmentForm from './DefineAssessmentForm';
import DesignAssessmentForm from './DesignAssessmentForm';
import TopicsAndThemesForm from './TopicsAndThemesForm';
import { TechnicalRequirementsForm } from './TechnicalRequirementsForm';
import ConstructiveAlignmentForm from './ConstructiveAlignmentForm';
import MultimodalLearningForm from './MultimodalLearningForm';
import SupplementaryConsiderationsForm from './SupplementaryConsiderationsForm';
import GlossaryForm from './GlossaryForm';
import LearningActivitiesForm from './LearningActivitiesForm';
import ContentReuseForm from './ContentReuseForm';
import MeetingLearnerNeedsForm from './MeetingLearnerNeedsForm';
import EvaluationPlanForm from './EvaluationPlanForm';
import { CompositeSourceViewer } from './CompositeSourceViewer';

interface ItemFormProps {
  item: Item;
  courseType: CourseType;
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  onUpdateOtherItem?: (itemId: string, fieldName: string, value: any) => void;
  allData?: Record<string, any>;
  compositeIntegrityBroken?: boolean;
  onBreakCompositeIntegrity?: () => void;
  basedOnSingleSource?: boolean;
  onBreakSingleSourceIntegrity?: () => void;
  standaloneSources?: Array<{ workingTitle: string; documentId: string; data: Record<string, any> }>;
  onGoToLearningActivities?: () => void;
}

export function ItemForm({ item, courseType, values, onChange, onUpdateOtherItem, allData, compositeIntegrityBroken, onBreakCompositeIntegrity, basedOnSingleSource, onBreakSingleSourceIntegrity, standaloneSources, onGoToLearningActivities }: ItemFormProps) {
  const validateECTS = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    return (num * 2) % 1 === 0;
  };

  // Show composite source data if available.
  // For composite MCs we read from the per-item _compositeSources metadata.
  // For regular MCs created from uploaded files (basedOnSingleSource OR a merge
  // of multiple uploads), we derive the same shape from courseData.standaloneSources
  // so every item gets the same collapsible read-only inspiration panel.
  const compositeSourcesFromValues = values?._compositeSources;
  const derivedSourcesForItem = (!compositeSourcesFromValues && standaloneSources && standaloneSources.length > 0)
    ? standaloneSources.map((src, sIdx) => {
        const itemData = src?.data?.[item.id];
        return {
          sourceIndex: sIdx,
          sourceTitle: src.workingTitle || (src as any).fileName || src.documentId || `Source ${sIdx + 1}`,
          sourceDocumentId: src.documentId,
          data: (itemData && typeof itemData === 'object') ? itemData : {},
        };
      })
    : null;
  const compositeSources = compositeSourcesFromValues || derivedSourcesForItem;
  const showAsCompositeViewer = courseType === 'composite-micro-credential' && compositeSourcesFromValues?.length > 0;
  const compositeSourceViewer = (compositeSources && compositeSources.length > 0) ? (
    <CompositeSourceViewer
      sources={compositeSources}
      itemId={item.id}
      integrityBroken={showAsCompositeViewer ? compositeIntegrityBroken : false}
      onRequestEdit={showAsCompositeViewer ? onBreakCompositeIntegrity : undefined}
    />
  ) : null;

  const withCompositeViewer = (content: React.ReactNode): React.ReactElement => {
    if (!compositeSourceViewer) return content as React.ReactElement;
    return (
      <div>
        {compositeSourceViewer}
        {content}
      </div>
    );
  };

  const renderFormContent = (): React.ReactElement => {
  // Use custom component for Phase 2.1
  if (item.id === '2.1') {
    return <ProjectClassification values={values} onChange={onChange} courseType={courseType} standaloneSources={standaloneSources} />;
  }

  // Use custom component for Phase 3.1 (Market Needs)
  if (item.id === '3.1') {
    return (
      <MarketNeedsForm
        value={values['marketNeedsData'] || {}}
        onChange={(newValue) => onChange('marketNeedsData', newValue)}
        courseType={courseType}
      />
    );
  }

  // Use custom component for Phase 3.4 (Audience)
  if (item.id === '3.4') {
    return (
      <AudienceForm
        value={values['audienceData'] || {}}
        onChange={(newValue) => onChange('audienceData', newValue)}
        courseType={courseType}
      />
    );
  }

  // Use custom component for Phase 3.5 (Interdisciplinary Perspectives)
  if (item.id === '3.5') {
    return (
      <InterdisciplinaryPerspectivesForm
        data={values['interdisciplinaryData'] || {}}
        onChange={(newValue) => onChange('interdisciplinaryData', newValue)}
        courseType={courseType}
        onBreakCompositeIntegrity={onBreakCompositeIntegrity}
        basedOnSingleSource={basedOnSingleSource}
        onBreakSingleSourceIntegrity={onBreakSingleSourceIntegrity}
        standaloneSources={standaloneSources}
      />
    );
  }

  // Use custom component for Phase 4.1 (Topics and Themes)
  if (item.id === '4.1') {
    const interdisciplinaryData = allData?.['3.5']?.interdisciplinaryData || {};
    const learningOutcomes = interdisciplinaryData.learningOutcomes || [];
    
    return (
      <TopicsAndThemesForm
        data={values['topicsData'] || {}}
        onChange={(newValue) => onChange('topicsData', newValue)}
        courseType={courseType}
        learningOutcomes={learningOutcomes}
      />
    );
  }

  // Use custom component for Phase 4.3 (Constructive Alignment)
  if (item.id === '4.3') {
    const interdisciplinaryData = allData?.['3.5']?.interdisciplinaryData || {};
    const learningOutcomes = interdisciplinaryData.learningOutcomes || [];
    const topicsData = allData?.['4.1']?.topicsData || {};
    const assessmentData = allData?.['3.10']?.defineAssessmentData || {};
    
    return (
      <ConstructiveAlignmentForm
        data={values['constructiveAlignmentData'] || {}}
        onChange={(newValue) => onChange('constructiveAlignmentData', newValue)}
        courseType={courseType}
        learningOutcomes={learningOutcomes}
        topicsData={topicsData}
        assessmentData={assessmentData}
      />
    );
  }

  // Use custom component for Phase 4.4 (Multimodal Learning Resources)
  if (item.id === '4.4') {
    return (
      <MultimodalLearningForm
        data={values['multimodalLearningData'] || {}}
        onChange={(newValue) => onChange('multimodalLearningData', newValue)}
        courseType={courseType}
        basedOnSingleSource={basedOnSingleSource}
      />
    );
  }

  // Use custom component for Phase 4.5 (Supplementary Learning Considerations)
  if (item.id === '4.5') {
    const multimodalData = allData?.['4.4']?.multimodalLearningData || {};
    
    const handleIncorporate = (field: string, checkField: string, checkValue: string) => {
      if (onUpdateOtherItem) {
        const currentMultimodal = allData?.['4.4']?.multimodalLearningData || {};
        const currentValues = currentMultimodal[checkField] || [];
        
        if (!currentValues.includes(checkValue)) {
          const updatedMultimodal = {
            ...currentMultimodal,
            [checkField]: [...currentValues, checkValue],
          };
          onUpdateOtherItem('4.4', 'multimodalLearningData', updatedMultimodal);
        }
      }
    };
    
    return (
      <SupplementaryConsiderationsForm
        multimodalData={multimodalData}
        value={values['supplementaryData'] || {}}
        onChange={(newValue) => onChange('supplementaryData', newValue)}
        onIncorporate={handleIncorporate}
        courseType={courseType}
        basedOnSingleSource={basedOnSingleSource}
      />
    );
  }

  // Use custom component for Phase 4.11 (Glossary)
  if (item.id === '4.11') {
    return (
      <GlossaryForm
        data={values['glossaryData'] || {}}
        onChange={(newValue) => onChange('glossaryData', newValue)}
        courseType={courseType}
        onBreakCompositeIntegrity={onBreakCompositeIntegrity}
        basedOnSingleSource={basedOnSingleSource}
        onBreakSingleSourceIntegrity={onBreakSingleSourceIntegrity}
      />
    );
  }

  // Use custom component for Phase 5.1 (Develop Learning Activities)
  if (item.id === '5.1') {
    const multimodalData = allData?.['4.4']?.multimodalLearningData || {};
    
    return (
      <LearningActivitiesForm
        data={values['learningActivitiesData'] || {}}
        onChange={(newValue) => onChange('learningActivitiesData', newValue)}
        courseType={courseType}
        multimodalData={multimodalData}
        onBreakCompositeIntegrity={onBreakCompositeIntegrity}
        basedOnSingleSource={basedOnSingleSource}
        onBreakSingleSourceIntegrity={onBreakSingleSourceIntegrity}
      />
    );
  }

  // Use custom component for Phase 3.10 (Define Assessment)
  if (item.id === '3.10') {
    const interdisciplinaryData = allData?.['3.5']?.interdisciplinaryData || {};
    const learningOutcomes = interdisciplinaryData.learningOutcomes || [];
    
    return (
      <DefineAssessmentForm
        data={values['defineAssessmentData'] || {}}
        onChange={(newValue) => onChange('defineAssessmentData', newValue)}
        courseType={courseType}
        learningOutcomes={learningOutcomes}
      />
    );
  }

  // Use custom component for Phase 5.5 (Design Assessment)
  if (item.id === '5.5') {
    const interdisciplinaryData = allData?.['3.5']?.interdisciplinaryData || {};
    const learningOutcomes = interdisciplinaryData.learningOutcomes || [];
    const assessmentFramework = allData?.['3.10']?.defineAssessmentData || {};
    
    const handleUpdatePhase3 = (activityDescription: string) => {
      if (onUpdateOtherItem) {
        const currentDefineAssessment = allData?.['3.10']?.defineAssessmentData || {};
        const updatedDefineAssessment = {
          ...currentDefineAssessment,
          activityDescription: activityDescription,
        };
        onUpdateOtherItem('3.10', 'defineAssessmentData', updatedDefineAssessment);
      }
    };
    
    return (
      <DesignAssessmentForm
        data={values['designAssessmentData'] || {}}
        onChange={(newValue) => onChange('designAssessmentData', newValue)}
        onUpdatePhase3={handleUpdatePhase3}
        courseType={courseType}
        learningOutcomes={learningOutcomes}
        assessmentFramework={assessmentFramework}
        currentItemId={item.id}
        standaloneSources={(values?._compositeSources as any) || standaloneSources}
      />
    );
  }

  // Use custom component for Phase 6.1 and 6.2 (Technical Requirements)
  if (item.id === '6.1' || item.id === '6.2') {
    const sharedTechData = allData?.['6.1']?.technicalRequirementsData || values['technicalRequirementsData'] || {};
    return (
      <TechnicalRequirementsForm
        value={sharedTechData}
        onChange={(newValue) => onChange('technicalRequirementsData', newValue)}
        courseType={courseType}
      />
    );
  }

  // Use custom component for Phase 6.3 (ECTS Calculator)
  if (item.id === '6.3') {
    // Composite micro-credentials use a course-level ECTS view (prefilled from sources)
    if (courseType === 'composite-micro-credential') {
      const sources = (values?._compositeSources as any[]) || [];
      const phase55 = allData?.['5.5']?.designAssessmentData || allData?.['5.5'] || {};
      return (
        <CompositeECTSCalculatorForm
          data={values['compositeEctsData'] || { sources: [], groups: [] }}
          onChange={(newValue) => onChange('compositeEctsData', newValue)}
          compositeSources={sources}
          phase5EitherGroups={phase55.partiallyFixedEitherGroups}
          phase5EitherSources={phase55.partiallyFixedEitherSources}
        />
      );
    }

    const learningActivitiesData = allData?.['5.1']?.learningActivitiesData || {};
    const confirmedActivities = learningActivitiesData.isComplete 
      ? (learningActivitiesData.activities || []).filter((a: any) => 
          a.activity?.trim() && a.timeStructure && a.deliveryMode && a.participationForm
        )
      : [];
    const designAssessmentData = allData?.['5.5']?.designAssessmentData || {};
    const assessmentProcessDescription = designAssessmentData.assessmentProcessDescription || '';
    
    return (
      <ECTSCalculatorForm
        data={values['ectsData'] || {}}
        onChange={(newValue) => onChange('ectsData', newValue)}
        courseType={courseType}
        predefinedLearningActivities={confirmedActivities}
        assessmentProcessDescription={assessmentProcessDescription}
        onBreakCompositeIntegrity={onBreakCompositeIntegrity}
        basedOnSingleSource={basedOnSingleSource}
        onBreakSingleSourceIntegrity={onBreakSingleSourceIntegrity}
        onGoToLearningActivities={onGoToLearningActivities}
      />
    );
  }

  // Use custom component for Phase 6.4 (EQF Level)
  if (item.id === '6.4') {
    const interdisciplinaryData = allData?.['3.5']?.interdisciplinaryData || {};
    const learningOutcomes = interdisciplinaryData.learningOutcomes || [];
    const compositeSources = values?._compositeSources || [];
    
    return (
      <EQFLevelForm
        value={values['eqfLevelData'] || {}}
        onChange={(newValue) => onChange('eqfLevelData', newValue)}
        courseType={courseType}
        learningOutcomes={learningOutcomes}
        compositeSources={compositeSources}
        standaloneSources={standaloneSources}
      />
    );
  }

  // Use custom component for Phase 6.5 (Content Reuse + Physical Presence + Skills Alignment)
  if (item.id === '6.5') {
    const learningActivitiesData = allData?.['5.1']?.learningActivitiesData || {};
    const marketNeedsData = allData?.['3.1']?.marketNeedsData || {};
    const workingTitle = allData?.['2.1']?.workingTitle || '';

    // Collect instructors from all standalone sources (composite or single-source MC)
    const sourceInstructors: Array<{ name: string; title: string; institution: string; additionalInfo?: string; sourceTitle: string }> = [];
    const sourcesForInstructors = (standaloneSources && standaloneSources.length > 0)
      ? standaloneSources
      : [];
    sourcesForInstructors.forEach((src) => {
      const inst = src?.data?.['6.5']?.contentReuseData?.instructors || [];
      inst.forEach((i: any) => {
        sourceInstructors.push({
          name: i.name || '',
          title: i.title || '',
          institution: i.institution || '',
          additionalInfo: i.additionalInfo || '',
          sourceTitle: src.workingTitle || '',
        });
      });
    });

    return (
      <ContentReuseForm
        data={values['contentReuseData'] || {}}
        onChange={(newValue) => onChange('contentReuseData', newValue)}
        courseType={courseType}
        learningActivitiesData={learningActivitiesData}
        marketNeedsData={marketNeedsData}
        workingTitle={workingTitle}
        sourceInstructors={sourceInstructors}
      />
    );
  }

  // Use custom component for Phase 6.8 (Meeting Learner Needs)
  if (item.id === '6.8') {
    const designAssessmentData = allData?.['5.5']?.designAssessmentData || {};
    const assessmentAccessModel = designAssessmentData.assessmentAccessModel;
    const eitherGroups = designAssessmentData.partiallyFixedEitherGroups || {};
    const hasEitherOrGroups = Object.keys(eitherGroups).length > 0;
    return (
      <MeetingLearnerNeedsForm
        data={values['meetingLearnerNeedsData'] || {}}
        onChange={(newValue) => onChange('meetingLearnerNeedsData', newValue)}
        courseType={courseType}
        assessmentAccessModel={assessmentAccessModel}
        hasEitherOrGroups={hasEitherOrGroups}
      />
    );
  }

  // Use custom component for Phase 6.10 (Evaluation Plan)
  if (item.id === '6.10') {
    return (
      <EvaluationPlanForm
        data={values['evaluationPlanData'] || {}}
        onChange={(newValue) => onChange('evaluationPlanData', newValue)}
        courseType={courseType}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-2xl font-bold text-foreground">{item.title}</h2>
        {item.description && (
          <p className="text-muted-foreground mt-2">{item.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {item.fields.map((field) => {
          if (field.mcOnly && courseType === 'standalone') {
            return null;
          }

          const fieldId = `${item.id}-${field.name}`;
          const value = values[field.name] ?? '';
          const isRequired = field.required && (courseType !== 'standalone' || !field.mcOnly);

          return (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={fieldId} className="text-base font-medium">
                  {field.label}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                  {field.mcOnly && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      MC Only
                    </span>
                  )}
                </Label>
                {field.helpText && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Help"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{field.helpText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {field.type === 'text' && (
                <Input
                  id={fieldId}
                  value={value}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={isRequired}
                  aria-required={isRequired}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  id={fieldId}
                  value={value}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={isRequired}
                  aria-required={isRequired}
                  rows={5}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              )}

              {field.type === 'number' && (
                <Input
                  id={fieldId}
                  type="number"
                  value={value}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={isRequired}
                  aria-required={isRequired}
                  min={field.validation?.min}
                  max={field.validation?.max}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              )}

              {field.type === 'ects' && (
                <div className="space-y-2">
                  <Input
                    id={fieldId}
                    type="number"
                    step="0.5"
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange(field.name, val);
                    }}
                    placeholder="e.g., 1.0, 1.5, 2.0"
                    required={isRequired}
                    aria-required={isRequired}
                    min={field.validation?.min ?? 0}
                    max={field.validation?.max ?? 60}
                    className={cn(
                      'transition-all duration-200 focus:ring-2 focus:ring-primary',
                      value && !validateECTS(value) && 'border-destructive'
                    )}
                  />
                  {value && !validateECTS(value) && (
                    <p className="text-sm text-destructive">
                      ECTS must be whole or half points (e.g., 1.0, 1.5, 2.0)
                    </p>
                  )}
                  {courseType !== 'standalone' && value && parseFloat(value) < 1.0 && (
                    <p className="text-sm text-destructive">
                      Minimum 1.0 ECTS required for a micro-credential
                    </p>
                  )}
                </div>
              )}

              {field.type === 'date' && (
                <Input
                  id={fieldId}
                  type="date"
                  value={value}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  required={isRequired}
                  aria-required={isRequired}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              )}

              {field.type === 'select' && (
                <Select value={value} onValueChange={(val) => onChange(field.name, val)}>
                  <SelectTrigger id={fieldId} className="transition-all duration-200 focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === 'checkbox' && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={fieldId}
                    checked={value === true}
                    onCheckedChange={(checked) => onChange(field.name, checked)}
                    aria-required={isRequired}
                  />
                  <Label htmlFor={fieldId} className="font-normal cursor-pointer">
                    {field.placeholder || 'Yes'}
                  </Label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
  };

  return withCompositeViewer(renderFormContent());
}
