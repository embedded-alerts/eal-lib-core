-- Parameters:
--   $1 tenant uuid
--   $2 embedding-space identity
--   $3 purpose
--   $4 exact query extensions.vector(4100)
--   $5 candidate limit
--   $6 final limit
-- Candidate generation uses the dense halfvec(4000) projection; exact ordering
-- always joins back to semantic_embeddings and ranks with vector(4100).
WITH ann_candidates AS (
  SELECT candidate.embedding_id
  FROM embedded_alerts.semantic_embedding_index AS candidate
  WHERE candidate.tenant_id = $1::uuid
    AND candidate.embedding_space = $2::text
    AND candidate.purpose = $3::text
  ORDER BY candidate.indexed_embedding OPERATOR(extensions.<=>)
    extensions.subvector($4::extensions.vector(4100), 1, 4000)::extensions.halfvec(4000)
  LIMIT $5
)
SELECT exact.*
FROM ann_candidates AS candidate
JOIN embedded_alerts.semantic_embeddings AS exact
  USING (embedding_id)
ORDER BY exact.embedding OPERATOR(extensions.<=>) $4::extensions.vector(4100)
LIMIT $6;
