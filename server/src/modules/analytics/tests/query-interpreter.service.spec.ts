import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueryInterpreterService } from '../services/query-interpreter.service';

describe('QueryInterpreterService', () => {
  let service: QueryInterpreterService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryInterpreterService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<QueryInterpreterService>(QueryInterpreterService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('interpretQuery', () => {
    it('should interpret a basic analytics query', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                analysisType: 'forecasting',
                parameters: { horizon: 7 },
                metrics: ['sales', 'revenue'],
              }),
            },
          },
        ],
      };

      // Mock OpenAI API call
      jest.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(mockResponse as any);

      const result = await service.interpretQuery('Forecast sales for next week');
      
      expect(result).toEqual({
        analysisType: 'forecasting',
        parameters: { horizon: 7 },
        metrics: ['sales', 'revenue'],
      });
    });

    it('should handle malformed GPT responses', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON response',
            },
          },
        ],
      };

      jest.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(mockResponse as any);

      await expect(service.interpretQuery('Invalid query')).rejects.toThrow();
    });
  });

  describe('sanitizeQuery', () => {
    it('should remove dangerous characters from query', () => {
      const unsafeQuery = "DROP TABLE users; SELECT * FROM data';\\";
      const result = service['sanitizeQuery'](unsafeQuery);
      expect(result).not.toContain(';');
      expect(result).not.toContain("'");
      expect(result).not.toContain('\\');
    });
  });
});
