import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CourseData } from '@/types/course';
import { phases } from '@/data/phases';
import { getIscedBroad, getIscedNarrow, getIscedDetailed } from '@/data/isced';

const PRIMARY_COLOR = '#195562';

export async function generatePDF(data: CourseData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Generate QR code
  const reopenUrl = `${window.location.origin}${window.location.pathname}#doc=${data.documentId}`;
  const qrDataUrl = await QRCode.toDataURL(reopenUrl, {
    width: 200,
    margin: 1,
    color: { dark: PRIMARY_COLOR, light: '#ffffff' },
  });

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to add text with word wrap
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    const lineHeight = fontSize * 0.4;
    
    checkNewPage(lines.length * lineHeight);
    
    doc.text(lines, margin, yPos);
    yPos += lines.length * lineHeight + 5;
  };

  // Get the course title from Phase 2.1 (workingTitle)
  const phase21Data = data.data['2.1'] || {};
  const courseTitle = phase21Data.workingTitle || 'Untitled Course';

  // COVER PAGE
  doc.setFillColor(PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 70, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Course Design', pageWidth / 2, 20, { align: 'center' });

  // Course title - main heading
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(courseTitle, pageWidth - 40);
  const titleYPos = titleLines.length > 1 ? 38 : 42;
  doc.text(titleLines, pageWidth / 2, titleYPos, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const typeLabel =
    data.courseType === 'composite-micro-credential'
      ? 'Composite Micro-Credential'
      : data.courseType === 'micro-credential'
      ? 'Micro-Credential'
      : 'Standalone Course';
  doc.text(
    typeLabel,
    pageWidth / 2,
    titleLines.length > 1 ? 58 : 56,
    { align: 'center' }
  );

  // EQF + ECTS subtitle line (for MCs only)
  if (data.courseType === 'micro-credential' || data.courseType === 'composite-micro-credential') {
    const eqfData = data.data['6.4']?.eqfLevelData || data.data?.eqfLevelData;
    const ectsData = data.data['6.3']?.ectsData;
    const compositeEcts = data.courseType === 'composite-micro-credential'
      ? data.data['6.3']?.compositeEctsData
      : undefined;

    let eqfLabel = '';
    if (eqfData) {
      if (eqfData.levelMode === 'multiple') {
        const lvl = eqfData.finalLevel || eqfData.suggestedLevel;
        eqfLabel = lvl ? `EQF ${lvl}` : '';
      } else if (eqfData.singleLevel) {
        eqfLabel = `EQF ${eqfData.singleLevel}`;
      }
    }

    let ectsLabel = '';
    if (compositeEcts && typeof compositeEcts.confirmedECTS === 'number') {
      ectsLabel = `${compositeEcts.confirmedECTS.toFixed(1)} ECTS`;
    } else if (compositeEcts && (typeof compositeEcts.totalECTSMin === 'number' || typeof compositeEcts.totalECTSMax === 'number')) {
      const mn = compositeEcts.totalECTSMin;
      const mx = compositeEcts.totalECTSMax;
      if (typeof mn === 'number' && typeof mx === 'number') {
        ectsLabel = mn === mx ? `${mn.toFixed(1)} ECTS` : `${mn.toFixed(1)}–${mx.toFixed(1)} ECTS`;
      }
    } else if (ectsData) {
      if (typeof ectsData.confirmedECTS === 'number') {
        ectsLabel = `${ectsData.confirmedECTS.toFixed(1)} ECTS`;
      } else if (ectsData.results) {
        const { ectsTotalMin, ectsTotalMax } = ectsData.results;
        if (typeof ectsTotalMin === 'number' && typeof ectsTotalMax === 'number') {
          ectsLabel = ectsTotalMin === ectsTotalMax
            ? `${ectsTotalMin.toFixed(1)} ECTS`
            : `${ectsTotalMin.toFixed(1)}–${ectsTotalMax.toFixed(1)} ECTS`;
        }
      }
    }

    const metaParts = [eqfLabel, ectsLabel].filter(Boolean);
    if (metaParts.length > 0) {
      doc.setFontSize(11);
      doc.text(
        metaParts.join('  •  '),
        pageWidth / 2,
        titleLines.length > 1 ? 65 : 63,
        { align: 'center' }
      );
    }
  }

  yPos = 90;
  doc.setTextColor(0, 0, 0);

  // Composite / single-source basis banner
  type SourceLine = { title: string; details: string[] };
  const buildSourceLines = (s: any): SourceLine => {
    const title = s.workingTitle || s.fileName || s.documentId || 'Untitled';
    const details: string[] = [];

    const p21 = s?.data?.['2.1'] || {};
    const dev = (p21.developers || [])[0];
    if (dev && (dev.name || dev.institution || dev.contact)) {
      const parts = [dev.name, dev.institution, dev.contact].filter(Boolean);
      if (parts.length) details.push(`Developed by ${parts.join(' • ')}`);
    }

    const eqf = s?.data?.['6.4']?.eqfLevelData || s?.data?.eqfLevelData;
    let eqfLabel = '';
    if (eqf) {
      if (eqf.levelMode === 'multiple') {
        const lvl = eqf.finalLevel || eqf.suggestedLevel;
        eqfLabel = lvl ? `EQF ${lvl} (multi-level)` : '';
      } else if (eqf.singleLevel) {
        eqfLabel = `EQF ${eqf.singleLevel}`;
      }
    }

    const ectsData = s?.data?.['6.3']?.ectsData;
    let ectsLabel = '';
    if (ectsData) {
      const r = ectsData.results;
      const totalMin = typeof r?.ectsTotalMin === 'number' ? r.ectsTotalMin : undefined;
      const totalMax = typeof r?.ectsTotalMax === 'number' ? r.ectsTotalMax : undefined;
      const learnMin = typeof r?.ectsLearningMin === 'number' ? r.ectsLearningMin : undefined;
      const learnMax = typeof r?.ectsLearningMax === 'number' ? r.ectsLearningMax : undefined;
      const confirmed = typeof ectsData.confirmedECTS === 'number' ? ectsData.confirmedECTS : undefined;

      let totalLabel = '';
      if (confirmed !== undefined) {
        totalLabel = `${confirmed.toFixed(1)} ECTS`;
      } else if (totalMin !== undefined && totalMax !== undefined) {
        totalLabel = totalMin === totalMax
          ? `${totalMin.toFixed(1)} ECTS`
          : `${totalMin.toFixed(1)}–${totalMax.toFixed(1)} ECTS`;
      }

      let learnLabel = '';
      if (learnMin !== undefined && learnMax !== undefined) {
        learnLabel = learnMin === learnMax
          ? `${learnMin.toFixed(1)} ECTS`
          : `${learnMin.toFixed(1)}–${learnMax.toFixed(1)} ECTS`;
      }

      if (totalLabel && learnLabel && totalLabel !== learnLabel) {
        ectsLabel = `Total MC: ${totalLabel} — of which learning activities: ${learnLabel}`;
      } else if (learnLabel) {
        ectsLabel = `Pure standalone element: ${learnLabel}`;
      } else if (totalLabel) {
        ectsLabel = `Pure standalone element: ${totalLabel}`;
      }
    }

    const meta = [eqfLabel, ectsLabel].filter(Boolean).join(', ');
    if (meta) details.push(`(${meta})`);

    return { title, details };
  };

  const sourceEntries: SourceLine[] = [];
  if (data.courseType === 'composite-micro-credential' && data.standaloneSources?.length) {
    data.standaloneSources.forEach((s) => sourceEntries.push(buildSourceLines(s)));
  }

  if (sourceEntries.length > 0) {
    const heading = 'This Micro-Credential is based on the following standalone courses:';

    const bulletLines: { text: string; bold: boolean; indent: number }[] = [];
    sourceEntries.forEach((entry) => {
      const titleWrapped = doc.splitTextToSize(`• ${entry.title}`, pageWidth - 2 * margin - 10);
      titleWrapped.forEach((t: string) =>
        bulletLines.push({ text: t, bold: true, indent: 8 })
      );
      entry.details.forEach((d) => {
        const wrapped = doc.splitTextToSize(d, pageWidth - 2 * margin - 16);
        wrapped.forEach((w: string) => bulletLines.push({ text: w, bold: false, indent: 12 }));
      });
    });

    const boxHeight = 14 + bulletLines.length * 5 + 8;
    doc.setFillColor(232, 245, 243);
    doc.setDrawColor(0, 124, 113);
    doc.roundedRect(margin, yPos - 4, pageWidth - 2 * margin, boxHeight, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 124, 113);
    const headingLines = doc.splitTextToSize(heading, pageWidth - 2 * margin - 10);
    doc.text(headingLines, margin + 5, yPos + 2);
    let innerY = yPos + 2 + headingLines.length * 5 + 3;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    bulletLines.forEach((line) => {
      doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
      doc.text(line.text, margin + line.indent, innerY);
      innerY += 5;
    });

    yPos += boxHeight + 6;
  }

  // Document info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Document Information', margin, yPos);
  yPos += 12;

  // Document ID - prominent styling
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPos - 5, pageWidth - 2 * margin, 18, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 124, 113);
  doc.text('Document ID:', margin + 5, yPos + 4);
  doc.setFontSize(14);
  doc.text(data.documentId, margin + 45, yPos + 4);
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Created: ${new Date(data.createdAt).toLocaleDateString()}`, margin, yPos);
  yPos += 7;
  doc.text(`Last Updated: ${new Date(data.updatedAt).toLocaleDateString()}`, margin, yPos);
  yPos += 7;
  doc.text(`Version: ${data.version}`, margin, yPos);
  yPos += 20;

  // QR Code and reopen instructions
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Reopen & Edit', margin, yPos);
  yPos += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Scan QR code or visit the link below:', margin, yPos);
  yPos += 7;

  // Add QR code
  doc.addImage(qrDataUrl, 'PNG', margin, yPos, 40, 40);

  // Add URL next to QR
  doc.setTextColor(0, 124, 113);
  const urlLines = doc.splitTextToSize(reopenUrl, pageWidth - margin - 50);
  doc.text(urlLines, margin + 45, yPos + 10);

  yPos += 50;

  // Keep the security-code block together — reserve space for the
  // instruction line + label + code value, otherwise start a new page.
  const securityBlockHeight = data.displaySecurityCode ? 35 : 10;
  checkNewPage(securityBlockHeight);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('You will need to enter your unique 12-character security code to reopen.', margin, yPos);

  // Add security code if available
  if (data.displaySecurityCode) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Security Code:', margin, yPos);
    yPos += 7;
    doc.setFontSize(14);
    doc.setTextColor(0, 124, 113);
    doc.text(data.displaySecurityCode, margin, yPos);
    doc.setTextColor(0, 0, 0);
  }

  // New page for content
  doc.addPage();
  yPos = margin;

  // CONTENT PAGES
  let itemCounter = 0;
  for (const phase of phases) {
    checkNewPage(30);

    // Phase header
    doc.setFillColor(PRIMARY_COLOR);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(phase.title, margin + 5, yPos + 10);

    yPos += 20;
    doc.setTextColor(0, 0, 0);

    for (const item of phase.items) {
      // Always increment so numbering is consistent across course types
      itemCounter += 1;

      // Skip MC-only items if standalone (number is reserved but not rendered)
      if (item.mcOnly && data.courseType === 'standalone') continue;

      checkNewPage(25);

      // Item header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 124, 113);
      doc.text(`${itemCounter}. ${item.title}`, margin, yPos);
      yPos += 8;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Special handling for Phase 2.1 - Project classification
      if (item.id === '2.1') {
        const itemData = data.data[item.id] || {};
        
        // Classification
        checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        doc.text('Project Classification *', margin + 3, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'normal');
        const classification = itemData.projectClassification;
        const classificationText = classification === 'approved' 
          ? 'Approved activity' 
          : classification === 'developed'
          ? 'Developed activity'
          : 'To be filled for completion';
        
        if (!classification) {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
        }
        doc.text(classificationText, margin + 3, yPos);
        yPos += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        // Developers table
        checkNewPage(40);
        doc.setFont('helvetica', 'bold');
        doc.text('Developing Institutions', margin + 3, yPos);
        yPos += 8;
        
        const developers = itemData.developers || [];
        if (developers.length > 0) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Name', margin + 3, yPos);
          doc.text('Institution', margin + 45, yPos);
          doc.text('Contact', margin + 95, yPos);
          doc.text('Notes', margin + 135, yPos);
          yPos += 5;
          
          doc.setFont('helvetica', 'normal');
          for (const dev of developers) {
            checkNewPage(10);
            const nameText = dev.name || '-';
            const instText = dev.institution || '-';
            const contactText = dev.contact || '-';
            const notesText = dev.notes || '-';
            
            doc.text(doc.splitTextToSize(nameText, 40)[0], margin + 3, yPos);
            doc.text(doc.splitTextToSize(instText, 48)[0], margin + 45, yPos);
            doc.text(doc.splitTextToSize(contactText, 38)[0], margin + 95, yPos);
            doc.text(doc.splitTextToSize(notesText, 40)[0], margin + 135, yPos);
            yPos += 6;
          }
          doc.setFontSize(10);
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 10;
        
        // External developers table
        checkNewPage(40);
        doc.setFont('helvetica', 'bold');
        doc.text('External Developers / Stakeholders', margin + 3, yPos);
        yPos += 8;
        
        const externalDevelopers = itemData.externalDevelopers || [];
        if (externalDevelopers.length > 0) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Organisation', margin + 3, yPos);
          doc.text('Type', margin + 45, yPos);
          doc.text('Role', margin + 70, yPos);
          doc.text('Contact', margin + 105, yPos);
          doc.text('Notes', margin + 145, yPos);
          yPos += 5;
          
          doc.setFont('helvetica', 'normal');
          for (const ext of externalDevelopers) {
            checkNewPage(10);
            const orgText = ext.organisation || '-';
            const typeText = ext.type || '-';
            const roleText = ext.role || '-';
            const contactText = ext.contact || '-';
            const notesText = ext.notes || '-';
            
            doc.text(doc.splitTextToSize(orgText, 38)[0], margin + 3, yPos);
            doc.text(doc.splitTextToSize(typeText, 22)[0], margin + 45, yPos);
            doc.text(doc.splitTextToSize(roleText, 30)[0], margin + 70, yPos);
            doc.text(doc.splitTextToSize(contactText, 36)[0], margin + 105, yPos);
            doc.text(doc.splitTextToSize(notesText, 30)[0], margin + 145, yPos);
            yPos += 6;
          }
          doc.setFontSize(10);
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text('No external developers specified', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 5;

        // Academic field of study (ISCED-F 2013)
        checkNewPage(30);
        doc.setFont('helvetica', 'bold');
        doc.text('Academic field of study (ISCED-F 2013)', margin + 3, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const broad = getIscedBroad(itemData.iscedBroadField);
        const narrow = getIscedNarrow(itemData.iscedBroadField, itemData.iscedNarrowField);
        const detailed = getIscedDetailed(itemData.iscedBroadField, itemData.iscedNarrowField, itemData.iscedDetailedField);
        if (broad || narrow || detailed) {
          const rows: Array<[string, string]> = [
            ['Broad field', broad ? `${broad.code} – ${broad.label}` : 'To be filled for completion'],
            ['Narrow field', narrow ? `${narrow.code} – ${narrow.label}` : 'To be filled for completion'],
            ['Detailed field', detailed ? `${detailed.code} – ${detailed.label}` : 'To be filled for completion'],
          ];
          for (const [label, value] of rows) {
            checkNewPage(10);
            const lines = doc.splitTextToSize(`${label}: ${value}`, pageWidth - margin * 2 - 6);
            doc.text(lines, margin + 3, yPos);
            yPos += lines.length * 5;
          }
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 5;
      } else if (item.id === '3.1') {
        // Special handling for Phase 3.1 - Market needs (new structure)
        const itemData = data.data[item.id] || {};
        const marketData = itemData.marketNeedsData || {};
        
        checkNewPage(20);
        
        // Section A: Labour Market Need
        doc.setFont('helvetica', 'bold');
        doc.text('What is the labour-market need you are addressing?', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        if (marketData.labourMarketNeed) {
          const needLines = doc.splitTextToSize(marketData.labourMarketNeed, pageWidth - 2 * margin - 6);
          doc.text(needLines, margin + 3, yPos);
          yPos += needLines.length * 5 + 8;
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        // Reminder about appendices
        checkNewPage(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        const reminderLines = doc.splitTextToSize(
          'If you have produced any analyses, studies, or other supporting material, you are encouraged to keep them as appendices to this work.',
          pageWidth - 2 * margin - 6
        );
        checkNewPage(reminderLines.length * 5 + 4);
        doc.text(reminderLines, margin + 3, yPos);
        yPos += reminderLines.length * 5 + 4;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        // Section B: Long-term Relevance
        checkNewPage(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Why is this need relevant in a long-term perspective?', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        if (marketData.longTermRelevance) {
          const relevanceLines = doc.splitTextToSize(marketData.longTermRelevance, pageWidth - 2 * margin - 6);
          doc.text(relevanceLines, margin + 3, yPos);
          yPos += relevanceLines.length * 5 + 8;
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        // Section C: Competences
        checkNewPage(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Which competences or skills are required?', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        const escoCompetences = marketData.escoCompetences || [];
        if (escoCompetences.length > 0) {
          doc.text('ESCO competences:', margin + 3, yPos);
          yPos += 6;
          for (const skill of escoCompetences) {
            checkNewPage(8);
            const skillLine = `• ${skill.title}`;
            const skillLines = doc.splitTextToSize(skillLine, pageWidth - 2 * margin - 10);
            doc.text(skillLines, margin + 6, yPos);
            yPos += skillLines.length * 5;
          }
          yPos += 4;
        }
        
        if (marketData.additionalCompetences) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Additional competences:', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const compLines = doc.splitTextToSize(marketData.additionalCompetences, pageWidth - 2 * margin - 6);
          doc.text(compLines, margin + 3, yPos);
          yPos += compLines.length * 5 + 8;
        }
        
        if (escoCompetences.length === 0 && !marketData.additionalCompetences) {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '6.3') {
        // Special handling for Phase 6.3 - ECTS Calculator
        const itemData = data.data[item.id] || {};
        const ectsData = itemData.ectsData || {};
        
        checkNewPage(30);
        
        // Learning Activities
        doc.setFont('helvetica', 'bold');
        doc.text('Learning Activities', margin + 3, yPos);
        yPos += 8;
        
        const learningActivities = ectsData.learningActivities || [];
        if (learningActivities.length > 0 && learningActivities.some((a: any) => a.name || a.hours)) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Activity', margin + 3, yPos);
          doc.text('Hours', margin + 120, yPos);
          yPos += 5;
          
          doc.setFont('helvetica', 'normal');
          for (const activity of learningActivities) {
            if (activity.name || activity.hours) {
              checkNewPage(8);
              doc.text(doc.splitTextToSize(activity.name || '-', 110)[0], margin + 3, yPos);
              doc.text(activity.hours || '0', margin + 120, yPos);
              yPos += 5;
            }
          }
          doc.setFontSize(10);
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(150, 150, 150);
          doc.text('No learning activities defined', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 8;
        
        // Assessment Activities (MC only)
        if (data.courseType === 'micro-credential') {
          checkNewPage(30);
          doc.setFont('helvetica', 'bold');
          doc.text('Assessment Activities', margin + 3, yPos);
          yPos += 8;
          
          const assessmentActivities = ectsData.assessmentActivities || [];
          if (assessmentActivities.length > 0 && assessmentActivities.some((a: any) => a.name || a.hours)) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Activity', margin + 3, yPos);
            doc.text('Hours', margin + 120, yPos);
            yPos += 5;
            
            doc.setFont('helvetica', 'normal');
            for (const activity of assessmentActivities) {
              if (activity.name || activity.hours) {
                checkNewPage(8);
                doc.text(doc.splitTextToSize(activity.name || '-', 110)[0], margin + 3, yPos);
                doc.text(activity.hours || '0', margin + 120, yPos);
                yPos += 5;
              }
            }
            doc.setFontSize(10);
          } else {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('No assessment activities defined', margin + 3, yPos);
            yPos += 6;
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
          }
          yPos += 8;
        }
        
        // ECTS Results
        if (ectsData.results) {
          checkNewPage(40);
          doc.setFont('helvetica', 'bold');
          doc.text('ECTS Calculation Results', margin + 3, yPos);
          yPos += 8;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`Total learning hours: ${ectsData.results.totalLearningHours}`, margin + 3, yPos);
          yPos += 6;
          doc.text(`ECTS (learning): ${ectsData.results.ectsLearningMin} - ${ectsData.results.ectsLearningMax}`, margin + 3, yPos);
          yPos += 6;
          
          if (data.courseType === 'micro-credential') {
            doc.text(`Total assessment hours: ${ectsData.results.totalAssessmentHours}`, margin + 3, yPos);
            yPos += 6;
            doc.text(`ECTS (assessment): ${ectsData.results.ectsAssessmentMin} - ${ectsData.results.ectsAssessmentMax}`, margin + 3, yPos);
            yPos += 8;
            
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 124, 113);
            doc.text(`Total micro-credential range: ${ectsData.results.ectsTotalMin} - ${ectsData.results.ectsTotalMax} ECTS`, margin + 3, yPos);
            yPos += 8;
            
            // Confirmed ECTS value
            if (ectsData.confirmedECTS) {
              doc.setFontSize(12);
              doc.text(`Confirmed ECTS: ${ectsData.confirmedECTS.toFixed(1)} ECTS`, margin + 3, yPos);
              yPos += 10;
              doc.setFontSize(10);
            }
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
          }
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.text('(Calculated using ECTS standard: 1 ECTS = 25-30 hours of workload)', margin + 3, yPos);
          yPos += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
        } else {
          checkNewPage(15);
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('ECTS not yet calculated', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '6.4') {
        // Special handling for Phase 6.4 - EQF Level
        const itemData = data.data[item.id] || {};
        const eqfData = itemData.eqfLevelData || {};
        
        checkNewPage(20);
        
        // Descriptor matches
        doc.setFont('helvetica', 'bold');
        doc.text('EQF descriptor matches', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        if (eqfData.descriptorMatches) {
          if (eqfData.descriptorMatches.knowledge) {
            doc.text(`Knowledge: Level ${eqfData.descriptorMatches.knowledge}`, margin + 3, yPos);
            yPos += 6;
            if (eqfData.descriptorComments?.knowledge) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(9);
              const commentLines = doc.splitTextToSize(eqfData.descriptorComments.knowledge, pageWidth - 2 * margin - 12);
              doc.text(commentLines, margin + 9, yPos);
              yPos += commentLines.length * 5 + 4;
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
            }
          }
          if (eqfData.descriptorMatches.skills) {
            doc.text(`Skills: Level ${eqfData.descriptorMatches.skills}`, margin + 3, yPos);
            yPos += 6;
            if (eqfData.descriptorComments?.skills) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(9);
              const commentLines = doc.splitTextToSize(eqfData.descriptorComments.skills, pageWidth - 2 * margin - 12);
              doc.text(commentLines, margin + 9, yPos);
              yPos += commentLines.length * 5 + 4;
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
            }
          }
          if (eqfData.descriptorMatches.responsibilityAutonomy) {
            doc.text(`Responsibility/Autonomy: Level ${eqfData.descriptorMatches.responsibilityAutonomy}`, margin + 3, yPos);
            yPos += 6;
            if (eqfData.descriptorComments?.responsibilityAutonomy) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(9);
              const commentLines = doc.splitTextToSize(eqfData.descriptorComments.responsibilityAutonomy, pageWidth - 2 * margin - 12);
              doc.text(commentLines, margin + 9, yPos);
              yPos += commentLines.length * 5 + 4;
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
            }
          }
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 4;
        
        // Suggested and chosen level
        checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        doc.text('EQF level determination', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        if (eqfData.suggestedLevel) {
          doc.text(`Suggested level: Level ${eqfData.suggestedLevel}`, margin + 3, yPos);
          yPos += 6;
        }

        // Confirmed/final level — supports both legacy `chosenLevel` and current
        // form fields (`singleLevel` for single-level mode, `finalLevel` for multi).
        const confirmedLevel =
          eqfData.chosenLevel ||
          (eqfData.levelMode === 'multiple'
            ? eqfData.finalLevel
            : eqfData.singleLevel);
        const confirmedNote =
          eqfData.levelMode === 'multiple' ? ' (multi-level)' : '';

        if (confirmedLevel) {
          doc.setFont('helvetica', 'bold');
          doc.text(
            `Confirmed final level: Level ${confirmedLevel}${confirmedNote}`,
            margin + 3,
            yPos
          );
          yPos += 6;
          doc.setFont('helvetica', 'normal');

          const justification = eqfData.justification || eqfData.reasoning;
          if (
            eqfData.suggestedLevel &&
            String(confirmedLevel) !== String(eqfData.suggestedLevel) &&
            justification
          ) {
            checkNewPage(15);
            doc.setFont('helvetica', 'bold');
            doc.text('Justification for different level:', margin + 3, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            const justLines = doc.splitTextToSize(justification, pageWidth - 2 * margin - 6);
            doc.text(justLines, margin + 3, yPos);
            yPos += justLines.length * 5 + 8;
          }
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 4;
        
        // Strategic responses
        if (eqfData.strategicResponses) {
          checkNewPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Strategic considerations', margin + 3, yPos);
          yPos += 8;
          
          if (eqfData.strategicResponses.descriptorExplanation) {
            checkNewPage(15);
            doc.setFont('helvetica', 'bold');
            doc.text('Descriptor alignment explanation:', margin + 3, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(eqfData.strategicResponses.descriptorExplanation, pageWidth - 2 * margin - 6);
            doc.text(descLines, margin + 3, yPos);
            yPos += descLines.length * 5 + 8;
          }
          
          if (eqfData.strategicResponses.mobilityRecognition) {
            checkNewPage(15);
            doc.setFont('helvetica', 'bold');
            doc.text('Mobility and recognition:', margin + 3, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            const mobLines = doc.splitTextToSize(eqfData.strategicResponses.mobilityRecognition, pageWidth - 2 * margin - 6);
            doc.text(mobLines, margin + 3, yPos);
            yPos += mobLines.length * 5 + 8;
          }
          
          if (eqfData.strategicResponses.metadataIntegration) {
            checkNewPage(15);
            doc.setFont('helvetica', 'bold');
            doc.text('Metadata integration:', margin + 3, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            const metaLines = doc.splitTextToSize(eqfData.strategicResponses.metadataIntegration, pageWidth - 2 * margin - 6);
            doc.text(metaLines, margin + 3, yPos);
            yPos += metaLines.length * 5 + 8;
          }
        }
        
        yPos += 5;
      } else if (item.id === '3.4') {
        // Special handling for Phase 3.4 - Audience
        const itemData = data.data[item.id] || {};
        const audienceData = itemData.audienceData || {};
        
        checkNewPage(20);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Who are the primary learners?', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        if (audienceData.primaryLearners) {
          const learnerLines = doc.splitTextToSize(audienceData.primaryLearners, pageWidth - 2 * margin - 6);
          doc.text(learnerLines, margin + 3, yPos);
          yPos += learnerLines.length * 5 + 8;
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '3.5') {
        // Special handling for Phase 3.5 - Interdisciplinary Perspectives + Overall Aim + Learning Outcomes
        const itemData = data.data[item.id] || {};
        const interdisciplinaryData = itemData.interdisciplinaryData || {};
        
        // Interdisciplinary Perspectives
        checkNewPage(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Interdisciplinary or cross-sector perspectives', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        if (interdisciplinaryData.hasPerspectives === 'yes' && interdisciplinaryData.perspectives?.length > 0) {
          const filledPerspectives = interdisciplinaryData.perspectives.filter((p: string) => p.trim());
          if (filledPerspectives.length > 0) {
            for (const perspective of filledPerspectives) {
              checkNewPage(8);
              const perspLine = `• ${perspective}`;
              const perspLines = doc.splitTextToSize(perspLine, pageWidth - 2 * margin - 10);
              doc.text(perspLines, margin + 6, yPos);
              yPos += perspLines.length * 5;
            }
          }
        } else if (interdisciplinaryData.hasPerspectives === 'none') {
          doc.setFont('helvetica', 'italic');
          doc.text('None appeared feasible at this time', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 8;
        
        // Overall Aim
        checkNewPage(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Overall aim', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        if (interdisciplinaryData.overallAim) {
          const aimLines = doc.splitTextToSize(interdisciplinaryData.overallAim, pageWidth - 2 * margin - 6);
          doc.text(aimLines, margin + 3, yPos);
          yPos += aimLines.length * 5 + 8;
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 4;
        
        // Learning Outcomes
        checkNewPage(25);
        doc.setFont('helvetica', 'bold');
        doc.text('Learning outcomes', margin + 3, yPos);
        yPos += 8;
        
        const learningOutcomes = interdisciplinaryData.learningOutcomes || [];
        const filledOutcomes = learningOutcomes.filter((o: any) => o.outcomeText?.trim());
        
        if (filledOutcomes.length > 0) {
          doc.setFont('helvetica', 'normal');
          for (let i = 0; i < filledOutcomes.length; i++) {
            const outcome = filledOutcomes[i];
            checkNewPage(15);
            
            const outcomeText = outcome.outcomeText;
            const outcomeLines = doc.splitTextToSize(outcomeText, pageWidth - 2 * margin - 6);
            doc.text(outcomeLines, margin + 3, yPos);
            yPos += outcomeLines.length * 5;
            
            if (outcome.cognitiveDomain) {
              doc.setFontSize(8);
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(100, 100, 100);
              doc.text(`Cognitive domain: ${outcome.cognitiveDomain}`, margin + 6, yPos);
              yPos += 5;
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);
            }
            yPos += 3;
          }
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '3.10') {
        // Special handling for Phase 3.10 - Define Assessment
        const itemData = data.data[item.id] || {};
        const assessmentData = itemData.defineAssessmentData || {};
        
        const assessmentTypeLabels: Record<string, string> = {
          'written': 'Written',
          'oral': 'Oral',
          'combination': 'Combination of written and oral',
        };
        
        const individualGroupLabels: Record<string, string> = {
          'individual': 'Individual assessment',
          'group': 'Group assessment',
          'combination': 'Combination',
        };
        
        const deliveryModeLabels: Record<string, string> = {
          'physical': 'Physical attendance required',
          'online-possible': 'Online possible',
          'fully-online': 'Fully online',
        };
        
        const activityTypeLabels: Record<string, string> = {
          'simulation': 'Simulation',
          'portfolio': 'Portfolio with oral defence',
          'case-based': 'Case-based assessment',
          'project-based': 'Project-based assessment',
          'practical-performance': 'Practical performance task',
          'presentation': 'Presentation',
          'observation-checklist': 'Observation checklist',
          'other': 'Other',
        };
        
        checkNewPage(20);
        
        // Assessment Type
        doc.setFont('helvetica', 'bold');
        doc.text('Overall assessment type', margin + 3, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(assessmentTypeLabels[assessmentData.assessmentType] || assessmentData.assessmentType || 'To be determined', margin + 3, yPos);
        yPos += 10;
        
        // Individual or Group
        checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessment format', margin + 3, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(individualGroupLabels[assessmentData.individualOrGroup] || assessmentData.individualOrGroup || 'To be determined', margin + 3, yPos);
        yPos += 10;
        
        // Delivery Mode
        checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        doc.text('Delivery mode', margin + 3, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(deliveryModeLabels[assessmentData.deliveryMode] || assessmentData.deliveryMode || 'To be determined', margin + 3, yPos);
        yPos += 10;
        
        // Activity Types
        if (assessmentData.activityTypes?.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Assessment activity types', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const type of assessmentData.activityTypes) {
            checkNewPage(8);
            const typeLabel = activityTypeLabels[type] || type;
            doc.text(`• ${typeLabel}`, margin + 6, yPos);
            yPos += 5;
          }
          if (assessmentData.otherActivityType) {
            doc.text(`  (Other: ${assessmentData.otherActivityType})`, margin + 6, yPos);
            yPos += 5;
          }
          yPos += 5;
        }
        
        // Activity Description
        if (assessmentData.activityDescription) {
          checkNewPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Activity description', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(assessmentData.activityDescription, pageWidth - 2 * margin - 6);
          doc.text(descLines, margin + 3, yPos);
          yPos += descLines.length * 5 + 8;
        }
        
        yPos += 5;
      } else if (item.id === '4.1') {
        // Special handling for Phase 4.1 - Topics and Themes
        const itemData = data.data[item.id] || {};
        const topicsData = itemData.topicsData || {};
        
        checkNewPage(20);
        
        // Themes
        doc.setFont('helvetica', 'bold');
        doc.text('Topics and themes', margin + 3, yPos);
        yPos += 8;
        
        const themes = topicsData.themes || [];
        const filledThemes = themes.filter((t: string) => t.trim());
        
        if (filledThemes.length > 0) {
          doc.setFont('helvetica', 'normal');
          for (const theme of filledThemes) {
            checkNewPage(8);
            const themeLine = `• ${theme}`;
            const themeLines = doc.splitTextToSize(themeLine, pageWidth - 2 * margin - 10);
            doc.text(themeLines, margin + 6, yPos);
            yPos += themeLines.length * 5;
          }
          yPos += 8;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '4.3') {
        // Special handling for Phase 4.3 - Constructive Alignment
        const itemData = data.data[item.id] || {};
        const alignmentData = itemData.constructiveAlignmentData || {};
        
        checkNewPage(20);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Alignment confirmation', margin + 3, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        if (alignmentData.alignmentConfirmed === 'aligned') {
          doc.text('Learning outcomes, content and assessment are aligned', margin + 3, yPos);
          yPos += 6;
        } else if (alignmentData.alignmentConfirmed === 'misaligned') {
          doc.text('Misalignment identified', margin + 3, yPos);
          yPos += 6;
          if (alignmentData.misalignmentNote) {
            checkNewPage(15);
            doc.setFont('helvetica', 'bold');
            doc.text('Misalignment note:', margin + 3, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            const noteLines = doc.splitTextToSize(alignmentData.misalignmentNote, pageWidth - 2 * margin - 6);
            doc.text(noteLines, margin + 3, yPos);
            yPos += noteLines.length * 5 + 8;
          }
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be confirmed', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '4.4') {
        // Special handling for Phase 4.4 - Multimodal Learning Resources
        const itemData = data.data[item.id] || {};
        const multimodalData = itemData.multimodalLearningData || {};
        
        const contentRepLabels: Record<string, string> = {
          'written': 'Written materials (texts, PDFs, articles)',
          'visual': 'Visual materials (slides, diagrams, infographics)',
          'video': 'Video materials (presentation videos)',
          'audio': 'Audio explanations (podcasts)',
          'interactive': 'Interactive digital content',
          'demonstrations': 'Demonstrations or walkthroughs',
          'other': 'Other format',
        };
        
        const activeEngagementLabels: Record<string, string> = {
          'plenary': 'Discussions in plenary',
          'peer-learning': 'Peer-learning interaction',
          'exercises': 'Practical exercises or applied tasks',
          'exploration': 'Exploration and experiencing together',
          'reflection': 'Reflection activities',
          'challenge-based': 'Challenge-based learning',
          'other': 'Other',
        };
        
        const applicationLabels: Record<string, string> = {
          'practice-tasks': 'Practice-oriented tasks',
          'simulations': 'Simulations or scenarios',
          'project-portfolio': 'Project or portfolio elements',
          'real-world': 'Real-world or workplace-related activities',
          'other': 'Other',
        };
        
        checkNewPage(20);
        
        // Content Representation
        if (multimodalData.contentRepresentation?.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Content representation', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const contentItem of multimodalData.contentRepresentation) {
            checkNewPage(8);
            const label = contentRepLabels[contentItem] || contentItem;
            doc.text(`• ${label}`, margin + 6, yPos);
            yPos += 5;
          }
          if (multimodalData.contentRepresentationOther) {
            doc.text(`  (Other: ${multimodalData.contentRepresentationOther})`, margin + 6, yPos);
            yPos += 5;
          }
          yPos += 5;
        }
        
        // Active Engagement
        if (multimodalData.activeEngagement?.length > 0) {
          checkNewPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Active engagement with content', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const engagementItem of multimodalData.activeEngagement) {
            checkNewPage(8);
            const label = activeEngagementLabels[engagementItem] || engagementItem;
            doc.text(`• ${label}`, margin + 6, yPos);
            yPos += 5;
          }
          if (multimodalData.activeEngagementOther) {
            doc.text(`  (Other: ${multimodalData.activeEngagementOther})`, margin + 6, yPos);
            yPos += 5;
          }
          yPos += 5;
        }
        
        // Application and Transfer
        if (multimodalData.applicationTransfer?.length > 0) {
          checkNewPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Application and transfer of learning', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const transferItem of multimodalData.applicationTransfer) {
            checkNewPage(8);
            const label = applicationLabels[transferItem] || transferItem;
            doc.text(`• ${label}`, margin + 6, yPos);
            yPos += 5;
          }
          if (multimodalData.applicationTransferOther) {
            doc.text(`  (Other: ${multimodalData.applicationTransferOther})`, margin + 6, yPos);
            yPos += 5;
          }
          yPos += 5;
        }
        
        // Final Confirmation
        if (multimodalData.finalConfirmation) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Do the selected resources support learning outcomes in varied and meaningful ways?', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const confirmLabels: Record<string, string> = {
            'yes': 'Yes',
            'partly': 'Partly',
            'no': 'No',
          };
          doc.text(confirmLabels[multimodalData.finalConfirmation] || multimodalData.finalConfirmation, margin + 3, yPos);
          yPos += 6;
          
          // Add comment if provided
          if (multimodalData.finalConfirmationComment && 
              (multimodalData.finalConfirmation === 'partly' || multimodalData.finalConfirmation === 'no')) {
            checkNewPage(15);
            doc.setFont('helvetica', 'italic');
            const commentLines = doc.splitTextToSize(`Comment: ${multimodalData.finalConfirmationComment}`, pageWidth - 2 * margin - 10);
            doc.text(commentLines, margin + 6, yPos);
            yPos += commentLines.length * 4 + 5;
          }
        }
        
        yPos += 5;
      } else if (item.id === '4.5') {
        // Special handling for Phase 4.5 - Supplementary Learning Considerations
        const itemData = data.data[item.id] || {};
        const supplementaryData = itemData.supplementaryData || {};
        
        const decisions: { field: string; label: string }[] = [
          { field: 'explorationDecision', label: 'Exploration and shared experiences' },
          { field: 'reflectionDecision', label: 'Reflection activities' },
          { field: 'challengeDecision', label: 'Challenge-based learning' },
          { field: 'realWorldDecision', label: 'Real-world activities' },
        ];
        
        const hasDecisions = decisions.some(d => supplementaryData[d.field]);
        if (hasDecisions) {
          checkNewPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Supplementary consideration decisions', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const decision of decisions) {
            if (supplementaryData[decision.field]) {
              checkNewPage(8);
              const decisionText = supplementaryData[decision.field] === 'incorporate' ? 'Will incorporate' : 'Intentionally left out';
              doc.text(`• ${decision.label}: ${decisionText}`, margin + 6, yPos);
              yPos += 5;
            }
          }
          yPos += 5;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.text('No supplementary considerations required (all modalities already selected).', margin + 3, yPos);
          yPos += 8;
        }

        // Feedback literacy
        if (supplementaryData.feedbackLiteracy) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Feedback literacy', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const flText = supplementaryData.feedbackLiteracy === 'yes'
            ? 'Yes, feedback literacy is explicitly supported'
            : 'No, feedback literacy is not explicitly addressed';
          doc.text(`• ${flText}`, margin + 6, yPos);
          yPos += 6;
          if (supplementaryData.feedbackLiteracy === 'yes' && supplementaryData.feedbackLiteracyDescription) {
            const flLines = doc.splitTextToSize(supplementaryData.feedbackLiteracyDescription, pageWidth - 2 * margin - 10);
            checkNewPage(flLines.length * 5 + 2);
            doc.text(flLines, margin + 6, yPos);
            yPos += flLines.length * 5 + 2;
          }
          if (supplementaryData.feedbackLiteracy === 'no' && supplementaryData.feedbackLiteracyReconsider) {
            const reconsiderText = supplementaryData.feedbackLiteracyReconsider === 'leave-out'
              ? 'Considered and intentionally left out'
              : 'Will be reconsidered';
            doc.text(`  (${reconsiderText})`, margin + 6, yPos);
            yPos += 5;
          }
          yPos += 5;
        }
        
        yPos += 5;
      } else if (item.id === '4.11') {
        // Special handling for Phase 4.11 - Glossary
        const itemData = data.data[item.id] || {};
        const glossaryData = itemData.glossaryData || {};
        
        checkNewPage(20);
        
        // Glossary status
        doc.setFont('helvetica', 'bold');
        doc.text('Glossary', margin + 3, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        
        if (glossaryData.isComplete) {
          doc.setTextColor(0, 124, 113);
          doc.text('Glossary completed', margin + 3, yPos);
          doc.setTextColor(0, 0, 0);
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be completed', margin + 3, yPos);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        yPos += 10;
        
        // Glossary entries (term + explanation pairs)
        const entries = glossaryData.entries || [];
        const filledEntries = entries.filter((e: any) => e?.term?.trim() && e?.explanation?.trim());
        if (filledEntries.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Terms and definitions', margin + 3, yPos);
          yPos += 8;
          
          for (const entry of filledEntries) {
            checkNewPage(15);
            doc.setFont('helvetica', 'bold');
            doc.text(`${entry.term}`, margin + 6, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const explanationLines = doc.splitTextToSize(entry.explanation, pageWidth - 2 * margin - 12);
            doc.text(explanationLines, margin + 9, yPos);
            yPos += explanationLines.length * 5 + 4;
          }
        } else if (!glossaryData.isComplete) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('No glossary entries defined yet', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '5.1') {
        // Special handling for Phase 5.1 - Learning Activities
        const itemData = data.data[item.id] || {};
        const activitiesData = itemData.learningActivitiesData || {};
        
        checkNewPage(20);
        
        const activities = activitiesData.activities || [];
        const filledActivities = activities.filter((a: any) => a.activity?.trim());
        
        if (filledActivities.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Learning activities', margin + 3, yPos);
          yPos += 8;
          
          const deliveryLabels: Record<string, string> = {
            'physical': 'Physical',
            'hybrid': 'Hybrid',
            'synchronous': 'Synchronous online',
            'asynchronous': 'Asynchronous',
          };
          
          const timeLabels: Record<string, string> = {
            'scheduled': 'Scheduled',
            'flexible': 'Flexible',
          };
          
          const participationLabels: Record<string, string> = {
            'individual': 'Individual',
            'collaborative': 'Collaborative',
            'mixed': 'Mixed',
          };
          
          doc.setFont('helvetica', 'normal');
          for (const activity of filledActivities) {
            checkNewPage(20);
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${activity.activity}`, margin + 3, yPos);
            yPos += 5;
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const details: string[] = [];
            if (activity.deliveryMode) details.push(deliveryLabels[activity.deliveryMode] || activity.deliveryMode);
            if (activity.timeStructure) details.push(timeLabels[activity.timeStructure] || activity.timeStructure);
            if (activity.participationForm) details.push(participationLabels[activity.participationForm] || activity.participationForm);
            
            if (details.length > 0) {
              doc.text(`  ${details.join(' | ')}`, margin + 6, yPos);
              yPos += 5;
            }
            doc.setFontSize(10);
          }
          yPos += 5;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        // Completion confirmation
        if (activitiesData.isComplete) {
          checkNewPage(10);
          doc.setTextColor(0, 124, 113);
          doc.setFont('helvetica', 'italic');
          doc.text('Learning activities confirmed as complete', margin + 3, yPos);
          yPos += 8;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '5.5') {
        // Special handling for Phase 5.5 - Design Assessment
        const itemData = data.data[item.id] || {};
        const assessmentData = itemData.designAssessmentData || {};
        
        const gradingLabels: Record<string, string> = {
          'pass-fail': 'Pass/Fail',
          'eu-scale': 'EU grading scale',
          'national': 'National scale',
          'dual': 'Dual grading',
        };
        
        // Assessment Process Description
        if (assessmentData.assessmentProcessDescription) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Assessment process description', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const procLines = doc.splitTextToSize(assessmentData.assessmentProcessDescription, pageWidth - 2 * margin - 6);
          doc.text(procLines, margin + 3, yPos);
          yPos += procLines.length * 5 + 8;
        }
        
        // Assessors
        const assessors = assessmentData.assessors || [];
        const filledAssessors = assessors.filter((a: any) => a.type);
        if (filledAssessors.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Assessors', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const assessorTypeLabels: Record<string, string> = {
            'internal': 'Internal assessor',
            'external': 'External assessor',
            'other': 'Other',
          };
          for (const assessor of filledAssessors) {
            checkNewPage(8);
            let assessorText = `• ${assessorTypeLabels[assessor.type] || assessor.type}`;
            if (assessor.type === 'other' && assessor.otherDescription) {
              assessorText += `: ${assessor.otherDescription}`;
            }
            doc.text(assessorText, margin + 6, yPos);
            yPos += 5;
          }
          yPos += 5;
        }
        
        // Transparency Measures
        const transparencyMeasures = assessmentData.transparencyMeasures || [];
        if (transparencyMeasures.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Transparency measures', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const measureLabels: Record<string, string> = {
            'informed-performance': 'Learners are informed about what constitutes satisfactory performance',
            'grading-basis': 'The basis for grading or pass/fail decisions is clearly described',
            'shared-criteria': 'Assessors use shared criteria or rubrics to ensure consistent judgement',
            'other': 'Other (please specify)',
          };
          for (const measure of transparencyMeasures) {
            const label = measureLabels[measure] || measure;
            const wrapped = doc.splitTextToSize(`• ${label}`, pageWidth - 2 * margin - 6);
            checkNewPage(wrapped.length * 5 + 2);
            doc.text(wrapped, margin + 6, yPos);
            yPos += wrapped.length * 5;
          }
          if (assessmentData.transparencyOther) {
            const wrappedOther = doc.splitTextToSize(`  (Other: ${assessmentData.transparencyOther})`, pageWidth - 2 * margin - 6);
            checkNewPage(wrappedOther.length * 5 + 2);
            doc.text(wrappedOther, margin + 6, yPos);
            yPos += wrappedOther.length * 5;
          }
          yPos += 5;
        }
        
        // Assessment Access Model
        if (assessmentData.assessmentAccessModel) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Assessment access model', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const accessLabels: Record<string, string> = {
            'open': 'Open assessment pathway',
            'fixed': 'Fixed learning pathway (all defined learning activities / standalone elements must be completed)',
            'partially-fixed': 'Partially Fixed learning pathway (only specified standalone parts must be completed)',
          };
          const accessLabel = accessLabels[assessmentData.assessmentAccessModel] || assessmentData.assessmentAccessModel;
          const accessLines = doc.splitTextToSize(accessLabel, pageWidth - 2 * margin - 6);
          checkNewPage(accessLines.length * 5 + 4);
          doc.text(accessLines, margin + 3, yPos);
          yPos += accessLines.length * 5 + 4;

          // Open: confirmation
          if (assessmentData.assessmentAccessModel === 'open' && assessmentData.assessmentAccessConfirmed) {
            checkNewPage(8);
            doc.text('• Confirmed: assessment alone is sufficient to demonstrate all learning outcomes.', margin + 3, yPos);
            yPos += 6;
          }

          // Partially-fixed: list required + either-groups
          if (assessmentData.assessmentAccessModel === 'partially-fixed') {
            const sources = (data as any).standaloneSources || [];
            const labelFor = (id: string): string => {
              const idx = sources.findIndex((s: any, i: number) => (s.documentId || s.fileName || `source-${i}`) === id);
              if (idx >= 0) {
                const s = sources[idx];
                return s.workingTitle || s.fileName || s.documentId || `Standalone source ${idx + 1}`;
              }
              return id;
            };

            const required: string[] = assessmentData.partiallyFixedRequiredSources || [];
            const either: string[] = assessmentData.partiallyFixedEitherSources || [];
            const groups: Record<string, number> = assessmentData.partiallyFixedEitherGroups || {};

            if (required.length > 0) {
              checkNewPage(8);
              doc.setFont('helvetica', 'bold');
              doc.text('Required (must all be completed):', margin + 3, yPos);
              yPos += 5;
              doc.setFont('helvetica', 'normal');
              for (const id of required) {
                const lines = doc.splitTextToSize(`• ${labelFor(id)}`, pageWidth - 2 * margin - 10);
                checkNewPage(lines.length * 5 + 1);
                doc.text(lines, margin + 6, yPos);
                yPos += lines.length * 5;
              }
              yPos += 3;
            }

            if (either.length > 0) {
              const usedGroups = Array.from(new Set(either.map(id => groups[id]).filter((g): g is number => typeof g === 'number'))).sort((a, b) => a - b);
              checkNewPage(8);
              doc.setFont('helvetica', 'bold');
              doc.text('Either / or groups (at least one alternative per group must be completed):', margin + 3, yPos);
              yPos += 5;
              doc.setFont('helvetica', 'normal');
              for (const g of usedGroups) {
                const members = either.filter(id => groups[id] === g).map(labelFor);
                const text = `• Group ${g}: ${members.join(' OR ')}`;
                const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 10);
                checkNewPage(lines.length * 5 + 1);
                doc.text(lines, margin + 6, yPos);
                yPos += lines.length * 5;
              }
              yPos += 3;
            }

            if (required.length === 0 && either.length === 0) {
              checkNewPage(6);
              doc.setFont('helvetica', 'italic');
              doc.text('(No standalone parts have been marked as required.)', margin + 3, yPos);
              doc.setFont('helvetica', 'normal');
              yPos += 6;
            }
          }

          yPos += 4;
        }
        
        // Grading System
        if (assessmentData.gradingSystem) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Grading system', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          let gradingText = gradingLabels[assessmentData.gradingSystem] || assessmentData.gradingSystem;
          if (assessmentData.gradingSystem === 'national' && assessmentData.gradingSystemCountry) {
            gradingText += ` (${assessmentData.gradingSystemCountry})`;
          }
          doc.text(gradingText, margin + 3, yPos);
          yPos += 10;
        }
        
        // Resit Description
        if (assessmentData.resitDescription) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Resit opportunities', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const resitLines = doc.splitTextToSize(assessmentData.resitDescription, pageWidth - 2 * margin - 6);
          checkNewPage(resitLines.length * 5 + 5);
          doc.text(resitLines, margin + 3, yPos);
          yPos += resitLines.length * 5 + 5;
        }
        
        if (assessmentData.resitAdminNotes) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Resit administrative notes', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const adminLines = doc.splitTextToSize(assessmentData.resitAdminNotes, pageWidth - 2 * margin - 6);
          doc.text(adminLines, margin + 3, yPos);
          yPos += adminLines.length * 5 + 5;
        }
        
        // Quality Framework
        if (assessmentData.qualityFrameworkType) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Quality framework', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          let fwText = assessmentData.qualityFrameworkType;
          if (assessmentData.qualityFrameworkOther) {
            fwText += `: ${assessmentData.qualityFrameworkOther}`;
          }
          doc.text(fwText, margin + 3, yPos);
          yPos += 10;
        }
        
        // Responsible Institution
        if (assessmentData.responsibleInstitution) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Responsible institution for assessment', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const instLines = doc.splitTextToSize(assessmentData.responsibleInstitution, pageWidth - 2 * margin - 6);
          doc.text(instLines, margin + 3, yPos);
          yPos += instLines.length * 5 + 8;
        }
        
        // Authentic Assessment
        if (assessmentData.hasAuthenticElements !== undefined) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Authentic assessment elements', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          doc.text(assessmentData.hasAuthenticElements ? 'Yes' : 'No', margin + 3, yPos);
          yPos += 6;
          if (assessmentData.authenticDescription) {
            const authLines = doc.splitTextToSize(assessmentData.authenticDescription, pageWidth - 2 * margin - 6);
            doc.text(authLines, margin + 3, yPos);
            yPos += authLines.length * 5 + 5;
          }
          yPos += 5;
        }
        
        // Authentic Case-Based
        if (assessmentData.authenticCaseBasedUsed) {
          checkNewPage(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Authentic case-based assessment', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          doc.text(assessmentData.authenticCaseBasedUsed === 'yes' ? 'Used' : 'Not used', margin + 3, yPos);
          yPos += 6;
          if (assessmentData.authenticCaseBasedUsed === 'no' && assessmentData.authenticCaseBasedReconsider) {
            const reconsiderLabel = assessmentData.authenticCaseBasedReconsider === 'reconsider'
              ? 'Will reconsider authentic case-based elements'
              : 'Proceeding without authentic case-based elements';
            doc.text(`  (${reconsiderLabel})`, margin + 3, yPos);
            yPos += 6;
          }
          yPos += 4;
        }

        // Additional prerequisites (5.5)
        const assessmentPrereqs = (assessmentData.additionalPrerequisites || [])
          .map((p: any) => (p?.description || '').trim())
          .filter((d: string) => d.length > 0);
        if (assessmentPrereqs.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Additional prerequisites', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const prereq of assessmentPrereqs) {
            const wrapped = doc.splitTextToSize(`• ${prereq}`, pageWidth - 2 * margin - 6);
            checkNewPage(wrapped.length * 5 + 2);
            doc.text(wrapped, margin + 6, yPos);
            yPos += wrapped.length * 5 + 2;
          }
          yPos += 5;
        }
        
        // Success Criteria
        if (assessmentData.successCriteria) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Success criteria', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const critLines = doc.splitTextToSize(assessmentData.successCriteria, pageWidth - 2 * margin - 6);
          doc.text(critLines, margin + 3, yPos);
          yPos += critLines.length * 5 + 8;
        }
        
        // Calibration Methods
        const calibrationMethods = assessmentData.calibrationMethods || [];
        if (calibrationMethods.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Calibration methods', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const method of calibrationMethods) {
            checkNewPage(8);
            doc.text(`• ${method}`, margin + 6, yPos);
            yPos += 5;
          }
          yPos += 5;
        }
        
        // Four-Eye Principle
        if (assessmentData.fourEyeApplied !== undefined) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Four-eye principle', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          doc.text(assessmentData.fourEyeApplied ? 'Applied' : 'Not applied', margin + 3, yPos);
          yPos += 6;
          if (assessmentData.fourEyeJustification) {
            const justLines = doc.splitTextToSize(assessmentData.fourEyeJustification, pageWidth - 2 * margin - 6);
            doc.text(justLines, margin + 3, yPos);
            yPos += justLines.length * 5 + 5;
          }
          yPos += 5;
        }
        
        // Final confirmation
        if (assessmentData.assessmentDesignConfirmed) {
          checkNewPage(10);
          doc.setTextColor(0, 124, 113);
          doc.setFont('helvetica', 'italic');
          doc.text('Assessment design confirmed as complete', margin + 3, yPos);
          yPos += 8;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '6.1') {
        // Special handling for Phase 6.1 - Technical Requirements
        const itemData = data.data[item.id] || {};
        const techData = itemData.technicalRequirementsData || {};

        checkNewPage(20);

        // Platforms / external tools
        const platforms: string[] = (techData.platforms || []).filter((p: string) => p && p.trim());
        if (platforms.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Digital platforms / external tools', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const p of platforms) {
            const wrapped = doc.splitTextToSize(`• ${p}`, pageWidth - 2 * margin - 6);
            checkNewPage(wrapped.length * 5 + 2);
            doc.text(wrapped, margin + 6, yPos);
            yPos += wrapped.length * 5;
          }
          yPos += 5;
        }

        // Software purchase requirement
        if (techData.requiresSoftwarePurchase) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Requires additional software purchase', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const label = techData.requiresSoftwarePurchase === 'yes' ? 'Yes' : techData.requiresSoftwarePurchase === 'no' ? 'No' : techData.requiresSoftwarePurchase;
          doc.text(label, margin + 3, yPos);
          yPos += 7;

          const purchaseRes: string[] = techData.selectedPurchaseResources || [];
          if (techData.requiresSoftwarePurchase === 'yes' && purchaseRes.length > 0) {
            doc.setFont('helvetica', 'italic');
            doc.text('Resources requiring purchase:', margin + 3, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            for (const r of purchaseRes) {
              const wrapped = doc.splitTextToSize(`• ${r}`, pageWidth - 2 * margin - 6);
              checkNewPage(wrapped.length * 5 + 2);
              doc.text(wrapped, margin + 6, yPos);
              yPos += wrapped.length * 5;
            }
          }
          yPos += 5;
        }

        // Accessibility checklist
        const accChecklist = techData.accessibilityChecklist || {};
        const accLabels: Record<string, string> = {
          multipleEngagement: 'Multiple means of engagement',
          multipleRepresentation: 'Multiple means of representation',
          multipleAction: 'Multiple means of action and expression',
          perceivable: 'All information perceivable',
          operable: 'User interface fully operable',
          understandable: 'Content understandable',
          robust: 'Robust and compatible with assistive technologies',
        };
        const accEntries = Object.entries(accChecklist).filter(([, v]) => v);
        if (accEntries.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Accessibility checklist (UDL / WCAG)', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const [key, val] of accEntries) {
            const line = `• ${accLabels[key] || key}: ${val}`;
            const wrapped = doc.splitTextToSize(line, pageWidth - 2 * margin - 6);
            checkNewPage(wrapped.length * 5 + 2);
            doc.text(wrapped, margin + 6, yPos);
            yPos += wrapped.length * 5;
          }
          yPos += 5;
        }

        yPos += 5;
      } else if (item.id === '6.5') {
        // Special handling for Phase 6.5 - Content Reuse & QA Metadata
        const itemData = data.data[item.id] || {};
        const reuseData = itemData.contentReuseData || {};
        
        const reuseLabels: Record<string, string> = {
          'open-access': 'Open access',
          'by-request': 'Available by request',
          'no': 'Not available for reuse',
        };
        
        checkNewPage(20);
        
        // Reuse Condition
        doc.setFont('helvetica', 'bold');
        doc.text('Content reuse within alliance', margin + 3, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(reuseLabels[reuseData.reuseCondition] || reuseData.reuseCondition || 'To be determined', margin + 3, yPos);
        yPos += 10;
        
        // Physical Presence
        if (reuseData.physicalDays !== undefined && reuseData.physicalDays > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Physical presence requirements', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          doc.text(`${reuseData.physicalDays} teaching day(s)`, margin + 3, yPos);
          yPos += 5;
          if (reuseData.teachingLocations) {
            doc.text(`Location(s): ${reuseData.teachingLocations}`, margin + 3, yPos);
            yPos += 5;
          }
          yPos += 5;
        }
        
        // Course Duration
        if (reuseData.courseDurationMode) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Course duration', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          if (reuseData.courseDurationMode === 'async') {
            doc.text('Fully asynchronous - no fixed learning period', margin + 3, yPos);
          } else if (reuseData.courseDurationMode === 'time-bound' && reuseData.estimatedWeeks) {
            doc.text(`Time-bound: ${reuseData.estimatedWeeks} week(s)`, margin + 3, yPos);
          }
          yPos += 10;
        }
        
        // Aligned Skills
        const alignedSkills = reuseData.alignedSkills || [];
        const additionalSkills = reuseData.additionalAlignedSkills || [];
        if (alignedSkills.length > 0 || additionalSkills.length > 0) {
          checkNewPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Market-relevant skills alignment', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          
          for (const skill of alignedSkills) {
            if (skill.title) {
              checkNewPage(8);
              doc.text(`• ${skill.title}`, margin + 6, yPos);
              yPos += 5;
            }
          }
          for (const skill of additionalSkills) {
            if (skill) {
              checkNewPage(8);
              doc.text(`• ${skill}`, margin + 6, yPos);
              yPos += 5;
            }
          }
        }
        
        // Instructors
        const instructors = reuseData.instructors || [];
        const filledInstructors = instructors.filter((i: any) => i.name?.trim());
        if (filledInstructors.length > 0) {
          checkNewPage(30);
          doc.setFont('helvetica', 'bold');
          doc.text('Who will lead the course', margin + 3, yPos);
          yPos += 8;
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Name', margin + 3, yPos);
          doc.text('Title', margin + 40, yPos);
          doc.text('Institution', margin + 80, yPos);
          doc.text('Additional info', margin + 125, yPos);
          yPos += 5;
          
          doc.setFont('helvetica', 'normal');
          for (const inst of filledInstructors) {
            checkNewPage(10);
            doc.text(doc.splitTextToSize(inst.name || '-', 35)[0], margin + 3, yPos);
            doc.text(doc.splitTextToSize(inst.title || '-', 38)[0], margin + 40, yPos);
            doc.text(doc.splitTextToSize(inst.institution || '-', 43)[0], margin + 80, yPos);
            doc.text(doc.splitTextToSize(inst.additionalInfo || '-', 45)[0], margin + 125, yPos);
            yPos += 6;
          }
          doc.setFontSize(10);
          yPos += 5;
        }
        
        // Additional prerequisites (6.5)
        const reusePrereqs = (reuseData.additionalPrerequisites || [])
          .map((p: any) => (p?.description || '').trim())
          .filter((d: string) => d.length > 0);
        if (reusePrereqs.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Additional prerequisites', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const prereq of reusePrereqs) {
            const wrapped = doc.splitTextToSize(`• ${prereq}`, pageWidth - 2 * margin - 6);
            checkNewPage(wrapped.length * 5 + 2);
            doc.text(wrapped, margin + 6, yPos);
            yPos += wrapped.length * 5 + 2;
          }
          yPos += 5;
        }

        // Confirmed Title
        if (reuseData.confirmedTitle) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Confirmed course title', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const titleLines = doc.splitTextToSize(reuseData.confirmedTitle, pageWidth - 2 * margin - 6);
          doc.text(titleLines, margin + 3, yPos);
          yPos += titleLines.length * 5 + 8;
        }

        // Additional information / administrative notes (free-text entries)
        const adminNotes = (reuseData.administrativeNotes || [])
          .map((n: any) => (n?.description || '').trim())
          .filter((d: string) => d.length > 0);
        if (adminNotes.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Additional information regarding this learning unit', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          for (const note of adminNotes) {
            const wrapped = doc.splitTextToSize(`• ${note}`, pageWidth - 2 * margin - 6);
            checkNewPage(wrapped.length * 5 + 2);
            doc.text(wrapped, margin + 6, yPos);
            yPos += wrapped.length * 5 + 2;
          }
          yPos += 5;
        }

        yPos += 5;
      } else if (item.id === '6.8') {
        // Special handling for Phase 6.8 - Meeting Learner Needs
        const itemData = data.data[item.id] || {};
        const learnerData = itemData.meetingLearnerNeedsData || {};
        
        checkNewPage(20);
        
        // Learner-facing description
        if (learnerData.learnerFacingDescription) {
          doc.setFont('helvetica', 'bold');
          doc.text('How learners will engage with this course', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(learnerData.learnerFacingDescription, pageWidth - 2 * margin - 6);
          doc.text(descLines, margin + 3, yPos);
          yPos += descLines.length * 5 + 8;
        } else {
          doc.setFont('helvetica', 'bold');
          doc.text('How learners will engage with this course', margin + 3, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        // Modularity confirmation
        if (learnerData.modularityConfirmed) {
          checkNewPage(10);
          doc.setTextColor(0, 124, 113);
          doc.setFont('helvetica', 'italic');
          doc.text('Modularity and flexibility confirmed', margin + 3, yPos);
          yPos += 8;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else if (item.id === '6.10') {
        // Special handling for Phase 6.10 - Evaluation Plan
        const itemData = data.data[item.id] || {};
        const evalData = itemData.evaluationPlanData || {};
        
        checkNewPage(20);
        
        // Learning Delivery Review
        doc.setFont('helvetica', 'bold');
        doc.text('Learning format and content review plan', margin + 3, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        
        if (evalData.learningDeliveryReview) {
          const reviewLines = doc.splitTextToSize(evalData.learningDeliveryReview, pageWidth - 2 * margin - 6);
          doc.text(reviewLines, margin + 3, yPos);
          yPos += reviewLines.length * 5 + 8;
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        // Assessment Calibration
        checkNewPage(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessment calibration plan', margin + 3, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        
        if (evalData.assessmentCalibration) {
          const calibLines = doc.splitTextToSize(evalData.assessmentCalibration, pageWidth - 2 * margin - 6);
          doc.text(calibLines, margin + 3, yPos);
          yPos += calibLines.length * 5 + 8;
        } else {
          doc.setTextColor(150, 150, 150);
          doc.setFont('helvetica', 'italic');
          doc.text('To be filled for completion', margin + 3, yPos);
          yPos += 6;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
        
        yPos += 5;
      } else {
        // Regular field rendering for other items
        for (const field of item.fields) {
          // Skip MC-only fields if standalone
          if (field.mcOnly && data.courseType === 'standalone') continue;

          checkNewPage(15);

          // Field label
          doc.setFont('helvetica', 'bold');
          let label = field.label;
          if (field.required) label += ' *';
          if (field.mcOnly) label += ' [MC Only]';
          
          doc.text(label, margin + 3, yPos);
          yPos += 6;

          // Field value or placeholder
          doc.setFont('helvetica', 'normal');
          const value = data.data[item.id]?.[field.name];
          const displayValue = value && value !== '' && value !== false
            ? String(value)
            : 'To be filled for completion';

          const valueLines = doc.splitTextToSize(displayValue, pageWidth - 2 * margin - 6);
          
          if (!value || value === '' || value === false) {
            doc.setTextColor(150, 150, 150);
            doc.setFont('helvetica', 'italic');
          }

          doc.text(valueLines, margin + 3, yPos);
          yPos += valueLines.length * 5 + 5;

          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
      }

      yPos += 5; // Space between items
    }

    yPos += 10; // Space between phases
  }

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF - use working title if available
  const workingTitle = data.data['2.1']?.workingTitle;
  const sanitizedTitle = workingTitle 
    ? workingTitle.replace(/[^a-zA-Z0-9æøåÆØÅäöüÄÖÜ\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 50)
    : null;
  const filename = sanitizedTitle 
    ? `${sanitizedTitle}.pdf`
    : `CourseDesign_${data.courseType}_${data.documentId.slice(0, 8)}.pdf`;
  doc.save(filename);
}
