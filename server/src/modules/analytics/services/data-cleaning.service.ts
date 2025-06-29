import { Injectable, Logger } from '@nestjs/common';
import { IndustryType } from '../interfaces/analysis-request.dto';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class DataCleaningService {
  private readonly logger = new Logger(DataCleaningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async cleanData(data: any[], industryType: IndustryType): Promise<any[]> {
    try {
      // Get industry-specific schema and rules
      const schema = await this.getIndustrySchema(industryType);
      
      // Apply common cleaning operations
      let cleanedData = await this.applyCommonCleaning(data);
      
      // Apply industry-specific cleaning
      cleanedData = await this.applyIndustrySpecificCleaning(cleanedData, schema);
      
      return cleanedData;
    } catch (error) {
      this.logger.error(`Error cleaning data: ${(error as any).message}`);
      throw error;
    }
  }

  private async getIndustrySchema(industryType: IndustryType): Promise<any> {
    // Fetch industry-specific schema from database or config
    const schema = await this.prisma.industrySchema.findUnique({
      where: { type: industryType },
    });

    if (!schema) {
      throw new Error(`No schema found for industry type: ${industryType}`);
    }

    return schema;
  }

  private async applyCommonCleaning(data: any[]): Promise<any[]> {
    return data.map(row => ({
      ...row,
      // Remove whitespace from string values
      ...Object.fromEntries(
        Object.entries(row)
          .map(([key, value]) => [
            key,
            typeof value === 'string' ? value.trim() : value
          ])
      )
    })).filter(row => 
      // Remove rows with all null values
      Object.values(row).some(value => value != null)
    );
  }

  private async applyIndustrySpecificCleaning(
    data: any[],
    schema: any
  ): Promise<any[]> {
    return data.map(row => {
      const cleanedRow = { ...row };
      
      // Apply schema-specific transformations
      Object.entries(schema.transformations || {}).forEach(([field, rules]) => {
        if (cleanedRow[field]) {
          cleanedRow[field] = this.applyFieldTransformations(
            cleanedRow[field],
            rules
          );
        }
      });

      return cleanedRow;
    });
  }

  private applyFieldTransformations(value: any, rules: any): any {
    // Apply field-specific transformations based on rules
    if (!rules) return value;

    let transformed = value;

    if (rules.type === 'number') {
      transformed = Number(value);
    } else if (rules.type === 'date') {
      transformed = new Date(value);
    }

    // Apply additional transformations based on rules
    if (rules.normalize) {
      transformed = this.normalizeValue(transformed, rules.normalize);
    }

    return transformed;
  }

  private normalizeValue(value: any, rules: any): any {
    // Implement normalization logic based on rules
    // This could include scaling, standardization, etc.
    return value;
  }
}
