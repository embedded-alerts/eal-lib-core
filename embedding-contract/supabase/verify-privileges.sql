DO $$
BEGIN
  IF has_table_privilege('anon', 'embedded_alerts.semantic_embeddings', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read exact embeddings';
  END IF;
  IF has_table_privilege('authenticated', 'embedded_alerts.semantic_embeddings', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not read exact embeddings';
  END IF;
  IF has_table_privilege('anon', 'embedded_alerts.semantic_embedding_index', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read ANN projections';
  END IF;
  IF has_table_privilege('authenticated', 'embedded_alerts.semantic_embedding_index', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not read ANN projections';
  END IF;
  IF NOT has_table_privilege('service_role', 'embedded_alerts.semantic_embeddings', 'SELECT') THEN
    RAISE EXCEPTION 'service_role must read exact embeddings';
  END IF;
  IF NOT has_table_privilege('service_role', 'embedded_alerts.semantic_embedding_index', 'SELECT') THEN
    RAISE EXCEPTION 'service_role must read ANN projections';
  END IF;
END
$$;
