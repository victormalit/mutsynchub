import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PerformanceMiddleware } from '../performance.middleware';

describe('PerformanceMiddleware', () => {
  let middleware: PerformanceMiddleware;
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
        PerformanceMiddleware,
        { provide: Logger, useValue: mockLogger }
      ],
    }).compile();

    middleware = new PerformanceMiddleware(mockLogger);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should track fast query performance metrics', async () => {
    const mockNext = jest.fn().mockImplementation(() => {
      jest.advanceTimersByTime(500); // Simulate 500ms operation
      return Promise.resolve({ id: 1, name: 'Test' });
    });

    const result = await middleware.handle(mockParams, mockNext);

    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockLogger.warn).not.toHaveBeenCalled();
    
    const stats = middleware.getQueryStats();
    expect(stats['User.findUnique']).toEqual({
      count: 1,
      averageDuration: 500,
      slowQueries: 0
    });
  });

  it('should detect and log slow queries', async () => {
    const mockNext = jest.fn().mockImplementation(() => {
      jest.advanceTimersByTime(1500); // Simulate 1.5s operation
      return Promise.resolve({ id: 1, name: 'Test' });
    });

    const result = await middleware.handle(mockParams, mockNext);

    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Slow query detected',
      expect.objectContaining({
        model: 'User',
        action: 'findUnique',
        duration: 1500,
        threshold: 1000,
        args: mockParams.args
      })
    );

    const stats = middleware.getQueryStats();
    expect(stats['User.findUnique']).toEqual({
      count: 1,
      averageDuration: 1500,
      slowQueries: 1
    });
  });

  it('should handle and track failed queries', async () => {
    const mockError = new Error('Database error');
    const mockNext = jest.fn().mockImplementation(() => {
      jest.advanceTimersByTime(800);
      return Promise.reject(mockError);
    });

    await expect(middleware.handle(mockParams, mockNext)).rejects.toThrow(mockError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Query failed',
      expect.objectContaining({
        model: 'User',
        action: 'findUnique',
        duration: 800,
        args: mockParams.args,
        error: 'Database error'
      })
    );

    const stats = middleware.getQueryStats();
    expect(stats['User.findUnique']).toEqual({
      count: 1,
      averageDuration: 800,
      slowQueries: 0
    });
  });

  it('should respect custom slow query threshold', async () => {
    middleware = new PerformanceMiddleware(mockLogger, { slowQueryThreshold: 2000 });

    const mockNext = jest.fn().mockImplementation(() => {
      jest.advanceTimersByTime(1500);
      return Promise.resolve({ id: 1 });
    });

    await middleware.handle(mockParams, mockNext);

    expect(mockLogger.warn).not.toHaveBeenCalled();

    const stats = middleware.getQueryStats();
    expect(stats['User.findUnique'].slowQueries).toBe(0);
  });

  it('should aggregate metrics for multiple queries', async () => {
    const durations = [500, 1200, 800, 1500];
    
    for (const duration of durations) {
      await middleware.handle(mockParams, async () => {
        jest.advanceTimersByTime(duration);
        return { id: 1 };
      });
    }

    const stats = middleware.getQueryStats();
    expect(stats['User.findUnique']).toEqual({
      count: 4,
      averageDuration: 1000, // (500 + 1200 + 800 + 1500) / 4
      slowQueries: 2 // 1200ms and 1500ms exceed the 1000ms threshold
    });
  });

  it('should reset statistics', async () => {
    await middleware.handle(mockParams, async () => {
      jest.advanceTimersByTime(500);
      return { id: 1 };
    });

    expect(middleware.getQueryStats()['User.findUnique']).toBeDefined();

    middleware.resetStats();

    expect(middleware.getQueryStats()['User.findUnique']).toBeUndefined();
  });

  it('should disable metrics collection when configured', async () => {
    middleware = new PerformanceMiddleware(mockLogger, { enableMetrics: false });

    await middleware.handle(mockParams, async () => {
      jest.advanceTimersByTime(500);
      return { id: 1 };
    });

    expect(middleware.getQueryStats()).toEqual({});
  });
});
