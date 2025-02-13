import { LlmRequestDTO } from '../../llm/dto/llm-request.dto';
import { LlmType } from '../../enum/llm';
import { IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Fields to be visible to the LLMs must be defined in the LlmRequestDTO class
export class EvaluateRequestDTO extends LlmRequestDTO {
  @IsEnum(LlmType)
  @ApiPropertyOptional({
    description: 'Which LLM model to use for evaluation.',
    enum: LlmType,
    default: LlmType.CLAUDE,
  })
  llmType?: LlmType;
}
