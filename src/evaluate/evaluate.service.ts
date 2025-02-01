import { Injectable, Logger } from '@nestjs/common';
import { EvaluateRequestDTO } from './dto/evaluate-request-d-t.o';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class EvaluateService {
  private readonly logger = new Logger(EvaluateService.name);

  constructor(private readonly queueService: QueueService) {}

  async evaluateAnswer(evaluateRequestDto: EvaluateRequestDTO) {
    return this.queueService.addEvaluationJob(evaluateRequestDto);
  }

  async checkStatus(jobId: string) {
    return this.queueService.getJobStatus(jobId);
  }
}
