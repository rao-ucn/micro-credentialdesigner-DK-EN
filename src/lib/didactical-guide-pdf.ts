import { jsPDF } from 'jspdf';
import { CourseData } from '@/types/course';
import type { Language } from '@/lib/i18n';
import { pdfLabels } from '@/lib/translations/pdfLabels';

const PRIMARY_COLOR = '#195562';
const CHECK_BOX = '☐';

export async function generateDidacticalGuidePDF(data: CourseData, lang: Language = 'en'): Promise<void> {
  const pl = pdfLabels[lang];
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = '#000000') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    doc.setTextColor(r, g, b);
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    const lineHeight = fontSize * 0.4;
    checkNewPage(lines.length * lineHeight + 2);
    doc.text(lines, margin, yPos);
    yPos += lines.length * lineHeight + 3;
  };

  const addChecklistItem = (text: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 10);
    const lineHeight = 10 * 0.4;
    checkNewPage(lines.length * lineHeight + 4);
    // Draw checkbox
    doc.rect(margin, yPos - 3, 3.5, 3.5);
    doc.text(lines, margin + 7, yPos);
    yPos += lines.length * lineHeight + 4;
  };

  const addInfoBox = (title: string, content: string) => {
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(content, pageWidth - 2 * margin - 12);
    const boxHeight = lines.length * 3.6 + 14;
    checkNewPage(boxHeight + 4);
    
    // Box background
    const r = parseInt(PRIMARY_COLOR.slice(1, 3), 16);
    const g = parseInt(PRIMARY_COLOR.slice(3, 5), 16);
    const b = parseInt(PRIMARY_COLOR.slice(5, 7), 16);
    doc.setFillColor(r, g, b);
    doc.rect(margin, yPos - 4, pageWidth - 2 * margin, boxHeight, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, margin + 6, yPos + 2);
    yPos += 8;
    
    // Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(lines, margin + 6, yPos);
    yPos += lines.length * 3.6 + 6;
    doc.setTextColor(0, 0, 0);
  };

  const addSectionDivider = () => {
    yPos += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
  };

  // ==================
  // COVER / HEADER
  // ==================
  doc.setFillColor(parseInt(PRIMARY_COLOR.slice(1, 3), 16), parseInt(PRIMARY_COLOR.slice(3, 5), 16), parseInt(PRIMARY_COLOR.slice(5, 7), 16));
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(pl.courseDesign, pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(pl.didacticalGuideTitle, pageWidth / 2, 28, { align: 'center' });

  yPos = 52;
  doc.setTextColor(0, 0, 0);

  // Course title
  const courseTitle = data.data['2.1']?.workingTitle || pl.untitledCourse;
  addText(courseTitle, 14, true);
  addText(`Document ID: ${data.documentId}  |  Generated: ${new Date().toLocaleDateString()}`, 8, false, '#666666');
  yPos += 4;

  // ==================
  // INTRO
  // ==================
  addText(pl.didacticalIntro, 9, false, '#444444');
  yPos += 4;

  // ==================
  // SECTION 1: SUPPLEMENTARY LEARNING CONSIDERATIONS
  // ==================
  addText(pl.section1Title, 14, true, PRIMARY_COLOR);
  yPos += 2;

  const supplementaryData = data.data['4.5']?.supplementaryData || {};
  const multimodalData = data.data['4.4']?.multimodalLearningData || {};

  // Considerations definitions
  const considerations = [
    {
      id: 'exploration',
      field: 'explorationDecision',
      checkField: 'activeEngagement',
      checkValue: 'exploration',
      label: 'Exploration and shared experiences',
      helpText: 'Joint exploration and shared experiences can support situated learning and the development of shared reference points among learners.',
    },
    {
      id: 'reflection',
      field: 'reflectionDecision',
      checkField: 'activeEngagement',
      checkValue: 'reflection',
      label: 'Reflection activities',
      helpText: 'Reflection activities support consolidation of learning and help learners connect new insights to prior knowledge and experience.',
    },
    {
      id: 'challenge',
      field: 'challengeDecision',
      checkField: 'activeEngagement',
      checkValue: 'challenge-based',
      label: 'Challenge-based learning',
      helpText: 'Challenge-based learning can support problem-solving, integration of knowledge and transfer to complex situations.',
    },
    {
      id: 'realWorld',
      field: 'realWorldDecision',
      checkField: 'applicationTransfer',
      checkValue: 'real-world',
      label: 'Real-world or workplace-related activities',
      helpText: 'Real-world or workplace-related activities can support transfer of learning beyond the course context and strengthen relevance to professional practice.',
    },
  ];

  // Show which are incorporated (either from multimodal or from supplementary)
  const incorporatedItems: { label: string; helpText: string }[] = [];
  
  for (const c of considerations) {
    const selectedOptions: string[] = multimodalData[c.checkField] || [];
    const isInMultimodal = selectedOptions.includes(c.checkValue);
    const decision = supplementaryData[c.field];
    
    if (isInMultimodal || decision === 'incorporate') {
      incorporatedItems.push({ label: c.label, helpText: c.helpText });
    }
  }

  if (incorporatedItems.length > 0) {
    addInfoBox(pl.designRemindersTitle, pl.designRemindersContent);
    yPos += 2;
    
    for (const item of incorporatedItems) {
      addChecklistItem(`Have you designed activities that incorporate ${item.label.toLowerCase()}?`);
      addText(`   Rationale: ${item.helpText}`, 8, false, '#666666');
    }
  }

  // Feedback literacy
  if (supplementaryData.feedbackLiteracy === 'yes') {
    yPos += 2;
    addChecklistItem(pl.feedbackLiteracyImplementedQuestion);
    if (supplementaryData.feedbackLiteracyDescription) {
      addText(`   Your plan: "${supplementaryData.feedbackLiteracyDescription}"`, 8, false, '#666666');
    }
  }

  addSectionDivider();

  // ==================
  // SECTION 2: MULTIMODAL LEARNING RESOURCES CHECKLIST
  // ==================
  addText(pl.section2Title, 14, true, PRIMARY_COLOR);
  yPos += 2;

  addInfoBox(pl.yourSelectedModalitiesTitle, pl.yourSelectedModalitiesContent);
  yPos += 2;

  // Content Representation
  const contentOptions: Record<string, string> = {
    'written': 'Written materials (texts, PDFs, articles)',
    'visual': 'Visual materials (slides, diagrams, infographics)',
    'video': 'Video materials (presentation videos)',
    'audio': 'Audio explanations (podcasts)',
    'interactive': 'Interactive digital content',
    'demonstrations': 'Demonstrations or walkthroughs',
    'other': 'Other format',
  };

  const selectedContent: string[] = multimodalData.contentRepresentation || [];
  if (selectedContent.length > 0) {
    addText(pl.contentRepresentationTitle, 11, true);
    for (const id of selectedContent) {
      const label = contentOptions[id] || id;
      if (id === 'video') {
        addChecklistItem(pl.checklistVideo);
      } else if (id === 'audio') {
        addChecklistItem(pl.checklistAudio);
      } else if (id === 'written') {
        addChecklistItem(pl.checklistWritten);
      } else if (id === 'visual') {
        addChecklistItem(pl.checklistVisual);
      } else if (id === 'interactive') {
        addChecklistItem(pl.checklistInteractive);
      } else if (id === 'demonstrations') {
        addChecklistItem(pl.checklistDemonstrations);
      } else if (id === 'other') {
        const otherText = multimodalData.contentRepresentationOther || pl.customFormatFallback;
        addChecklistItem(`Have you prepared your custom content format: "${otherText}"?`);
      }
    }
    yPos += 2;
  }

  // Active Engagement
  const engagementOptions: Record<string, string> = {
    'plenary': 'Discussions in plenary',
    'peer-learning': 'Peer-learning interaction',
    'exercises': 'Practical exercises or applied tasks',
    'exploration': 'Exploration and experiencing together',
    'reflection': 'Reflection activities',
    'challenge-based': 'Challenge-based learning',
    'other': pl.other,
  };

  const selectedEngagement: string[] = multimodalData.activeEngagement || [];
  if (selectedEngagement.length > 0) {
    addText(pl.activeEngagementTitle, 11, true);
    for (const id of selectedEngagement) {
      if (id === 'plenary') {
        addChecklistItem(pl.checklistPlenary);
      } else if (id === 'peer-learning') {
        addChecklistItem(pl.checklistPeerLearning);
      } else if (id === 'exercises') {
        addChecklistItem(pl.checklistExercises);
      } else if (id === 'exploration') {
        addChecklistItem(pl.checklistExploration);
      } else if (id === 'reflection') {
        addChecklistItem(pl.checklistReflection);
      } else if (id === 'challenge-based') {
        addChecklistItem(pl.checklistChallengeBased);
      } else if (id === 'other') {
        const otherText = multimodalData.activeEngagementOther || pl.customEngagementFallback;
        addChecklistItem(`Have you designed your custom engagement method: "${otherText}"?`);
      }
    }
    yPos += 2;
  }

  // Application & Transfer
  const transferOptions: Record<string, string> = {
    'practice-tasks': 'Practice-oriented tasks',
    'simulations': 'Simulations or scenarios',
    'project-portfolio': 'Project or portfolio elements',
    'real-world': 'Real-world or workplace-related activities',
    'other': pl.other,
  };

  const selectedTransfer: string[] = multimodalData.applicationTransfer || [];
  if (selectedTransfer.length > 0) {
    addText(pl.applicationAndTransferTitle, 11, true);
    for (const id of selectedTransfer) {
      if (id === 'practice-tasks') {
        addChecklistItem(pl.checklistPracticeTasks);
      } else if (id === 'simulations') {
        addChecklistItem(pl.checklistSimulations);
      } else if (id === 'project-portfolio') {
        addChecklistItem(pl.checklistProjectPortfolio);
      } else if (id === 'real-world') {
        addChecklistItem(pl.checklistRealWorld);
      } else if (id === 'other') {
        const otherText = multimodalData.applicationTransferOther || pl.customApplicationFallback;
        addChecklistItem(`Have you designed your custom application method: "${otherText}"?`);
      }
    }
  }

  addSectionDivider();

  // ==================
  // SECTION 3: ASSESSMENT FRAMEWORK (from Phase 3)
  // ==================
  addText(pl.section3Title, 14, true, PRIMARY_COLOR);
  yPos += 2;

  const assessmentData = data.data['3.6'] || {};

  const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
    'written': 'Written',
    'oral': 'Oral',
    'combination': 'Combination of written and oral',
  };
  const INDIVIDUAL_GROUP_LABELS: Record<string, string> = {
    'individual': 'Individual assessment',
    'group': 'Group assessment',
    'combination': 'Combination',
  };
  const DELIVERY_MODE_LABELS: Record<string, string> = {
    'physical': 'Physical attendance required',
    'online-possible': 'Online possible',
    'fully-online': 'Fully online',
  };
  const ACTIVITY_TYPE_LABELS: Record<string, string> = {
    'simulation': 'Simulation',
    'portfolio': 'Portfolio with oral defence',
    'case-based': 'Case-based assessment',
    'project-based': 'Project-based assessment',
    'practical-performance': 'Practical performance task',
    'presentation': 'Presentation',
    'observation-checklist': 'Observation checklist',
    'other': pl.other,
  };

  addInfoBox(pl.yourAssessmentFrameworkTitle, pl.yourAssessmentFrameworkContent);
  yPos += 2;

  const assessType = assessmentData.assessmentType;
  const indGroup = assessmentData.individualOrGroup;
  const delivery = assessmentData.deliveryMode;
  const actTypes: string[] = assessmentData.activityTypes || [];

  if (assessType) {
    addText(`Assessment type: ${ASSESSMENT_TYPE_LABELS[assessType] || assessType}`, 10, true);
  }
  if (indGroup) {
    addText(`Format: ${INDIVIDUAL_GROUP_LABELS[indGroup] || indGroup}`, 10, true);
  }
  if (delivery) {
    addText(`Delivery mode: ${DELIVERY_MODE_LABELS[delivery] || delivery}`, 10, true);
  }
  if (actTypes.length > 0) {
    addText(`Activity types: ${actTypes.map(t => ACTIVITY_TYPE_LABELS[t] || t).join(', ')}`, 10, true);
  }
  if (assessmentData.activityDescription) {
    addText(`Description: ${assessmentData.activityDescription}`, 9, false, '#444444');
  }

  yPos += 4;

  // Assessment checklist items
  addText(pl.assessmentDesignChecklistTitle, 11, true);
  addChecklistItem(pl.checklistAlignAssessmentType);
  addChecklistItem(pl.checklistIndividualGroupFormat);
  addChecklistItem(pl.checklistDeliveryModeMatch);
  if (actTypes.length > 0) {
    for (const t of actTypes) {
      const label = ACTIVITY_TYPE_LABELS[t] || t;
      addChecklistItem(`Have you developed the ${label.toLowerCase()} assessment activity?`);
    }
  }

  // ==================
  // FOOTER NOTE
  // ==================
  yPos += 8;
  checkNewPage(20);
  doc.setDrawColor(parseInt(PRIMARY_COLOR.slice(1, 3), 16), parseInt(PRIMARY_COLOR.slice(3, 5), 16), parseInt(PRIMARY_COLOR.slice(5, 7), 16));
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;
  addText(pl.footerNote, 8, false, '#888888');

  // Save
  const sanitizedTitle = courseTitle.replace(/[^a-zA-Z0-9æøåÆØÅäöüÄÖÜ\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 40);
  const filename = sanitizedTitle
    ? `${sanitizedTitle}_didactical_guide.pdf`
    : `didactical_guide_${data.documentId.slice(0, 8)}.pdf`;

  doc.save(filename);
}
