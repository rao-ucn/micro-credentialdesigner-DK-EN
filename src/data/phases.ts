import { Phase } from '@/types/course';
import type { Language } from '@/lib/i18n';
import { phasesDa } from './phases.da';

export const phases: Phase[] = [
  {
    id: 'phase1',
    number: 1,
    title: 'Course type',
    items: [
      {
        id: '1.2',
        title: 'Select course type',
        fields: [
          {
            name: 'selectedCourseType',
            label: 'Selected Course Type',
            type: 'select',
            required: false,
            options: ['standalone', 'micro-credential'],
            helpText: 'The chosen course type for this design',
          },
        ],
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    title: 'Project classification and partners',
    items: [
      {
        id: '2.1',
        title: 'Project classification',
        description: 'Define the classification of your activity',
        fields: [
          {
            name: 'projectClassification',
            label: 'Project Classification',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    title: 'Learning outcomes and target audience',
    subPhases: [
      { id: '3a', label: 'Market needs', itemIds: ['3.1'] },
      { id: '3b', label: 'Audience', itemIds: ['3.4'] },
      { id: '3c', label: 'Learning aims and objectives', itemIds: ['3.5'], metatext: 'Learning aims and objectives define the direction and purpose of the micro-credential. They clarify what the learner is expected to achieve and why these aims matter in relation to the identified labour-market need. This theme supports developers in formulating aims that are coherent, relevant and aligned with the expected learning outcomes. Each item in this theme guides the developer through a structured reflection process, ensuring that choices are transparent and grounded in documented needs.' },
      { id: '3d', label: 'Define assessment', itemIds: ['3.10'], mcOnly: true },
    ],
    items: [
      {
        id: '3.1',
        title: 'Market needs',
        fields: [
          {
            name: 'marketNeedsData',
            label: 'Market Needs',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
      {
        id: '3.4',
        title: 'Identify primary learners',
        fields: [
          {
            name: 'targetAudience',
            label: 'Target Audience',
            type: 'textarea',
            required: true,
            helpText: 'Describe the primary learners (demographics, background, prerequisites)',
          },
          {
            name: 'prerequisites',
            label: 'Prerequisites',
            type: 'textarea',
            required: false,
          },
        ],
      },
      {
        id: '3.5',
        title: 'Interdisciplinary or cross-sector perspectives',
        fields: [
          {
            name: 'interdisciplinaryData',
            label: 'Interdisciplinary Perspectives',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
      {
        id: '3.10',
        title: 'Define assessment',
        mcOnly: true,
        fields: [
          {
            name: 'defineAssessmentData',
            label: 'Define Assessment',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    title: 'Content and learning activities',
    subPhases: [
      { id: '4a', label: 'Topics and skills', itemIds: ['4.1'] },
      { id: '4b', label: 'Constructive alignment', itemIds: ['4.3'] },
      { id: '4c', label: 'Multimodal learning resources', itemIds: ['4.4'] },
      { id: '4d', label: 'Supplementary learning considerations', itemIds: ['4.5'] },
      { id: '4e', label: 'Glossary call-back', itemIds: ['4.11'] },
    ],
    items: [
      {
        id: '4.1',
        title: 'Topics and themes',
        fields: [
          {
            name: 'topicsData',
            label: 'Topics and Themes',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
      {
        id: '4.3',
        title: 'Ensure constructive alignments',
        fields: [
          {
            name: 'alignmentStrategy',
            label: 'Constructive Alignment Strategy',
            type: 'textarea',
            required: true,
            helpText: 'How do learning activities, assessments, and outcomes align?',
          },
        ],
      },
      {
        id: '4.4',
        title: 'Use multimodal learning resources',
        fields: [
          {
            name: 'multimodalResources',
            label: 'Multimodal Resources',
            type: 'textarea',
            required: true,
            helpText: 'List different types of resources: videos, texts, podcasts, simulations, etc.',
          },
        ],
      },
      {
        id: '4.5',
        title: 'Supplementary learning considerations',
        fields: [
          {
            name: 'supplementaryData',
            label: 'Supplementary Considerations',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
      {
        id: '4.11',
        title: 'Ensure the inclusion of glossary',
        fields: [
          {
            name: 'glossaryIncluded',
            label: 'Glossary Included',
            type: 'checkbox',
            required: true,
          },
          {
            name: 'keyTerms',
            label: 'Key Terms (sample)',
            type: 'textarea',
            required: false,
            helpText: 'List important terms that will be in the glossary',
          },
        ],
      },
    ],
  },
  {
    id: 'phase5',
    number: 5,
    title: 'Assessment design and learning processes',
    subPhases: [
      { id: '5a', label: 'Develop learning activities', itemIds: ['5.1'] },
      { id: '5b', label: 'Design assessment', itemIds: ['5.5'], mcOnly: true },
    ],
    items: [
      {
        id: '5.1',
        title: 'Develop learning activities',
        fields: [
          {
            name: 'learningActivitiesData',
            label: 'Learning Activities',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
      {
        id: '5.5',
        title: 'Design assessment',
        mcOnly: true,
        fields: [
          {
            name: 'designAssessmentData',
            label: 'Design Assessment',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
    ],
  },
  {
    id: 'phase6',
    number: 6,
    title: 'Delivery, metadata, and evaluation',
    subPhases: [
      { id: '6a', label: 'Technical requirements and accessibility', itemIds: ['6.1'] },
      { id: '6b', label: 'ECTS metadata', itemIds: ['6.3'] },
      { id: '6c', label: 'EQF metadata', itemIds: ['6.4'] },
      { id: '6d', label: 'QA on metadata', itemIds: ['6.5'], metatext: 'This section focuses on final quality-assurance metadata for the micro-credential. Here, you confirm key conditions that support transparency, reuse, recognition, and long-term sustainability across the alliance. The information collected does not change the academic design of the micro-credential, but clarifies how it can be shared, managed, and understood beyond the immediate course context.' },
      { id: '6e', label: 'Meeting learner needs', itemIds: ['6.8'], metatext: 'This section focuses on how learners are expected to work with the micro-credential in practice. The aim is to describe flexibility, pacing, and ways learners can organise their learning in relation to their own needs, constraints, and prior experience.\n\nThis is not a description of what the micro-credential is about, but how learners can engage with it.' },
      { id: '6f', label: 'Evaluation plan', itemIds: ['6.10'], metatext: 'This step focuses on how the micro-credential will be reviewed and quality-assured over time. You are asked to describe how learning delivery and content will be reviewed, and how assessment practices will be calibrated and monitored.\n\nBoth text fields below must be completed before you can mark this step as complete.' },
    ],
    items: [
      {
        id: '6.1',
        title: 'Address technical requirements and platform compatibility',
        fields: [
          {
            name: 'technicalRequirements',
            label: 'Technical Requirements',
            type: 'textarea',
            required: true,
            helpText: 'Hardware, software, internet speed, etc.',
          },
          {
            name: 'platformsUsed',
            label: 'Learning Platforms',
            type: 'text',
            required: true,
            helpText: 'LMS and other platforms',
          },
        ],
      },
      {
        id: '6.2',
        title: 'Ensure the format supports accessibility, engagement, and scalability',
        fields: [],
      },
      {
        id: '6.3',
        title: 'Ensure standalone courses have standardised metadata for ECTS level',
        fields: [
          {
            name: 'ectsCredits',
            label: 'ECTS Credits',
            type: 'ects',
            required: true,
            helpText: 'Must be whole or half points (e.g., 1.0, 1.5, 2.0). Minimum 1.0 for MC.',
            validation: {
              min: 0,
              max: 60,
            },
          },
          {
            name: 'ectsJustification',
            label: 'ECTS Justification',
            type: 'textarea',
            required: true,
            helpText: 'Explain workload calculation (1 ECTS = 25-30 hours)',
          },
        ],
      },
      {
        id: '6.4',
        title: 'Ensure courses have standardised metadata for EQF level',
        fields: [
          {
            name: 'eqfLevelData',
            label: 'EQF Level Data',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
      {
        id: '6.5',
        title: 'Reuse of learning content within the alliance',
        fields: [
          {
            name: 'contentReuseData',
            label: 'Content Reuse',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
      {
        id: '6.8',
        title: 'Meeting learner needs',
        fields: [
          {
            name: 'meetingLearnerNeedsData',
            label: 'Meeting Learner Needs',
            type: 'text',
            required: true,
            helpText: 'This field uses a custom component',
          },
        ],
      },
      {
        id: '6.10',
        title: 'Plan for evaluation',
        fields: [
          {
            name: 'evaluationPlan',
            label: 'Course Evaluation Plan',
            type: 'textarea',
            required: true,
            helpText: 'How will the course itself be evaluated and improved?',
          },
          {
            name: 'feedbackMechanisms',
            label: 'Feedback Mechanisms',
            type: 'textarea',
            required: true,
            helpText: 'How will learner feedback be collected?',
          },
        ],
      },
    ],
  },
];

export function getPhases(lang: Language): Phase[] {
  return lang === 'da' ? phasesDa : phases;
}
