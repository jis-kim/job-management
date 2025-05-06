import { type ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  private maskSensitiveFields(data: any) {
    const sensitiveFields = ['password', 'token', 'authorization'];
    if (typeof data !== 'object') return data;
    return Object.entries(data).reduce((acc: Record<string, any>, [key, value]) => {
      acc[key] = sensitiveFields.includes(key.toLowerCase()) ? '***' : value;
      return acc;
    }, {});
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let clientMessage = 'Internal server error';
    if (exception instanceof HttpException && status !== HttpStatus.INTERNAL_SERVER_ERROR) {
      clientMessage = (exception.getResponse() as HttpException).message;
      if (typeof clientMessage === 'object') {
        // 에러 메시지가 객체인 경우 - validation pipe에서 발생하는 에러
        clientMessage = Object.values(clientMessage)[0] as string;
      }
    }

    // exception의 세부 정보를 로깅
    const errorJson = {
      message: exception instanceof Error ? exception.message : 'Internal server error', // exception이 Error인 경우만 접근
      name: exception instanceof Error ? exception.name : 'UnknownError',
    };

    const headers = this.maskSensitiveFields(request.headers);
    const query = request.query;
    const params = request.params;
    const body = this.maskSensitiveFields(request.body);

    const userAgent = request.get('user-agent');

    const requestInfo = {
      error: errorJson,
      status,
      headers,
      query,
      params,
      body,
      userAgent,
    };

    const errorContext = {
      method: request.method,
      path: request.url,
      status: status,
      contents: requestInfo,
    };

    if (status >= 500) {
      Logger.error(JSON.stringify(errorContext), exception instanceof Error ? exception.stack : '');
    } else if (status) {
      Logger.warn(JSON.stringify(errorContext));
    }

    const errorCode =
      exception instanceof HttpException ? HttpStatus[status] || 'UNKNOWN_ERROR' : 'INTERNAL_SERVER_ERROR';

    const responseBody = {
      error: errorCode,
      message: clientMessage,
    };

    response.status(status).json(responseBody);
  }
}
