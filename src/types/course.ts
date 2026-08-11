export type CourseType = 'standalone' | 'micro-credential' | 'composite-micro-credential';

export interface StandaloneSource {
  fileName: string;
  documentId: string;
  workingTitle: string;
  courseType: 'standalone'; // Only standalone courses can be sources
  originalCourseType?: CourseType; // Track what type the source file originally was
  data: Record<string, any>;
}

export interface CompositeFieldMeta {
  sourceIndex: number; // Index into CourseData.standaloneSources
  locked: boolean; // Whether the field is locked (read-only)
}

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'ects';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  mcOnly?: boolean; // Only show/require for micro-credentials
  helpText?: string;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  mcOnly?: boolean; // Only show for micro-credentials
  fields: Field[];
}

export interface SubPhase {
  id: string;
  label: string;
  itemIds: string[]; // Item IDs belonging to this sub-phase
  mcOnly?: boolean; // Hide entire sub-phase for standalone
  metatext?: string; // Theme metatext shown at the top
}

export interface Phase {
  id: string;
  number: number;
  title: string;
  subPhases?: SubPhase[];
  items: Item[];
}

export interface CourseData {
  documentId: string;
  securityCode: string; // 12-character alphanumeric code (stored as hash)
  displaySecurityCode?: string; // Plain text code for PDF display
  courseType: CourseType;
  version: string;
  createdAt: string;
  updatedAt: string;
  currentPhaseId: string;
  currentItemIndex: number;
  data: Record<string, any>; // Item ID -> field values
  standaloneSources?: StandaloneSource[]; // Sources for composite micro-credentials
  compositeFieldMeta?: Record<string, CompositeFieldMeta>; // Field-level lock/source metadata
  compositeIntegrityBroken?: boolean; // True if user edited embedded standalone data
  basedOnSingleSource?: boolean; // True for MCs created from a single existing standalone file (until user breaks integrity)
  singleSourceDocumentId?: string; // Original source document ID when basedOnSingleSource is true
}

export interface EncryptedData {
  iv: string;
  salt: string;
  data: string;
}
