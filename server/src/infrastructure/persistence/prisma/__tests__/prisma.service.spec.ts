import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { Logger } from '@nestjs/common';
import { Prisma, PrismaClient, AnalyticsSchedule } from '@prisma/client';
import { PerformanceMiddleware } from '../middleware/performance.middleware';
import { ErrorHandlingMiddleware } from '../middleware/error-handling.middleware';

// Mock implementation for PrismaClient
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
  $use: jest.fn(),
  $transaction: jest.fn(),
  analyticsSchedule: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

// Mock PrismaClient and Prisma namespace
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
  Prisma: {
    sql: jest.fn().mockImplementation((strings) => strings.join('')),
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      clientVersion: string;
      meta: any;

      constructor(
        message: string,
        { code, clientVersion }: { code: string; clientVersion: string }
      ) {
        super(message);
        this.code = code;
        this.clientVersion = clientVersion;
        this.meta = {};
      }
    },
  },
}));

describe('PrismaService', () => {
  let prismaService: PrismaService;
  let logger: jest.Mocked<Logger>;
  let performanceMiddleware: PerformanceMiddleware;
  let errorHandlingMiddleware: ErrorHandlingMiddleware;

  // Sample mock data
  const mockSchedule: AnalyticsSchedule = {
    id: 'test-id',
    orgId: 'org-1',
    frequency: 'daily',
    interval: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Mock logger with proper typing
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    // Create testing module
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: Logger, useValue: logger },
      ],
    }).compile();

    prismaService = moduleRef.get<PrismaService>(PrismaService);
    
    // Initialize middleware
    performanceMiddleware = new PerformanceMiddleware(logger);
    errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);

    // Reset mocks before each test
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  describe('Lifecycle Methods', () => {
    it('should connect to database on module init', async () => {
      await prismaService.onModuleInit();
      expect(prismaService.$connect).toHaveBeenCalled();
    });

    it('should disconnect from database on module destroy', async () => {
      await prismaService.onModuleDestroy();
      expect(prismaService.$disconnect).toHaveBeenCalled();
    });

    it('should prevent database clearing in production', async () => {
      process.env.NODE_ENV = 'production';
      await expect(prismaService.clearDatabase()).rejects.toThrow(
        'Cannot clear database in production'
      );
    });

    it('should clear database in test environment', async () => {
      process.env.NODE_ENV = 'test';
      const mockResult = { count: 5 };
      
      (prismaService.analyticsSchedule.deleteMany as jest.Mock).mockResolvedValue(mockResult);
      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(prismaService)
      );

      await prismaService.clearDatabase();

      expect(logger.warn).toHaveBeenCalledWith(
        'Cleaning database in test environment'
      );
      expect(prismaService.analyticsSchedule.deleteMany).toHaveBeenCalled();
    });
  });

  describe('Query Monitoring', () => {
    it('should enable/disable query logging', async () => {
      await prismaService.enableQueryLogging();
      expect(logger.log).toHaveBeenCalledWith(
        'Query performance monitoring enabled'
      );

      await prismaService.disableQueryLogging();
      expect(logger.log).toHaveBeenCalledWith(
        'Query performance monitoring disabled'
      );
    });

    it('should detect slow queries', async () => {
      const mockParams = { model: 'User', action: 'findMany' };
      const mockNext = jest.fn().mockResolvedValue({});
      
      // Mock Date.now for timing
      const startTime = 1000;
      const endTime = 2500;
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      await performanceMiddleware.handle(mockParams, mockNext);

      expect(logger.warn).toHaveBeenCalledWith('Slow query detected', {
        model: 'User',
        action: 'findMany',
        duration: 1500,
        threshold: 1000
      });
    });

    it('should ignore fast queries', async () => {
      const mockParams = { model: 'User', action: 'findMany' };
      const mockNext = jest.fn().mockResolvedValue({});
      
      // Mock fast execution (50ms)
      const startTime = 1000;
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 50);

      await performanceMiddleware.handle(mockParams, mockNext);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should log database errors', async () => {
      const mockError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '3.0.0' }
      );
      
      const mockParams = { model: 'User', action: 'findUnique' };
      const mockNext = jest.fn().mockRejectedValue(mockError);

      await expect(
        errorHandlingMiddleware.handle(mockParams, mockNext)
      ).rejects.toThrow(mockError);

      expect(logger.error).toHaveBeenCalledWith('Database operation failed', {
        model: 'User',
        action: 'findUnique',
        error: 'Record not found'
      });
    });
  });

  describe('AnalyticsSchedule Operations', () => {
    it('should create analytics schedule', async () => {
      (prismaService.analyticsSchedule.create as jest.Mock).mockResolvedValue(mockSchedule);
      
      const result = await prismaService.createAnalyticsSchedule(mockSchedule);
      expect(result).toEqual(mockSchedule);
      expect(prismaService.analyticsSchedule.create).toHaveBeenCalledWith({
        data: mockSchedule
      });
    });

    it('should get schedules by org ID', async () => {
      (prismaService.analyticsSchedule.findMany as jest.Mock).mockResolvedValue([mockSchedule]);
      
      const result = await prismaService.getAnalyticsSchedules('org-1');
      expect(result).toEqual([mockSchedule]);
      expect(prismaService.analyticsSchedule.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-1' }
      });
    });

    it('should update schedule', async () => {
      const updateData = { frequency: 'weekly' };
      const updatedSchedule = { ...mockSchedule, ...updateData };
      
      (prismaService.analyticsSchedule.update as jest.Mock).mockResolvedValue(updatedSchedule);
      
      const result = await prismaService.updateAnalyticsSchedule('test-id', updateData);
      expect(result).toEqual(updatedSchedule);
      expect(prismaService.analyticsSchedule.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updateData
      });
    });

    it('should delete schedule', async () => {
      (prismaService.analyticsSchedule.delete as jest.Mock).mockResolvedValue(mockSchedule);
      
      const result = await prismaService.deleteAnalyticsSchedule('test-id');
      expect(result).toEqual(mockSchedule);
      expect(prismaService.analyticsSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      });
    });
  });

  describe('Database Health', () => {
    it('should report healthy database', async () => {
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
      
      const isActive = await prismaService.isDatabaseActive();
      expect(isActive).toBe(true);
      expect(logger.log).toHaveBeenCalledWith('Database health check: OK');
    });

    it('should report unhealthy database', async () => {
      const dbError = new Error('Connection failed');
      (prismaService.$queryRaw as jest.Mock).mockRejectedValue(dbError);
      
      const isActive = await prismaService.isDatabaseActive();
      expect(isActive).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Database health check failed',
        dbError
      );
    });
  });

  describe('Transactions', () => {
    it('should execute transactions', async () => {
      const mockResult = { success: true };
      const mockTransactionFn = jest.fn().mockResolvedValue(mockResult);
      
      (prismaService.$transaction as jest.Mock).mockImplementation(
        (fn) => fn(prismaService)
      );
      
      const result = await prismaService.createTransaction(mockTransactionFn);
      expect(result).toEqual(mockResult);
      expect(mockTransactionFn).toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      const mockError = new Error('Transaction failed');
      const mockTransactionFn = jest.fn().mockRejectedValue(mockError);
      
      (prismaService.$transaction as jest.Mock).mockImplementation(
        (fn) => fn(prismaService)
      );
      
      await expect(
        prismaService.createTransaction(mockTransactionFn)
      ).rejects.toThrow('Transaction failed');
    });
  });
});