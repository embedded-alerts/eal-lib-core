//! ORM projection boundary for the PostgreSQL-family vector contract.
//!
//! This file is contract evidence consumed by TJSV/conformance tooling. Runtime
//! ORM crates bind the same table/column identities without duplicating dimensions.

/// Diesel exact storage uses pgvector::Vector; the ANN projection uses
/// pgvector::HalfVector because HNSW halfvec supports the 4000-value projection.
pub struct DieselSemanticEmbedding {
    pub embedding: pgvector::Vector,
}

pub struct DieselSemanticEmbeddingIndex {
    pub indexed_embedding: pgvector::HalfVector,
}

/// SeaORM retains PgVector for exact storage. The separately named
/// semantic_embedding_index table is the ANN candidate source and maps its
/// half-precision representation through the provider-specific adapter.
pub struct SeaOrmSemanticEmbedding {
    pub embedding: sea_orm::prelude::PgVector,
}

pub const EXACT_TABLE: &str = "semantic_embeddings";
pub const ANN_TABLE: &str = "semantic_embedding_index";
pub const EXACT_DIMENSIONS: usize = 4100;
pub const INDEXED_DIMENSIONS: usize = 4000;
