import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsScheduleService } from '../analytics-schedule.service';
import { QueryInterpreterService } from '../services/query-interpreter.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from '../dto/analytics-schedule.dto';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let scheduleService: AnalyticsScheduleService;
  let analyticsService: AnalyticsService;
  let queryInterpreter: QueryInterpreterService;
  let prisma: PrismaService;

  const mockScheduleService = {
    createSchedule: jest.fn(),
    getSchedules: jest.fn(),
    updateSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
  };

  const mockAnalyticsService = {
    performAnalysis: jest.fn(),
  };

  const mockQueryInterpreter = {
    interpretQuery: jest.fn(),
  };

  const mockPrisma = {
    dataset: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    analyticsReport: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsScheduleService,
          useValue: mockScheduleService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: QueryInterpreterService,
          useValue: mockQueryInterpreter,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    scheduleService = module.get<AnalyticsScheduleService>(AnalyticsScheduleService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    queryInterpreter = module.get<QueryInterpreterService>(QueryInterpreterService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSchedule', () => {
    it('should create a new analytics schedule', async () => {
      const createScheduleDto: CreateScheduleDto = {
        orgId: 'test-org-id',
        frequency: 'daily',
        interval: null,
      };

      const expectedSchedule = {
        id: 'test-schedule-id',
        ...createScheduleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockScheduleService.createSchedule.mockResolvedValue(expectedSchedule);

      const result = await controller.createSchedule(createScheduleDto);

      expect(result).toEqual(expectedSchedule);
      expect(mockScheduleService.createSchedule).toHaveBeenCalledWith(
        createScheduleDto.orgId,
        {
          frequency: createScheduleDto.frequency,
          interval: createScheduleDto.interval,
        },
      );
    });
  });

  describe('getSchedules', () => {
    it('should return all schedules for an organization', async () => {
      const orgId = 'test-org-id';
      const expectedSchedules = [
        {
          id: 'schedule-1',
          orgId,
          frequency: 'daily',
        },
        {
          id: 'schedule-2',
          orgId,
          frequency: 'weekly',
        },
      ];

      mockScheduleService.getSchedules.mockResolvedValue(expectedSchedules);

      const result = await controller.getSchedules(orgId);

      expect(result).toEqual(expectedSchedules);
      expect(mockScheduleService.getSchedules).toHaveBeenCalledWith(orgId);
    });
  });

  describe('updateSchedule', () => {
    it('should update an existing schedule', async () => {
      const scheduleId = 'test-schedule-id';
      const updateScheduleDto: UpdateScheduleDto = {
        frequency: 'weekly',
        interval: null,
      };

      const expectedSchedule = {
        id: scheduleId,
        ...updateScheduleDto,
        updatedAt: new Date(),
      };

      mockScheduleService.updateSchedule.mockResolvedValue(expectedSchedule);

      const result = await controller.updateSchedule(scheduleId, updateScheduleDto);

      expect(result).toEqual(expectedSchedule);
      expect(mockScheduleService.updateSchedule).toHaveBeenCalledWith(
        scheduleId,
        updateScheduleDto,
      );
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule', async () => {
      const scheduleId = 'test-schedule-id';
      const deletedSchedule = {
        id: scheduleId,
        frequency: 'daily',
      };

      mockScheduleService.deleteSchedule.mockResolvedValue(deletedSchedule);

      const result = await controller.deleteSchedule(scheduleId);

      expect(result).toEqual(deletedSchedule);
      expect(mockScheduleService.deleteSchedule).toHaveBeenCalledWith(scheduleId);
    });
  });

  describe('processQuery', () => {
    it('should process a natural language query and return results', async () => {
      const queryDto: AnalyticsQueryDto = {
        query: 'Show me sales trends',
        orgId: 'test-org-id',
        datasetId: 'test-dataset-id',
      };

      const interpretation = {
        analysisType: 'trend_analysis',
        parameters: { timeframe: 'monthly' },
        metrics: ['sales'],
      };

      const dataset = {
        id: queryDto.datasetId,
        name: 'Test Dataset',
      };

      const analysisResult = {
        trends: [{ period: '2025-06', value: 1000 }],
      };

      mockQueryInterpreter.interpretQuery.mockResolvedValue(interpretation);
      mockPrisma.dataset.findUnique.mockResolvedValue(dataset);
      mockAnalyticsService.performAnalysis.mockResolvedValue(analysisResult);
      mockPrisma.analyticsReport.create.mockResolvedValue({
        id: 'test-report-id',
        name: 'Query Analysis - trend_analysis',
        results: analysisResult,
      });

      const result = await controller.processQuery(queryDto);

      expect(result).toEqual({
        interpretation,
        results: [{
          datasetName: 'Test Dataset',
          result: analysisResult,
        }],
      });

      expect(mockQueryInterpreter.interpretQuery).toHaveBeenCalledWith(queryDto.query);
      expect(mockPrisma.dataset.findUnique).toHaveBeenCalledWith({
        where: { id: queryDto.datasetId },
      });
      expect(mockAnalyticsService.performAnalysis).toHaveBeenCalled();
      expect(mockPrisma.analyticsReport.create).toHaveBeenCalled();
    });
  });

  describe('getQueryHistory', () => {
    it('should return query history for an organization', async () => {
      const orgId = 'test-org-id';
      const expectedHistory = [
        {
          id: 'report-1',
          name: 'Query Analysis - trend_analysis',
          type: 'query',
          results: { trends: [] },
        },
      ];

      mockPrisma.analyticsReport.findMany.mockResolvedValue(expectedHistory);

      const result = await controller.getQueryHistory(orgId);

      expect(result).toEqual(expectedHistory);
      expect(mockPrisma.analyticsReport.findMany).toHaveBeenCalledWith({
        where: { 
          orgId,
          type: 'query',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
});
