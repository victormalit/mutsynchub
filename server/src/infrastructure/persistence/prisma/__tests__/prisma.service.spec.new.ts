import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { Logger } from '@nestjs/common';
import { Prisma, PrismaClient, AnalyticsSchedule } from '@prisma/client';
import { PerformanceMiddleware } from '../middleware/performance.middleware';
import { ErrorHandlingMiddleware } from '../middleware/error-handling.middleware';

type MockAnalyticsScheduleDelegate = {
  [K in keyof Prisma.AnalyticsScheduleDelegate<any>]: jest.Mock;
};

// Create a mock class that extends PrismaClient
class MockPrismaClient extends PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
  $queryRaw = jest.fn();
  $use = jest.fn();
  $transaction = jest.fn();
  analyticsSchedule: MockAnalyticsScheduleDelegate = {
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
  };
}

// Mock the PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => new MockPrismaClient()),
  Prisma: {
    sql: jest.fn(strings => strings[0]),
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      clientVersion: string;
      meta: any;
      constructor(message: string, { code, clientVersion }: { code: string; clientVersion: string }) {
        super(message);
        this.code = code;
        this.clientVersion = clientVersion;
        this.meta = {};
      }
    }
  }
}));
