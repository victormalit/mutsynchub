import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsScheduleService } from '../analytics-schedule.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AnalyticsService } from '../analytics.service';

describe('AnalyticsScheduleService', () => {
  let service: AnalyticsScheduleService;
  let prismaService: PrismaService;
  let schedulerRegistry: SchedulerRegistry;
  let analyticsService: AnalyticsService;

  const mockPrismaService = {
    analyticsSchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: {
      start: jest.fn(),
    },
  };

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
  };

  const mockAnalyticsService = {
    performAnalysis: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsScheduleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsScheduleService>(AnalyticsScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSchedule', () => {
    const mockScheduleData = {
      orgId: 'test-org-id',
      frequency: 'daily',
      interval: null,
    };

    it('should create a schedule and set up a cron job', async () => {
      const mockCreatedSchedule = {
        id: 'test-schedule-id',
        ...mockScheduleData,
      };

      mockPrismaService.analyticsSchedule.create.mockResolvedValue(mockCreatedSchedule);

      const result = await service.createSchedule(mockScheduleData.orgId, {
        frequency: mockScheduleData.frequency,
        interval: mockScheduleData.interval,
      });

      expect(result).toEqual(mockCreatedSchedule);
      expect(mockPrismaService.analyticsSchedule.create).toHaveBeenCalledWith({
        data: mockScheduleData,
      });
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        `analytics_${mockCreatedSchedule.id}`,
        expect.any(Object),
      );
    });
  });

  describe('getSchedules', () => {
    const mockOrgId = 'test-org-id';

    it('should return schedules for an organization', async () => {
      const mockSchedules = [
        { id: '1', orgId: mockOrgId, frequency: 'daily' },
        { id: '2', orgId: mockOrgId, frequency: 'weekly' },
      ];

      mockPrismaService.analyticsSchedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.getSchedules(mockOrgId);

      expect(result).toEqual(mockSchedules);
      expect(mockPrismaService.analyticsSchedule.findMany).toHaveBeenCalledWith({
        where: { orgId: mockOrgId },
      });
    });
  });

  describe('updateSchedule', () => {
    const mockScheduleId = 'test-schedule-id';
    const mockUpdateData = {
      frequency: 'weekly',
    };

    it('should update a schedule and recreate the cron job', async () => {
      const mockUpdatedSchedule = {
        id: mockScheduleId,
        ...mockUpdateData,
      };

      mockPrismaService.analyticsSchedule.update.mockResolvedValue(mockUpdatedSchedule);

      const result = await service.updateSchedule(mockScheduleId, mockUpdateData);

      expect(result).toEqual(mockUpdatedSchedule);
      expect(mockPrismaService.analyticsSchedule.update).toHaveBeenCalledWith({
        where: { id: mockScheduleId },
        data: mockUpdateData,
      });
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        `analytics_${mockScheduleId}`,
      );
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        `analytics_${mockScheduleId}`,
        expect.any(Object),
      );
    });
  });

  describe('deleteSchedule', () => {
    const mockScheduleId = 'test-schedule-id';

    it('should delete a schedule and its cron job', async () => {
      const mockDeletedSchedule = {
        id: mockScheduleId,
        frequency: 'daily',
      };

      mockPrismaService.analyticsSchedule.delete.mockResolvedValue(mockDeletedSchedule);

      const result = await service.deleteSchedule(mockScheduleId);

      expect(result).toEqual(mockDeletedSchedule);
      expect(mockPrismaService.analyticsSchedule.delete).toHaveBeenCalledWith({
        where: { id: mockScheduleId },
      });
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        `analytics_${mockScheduleId}`,
      );
    });
  });

  describe('getCronExpression', () => {
    it('should return correct cron expressions for different frequencies', () => {
      const frequencies = {
        hourly: '0 * * * *',
        daily: '0 0 * * *',
        weekly: '0 0 * * 0',
        monthly: '0 0 1 * *',
        custom: '*\/30 * * * *', // 30 minutes interval
      };

      Object.entries(frequencies).forEach(([frequency, expected]) => {
        const result = service['getCronExpression'](
          frequency,
          frequency === 'custom' ? 30 : undefined
        );
        expect(result).toBe(expected);
      });
    });

    it('should throw error for custom frequency without interval', () => {
      expect(() => service['getCronExpression']('custom')).toThrow(
        'Interval required for custom frequency'
      );
    });

    it('should throw error for unsupported frequency', () => {
      expect(() => service['getCronExpression']('invalid')).toThrow(
        'Unsupported frequency: invalid'
      );
    });
  });
});
