import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { FastifyReply } from "fastify";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = "Internal server error";

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === "string" ? res : (res as any).message ?? message;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        this.logger.error("unhandled_exception", {
            status,
            message,
            error: exception instanceof Error ? exception.stack : String(exception),
        });

        response.status(status).send({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}
