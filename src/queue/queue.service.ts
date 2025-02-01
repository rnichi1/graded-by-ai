import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { EvaluateRequestDTO } from '../evaluate/dto/evaluate-request-d-t.o';
import { EvaluateResponseDTO } from '../evaluate/dto/evaluate-response-d-t.o';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('evaluation') private readonly evaluationQueue: Queue,
  ) {}

  async addEvaluationJob(
    evaluateRequestDto: EvaluateRequestDTO,
  ): Promise<{ jobId: string }> {
    const job = await this.evaluationQueue.add('evaluate', evaluateRequestDto, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    });

    this.logger.debug(`Created job with ID: ${job.id}`);
    return { jobId: job.id.toString() };
  }

  async getJobStatus(jobId: string): Promise<{
    status: string;
    result?: EvaluateResponseDTO;
  }> {
    this.logger.debug(`Checking status for job: ${jobId}`);
    
    const job = await this.evaluationQueue.getJob(jobId);
    
    if (!job) {
      this.logger.warn(`Job not found: ${jobId}`);
      return { status: 'not_found' };
    }

    const state = await job.getState();
    const result = job.returnvalue;

    this.logger.debug(`Job ${jobId} state: ${state}, has result: ${!!result}`);

    return {
      status: state,
      result: result || undefined,
    };
  }

  async cleanupOldJobs() {
    const jobs = await this.evaluationQueue.getCompleted();
    for (const job of jobs) {
      if (Date.now() - job.timestamp > 3600000) {
        await job.remove();
      }
    }
  }
}
