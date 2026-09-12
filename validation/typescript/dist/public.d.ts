import { z } from "zod";
export declare const VALIDATION_CONTRACT_VERSION: "ores.validation.v1";
export declare const RequestMetaSchema: z.ZodObject<{
    requestId: z.ZodString;
    traceId: z.ZodString;
    locale: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const PageQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const ProblemDetailsSchema: z.ZodObject<{
    type: z.ZodString;
    title: z.ZodString;
    status: z.ZodNumber;
    detail: z.ZodOptional<z.ZodString>;
    requestId: z.ZodString;
}, z.core.$strict>;
export declare const publicSchemas: Readonly<{
    "request-meta": z.ZodObject<{
        requestId: z.ZodString;
        traceId: z.ZodString;
        locale: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    "page-query": z.ZodObject<{
        limit: z.ZodDefault<z.ZodNumber>;
        cursor: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    "problem-details": z.ZodObject<{
        type: z.ZodString;
        title: z.ZodString;
        status: z.ZodNumber;
        detail: z.ZodOptional<z.ZodString>;
        requestId: z.ZodString;
    }, z.core.$strict>;
}>;
export type RequestMeta = z.infer<typeof RequestMetaSchema>;
export type PageQuery = z.infer<typeof PageQuerySchema>;
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
export type PublicSchemaId = keyof typeof publicSchemas;
export declare function parsePublic<T extends PublicSchemaId>(schemaId: T, value: unknown): z.output<(typeof publicSchemas)[T]>;
export declare function safeParsePublic<T extends PublicSchemaId>(schemaId: T, value: unknown): z.ZodSafeParseResult<{
    requestId: string;
    traceId: string;
    locale?: string | undefined;
}> | z.ZodSafeParseResult<{
    limit: number;
    cursor?: string | undefined;
}> | z.ZodSafeParseResult<{
    type: string;
    title: string;
    status: number;
    requestId: string;
    detail?: string | undefined;
}>;
