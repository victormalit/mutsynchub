import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { DataGateway } from '../../interfaces/websocket/data.gateway';
import { Dataset } from '@prisma/client';
import { AuditLoggerService } from '../../audit/audit-logger.service';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class AnalyticsService {
  private pythonPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataGateway: DataGateway,
    private readonly auditLogger: AuditLoggerService,
  ) {
    // Path to the Python virtual environment
    this.pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python');
  }

  async processDataStream(orgId: string, streamId: string, data: any) {
    try {
      // Store raw data
      const storedData = await this.prisma.dataStream.update({
        where: { id: streamId },
        data: {
          updatedAt: new Date(),
        },
        include: {
          dataSource: true,
        },
      });

      // Apply transformations if defined
      const transformedData = storedData.transformations 
        ? await this.applyTransformations(data, storedData.transformations as Record<string, any>)
        : data;

      // Broadcast real-time updates
      await this.dataGateway.broadcastToOrg(orgId, 'dataUpdate', {
        streamId,
        data: transformedData,
      });

      return transformedData;
    } catch (error) {
      console.error('Error processing data stream:', error);
      throw error;
    }
  }

  async performAnalysis(params: {
    dataset: Dataset;
    type: string;
    parameters: Record<string, any>;
    metrics: string[];
    userId?: string;
    orgId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { dataset, type, parameters, metrics, userId, orgId, ipAddress, userAgent } = params;

    // Basic validation
    if (!dataset) {
      throw new Error('Dataset is required');
    }

    // Audit log: analysis started
    if (userId) {
      await this.auditLogger.log({
        userId,
        orgId,
        action: 'analytics_run_start',
        resource: 'analytics',
        details: {
          datasetId: dataset.id,
          type,
          parameters,
          metrics,
        },
        ipAddress,
        userAgent,
      });
    }

    return new Promise((resolve, reject) => {
      // Call Python analytics service
      const pythonProcess = spawn(this.pythonPath, [
        '-m', 'src.infrastructure.ml.industry_analytics_service',
        '--data', JSON.stringify(dataset.data),
        '--type', type,
        '--parameters', JSON.stringify(parameters),
        '--metrics', JSON.stringify(metrics)
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          // Audit log: analysis failed
          if (userId) {
            await this.auditLogger.log({
              userId,
              orgId,
              action: 'analytics_run_failure',
              resource: 'analytics',
              details: {
                datasetId: dataset.id,
                type,
                parameters,
                metrics,
                error,
              },
              ipAddress,
              userAgent,
            });
          }
          reject(new Error(`Analytics process failed: ${error}`));
          return;
        }

        try {
          const analysisResult = JSON.parse(result);
          // Audit log: analysis success
          if (userId) {
            await this.auditLogger.log({
              userId,
              orgId,
              action: 'analytics_run_success',
              resource: 'analytics',
              details: {
                datasetId: dataset.id,
                type,
                parameters,
                metrics,
                result: analysisResult,
              },
              ipAddress,
              userAgent,
            });
          }
          resolve(analysisResult);
        } catch (e) {
          // Audit log: parse failure
          if (userId) {
            await this.auditLogger.log({
              userId,
              orgId,
              action: 'analytics_run_failure',
              resource: 'analytics',
              details: {
                datasetId: dataset.id,
                type,
                parameters,
                metrics,
                error: 'Failed to parse analytics result',
              },
              ipAddress,
              userAgent,
            });
          }
          reject(new Error('Failed to parse analytics result'));
        }
      });
    });
  }

  private async applyTransformations(data: any, transformations: Record<string, any>) {
    // Call Python service for transformations
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, [
        '-m', 'src.infrastructure.ml.data_transformation',
        '--data', JSON.stringify(data),
        '--transformations', JSON.stringify(transformations)
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Transformation failed: ${error}`));
          return;
        }

        try {
          const transformedData = JSON.parse(result);
          resolve(transformedData);
        } catch (e) {
          reject(new Error('Failed to parse transformed data'));
        }
      });
    });
  }
}