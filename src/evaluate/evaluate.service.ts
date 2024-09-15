import { Injectable, Logger } from '@nestjs/common';
import { EvaluateRequestDTO } from './dto/evaluate-request-d-t.o';
import { EvaluateResponseDTO } from './dto/evaluate-response-d-t.o';
import { GptService } from '../llm/services/gpt.service';
import { ClaudeService } from '../llm/services/claude.service';
import { LlmServiceInterface } from '../llm/interfaces/llm.service.interface';
import { LlmType } from '../enum/llm';

@Injectable()
export class EvaluateService {
  private readonly logger = new Logger(EvaluateService.name);

  constructor(
    private readonly gptService: GptService,
    private readonly claudeService: ClaudeService,
  ) {}

  async evaluateAnswer(
    evaluateRequestDto: EvaluateRequestDTO,
  ): Promise<EvaluateResponseDTO> {
    const { llmType, ...rest } = evaluateRequestDto;

    let llmService: LlmServiceInterface;

    // Decide which LLM service to use based on llmType
    if (llmType === LlmType.CLAUDE) {
      llmService = this.claudeService;
    } else {
      llmService = this.gptService;
    }

    this.logger.debug(`Using LLM Service: ${llmService.constructor.name}`);

    return llmService.evaluate({ ...rest });
  }
}
