import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class QueryInterpreterService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async interpretQuery(query: string): Promise<{
    analysisType: string;
    parameters: Record<string, any>;
    metrics: string[];
  }> {
    const prompt = `
    Interpret the following analytics query and extract:
    1. Type of analysis needed (e.g., forecasting, correlation, pattern detection)
    2. Required parameters
    3. Specific metrics to analyze

    Query: ${query}

    Respond in JSON format.
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an analytics query interpreter." },
        { role: "user", content: prompt }
      ],
    });

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const response = JSON.parse(completion.choices[0].message.content);

    if (!response?.analysisType || !response?.parameters || !response?.metrics) {
      throw new Error('Invalid response format');
    }

    return {
      analysisType: response.analysisType,
      parameters: response.parameters,
      metrics: response.metrics,
    };
  }

  private sanitizeQuery(query: string): string {
    // Remove any potential SQL injection or harmful content
    // Implement based on security requirements
    return query.replace(/[;'"\\]/g, '');
  }
}
