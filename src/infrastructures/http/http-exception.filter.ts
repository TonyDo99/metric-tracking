import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface CommonErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  path?: string;
  timestamp: string;
  // Optional field for validation or domain-specific errors
  errors?: Record<string, unknown> | string[] | string;
  // Optional metadata container
  meta?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request?.url;

    // HttpExceptions (includes BadRequestException, NotFoundException, etc.)
    if (exception instanceof HttpException) {
      const statusCode =
        exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;

      // Attempt to extract response body from HttpException
      const exceptionResponse = exception.getResponse?.();
      const payload = this.normalizeHttpException(exception, exceptionResponse);

      const commonResponse: CommonErrorResponse = {
        success: false,
        statusCode,
        message: payload.message ?? this.defaultMessageForStatus(statusCode),
        error: payload.error,
        path,
        timestamp,
        errors: payload.errors,
        meta: payload.meta,
      };

      return response.status(statusCode).json(commonResponse);
    }

    // Non-HTTP Exceptions: treat as 500 Internal Server Error
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const commonResponse: CommonErrorResponse = {
      success: false,
      statusCode,
      message: 'Internal server error',
      error: this.extractErrorName(exception),
      path,
      timestamp,
      errors: this.extractErrorDetails(exception),
    };

    return response.status(statusCode).json(commonResponse);
  }

  private normalizeHttpException(
    exception: HttpException,
    exceptionResponse: any,
  ): {
    message?: string;
    error?: string;
    errors?: Record<string, unknown> | string[] | string;
    meta?: Record<string, unknown>;
  } {
    // Handle Validation errors specifically
    if (exception instanceof BadRequestException) {
      const resp =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : exceptionResponse || {};

      // Nest validation pipe often returns: { statusCode, message: string[] | string, error: 'Bad Request' }
      const message =
        Array.isArray(resp?.message) && resp?.message.length
          ? 'Validation failed'
          : resp?.message ?? 'Bad Request';

      return {
        message,
        error: (resp?.error as string) ?? 'Bad Request',
        errors: resp?.message, // keep original validation messages
        meta: resp?.meta,
      };
    }

    // Generic HttpException normalization
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      return {
        message: exceptionResponse.message ?? exception.message,
        error: exceptionResponse.error,
        errors: exceptionResponse.errors,
        meta: exceptionResponse.meta,
      };
    }

    return { message: exception.message };
  }

  private defaultMessageForStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return 'Internal server error';
    }
  }

  private extractErrorName(exception: unknown): string | undefined {
    if (exception && typeof exception === 'object' && 'name' in exception) {
      const name = (exception as any).name;
      return typeof name === 'string' ? name : undefined;
    }
    return undefined;
  }

  private extractErrorDetails(
    exception: unknown,
  ): Record<string, unknown> | string[] | string | undefined {
    // Common Node.js error shape
    if (exception && typeof exception === 'object') {
      const anyEx = exception as any;
      if (anyEx.message && typeof anyEx.message === 'string') {
        return anyEx.stack || anyEx.message;
      }
      return anyEx;
    }
    if (typeof exception === 'string') {
      return exception;
    }
    return undefined;
  }
}
