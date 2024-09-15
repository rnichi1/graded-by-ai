import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { LlmServiceInterface } from '../interfaces/llm.service.interface';
import {
  EvaluateResponseDTO,
  EvaluateResponseSchema,
} from '../../evaluate/dto/evaluate-response-d-t.o';
import { LlmRequestDTO } from '../dto/llm-request.dto';
import { zodResponseFormat } from 'openai/helpers/zod';
import { context } from '../../constants/llmContext';

@Injectable()
export class GptService implements LlmServiceInterface {
  private readonly logger = new Logger(GptService.name);
  private client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
  }

  async evaluate(requestDto: LlmRequestDTO): Promise<EvaluateResponseDTO> {
    const prompt = this.buildPrompt(requestDto);

    try {
      const response = await this.client.beta.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: prompt },
        ],
        response_format: zodResponseFormat(
          EvaluateResponseSchema,
          'json_object',
        ),
      });

      const content = response.choices[0].message.parsed;
      if (!content) {
        throw new InternalServerErrorException(
          'LLM evaluation undefined or empty',
        );
      }

      return content;
    } catch (error) {
      this.logger.error('Error during GPT evaluation', error);
      throw new InternalServerErrorException(`LLM evaluation failed`);
    }
  }

  private buildPrompt({ rubrics, question, answer }: LlmRequestDTO): string {
    const rubricsText = rubrics?.join('\n');
    return `Please evaluate the following student answer based on the provided rubrics.

          Question:
          ${question}
          
          Answer:
          ${answer}
          
          Rubrics:
          ${rubricsText}
      `;
  }
}
