import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { iscedBroadFields, getIscedBroad, getIscedNarrow, getIscedDetailed } from '@/data/isced';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Info, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CourseType } from '@/types/course';

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
  const courseLabel = courseType === 'standalone' ? 'standalone course' : courseType === 'composite-micro-credential' ? 'micro-credential' : 'micro-credential';
  const [workingTitle, setWorkingTitle] = useState(values.workingTitle || '');
  const [classification, setClassification] = useState(values.projectClassification || '');
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
    if (!classification) return false;
    if (!iscedBroad) return false;
    if (classification === 'approved' && developers.length < 1) return false;
    if (classification === 'developed' && developers.length < 2) return false;
    
    // Check for different institutions in developed mode
    if (classification === 'developed') {
      const institutions = developers.map(d => d.institution.toLowerCase().trim()).filter(i => i);
      const uniqueInstitutions = new Set(institutions);
      if (uniqueInstitutions.size < 2) return false;
    }
    
    return true;
  };

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-2xl font-bold text-foreground">Project classification</h2>
      </div>

      {/* Meta text */}
      <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-4">
        <p className="text-foreground leading-relaxed">
          Before starting the design process, it is essential to clarify under which conditions the learning activity is developed. According to the HEROES Joint Action Plan, every activity must be classified as either an approved or a developed HEROES activity.
        </p>
        <p className="text-foreground leading-relaxed">
          This distinction ensures transparency about ownership, responsibilities, and collaborative processes within the alliance.
        </p>
        <p className="text-foreground leading-relaxed">
          A HEROES approved activity is a learning offer developed by a single HEROES institution and later aligned to the HEROES framework. External stakeholders such as companies, NGOs, or public agencies can still participate in design or validation.
        </p>
        <p className="text-foreground leading-relaxed">
          A HEROES developed activity is co-created and delivered by two or more HEROES partner institutions. These activities normally include shared ownership, distributed QA responsibility, and joint evaluation.
        </p>
        <p className="text-foreground leading-relaxed">
          The classification defines who holds academic responsibility, how quality assurance is distributed, and which metadata and institutional references must be included in the final {courseLabel}.
        </p>
      </div>

      {/* Working Title */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="workingTitle" className="text-base font-medium">
            Working title
          </Label>
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
                <p>Give your {courseLabel} a working title. This can be changed later and is used to help identify your project during development.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Enter a working title for your {courseLabel}. This helps identify the project during development.
        </p>

        <Input
          id="workingTitle"
          value={workingTitle}
          onChange={(e) => setWorkingTitle(e.target.value)}
          placeholder={`Enter working title for your ${courseLabel}...`}
          className="max-w-xl"
        />

        <p className="text-sm text-muted-foreground italic">
          You will have the opportunity to revise the title later in Phase 6.
        </p>
      </div>

      {/* Classification Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">
            Project classification
            <span className="text-destructive ml-1">*</span>
          </Label>
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
                <p>Defines whether the activity is based on an existing institutional course or jointly developed within the HEROES alliance.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Select how this activity is organised within the HEROES framework.
        </p>

        <RadioGroup value={classification} onValueChange={setClassification}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card 
              className={cn(
                "relative cursor-pointer transition-all hover:border-primary",
                classification === 'approved' && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setClassification('approved')}
            >
              <div className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="approved" id="approved" className="mt-1" />
                  <Label htmlFor="approved" className="cursor-pointer flex-1">
                    <div className="font-semibold text-lg text-foreground">HEROES approved activity</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      A course developed by a single HEROES institution and aligned to the HEROES framework. External stakeholders may also contribute.
                    </p>
                  </Label>
                </div>
              </div>
            </Card>

            <Card 
              className={cn(
                "relative cursor-pointer transition-all hover:border-primary",
                classification === 'developed' && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setClassification('developed')}
            >
              <div className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="developed" id="developed" className="mt-1" />
                  <Label htmlFor="developed" className="cursor-pointer flex-1">
                    <div className="font-semibold text-lg text-foreground">HEROES developed activity</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      A new course jointly designed and delivered by two or more HEROES partner institutions. External stakeholders may also participate.
                    </p>
                  </Label>
                </div>
              </div>
            </Card>
          </div>
        </RadioGroup>
      </div>

      {/* Developers Section - appears after classification is selected */}
      {classification && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {classification === 'approved' 
                ? 'Developer (HEROES Institution)'
                : 'Developers (HEROES Institutions)'}
              <span className="text-destructive ml-1">*</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              {classification === 'approved' 
                ? 'List the HEROES institution directly developing this activity. For approved activities, list your own institution.'
                : 'List all HEROES institutions directly developing this activity. A minimum of 2 developers from different institutions is required for developed activities.'}
            </p>
          </div>

          {developers.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Institution / Developer</TableHead>
                    <TableHead>Contact information</TableHead>
                    <TableHead>Notes (optional)</TableHead>
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
                          placeholder="Name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={dev.institution}
                          onChange={(e) => updateDeveloper(index, 'institution', e.target.value)}
                          placeholder="Institution"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={dev.contact}
                          onChange={(e) => updateDeveloper(index, 'contact', e.target.value)}
                          placeholder="Email or phone"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={dev.notes}
                          onChange={(e) => updateDeveloper(index, 'notes', e.target.value)}
                          placeholder="Additional notes"
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
              Add developer
            </Button>
            {(courseType === 'composite-micro-credential' || (standaloneSources && standaloneSources.length > 0)) && availableDevelopers.length > 0 && (
              <Dialog open={importDevOpen} onOpenChange={setImportDevOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2" disabled={importableDevelopers.length === 0}>
                    <Download className="w-4 h-4" />
                      Choose from sources ({importableDeveloperSourceCount})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Import developers from standalone sources</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {importableDeveloperGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">All developers from your sources have already been added.</p>
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
                                  <span className="text-foreground">{dev.name || '(no name)'}</span>
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
                    <Button variant="outline" onClick={() => { setImportDevOpen(false); setSelectedDevs(new Set()); }}>Cancel</Button>
                    <Button onClick={handleImportDevelopers} disabled={selectedDevs.size === 0}>
                      Import {selectedDevs.size > 0 ? `(${selectedDevs.size})` : ''}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {classification === 'approved' && developers.length < 1 && (
            <p className="text-sm text-destructive">At least 1 developer is required for approved activities.</p>
          )}
          {classification === 'developed' && developers.length < 2 && (
            <p className="text-sm text-destructive">At least 2 developers from different institutions are required for developed activities.</p>
          )}
        </div>
      )}

      {/* External Developers Section - appears after classification is selected */}
      {classification && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              External Developers / Stakeholders (Optional)
            </h3>
            <p className="text-sm text-muted-foreground">
              External participants can be involved in both approved and developed activities. Use this section to record their role in co-design, validation, or pilot implementation.
            </p>
          </div>

          {externalDevelopers.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation / Person</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact information</TableHead>
                    <TableHead>Notes (optional)</TableHead>
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
                          placeholder="Name"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={ext.type} 
                          onValueChange={(val) => updateExternalDeveloper(index, 'type', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="ngo">NGO</SelectItem>
                            <SelectItem value="agency">Agency</SelectItem>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={ext.role} 
                          onValueChange={(val) => updateExternalDeveloper(index, 'role', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="co-designer">Co-designer</SelectItem>
                            <SelectItem value="validator">Validator</SelectItem>
                            <SelectItem value="pilot-partner">Pilot partner</SelectItem>
                            <SelectItem value="qa-reviewer">QA reviewer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={ext.contact}
                          onChange={(e) => updateExternalDeveloper(index, 'contact', e.target.value)}
                          placeholder="Email or phone"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={ext.notes}
                          onChange={(e) => updateExternalDeveloper(index, 'notes', e.target.value)}
                          placeholder="Additional notes"
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
              Add external developer
            </Button>
            {(courseType === 'composite-micro-credential' || (standaloneSources && standaloneSources.length > 0)) && availableExternals.length > 0 && (
              <Dialog open={importExtOpen} onOpenChange={setImportExtOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2" disabled={importableExternals.length === 0}>
                    <Download className="w-4 h-4" />
                      Choose from sources ({importableExternalSourceCount})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Import external developers from standalone sources</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {importableExternalGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">All external developers from your sources have already been added.</p>
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
                                  <span className="text-foreground">{ext.organisation || '(no name)'}</span>
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
                    <Button variant="outline" onClick={() => { setImportExtOpen(false); setSelectedExts(new Set()); }}>Cancel</Button>
                    <Button onClick={handleImportExternals} disabled={selectedExts.size === 0}>
                      Import {selectedExts.size > 0 ? `(${selectedExts.size})` : ''}
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
            <h3 className="text-lg font-semibold text-foreground">Academic field of study</h3>
            <p className="text-sm text-muted-foreground">
              Select the primary academic field that best represents this {courseLabel}. The ISCED-F 2013 classification is the European standard for describing fields of education and training. This information supports recognition, reporting, interoperability, and metadata exchange across higher education institutions.
            </p>
            <p className="text-sm text-muted-foreground">
              Select the field of education and training that best represents the {courseLabel}.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              Broad field<span className="text-destructive ml-1">*</span>
            </Label>

            <p className="text-sm text-muted-foreground">Select the broad field that best represents the {courseLabel}.</p>
            <Select
              value={iscedBroad}
              onValueChange={(v) => {
                setIscedBroad(v);
                setIscedNarrow('');
                setIscedDetailed('');
              }}
            >
              <SelectTrigger className="max-w-xl bg-background">
                <SelectValue placeholder="Select broad field..." />
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
              Narrow field <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <p className="text-sm text-muted-foreground">Select the narrow field that best represents the {courseLabel}.</p>
            <Select
              value={iscedNarrow}
              disabled={!iscedBroad}
              onValueChange={(v) => {
                setIscedNarrow(v);
                setIscedDetailed('');
              }}
            >
              <SelectTrigger className="max-w-xl bg-background">
                <SelectValue placeholder={iscedBroad ? 'Select narrow field...' : 'Select a broad field first'} />
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
              Detailed field <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <p className="text-sm text-muted-foreground">Select the most precise field available for the {courseLabel}.</p>
            <Select
              value={iscedDetailed}
              disabled={!iscedNarrow}
              onValueChange={setIscedDetailed}
            >
              <SelectTrigger className="max-w-xl bg-background">
                <SelectValue placeholder={iscedNarrow ? 'Select detailed field...' : 'Select a narrow field first'} />
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
      {!isValid() && classification && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          {classification === 'developed' && developers.length >= 2 && (() => {
            const institutions = developers.map(d => d.institution.toLowerCase().trim()).filter(i => i);
            const uniqueInstitutions = new Set(institutions);
            return uniqueInstitutions.size < 2;
          })() 
            ? 'For developed activities, developers must be from at least 2 different institutions.'
            : !iscedBroad
              ? 'Please select the academic field of study (ISCED-F 2013) to continue.'
              : 'Please complete the required developer information to continue.'}
        </div>
      )}
    </div>
  );
}
