// test exception filter

import { ArgumentsHost } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataError, DatabaseError } from 'node-json-db';
import { JsonDBExceptionFilter } from './json-db-exception.filter';

describe('JsonDbExceptionFilter', () => {
  let filter: JsonDBExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: any;
  let mockRequest: any;
  let host: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonDBExceptionFilter],
    }).compile();

    filter = module.get<JsonDBExceptionFilter>(JsonDBExceptionFilter);

    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));
    mockResponse = { status: mockStatus };
    mockRequest = { url: '/no', method: 'GET' };
    host = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    };
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch DataError', async () => {
    filter.catch(new DataError('Cant find dataPath: /no', 3, undefined), host as ArgumentsHost);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Database Error',
    });
  });

  it('DatabaseError 예외 처리', async () => {
    filter.catch(
      new DatabaseError('Cant find dataPath: /no', 3, new Error('inner Error Message')),
      host as ArgumentsHost,
    );

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Database Error',
    });
  });
});
