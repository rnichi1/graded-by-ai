import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EvaluateRequestDTO } from '../evaluate/dto/evaluate-request-d-t.o';
import { GptService } from '../llm/services/gpt.service';
import { ClaudeService } from '../llm/services/claude.service';
import { LlmType } from '../enum/llm';

@Processor('evaluation')
export class EvaluationProcessor {
  private readonly logger = new Logger(EvaluationProcessor.name);

  constructor(
    private readonly gptService: GptService,
    private readonly claudeService: ClaudeService,
  ) {}

  @Process('evaluate')
  async handleEvaluation(job: Job<EvaluateRequestDTO>) {
    this.logger.debug(
      `Starting to process job ${job.id} for question: ${job.data.question}`,
    );

    try {
      const { llmType, ...rest } = job.data;
      const service = llmType === LlmType.CLAUDE ? this.claudeService : this.gptService;

      const result = await service.evaluate(rest);
      
      this.logger.debug(
        `Successfully completed job ${job.id} with result status: ${result.status}`,
      );
      
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
