import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof payload === 'string'
        ? payload
        : Array.isArray((payload as any).message)
          ? (payload as any).message.join(', ')
          : ((payload as any).message ?? 'Unexpected error');

    this.logger.error(message, exception instanceof Error ? exception.stack : undefined);

    response.status(status).json({
      data: null,
      error: {
        statusCode: status,
        message,
      },
    });
  }
}
