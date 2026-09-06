import { z } from "zod";
export const VALIDATION_CONTRACT_VERSION = "ores.validation.v1";
const token = z.string().trim().min(1).max(128);
export const RequestMetaSchema = z.object({
    requestId: token,
    traceId: token,
    locale: z.string().trim().min(2).max(64).optional(),
}).strict();
export const PageQuerySchema = z.object({
    limit: z.number().int().min(1).max(100).default(50),
    cursor: z.string().trim().min(1).max(512).optional(),
}).strict();
export const ProblemDetailsSchema = z.object({
    type: z.string().trim().min(1).max(512),
    title: z.string().trim().min(1).max(256),
    status: z.number().int().min(400).max(599),
    detail: z.string().max(4096).optional(),
    requestId: token,
}).strict();
export const publicSchemas = Object.freeze({
    "request-meta": RequestMetaSchema,
    "page-query": PageQuerySchema,
    "problem-details": ProblemDetailsSchema,
});
export function parsePublic(schemaId, value) {
    return publicSchemas[schemaId].parse(value);
}
export function safeParsePublic(schemaId, value) {
    return publicSchemas[schemaId].safeParse(value);
}
