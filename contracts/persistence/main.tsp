import "@typespec/json-schema";
using TypeSpec.JsonSchema;

namespace EmbeddedAlerts.Persistence;

@id("AlertRuleRow")
model AlertRuleRow {
  id: string;
  title: string;
  summary: string;
  query: string;
  threshold: float64;
  deliveryChannel: string;
  enabled: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@id("AlertDocumentRow")
model AlertDocumentRow {
  id: string;
  sourceUri: string;
  contentSha256: string;
  contentText: string;
  embedding?: float64[];
  publishedAt?: string;
  ingestedAt: string;
}

@id("PersistenceRegistration")
model PersistenceRegistration {
  schemaVersion: "embedded-alerts.persistence/v1";
  schema: "public";
  alertRulesTable: "alert_rules";
  alertDocumentsTable: "alert_documents";
}
