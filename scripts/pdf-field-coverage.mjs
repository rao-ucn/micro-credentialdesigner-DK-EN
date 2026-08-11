#!/usr/bin/env node
/**
 * PDF field-coverage test.
 *
 * For each phase item, compare:
 *   - Fields the form WRITES to its data slot (e.g. `onChange({ ...data, foo: ... })`)
 *   - Fields the PDF READS from that slot   (e.g. `techData.foo`)
 *
 * Reports any field written by the form but never read by the PDF generator
 * (which is the exact bug pattern: lmsPlatform/chosenLevel/etc).
 *
 * Heuristic — not exhaustive — but catches naming mismatches like the recent
 * 6.1 (lmsPlatform) and 6.4 (chosenLevel) regressions.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const pdf = fs.readFileSync(path.join(root, 'src/lib/pdf.ts'), 'utf8');

// item.id -> { component, dataKey }
const ITEMS = {
  '2.1': { file: 'ProjectClassification.tsx',           dataKey: null /* uses many root keys */ },
  '3.1': { file: 'MarketNeedsForm.tsx',                  dataKey: 'marketNeedsData' },
  '3.4': { file: 'AudienceForm.tsx',                     dataKey: 'audienceData' },
  '3.5': { file: 'InterdisciplinaryPerspectivesForm.tsx',dataKey: 'interdisciplinaryData' },
  '3.10':{ file: 'DefineAssessmentForm.tsx',             dataKey: 'defineAssessmentData' },
  '4.1': { file: 'TopicsAndThemesForm.tsx',              dataKey: 'topicsData' },
  '4.3': { file: 'ConstructiveAlignmentForm.tsx',        dataKey: 'constructiveAlignmentData' },
  '4.4': { file: 'MultimodalLearningForm.tsx',           dataKey: 'multimodalLearningData' },
  '4.5': { file: 'SupplementaryConsiderationsForm.tsx',  dataKey: 'supplementaryData' },
  '4.11':{ file: 'GlossaryForm.tsx',                     dataKey: 'glossaryData' },
  '5.1': { file: 'LearningActivitiesForm.tsx',           dataKey: 'learningActivitiesData' },
  '5.5': { file: 'DesignAssessmentForm.tsx',             dataKey: 'designAssessmentData' },
  '6.1': { file: 'TechnicalRequirementsForm.tsx',        dataKey: 'technicalRequirementsData' },
  '6.3': { file: 'ECTSCalculatorForm.tsx',               dataKey: 'ectsData' },
  '6.4': { file: 'EQFLevelForm.tsx',                     dataKey: 'eqfLevelData' },
  '6.5': { file: 'ContentReuseForm.tsx',                 dataKey: 'contentReuseData' },
  '6.8': { file: 'MeetingLearnerNeedsForm.tsx',          dataKey: 'meetingLearnerNeedsData' },
  '6.10':{ file: 'EvaluationPlanForm.tsx',               dataKey: 'evaluationPlanData' },
};

// Common keys to ignore — UI flags, component props, nested-record keys, callbacks
const IGNORE = new Set([
  // housekeeping
  'isComplete', 'completed', 'confirmed', 'id', 'createdAt', 'updatedAt',
  'platformsCompleted', 'singleLevelConfirmed', 'transparencyConfirmed',
  'multimodalConfirmed', 'resitAlignmentConfirmed', 'assessmentAccessConfirmed',
  'finalConfirmation', 'singleLevelLockedForComposite', 'boksaGenerated',
  // generic component props (not data fields)
  'data', 'value', 'onChange', 'courseType', 'learningOutcomes',
  'learningActivitiesData', 'marketNeedsData', 'assessmentFramework',
  'assessmentAccessModel', 'currentItemId', 'basedOnSingleSource',
  'hasEitherOrGroups', 'predefinedLearningActivities', 'multimodalData',
  'assessmentProcessDescription', 'learningResources', 'sourceInstructors',
  'standaloneSources', 'compositeSources', 'topicsData', 'assessmentData',
  'minimumRequired', 'onUpdatePhase3',
  // nested-record / sub-shape keys (live inside arrays already handled by parent)
  'knowledge', 'skills', 'type', 'key', 'name', 'uri', 'title', 'description',
  'level', 'institution', 'additionalInfo', 'activities', 'escoCompetences',
  'additionalCompetences', 'workingTitle', 'approach', 'cognitiveDomain',
  'activeVerb', 'outcomeText', 'competenceFocus', 'composedOutcome',
  'competenceDimensions', 'contextOfApplication', 'keyActions',
  'expectedResult', 'successCriteria', 'measurementMethod',
  'formulationApproach', 'alignmentCheck1', 'alignmentCheck1Issue',
  'alignmentCheck2', 'alignmentCheck2Issue', 'activity', 'timeStructure',
  'deliveryMode', 'participationForm', 'notes', 'participationConstraints',
  'openAccess', 'minimumNumber', 'maximumRequired', 'maximumNumber',
  'confirmProceedWithoutCoverage', '_sourceTitle', '_sourceInstructorsImported',
  'isPredefined', 'totalLearningHours', 'otherDescription',
  'contentRepresentation', 'themes', 'boksaContent', 'individualOrGroup',
  'assessmentType', 'activityTypes', 'otherActivityType', 'activityDescription',
  // 5.1: read-only mirrors of 4.4 multimodal data
  'activeEngagement', 'applicationTransfer',
  // 4.5: stale type-only fields no longer rendered by the form
  'plenaryDecision', 'finalConfirmationComment',
  // 5.5: legacy resit fields (replaced by resitDescription/resitAdminNotes)
  'resitAvailability', 'resitConditions', 'resitConditionsOther',
  'resitFeedbackType', 'resitFormat', 'resitFormatOther', 'resitAvailable',
]);

// Anything starting with these prefixes is treated as ignorable
const IGNORE_PREFIXES = ['on', '_'];

function extractWrittenFields(srcPath) {
  if (!fs.existsSync(srcPath)) return new Set();
  const code = fs.readFileSync(srcPath, 'utf8');
  const fields = new Set();

  // Match: { ...data, foo: ... }   and   onChange({ ..., foo: ... })
  const objRe = /\{\s*(?:\.\.\.[A-Za-z_]\w*\s*,\s*)?([A-Za-z_]\w*)\s*:/g;
  let m;
  while ((m = objRe.exec(code))) fields.add(m[1]);

  // Match: handleChange('foo', ...)  /  onChange({ ..., 'foo': ... })
  const callRe = /handleChange\(\s*['"]([A-Za-z_]\w*)['"]/g;
  while ((m = callRe.exec(code))) fields.add(m[1]);

  // Match shape declarations: foo?: Type
  const propRe = /^\s+([A-Za-z_]\w*)\?\s*:/gm;
  while ((m = propRe.exec(code))) fields.add(m[1]);

  // Drop noise
  for (const k of [...fields]) {
    if (IGNORE.has(k)) fields.delete(k);
    if (k.length <= 1) fields.delete(k);
    if (IGNORE_PREFIXES.some(p => k.startsWith(p) && k[p.length] && k[p.length] === k[p.length].toUpperCase())) fields.delete(k);
  }
  return fields;
}

function extractReadFields(dataKey) {
  if (!dataKey) return new Set();
  // Match: <varName>.<field> where varName has been assigned from itemData[dataKey]
  // Simple heuristic: scan for `<dataKey> = ... || {}` to find alias var, then read aliasVar.field
  // Fallback: just look for `dataKey.field` and any alias var derived in surrounding lines.
  const fields = new Set();
  // Find every `const X = itemData.<dataKey> || ...` to capture aliases
  const aliasRe = new RegExp(`const\\s+(\\w+)\\s*=\\s*(?:itemData|data\\.data\\[[^\\]]+\\])\\.${dataKey}`, 'g');
  const aliases = new Set([dataKey]);
  let m;
  while ((m = aliasRe.exec(pdf))) aliases.add(m[1]);

  for (const a of aliases) {
    const re = new RegExp(`\\b${a}\\.([A-Za-z_]\\w*)`, 'g');
    while ((m = re.exec(pdf))) fields.add(m[1]);
  }
  return fields;
}

let totalMissing = 0;
const report = [];

for (const [itemId, { file, dataKey }] of Object.entries(ITEMS)) {
  if (!dataKey) continue;
  const written = extractWrittenFields(path.join(root, 'src/components', file));
  const read = extractReadFields(dataKey);
  // Per-item allowlist: fields rendered via dynamic indexing the regex can't detect
  const PER_ITEM_RENDERED = {
    '4.5': ['explorationDecision', 'reflectionDecision', 'challengeDecision', 'realWorldDecision'],
  };
  const knownRendered = new Set(PER_ITEM_RENDERED[itemId] || []);
  const missing = [...written].filter(f => !read.has(f) && !IGNORE.has(f) && !knownRendered.has(f));

  report.push({
    itemId, file, dataKey,
    writtenCount: written.size,
    readCount: read.size,
    missing,
  });
  totalMissing += missing.length;
}

// Pretty print
console.log('\n=== PDF FIELD COVERAGE REPORT ===\n');
for (const r of report) {
  const status = r.missing.length === 0 ? '✅' : '⚠️ ';
  console.log(`${status} Item ${r.itemId.padEnd(5)} (${r.file})`);
  console.log(`   form writes: ${r.writtenCount}  |  pdf reads: ${r.readCount}  |  missing in PDF: ${r.missing.length}`);
  if (r.missing.length) {
    console.log(`   → ${r.missing.join(', ')}`);
  }
  console.log();
}
console.log(`Total form fields not referenced by PDF: ${totalMissing}`);
console.log('\n(NB: Heuristic. Fields may be intentionally omitted (UI-only flags, derived values, etc.). Investigate each ⚠️  case.)');

process.exit(0);
