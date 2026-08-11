import { CourseData, EncryptedData } from '@/types/course';
import { encryptData, decryptData } from './crypto';

const STORAGE_PREFIX = 'mcd:';
const COUNTER_KEY = 'mcd:document_counter';
const VERSION = '1.0.0';

/**
 * Strips legacy manual either/or group IDs (`grp-*`) from composite ECTS data.
 * Either/or grouping is now driven exclusively by Phase 5.5; manual `grp-*` IDs
 * from older documents would be invisible in the UI but still affect ECTS sums.
 * Phase-5-synced groups (`phase5-grp-*`) are preserved.
 */
function migrateLegacyEitherGroups(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const ects = data?.['6.3']?.compositeEctsData;
  if (!ects || typeof ects !== 'object') return data;
  if (Array.isArray(ects.groups)) {
    ects.groups = ects.groups.filter((g: any) =>
      typeof g?.id === 'string' && g.id.startsWith('phase5-grp-')
    );
  }
  if (Array.isArray(ects.sources)) {
    ects.sources = ects.sources.map((s: any) => {
      if (s?.groupId && typeof s.groupId === 'string' && !s.groupId.startsWith('phase5-grp-')) {
        return { ...s, groupId: null };
      }
      return s;
    });
  }
  return data;
}

/**
 * Saves course data to localStorage with encryption.
 * Documents never leave the user's device.
 */
export async function saveCourseData(data: CourseData, securityCode: string, _isComplete: boolean = false): Promise<void> {
  const json = JSON.stringify({ ...data, version: VERSION });
  const encrypted = await encryptData(json, securityCode);

  try {
    localStorage.setItem(STORAGE_PREFIX + data.documentId, JSON.stringify(encrypted));
  } catch (localErr) {
    console.error('Local save failed:', localErr);
    throw new Error('Save failed: local storage is full or unavailable.');
  }
}

/**
 * Loads course data from localStorage with decryption
 */
export async function loadCourseData(documentId: string, securityCode: string): Promise<CourseData> {
  const stored = localStorage.getItem(STORAGE_PREFIX + documentId);
  if (!stored) {
    throw new Error('Document not found');
  }

  const encrypted: EncryptedData = JSON.parse(stored);
  const decrypted = await decryptData(encrypted, securityCode);
  return migrateLegacyEitherGroups(JSON.parse(decrypted));
}

/**
 * Deletes course data from localStorage
 */
export async function deleteCourseData(documentId: string): Promise<void> {
  localStorage.removeItem(STORAGE_PREFIX + documentId);
}

/**
 * Checks if a document exists in localStorage
 */
export async function documentExists(documentId: string): Promise<boolean> {
  return localStorage.getItem(STORAGE_PREFIX + documentId) !== null;
}

/**
 * Lists all document IDs from localStorage
 */
export async function listDocuments(): Promise<string[]> {
  const keys = Object.keys(localStorage);
  return keys
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .map(key => key.substring(STORAGE_PREFIX.length));
}

/**
 * Exports course data as JSON
 */
export function exportToJSON(data: CourseData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Imports course data from JSON and validates it
 */
export function importFromJSON(json: string): CourseData {
  const data = JSON.parse(json);
  // Validate required fields
  if (!data.documentId || !data.courseType) {
    throw new Error('Invalid JSON format - missing documentId or courseType');
  }
  // securityCode field is optional (may be the hash, may be missing in older exports)
  return migrateLegacyEitherGroups(data);
}

/**
 * Saves imported data to localStorage using the provided security code
 */
export async function saveImportedData(data: CourseData, securityCode: string, _isComplete: boolean = false): Promise<void> {
  const json = JSON.stringify({ ...data, version: VERSION });
  const encrypted = await encryptData(json, securityCode);

  try {
    localStorage.setItem(STORAGE_PREFIX + data.documentId, JSON.stringify(encrypted));
  } catch (localErr) {
    console.error('Local save failed:', localErr);
    throw new Error('Save failed: local storage is full or unavailable.');
  }
}

/**
 * Gets the next document ID from a monotonic local counter (never reused).
 */
export async function getNextDocumentId(): Promise<string> {
  const localCounter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
  const nextNumber = localCounter + 1;
  localStorage.setItem(COUNTER_KEY, nextNumber.toString());
  const padded = nextNumber.toString().padStart(9, '0');
  return `${padded.slice(0, 3)}-${padded.slice(3, 6)}-${padded.slice(6, 9)}`;
}
