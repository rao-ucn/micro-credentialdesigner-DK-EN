import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { iscedBroadFields, getIscedBroad, getIscedNarrow, getIscedDetailed } from '@/data/isced';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Info, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CourseType } from '@/types/course';
import { useLanguage } from '@/contexts/LanguageContext';
import { coreuiTranslations } from '@/lib/translations/coreui';

interface Developer {
  name: string;
  institution: string;
  contact: string;
  notes: string;
}

interface ExternalDeveloper {
  organisation: string;
  type: string;
  role: string;
  contact: string;
  notes: string;
}

interface ProjectClassificationData {
  workingTitle?: string;
  projectClassification?: string;
  developers?: Developer[];
  externalDevelopers?: ExternalDeveloper[];
  iscedBroadField?: string;
  iscedNarrowField?: string;
  iscedDetailedField?: string;
}

interface ProjectClassificationProps {
  values: ProjectClassificationData;
  onChange: (fieldName: string, value: any) => void;
  courseType?: CourseType;
  standaloneSources?: Array<{ workingTitle: string; documentId: string; data: Record<string, any> }>;
}

export function ProjectClassification({ values, onChange, courseType = 'micro-credential', standaloneSources }: ProjectClassificationProps) {
  const { language, t } = useLanguage();
  const lt = coreuiTranslations[language];
  const courseLabel = courseType === 'standalone' ? lt.courseLabelStandalone : courseType === 'composite-micro-credential' ? lt.courseLabelMc : lt.courseLabelMc;
  const [workingTitle, setWorkingTitle] = useState(values.workingTitle || '');
  // The classification choice has been removed — every activity follows the
  // "approved activity" structure (single developing institution).
  const [classification] = useState('approved');
  const [developers, setDevelopers] = useState<Developer[]>(values.developers || []);
  const [externalDevelopers, setExternalDevelopers] = useState<ExternalDeveloper[]>(values.externalDevelopers || []);
  const [iscedBroad, setIscedBroad] = useState(values.iscedBroadField || '');
  const [iscedNarrow, setIscedNarrow] = useState(values.iscedNarrowField || '');
  const [iscedDetailed, setIscedDetailed] = useState(values.iscedDetailedField || '');

  useEffect(() => {
    onChange('iscedBroadField', iscedBroad);
  }, [iscedBroad]);

  useEffect(() => {
    onChange('iscedNarrowField', iscedNarrow);
  }, [iscedNarrow]);

  useEffect(() => {
    onChange('iscedDetailedField', iscedDetailed);
  }, [iscedDetailed]);

  useEffect(() => {
    onChange('workingTitle', workingTitle);
  }, [workingTitle]);

  useEffect(() => {
    onChange('projectClassification', classification);
  }, [classification]);

  useEffect(() => {
    onChange('developers', developers);
  }, [developers]);

  useEffect(() => {
    onChange('externalDevelopers', externalDevelopers);
  }, [externalDevelopers]);

  const addDeveloper = () => {
    setDevelopers([...developers, { name: '', institution: '', contact: '', notes: '' }]);
  };

  const removeDeveloper = (index: number) => {
    setDevelopers(developers.filter((_, i) => i !== index));
  };

  const updateDeveloper = (index: number, field: keyof Developer, value: string) => {
    const updated = [...developers];
    updated[index][field] = value;
    setDevelopers(updated);
  };

  const addExternalDeveloper = () => {
    setExternalDevelopers([...externalDevelopers, { organisation: '', type: '', role: '', contact: '', notes: '' }]);
  };

  const removeExternalDeveloper = (index: number) => {
    setExternalDevelopers(externalDevelopers.filter((_, i) => i !== index));
  };

  const updateExternalDeveloper = (index: number, field: keyof ExternalDeveloper, value: string) => {
    const updated = [...externalDevelopers];
    updated[index][field] = value;
    setExternalDevelopers(updated);
  };

  // ----- Composite import: collect developers from all standalone sources -----
  const [importDevOpen, setImportDevOpen] = useState(false);
  const [importExtOpen, setImportExtOpen] = useState(false);
  const [selectedDevs, setSelectedDevs] = useState<Set<string>>(new Set());
  const [selectedExts, setSelectedExts] = useState<Set<string>>(new Set());

  const availableDevelopers: Array<{ key: string; sourceTitle: string; sourceDocumentId: string; dev: Developer }> = [];
  const availableExternals: Array<{ key: string; sourceTitle: string; sourceDocumentId: string; ext: ExternalDeveloper }> = [];
  const seenDeveloperEntries = new Set<string>();
  const seenExternalEntries = new Set<string>();

  if (standaloneSources && standaloneSources.length > 0) {
    standaloneSources.forEach((src, sIdx) => {
      const data21 = src.data?.['2.1'];
      if (!data21) return;
      const devs: Developer[] = Array.isArray(data21.developers) ? data21.developers : [];
      devs.forEach((d, dIdx) => {
        if (!d || (!d.name && !d.institution)) return;
        const dedupeKey = [
          src.documentId,
          d.name?.trim().toLowerCase() || '',
          d.institution?.trim().toLowerCase() || '',
          d.contact?.trim().toLowerCase() || '',
          d.notes?.trim().toLowerCase() || '',
        ].join('::');
        if (seenDeveloperEntries.has(dedupeKey)) return;
        seenDeveloperEntries.add(dedupeKey);
        availableDevelopers.push({
          key: `${sIdx}-${dIdx}`,
          sourceTitle: src.workingTitle || `Source ${sIdx + 1}`,
          sourceDocumentId: src.documentId,
          dev: d,
        });
      });
      const exts: ExternalDeveloper[] = Array.isArray(data21.externalDevelopers) ? data21.externalDevelopers : [];
      exts.forEach((e, eIdx) => {
        if (!e || (!e.organisation && !e.role)) return;
        const dedupeKey = [
          src.documentId,
          e.organisation?.trim().toLowerCase() || '',
          e.type?.trim().toLowerCase() || '',
          e.role?.trim().toLowerCase() || '',
          e.contact?.trim().toLowerCase() || '',
          e.notes?.trim().toLowerCase() || '',
        ].join('::');
        if (seenExternalEntries.has(dedupeKey)) return;
        seenExternalEntries.add(dedupeKey);
        availableExternals.push({
          key: `${sIdx}-${eIdx}`,
          sourceTitle: src.workingTitle || `Source ${sIdx + 1}`,
          sourceDocumentId: src.documentId,
          ext: e,
        });
      });
    });
  }

  const isDevAlreadyAdded = (d: Developer) =>
    developers.some(x => x.name.trim() === d.name.trim() && x.institution.trim() === d.institution.trim());
  const isExtAlreadyAdded = (e: ExternalDeveloper) =>
    externalDevelopers.some(x => x.organisation.trim() === e.organisation.trim() && x.role.trim() === e.role.trim());

  const importableDevelopers = availableDevelopers.filter(({ dev }) => !isDevAlreadyAdded(dev));
  const importableExternals = availableExternals.filter(({ ext }) => !isExtAlreadyAdded(ext));

  const importableDeveloperGroups = Array.from(
    importableDevelopers.reduce((groups, entry) => {
      const existing = groups.get(entry.sourceDocumentId);
      if (existing) {
        existing.developers.push(entry.dev);
      } else {
        groups.set(entry.sourceDocumentId, {
          sourceDocumentId: entry.sourceDocumentId,
          sourceTitle: entry.sourceTitle,
          developers: [entry.dev],
        });
      }
      return groups;
    }, new Map<string, { sourceDocumentId: string; sourceTitle: string; developers: Developer[] }>())
      .values()
  );

  const importableExternalGroups = Array.from(
    importableExternals.reduce((groups, entry) => {
      const existing = groups.get(entry.sourceDocumentId);
      if (existing) {
        existing.externals.push(entry.ext);
      } else {
        groups.set(entry.sourceDocumentId, {
          sourceDocumentId: entry.sourceDocumentId,
          sourceTitle: entry.sourceTitle,
          externals: [entry.ext],
        });
      }
      return groups;
    }, new Map<string, { sourceDocumentId: string; sourceTitle: string; externals: ExternalDeveloper[] }>())
      .values()
  );

  const importableDeveloperSourceCount = importableDeveloperGroups.length;
  const importableExternalSourceCount = importableExternalGroups.length;

  const handleImportDevelopers = () => {
    const toAdd = importableDevelopers
      .filter(({ sourceDocumentId }) => selectedDevs.has(sourceDocumentId))
      .map(({ dev }) => ({ ...dev }));
    if (toAdd.length > 0) setDevelopers([...developers, ...toAdd]);
    setSelectedDevs(new Set());
    setImportDevOpen(false);
  };

  const handleImportExternals = () => {
    const toAdd = importableExternals
      .filter(({ sourceDocumentId }) => selectedExts.has(sourceDocumentId))
      .map(({ ext }) => ({ ...ext }));
    if (toAdd.length > 0) setExternalDevelopers([...externalDevelopers, ...toAdd]);
    setSelectedExts(new Set());
    setImportExtOpen(false);
  };

  const toggleDevSelection = (key: string) => {
    setSelectedDevs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const toggleExtSelection = (key: string) => {
    setSelectedExts(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isValid = () => {
    if (!iscedBroad) return false;
    if (developers.length < 1) return false;
    return true;
  };

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-2xl font-bold text-foreground">{lt.projectClassificationTitle}</h2>
      </div>

      {/* Meta text */}
      <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-4">
        <p className="text-foreground leading-relaxed">
          {lt.pcIntro1}
        </p>
        <p className="text-foreground leading-relaxed">
          {lt.pcIntro2}
        </p>
        <p className="text-foreground leading-relaxed">
          {lt.pcIntro3.replace('{courseLabel}', courseLabel)}
        </p>
      </div>

      {/* Working Title */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="workingTitle" className="text-base font-medium">
            {lt.workingTitleLabel}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={lt.helpAriaLabel}
                >
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{lt.workingTitleTooltip.replace('{courseLabel}', courseLabel)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {lt.workingTitleDescription.replace('{courseLabel}', courseLabel)}
        </p>

        <Input
          id="workingTitle"
          value={workingTitle}
          onChange={(e) => setWorkingTitle(e.target.value)}
          placeholder={lt.workingTitlePlaceholder.replace('{courseLabel}', courseLabel)}
          className="max-w-xl"
        />

        <p className="text-sm text-muted-foreground italic">
          {lt.workingTitleRevise}
        </p>
      </div>

      {/* Developers Section */}
      {classification && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {lt.developerSectionTitle}
              <span className="text-destructive ml-1">*</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              {lt.developerSectionDescription}
            </p>
          </div>

          {developers.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lt.tableColName}</TableHead>
                    <TableHead>{lt.tableColInstitution}</TableHead>
                    <TableHead>{lt.tableColContact}</TableHead>
                    <TableHead>{lt.tableColNotes}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {developers.map((dev, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={dev.name}
                          onChange={(e) => updateDeveloper(index, 'name', e.target.value)}
                          placeholder={lt.namePlaceholder}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={dev.institution}
                          onChange={(e) => updateDeveloper(index, 'institution', e.target.value)}
                          placeholder={lt.institutionPlaceholder}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={dev.contact}
                          onChange={(e) => updateDeveloper(index, 'contact', e.target.value)}
                          placeholder={lt.contactPlaceholder}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={dev.notes}
                          onChange={(e) => updateDeveloper(index, 'notes', e.target.value)}
                          placeholder={lt.notesPlaceholder}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDeveloper(index)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={addDeveloper} variant="outline" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              {lt.addDeveloperButton}
            </Button>
            {(courseType === 'composite-micro-credential' || (standaloneSources && standaloneSources.length > 0)) && availableDevelopers.length > 0 && (
              <Dialog open={importDevOpen} onOpenChange={setImportDevOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2" disabled={importableDevelopers.length === 0}>
                    <Download className="w-4 h-4" />
                      {lt.chooseFromSources.replace('{count}', String(importableDeveloperSourceCount))}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{lt.importDevelopersDialogTitle}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {importableDeveloperGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">{lt.allDevelopersImported}</p>
                    ) : (
                      importableDeveloperGroups.map(({ sourceDocumentId, sourceTitle, developers: groupedDevelopers }) => (
                        <label
                          key={sourceDocumentId}
                          className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={selectedDevs.has(sourceDocumentId)}
                            onCheckedChange={() => toggleDevSelection(sourceDocumentId)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sourceTitle}</span>
                              <Badge variant="secondary" className="text-xs">{sourceTitle}</Badge>
                            </div>
                            <div className="space-y-1">
                              {groupedDevelopers.map((dev, index) => (
                                <div key={`${sourceDocumentId}-dev-${index}`} className="text-sm text-muted-foreground">
                                  <span className="text-foreground">{dev.name || lt.noNamePlaceholder}</span>
                                  {dev.institution ? ` · ${dev.institution}` : ''}
                                  {dev.contact ? ` · ${dev.contact}` : ''}
                                  {dev.notes && <span className="italic"> · {dev.notes}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setImportDevOpen(false); setSelectedDevs(new Set()); }}>{lt.cancelButton}</Button>
                    <Button onClick={handleImportDevelopers} disabled={selectedDevs.size === 0}>
                      {lt.importButton} {selectedDevs.size > 0 ? `(${selectedDevs.size})` : ''}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {developers.length < 1 && (
            <p className="text-sm text-destructive">{lt.developerRequiredWarning}</p>
          )}
        </div>
      )}

      {/* External Developers Section - appears after classification is selected */}
      {classification && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {lt.externalDevelopersSectionTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {lt.externalDevelopersSectionDescription}
            </p>
          </div>

          {externalDevelopers.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lt.tableColOrganisation}</TableHead>
                    <TableHead>{lt.tableColType}</TableHead>
                    <TableHead>{lt.tableColRole}</TableHead>
                    <TableHead>{lt.tableColContact}</TableHead>
                    <TableHead>{lt.tableColNotes}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {externalDevelopers.map((ext, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={ext.organisation}
                          onChange={(e) => updateExternalDeveloper(index, 'organisation', e.target.value)}
                          placeholder={lt.orgPlaceholder}
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={ext.type} 
                          onValueChange={(val) => updateExternalDeveloper(index, 'type', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={lt.selectTypePlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="company">{lt.typeCompany}</SelectItem>
                            <SelectItem value="ngo">{lt.typeNgo}</SelectItem>
                            <SelectItem value="agency">{lt.typeAgency}</SelectItem>
                            <SelectItem value="individual">{lt.typeIndividual}</SelectItem>
                            <SelectItem value="other">{lt.typeOther}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={ext.role} 
                          onValueChange={(val) => updateExternalDeveloper(index, 'role', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={lt.selectRolePlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="co-designer">{lt.roleCoDesigner}</SelectItem>
                            <SelectItem value="validator">{lt.roleValidator}</SelectItem>
                            <SelectItem value="pilot-partner">{lt.rolePilotPartner}</SelectItem>
                            <SelectItem value="qa-reviewer">{lt.roleQaReviewer}</SelectItem>
                            <SelectItem value="other">{lt.roleOther}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={ext.contact}
                          onChange={(e) => updateExternalDeveloper(index, 'contact', e.target.value)}
                          placeholder={lt.contactPlaceholder}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={ext.notes}
                          onChange={(e) => updateExternalDeveloper(index, 'notes', e.target.value)}
                          placeholder={lt.notesPlaceholder}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExternalDeveloper(index)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={addExternalDeveloper} variant="outline" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              {lt.addExternalDeveloperButton}
            </Button>
            {(courseType === 'composite-micro-credential' || (standaloneSources && standaloneSources.length > 0)) && availableExternals.length > 0 && (
              <Dialog open={importExtOpen} onOpenChange={setImportExtOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2" disabled={importableExternals.length === 0}>
                    <Download className="w-4 h-4" />
                      {lt.chooseFromSources.replace('{count}', String(importableExternalSourceCount))}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{lt.importExternalDialogTitle}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {importableExternalGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">{lt.allExternalsImported}</p>
                    ) : (
                      importableExternalGroups.map(({ sourceDocumentId, sourceTitle, externals }) => (
                        <label
                          key={sourceDocumentId}
                          className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={selectedExts.has(sourceDocumentId)}
                            onCheckedChange={() => toggleExtSelection(sourceDocumentId)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sourceTitle}</span>
                              <Badge variant="secondary" className="text-xs">{sourceTitle}</Badge>
                            </div>
                            <div className="space-y-1">
                              {externals.map((ext, index) => (
                                <div key={`${sourceDocumentId}-ext-${index}`} className="text-sm text-muted-foreground">
                                  <span className="text-foreground">{ext.organisation || lt.noNamePlaceholder}</span>
                                  {ext.type ? ` · ${ext.type}` : ''}
                                  {ext.role ? ` · ${ext.role}` : ''}
                                  {ext.contact ? ` · ${ext.contact}` : ''}
                                  {ext.notes && <span className="italic"> · {ext.notes}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setImportExtOpen(false); setSelectedExts(new Set()); }}>{lt.cancelButton}</Button>
                    <Button onClick={handleImportExternals} disabled={selectedExts.size === 0}>
                      {lt.importButton} {selectedExts.size > 0 ? `(${selectedExts.size})` : ''}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      )}

      {/* Academic field of study (ISCED-F 2013) */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{lt.academicFieldTitle}</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    aria-label={lt.iscedReadMoreAria}
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm space-y-2">
                  <p>{lt.iscedReadMoreText}</p>
                  <a
                    href="https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/international-standard-classification-education-fields-education-and"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                  >
                    https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/international-standard-classification-education-fields-education-and
                  </a>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-sm text-muted-foreground">
              {lt.academicFieldDescription1.replace('{courseLabel}', courseLabel)}
            </p>
            <p className="text-sm text-muted-foreground">
              {lt.academicFieldDescription2.replace('{courseLabel}', courseLabel)}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              {lt.broadFieldLabel}<span className="text-destructive ml-1">*</span>
            </Label>

            <p className="text-sm text-muted-foreground">{lt.broadFieldDescription.replace('{courseLabel}', courseLabel)}</p>
            <Select
              value={iscedBroad}
              onValueChange={(v) => {
                setIscedBroad(v);
                setIscedNarrow('');
                setIscedDetailed('');
              }}
            >
              <SelectTrigger className="max-w-xl bg-background">
                <SelectValue placeholder={lt.selectBroadFieldPlaceholder} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {iscedBroadFields.map((b) => (
                  <SelectItem key={b.code} value={b.code}>{b.code} – {b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              {lt.narrowFieldLabel} <span className="text-muted-foreground font-normal">({lt.optionalLabel})</span>
            </Label>
            <p className="text-sm text-muted-foreground">{lt.narrowFieldDescription.replace('{courseLabel}', courseLabel)}</p>
            <Select
              value={iscedNarrow}
              disabled={!iscedBroad}
              onValueChange={(v) => {
                setIscedNarrow(v);
                setIscedDetailed('');
              }}
            >
              <SelectTrigger className="max-w-xl bg-background">
                <SelectValue placeholder={iscedBroad ? lt.selectNarrowFieldPlaceholder : lt.selectBroadFieldFirstPlaceholder} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {(getIscedBroad(iscedBroad)?.narrow || []).map((n) => (
                  <SelectItem key={n.code} value={n.code}>{n.code} – {n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              {lt.detailedFieldLabel} <span className="text-muted-foreground font-normal">({lt.optionalLabel})</span>
            </Label>
            <p className="text-sm text-muted-foreground">{lt.detailedFieldDescription.replace('{courseLabel}', courseLabel)}</p>
            <Select
              value={iscedDetailed}
              disabled={!iscedNarrow}
              onValueChange={setIscedDetailed}
            >
              <SelectTrigger className="max-w-xl bg-background">
                <SelectValue placeholder={iscedNarrow ? lt.selectDetailedFieldPlaceholder : lt.selectNarrowFieldFirstPlaceholder} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {(getIscedNarrow(iscedBroad, iscedNarrow)?.detailed || []).map((x) => (
                  <SelectItem key={x.code} value={x.code}>{x.code} – {x.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      {/* Validation message - only shows when developers are incomplete */}
      {!isValid() && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          {!iscedBroad
            ? lt.validationSelectField
            : lt.validationCompleteDevelopers}
        </div>
      )}
    </div>
  );
}
