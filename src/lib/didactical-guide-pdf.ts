import { jsPDF } from 'jspdf';
import { CourseData } from '@/types/course';

const PRIMARY_COLOR = '#195562';
const CHECK_BOX = '☐';

export async function generateDidacticalGuidePDF(data: CourseData): Promise<void> {
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
  doc.text('Course Design', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Didactical Guide Checklist', pageWidth / 2, 28, { align: 'center' });

  yPos = 52;
  doc.setTextColor(0, 0, 0);

  // Course title
  const courseTitle = data.data['2.1']?.workingTitle || 'Untitled Course';
  addText(courseTitle, 14, true);
  addText(`Document ID: ${data.documentId}  |  Generated: ${new Date().toLocaleDateString()}`, 8, false, '#666666');
  yPos += 4;

  // ==================
  // INTRO
  // ==================
  addText('This checklist is auto-generated from your design choices in Phases 3 and 4. Use it as a reference when developing learning activities and assessment in Phase 5.', 9, false, '#444444');
  yPos += 4;

  // ==================
  // SECTION 1: SUPPLEMENTARY LEARNING CONSIDERATIONS
  // ==================
  addText('1. Supplementary Learning Considerations', 14, true, PRIMARY_COLOR);
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
    addInfoBox('Design reminders', 'The following elements have been marked for integration. Ensure each is reflected in your Phase 5 learning activities.');
    yPos += 2;
    
    for (const item of incorporatedItems) {
      addChecklistItem(`Have you designed activities that incorporate ${item.label.toLowerCase()}?`);
      addText(`   Rationale: ${item.helpText}`, 8, false, '#666666');
    }
  }

  // Feedback literacy
  if (supplementaryData.feedbackLiteracy === 'yes') {
    yPos += 2;
    addChecklistItem('Have you implemented feedback literacy support as described?');
    if (supplementaryData.feedbackLiteracyDescription) {
      addText(`   Your plan: "${supplementaryData.feedbackLiteracyDescription}"`, 8, false, '#666666');
    }
  }

  addSectionDivider();

  // ==================
  // SECTION 2: MULTIMODAL LEARNING RESOURCES CHECKLIST
  // ==================
  addText('2. Multimodal Learning Resources', 14, true, PRIMARY_COLOR);
  yPos += 2;

  addInfoBox('Your selected modalities', 'Below is a checklist based on the content representation, engagement, and application modalities you selected in Phase 4. Use this to verify that all chosen modalities are represented in your Phase 5 activities.');
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
    addText('Content Representation', 11, true);
    for (const id of selectedContent) {
      const label = contentOptions[id] || id;
      if (id === 'video') {
        addChecklistItem('Have you designed or planned video content for learners?');
      } else if (id === 'audio') {
        addChecklistItem('Have you designed or planned audio content (e.g. podcasts) for learners?');
      } else if (id === 'written') {
        addChecklistItem('Have you prepared written materials (texts, PDFs, articles)?');
      } else if (id === 'visual') {
        addChecklistItem('Have you prepared visual materials (slides, diagrams, infographics)?');
      } else if (id === 'interactive') {
        addChecklistItem('Have you designed interactive digital content for learners?');
      } else if (id === 'demonstrations') {
        addChecklistItem('Have you planned demonstrations or walkthroughs?');
      } else if (id === 'other') {
        const otherText = multimodalData.contentRepresentationOther || 'custom format';
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
    'other': 'Other',
  };

  const selectedEngagement: string[] = multimodalData.activeEngagement || [];
  if (selectedEngagement.length > 0) {
    addText('Active Engagement', 11, true);
    for (const id of selectedEngagement) {
      if (id === 'plenary') {
        addChecklistItem('Have you designed plenary discussion activities?');
      } else if (id === 'peer-learning') {
        addChecklistItem('Have you designed peer-learning interaction activities?');
      } else if (id === 'exercises') {
        addChecklistItem('Have you designed practical exercises or applied tasks?');
      } else if (id === 'exploration') {
        addChecklistItem('Have you designed exploration and shared experience activities?');
      } else if (id === 'reflection') {
        addChecklistItem('Have you designed reflection activities?');
      } else if (id === 'challenge-based') {
        addChecklistItem('Have you designed challenge-based learning activities?');
      } else if (id === 'other') {
        const otherText = multimodalData.activeEngagementOther || 'custom engagement';
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
    'other': 'Other',
  };

  const selectedTransfer: string[] = multimodalData.applicationTransfer || [];
  if (selectedTransfer.length > 0) {
    addText('Application and Transfer', 11, true);
    for (const id of selectedTransfer) {
      if (id === 'practice-tasks') {
        addChecklistItem('Have you designed practice-oriented tasks?');
      } else if (id === 'simulations') {
        addChecklistItem('Have you designed simulations or scenario-based activities?');
      } else if (id === 'project-portfolio') {
        addChecklistItem('Have you included project or portfolio elements?');
      } else if (id === 'real-world') {
        addChecklistItem('Have you designed real-world or workplace-related activities?');
      } else if (id === 'other') {
        const otherText = multimodalData.applicationTransferOther || 'custom application method';
        addChecklistItem(`Have you designed your custom application method: "${otherText}"?`);
      }
    }
  }

  addSectionDivider();

  // ==================
  // SECTION 3: ASSESSMENT FRAMEWORK (from Phase 3)
  // ==================
  addText('3. Assessment Framework (from Phase 3)', 14, true, PRIMARY_COLOR);
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
    'other': 'Other',
  };

  addInfoBox('Your assessment framework', 'These are the assessment parameters you defined in Phase 3. Ensure your Phase 5 assessment design remains aligned with this framework.');
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
  addText('Assessment Design Checklist', 11, true);
  addChecklistItem('Does your assessment design align with the assessment type defined above?');
  addChecklistItem('Is the individual/group format correctly reflected in your assessment activities?');
  addChecklistItem('Does the delivery mode match what was defined in Phase 3?');
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
  addText('This checklist was auto-generated from your course design template. Use it as a working document during Phase 5 development.', 8, false, '#888888');

  // Save
  const sanitizedTitle = courseTitle.replace(/[^a-zA-Z0-9æøåÆØÅäöüÄÖÜ\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 40);
  const filename = sanitizedTitle
    ? `${sanitizedTitle}_didactical_guide.pdf`
    : `didactical_guide_${data.documentId.slice(0, 8)}.pdf`;

  doc.save(filename);
}
