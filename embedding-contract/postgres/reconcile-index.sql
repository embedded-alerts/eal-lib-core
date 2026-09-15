-- Idempotent model/index reconciliation. Safe to rerun after schema convergence.
INSERT INTO embedded_alerts.semantic_embedding_index (
  embedding_id,
  tenant_id,
  purpose,
  embedding_space,
  indexed_embedding
)
SELECT
  exact.embedding_id,
  exact.tenant_id,
  exact.purpose,
  exact.embedding_provider || ':' || exact.model || ':' || exact.original_dimensions::text || ':' || exact.normalization,
  extensions.subvector(exact.embedding, 1, 4000)::extensions.halfvec(4000)
FROM embedded_alerts.semantic_embeddings AS exact
ON CONFLICT (embedding_id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  purpose = EXCLUDED.purpose,
  embedding_space = EXCLUDED.embedding_space,
  indexed_embedding = EXCLUDED.indexed_embedding;

DELETE FROM embedded_alerts.semantic_embedding_index AS candidate
WHERE NOT EXISTS (
  SELECT 1
  FROM embedded_alerts.semantic_embeddings AS exact
  WHERE exact.embedding_id = candidate.embedding_id
);
