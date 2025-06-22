
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorType = 'InternalServerError';
    let error = exception;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
      errorType = exception.name || 'HttpException';
    } else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          errorType = 'UniqueConstraintViolation';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          errorType = 'RecordNotFound';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database error';
          errorType = 'DatabaseError';
      }
    }

    // Log the error (never log sensitive data)
    this.logger.error(
      `Exception: status=${status}, message=${message}, errorType=${errorType}, path=${request?.url}`,
      (exception as any)?.stack,
    );

    // Optionally, attach a requestId for tracing
    const requestId = request?.headers['x-request-id'] || undefined;

    response.status(status).json({
      statusCode: status,
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
      path: request?.url,
      requestId,
    });
  }
}
