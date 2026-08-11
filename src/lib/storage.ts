import { CourseData, EncryptedData } from '@/types/course';
import { encryptData, decryptData } from './crypto';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_PREFIX = 'heroes:';
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
 * Saves course data to Cloud (Supabase) with encryption
 */
export async function saveCourseData(data: CourseData, securityCode: string, isComplete: boolean = false): Promise<void> {
  const json = JSON.stringify({ ...data, version: VERSION });
  const encrypted = await encryptData(json, securityCode);
  
  // Try to upsert to Cloud first
  const { error } = await supabase
    .from('course_documents')
    .upsert({
      document_id: data.documentId,
      encrypted_data: encrypted as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
      is_complete: isComplete
    } as never, {
      onConflict: 'document_id'
    });

  const serialized = JSON.stringify(encrypted);

  let localSaved = true;
  try {
    localStorage.setItem(STORAGE_PREFIX + data.documentId, serialized);
  } catch (localErr) {
    localSaved = false;
    console.warn('Local mirror save failed:', localErr);
  }

  if (error) {
    console.error('Cloud save failed:', error);
    if (!localSaved) {
      throw new Error(`Save failed: cloud error (${error.message}) and local storage is full.`);
    }
  }
}

/**
 * Loads course data from Cloud (Supabase) with decryption, falls back to localStorage
 */
export async function loadCourseData(documentId: string, securityCode: string): Promise<CourseData> {
  // Try Cloud first
  const { data: cloudData, error } = await supabase
    .from('course_documents')
    .select('encrypted_data')
    .eq('document_id', documentId)
    .maybeSingle();

  if (cloudData && !error) {
    const encrypted: EncryptedData = cloudData.encrypted_data as unknown as EncryptedData;
    const decrypted = await decryptData(encrypted, securityCode);
    const parsed = JSON.parse(decrypted);
    
    // Also update localStorage for offline access
    localStorage.setItem(STORAGE_PREFIX + documentId, JSON.stringify(encrypted));
    
    return migrateLegacyEitherGroups(parsed);
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_PREFIX + documentId);
  if (!stored) {
    throw new Error('Document not found');
  }

  const encrypted: EncryptedData = JSON.parse(stored);
  const decrypted = await decryptData(encrypted, securityCode);
  return migrateLegacyEitherGroups(JSON.parse(decrypted));
}

/**
 * Deletes course data from Cloud and localStorage
 */
export async function deleteCourseData(documentId: string): Promise<void> {
  // Delete from Cloud
  await supabase
    .from('course_documents')
    .delete()
    .eq('document_id', documentId);

  // Delete from localStorage
  localStorage.removeItem(STORAGE_PREFIX + documentId);
}

/**
 * Checks if a document exists in Cloud or localStorage
 */
export async function documentExists(documentId: string): Promise<boolean> {
  // Check Cloud first
  const { data, error } = await supabase
    .from('course_documents')
    .select('document_id')
    .eq('document_id', documentId)
    .maybeSingle();

  if (data && !error) {
    return true;
  }

  // Fallback to localStorage
  return localStorage.getItem(STORAGE_PREFIX + documentId) !== null;
}

/**
 * Lists all document IDs from Cloud and localStorage
 */
export async function listDocuments(): Promise<string[]> {
  const documentIds = new Set<string>();

  // Get from Cloud
  const { data: cloudDocs } = await supabase
    .from('course_documents')
    .select('document_id');

  if (cloudDocs) {
    cloudDocs.forEach(doc => documentIds.add(doc.document_id));
  }

  // Get from localStorage
  const keys = Object.keys(localStorage);
  keys
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .forEach(key => documentIds.add(key.substring(STORAGE_PREFIX.length)));

  return Array.from(documentIds);
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
 * Saves imported data to Cloud and localStorage using the provided security code
 */
export async function saveImportedData(data: CourseData, securityCode: string, isComplete: boolean = false): Promise<void> {
  const json = JSON.stringify({ ...data, version: VERSION });
  const encrypted = await encryptData(json, securityCode);
  
  // Save to Cloud
  const { error } = await supabase
    .from('course_documents')
    .upsert({
      document_id: data.documentId,
      encrypted_data: encrypted as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
      is_complete: isComplete
    } as never, {
      onConflict: 'document_id'
    });

  let localSaved = true;
  try {
    localStorage.setItem(STORAGE_PREFIX + data.documentId, JSON.stringify(encrypted));
  } catch (localErr) {
    localSaved = false;
    console.warn('Local mirror save failed:', localErr);
  }

  if (error) {
    console.error('Cloud save failed:', error);
    if (!localSaved) {
      throw new Error(`Save failed: cloud error (${error.message}) and local storage is full.`);
    }
  }
}

/**
 * Gets the next document ID from a monotonic Cloud counter (atomic, never reused).
 * Falls back to localStorage-based numbering only if Cloud is unreachable.
 */
export async function getNextDocumentId(): Promise<string> {
  // Atomic, monotonic ID from server-side function
  const { data, error } = await supabase.rpc('get_next_document_id' as never);
  const idValue = data as unknown as string | null;

  if (!error && typeof idValue === 'string' && idValue.length > 0) {
    // Mirror to localStorage counter so offline fallback stays in sync
    const COUNTER_KEY = 'heroes:document_counter';
    const num = parseInt(idValue.replace(/-/g, ''), 10);
    if (!isNaN(num)) {
      const localCounter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
      localStorage.setItem(COUNTER_KEY, Math.max(num, localCounter).toString());
    }
    return idValue;
  }

  // Offline fallback: bump local counter only
  console.error('Cloud ID generation failed, falling back to local counter:', error);
  const COUNTER_KEY = 'heroes:document_counter';
  const localCounter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
  const nextNumber = localCounter + 1;
  localStorage.setItem(COUNTER_KEY, nextNumber.toString());
  const padded = nextNumber.toString().padStart(9, '0');
  return `${padded.slice(0, 3)}-${padded.slice(3, 6)}-${padded.slice(6, 9)}`;
}

/**
 * Checks if a document with this ID already exists in the Cloud,
 * and if so returns its updated_at timestamp. Returns null if not present.
 */
export async function getCloudDocumentMeta(documentId: string): Promise<{ updatedAt: string } | null> {
  const { data, error } = await supabase
    .from('course_documents')
    .select('updated_at')
    .eq('document_id', documentId)
    .maybeSingle();

  if (error || !data) return null;
  return { updatedAt: data.updated_at };
}
