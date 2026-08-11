// Shared helpers for learning outcome handling across components

type CompetenceDimension = 'knowledge' | 'skills' | 'responsibility_autonomy';

export interface UnifiedLearningOutcome {
  id: string;
  approach?: 'bloom' | 'tuning';
  cognitiveDomain?: string;
  activeVerb?: string;
  outcomeText?: string;
  competenceFocus?: string;
  composedOutcome?: string;
  competenceDimensions?: CompetenceDimension[];
  contextOfApplication?: string;
  keyActions?: string;
  expectedResult?: string;
}

export function getOutcomeText(o: UnifiedLearningOutcome): string {
  if (o.approach === 'tuning') {
    if (o.composedOutcome) return o.composedOutcome;
    const parts: string[] = [];
    if (o.competenceFocus) {
      let s = `The learner can ${o.competenceFocus}`;
      if (o.contextOfApplication) s += ` ${o.contextOfApplication}`;
      parts.push(s);
    }
    if (o.keyActions) parts.push(o.keyActions);
    if (o.expectedResult) parts.push(`in order to ${o.expectedResult}`);
    return parts.length > 0 ? parts.join(', ') + '.' : '';
  }
  return o.outcomeText || '';
}

export function isOutcomeComplete(o: UnifiedLearningOutcome): boolean {
  if (o.approach === 'tuning') {
    return !!(o.composedOutcome?.trim() || o.competenceFocus?.trim());
  }
  return !!(o.cognitiveDomain && o.outcomeText?.trim());
}
