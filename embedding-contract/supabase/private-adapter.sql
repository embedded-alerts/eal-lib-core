-- Supabase private-role adapter. Browser-facing roles must never read raw exact
-- embeddings or ANN projections directly; access is mediated by server APIs.
REVOKE ALL PRIVILEGES ON TABLE embedded_alerts.semantic_embeddings FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE embedded_alerts.semantic_embedding_index FROM anon, authenticated;

GRANT USAGE ON SCHEMA embedded_alerts, extensions TO service_role;
GRANT SELECT ON TABLE embedded_alerts.semantic_embeddings TO service_role;
GRANT SELECT ON TABLE embedded_alerts.semantic_embedding_index TO service_role;

-- The service-role policy is created in desired-state.sql so a test role without
-- PostgreSQL BYPASSRLS still exercises the intended Supabase service boundary.
