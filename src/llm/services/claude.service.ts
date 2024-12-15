import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmServiceInterface } from '../interfaces/llm.service.interface';
import { Anthropic } from '@anthropic-ai/sdk';

import { LlmRequestDTO } from '../dto/llm-request.dto';
import { EvaluateResponseDTO } from '../../evaluate/dto/evaluate-response-d-t.o';
import { Status } from '../../enum/status';
import { context } from '../../constants/llmContext';

@Injectable()
export class ClaudeService implements LlmServiceInterface {
  private readonly logger = new Logger(ClaudeService.name);
  private anthropicClient: Anthropic;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropicClient = new Anthropic({
      apiKey,
    });
  }

  async evaluate(requestDto: LlmRequestDTO): Promise<EvaluateResponseDTO> {
    const prompt = this.buildPrompt(requestDto);

    try {
      const response = await this.anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        messages: [{ role: 'user', content: prompt }],
        system: context,
        max_tokens: 1024,
      });

      return this.parseEvaluation(
        (response.content[0] as { text: string }).text,
      );
    } catch (error) {
      this.logger.error('Error during Claude evaluation', error);
      throw new InternalServerErrorException('LLM evaluation failed');
    }
  }

  private buildPrompt({
    question,
    answer,
    rubrics,
    maxPoints,
    pointStep,
    minPoints,
    modelSolution,
  }: LlmRequestDTO): string {
    const rubricsText = rubrics?.join('\n');
    return `Please evaluate the following student answer based on the provided rubrics.

         
          Question:
          ${question}
          
          Answer:
          ${answer}
          
          Max Points:
          ${maxPoints}
          
          Min Points:
          ${minPoints}
          
          Point Step:
          ${pointStep}
          
          Rubrics:
          ${rubricsText ?? 'N/A'}
          
          Model Solution:
          ${modelSolution ?? 'N/A'}
          
          Your evaluation should be in the following JSON format without any additional text:
          
          {
            "status": "correct" or "incorrect" or "incomplete",
            "feedback": "Your feedback here.",
            "hint": "Optional hint."
            "passedRubrics": ["id1", "id2"],
            "failedRubrics": ["id3", "id4"],
            "points": 1
          }
    `;
  }

  private parseEvaluation(text: string): EvaluateResponseDTO {
    try {
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
      const data = JSON.parse(jsonString);

      const status = data.status as Status;
      const feedback = data.feedback;
      const hint = data.hint;
      const passedRubricsIds = data.passedRubrics;
      const failedRubricsIds = data.failedRubrics;
      const points = data.points;

      return {
        status,
        feedback,
        hint,
        failedRubricsIds,
        passedRubricsIds,
        points,
      };
    } catch (error) {
      this.logger.error('Error parsing Claude response', error);
      throw new InternalServerErrorException('Failed to parse LLM response');
    }
  }
}
