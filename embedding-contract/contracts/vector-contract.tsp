namespace EmbeddedAlerts.VectorContract;

/** Storage and ANN dimensions are deliberately distinct pgvector authorities. */
model VectorDimensions {
  storageDimensions: 4100;
  indexedDimensions: 4000;
  maximumSourceDimensions: 4096;
}

model ExactEmbedding {
  originalDimensions: int32;
  @minItems(4100)
  @maxItems(4100)
  embedding: float32[];
}

model IndexedEmbeddingProjection {
  @minItems(4000)
  @maxItems(4000)
  indexedEmbedding: float32[];
}
