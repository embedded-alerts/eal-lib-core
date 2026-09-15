-- Read-only capability assertions after desired-state migration application.
DO $$
DECLARE
  installed_schema text;
BEGIN
  SELECT n.nspname INTO installed_schema
  FROM pg_extension AS e
  JOIN pg_namespace AS n ON n.oid = e.extnamespace
  WHERE e.extname = 'vector';

  IF installed_schema IS NULL THEN
    RAISE EXCEPTION 'pgvector extension is not installed';
  END IF;
  IF installed_schema <> 'extensions' THEN
    RAISE EXCEPTION 'pgvector must be installed in extensions schema, found %', installed_schema;
  END IF;
  IF to_regtype('extensions.vector') IS NULL OR to_regtype('extensions.halfvec') IS NULL THEN
    RAISE EXCEPTION 'pgvector vector and halfvec types are required';
  END IF;
  IF to_regclass('embedded_alerts.semantic_embeddings') IS NULL THEN
    RAISE EXCEPTION 'exact semantic embedding table is missing';
  END IF;
  IF to_regclass('embedded_alerts.semantic_embedding_index') IS NULL THEN
    RAISE EXCEPTION 'ANN projection table is missing';
  END IF;
END
$$;
