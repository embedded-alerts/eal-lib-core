import { z } from "zod";
export declare const TrustedActorSchema: z.ZodObject<{
    userId: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    roles: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const ServerRequestContextSchema: z.ZodObject<{
    requestId: z.ZodString;
    traceId: z.ZodString;
    locale: z.ZodOptional<z.ZodString>;
    actor: z.ZodObject<{
        userId: z.ZodString;
        tenantId: z.ZodOptional<z.ZodString>;
        roles: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    sourceIp: z.ZodOptional<z.ZodUnion<readonly [z.ZodIPv4, z.ZodIPv6]>>;
}, z.core.$strict>;
export declare const InternalCommandSchema: z.ZodObject<{
    operationId: z.ZodString;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    context: z.ZodObject<{
        requestId: z.ZodString;
        traceId: z.ZodString;
        locale: z.ZodOptional<z.ZodString>;
        actor: z.ZodObject<{
            userId: z.ZodString;
            tenantId: z.ZodOptional<z.ZodString>;
            roles: z.ZodArray<z.ZodString>;
        }, z.core.$strict>;
        sourceIp: z.ZodOptional<z.ZodUnion<readonly [z.ZodIPv4, z.ZodIPv6]>>;
    }, z.core.$strict>;
    payload: z.ZodUnknown;
}, z.core.$strict>;
export type TrustedActor = z.infer<typeof TrustedActorSchema>;
export type ServerRequestContext = z.infer<typeof ServerRequestContextSchema>;
export type InternalCommand = z.infer<typeof InternalCommandSchema>;
