-- Lock down legacy cloud-save artifacts: the app is local-only and no code calls these anymore.

-- 1) Remove all unrestricted public policies on course_documents (default deny; data preserved)
DROP POLICY IF EXISTS "Anyone can create documents" ON public.course_documents;
DROP POLICY IF EXISTS "Anyone can read documents by document_id" ON public.course_documents;
DROP POLICY IF EXISTS "Anyone can update documents" ON public.course_documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON public.course_documents;

-- 2) Revoke EXECUTE on the SECURITY DEFINER counter function from API-facing roles
REVOKE EXECUTE ON FUNCTION public.get_next_document_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_next_document_id() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_next_document_id() FROM PUBLIC;