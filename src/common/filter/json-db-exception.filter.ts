import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { DataError, DatabaseError } from 'node-json-db';

function formatError(error: DataError | DatabaseError) {
  return {
    name: error.name,
    message: error.message,
    id: typeof error.id === 'number' ? error.id : undefined,
    stack: error.stack,
    inner: error.inner
      ? {
          name: error.inner.name,
          message: error.inner.message,
          stack: error.inner.stack ?? undefined,
        }
      : undefined,
    cause: error.cause,
  };
}

@Catch(DataError, DatabaseError)
export class JsonDBExceptionFilter extends BaseExceptionFilter {
  catch(exception: DataError | DatabaseError, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response: Response = context.getResponse();
    const request: Request = context.getRequest();

    /**
     * DataError 객체
     * id: number
     * message: string
     * stack: string
     * name: string
     * cause: Error (원인)
     * inner: Error (원인) - database save/load error에만 있음
     */

    const errorInfo = formatError(exception as any);

    const logInfo = {
      ...errorInfo,
      path: request?.url,
      method: request?.method,
    };
    Logger.error(JSON.stringify(logInfo));

    response.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Database Error',
    });
  }
}
