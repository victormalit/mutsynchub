import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorHandlingMiddleware } from '../error-handling.middleware';

describe('ErrorHandlingMiddleware', () => {
  let middleware: ErrorHandlingMiddleware;
  let mockLogger: jest.Mocked<Logger>;

  const mockParams: Prisma.MiddlewareParams = {
    model: 'User',
    action: 'findUnique',
    args: { where: { id: 1 } },
    dataPath: [],
    runInTransaction: false
  };

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        ErrorHandlingMiddleware,
        { provide: Logger, useValue: mockLogger }
      ],
    }).compile();

    const mockAuditLogger = { log: jest.fn() } as any;
    middleware = new ErrorHandlingMiddleware(mockLogger, mockAuditLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should pass through successful operations', async () => {
    const mockNext = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
    const result = await middleware.handle(mockParams, mockNext);
    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should handle PrismaClientKnownRequestError', async () => {
    const mockError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '2.0.0',
      meta: { target: ['id'] }
    });
    const mockNext = jest.fn().mockRejectedValue(mockError);

    await expect(middleware.handle(mockParams, mockNext)).rejects.toThrow(mockError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Database operation failed - Known error',
      expect.objectContaining({
        model: 'User',
        action: 'findUnique',
        args: mockParams.args,
        code: 'P2025',
        error: 'Record not found',
        target: ['id'],
        timestamp: expect.any(String)
      })
    );

    expect(mockError.meta).toMatchObject({
      model: 'User',
      action: 'findUnique',
      args: mockParams.args,
      target: ['id'],
      timestamp: expect.any(String)
    });
  });

  it('should handle PrismaClientValidationError', async () => {
    const mockError = new Prisma.PrismaClientValidationError('Invalid input', { clientVersion: '2.0.0' });
    const mockNext = jest.fn().mockRejectedValue(mockError);

    await expect(middleware.handle(mockParams, mockNext)).rejects.toThrow(mockError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Database operation failed - Validation error',
      expect.objectContaining({
        model: 'User',
        action: 'findUnique',
        args: mockParams.args,
        error: 'Invalid input',
        timestamp: expect.any(String)
      })
    );
  });

  it('should handle PrismaClientUnknownRequestError', async () => {
    const mockError = new Prisma.PrismaClientUnknownRequestError('Unknown error', { clientVersion: '2.0.0' });
    const mockNext = jest.fn().mockRejectedValue(mockError);

    await expect(middleware.handle(mockParams, mockNext)).rejects.toThrow(mockError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Database operation failed - Unknown error',
      expect.objectContaining({
        model: 'User',
        action: 'findUnique',
        args: mockParams.args,
        error: 'Unknown error',
        timestamp: expect.any(String)
      })
    );
  });

  it('should handle unexpected errors', async () => {
    const mockError = new Error('Unexpected error');
    const mockNext = jest.fn().mockRejectedValue(mockError);

    await expect(middleware.handle(mockParams, mockNext)).rejects.toThrow(mockError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Database operation failed - Unexpected error',
      expect.objectContaining({
        model: 'User',
        action: 'findUnique',
        args: mockParams.args,
        error: 'Unexpected error',
        stack: expect.any(String),
        timestamp: expect.any(String)
      })
    );
  });
});
