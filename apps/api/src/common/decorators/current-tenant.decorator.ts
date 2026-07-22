import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

export const CurrentTenant = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>();
        const user = (request as any).user as { tenantId?: string } | undefined;
        return user?.tenantId ?? "";
    },
);
