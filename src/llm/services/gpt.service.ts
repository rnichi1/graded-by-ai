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
import { classifyVoting } from '../utils/voting.utils';

@Injectable()
export class GptService implements LlmServiceInterface {
  private readonly logger = new Logger(GptService.name);
  private client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
  }

  async evaluate(requestDto: LlmRequestDTO): Promise<EvaluateResponseDTO> {
    const userPrompt = this.buildPrompt(requestDto);
    const votingCount = requestDto.votingCount ?? 1;
    const responses: EvaluateResponseDTO[] = [];

    try {
      for (let i = 0; i < votingCount; i++) {
        const response = await this.makeApiCallWithRetry(
          userPrompt,
          requestDto.temperature,
          requestDto.prePrompt,
          requestDto.postPrompt,
          requestDto.prompt,
        );
        if (response) {
          responses.push(response);
        } else {
          this.logger.warn(`Empty response from LLM at attempt ${i + 1}`);
        }
      }

      if (responses.length === 0) {
        throw new InternalServerErrorException(
          'LLM evaluation returned no valid responses',
        );
      }

      return classifyVoting(responses);
    } catch (error) {
      this.logger.error('Error during GPT evaluation', error);
      throw new InternalServerErrorException(`LLM evaluation failed`);
    }
  }

  private async makeApiCallWithRetry(
    prompt: string,
    temperature?: number,
    prePrompt: string = '',
    postPrompt: string = '',
    contextPrompt: string = context,
  ): Promise<EvaluateResponseDTO | null> {
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.beta.chat.completions.parse({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `${prePrompt} ${contextPrompt} ${postPrompt}`,
            },
            { role: 'user', content: prompt },
          ],
          temperature,
          response_format: zodResponseFormat(
            EvaluateResponseSchema,
            'json_object',
          ),
        });

        const content = response.choices[0].message.parsed;
        if (content) {
          return content;
        }
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt} failed: ${error.message}. Retrying in ${retryDelay / 1000} seconds...`,
        );
        if (attempt === maxRetries) {
          this.logger.error(`All ${maxRetries} attempts failed.`);
          throw error;
        }
        await this.delay(retryDelay);
      }
    }

    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildPrompt({
    rubrics,
    question,
    answer,
    modelSolution,
    maxPoints,
    pointStep,
    minPoints,
    chainOfThought,
    fewShotExamples,
  }: LlmRequestDTO): string {
    // Format the few-shot examples
    const fewShotExamplesText =
      fewShotExamples
        ?.map(
          (example, index) =>
            `Example ${index + 1}:\n` +
            `Answer: ${example.answer}\n` +
            `Points Assigned: ${example.points}`,
        )
        .join('\n\n') ?? '';

    // Format the rubrics
    const rubricsText = rubrics
      ? rubrics
          ?.map(
            (rubric) =>
              `ID: ${rubric.id}, Title: ${rubric.title}, Points: ${rubric.points}`,
          )
          .join('\n')
      : undefined;

    const chainOfThoughtText = chainOfThought
      ? "Let's think step by step."
      : '';

    return `Please evaluate the following student answer based on the provided rubrics and model solution (if they are provided).          
          
          ${chainOfThoughtText}
          
          Exercise that the student had to solve:
          ${question}
          
          ${fewShotExamplesText ? `Examples of answers to this question by other students and their respective scores:\n\n${fewShotExamplesText}\n\n` : ''}
          
          Here the details about this exercise:
          
          Max Points:
          ${maxPoints}
          
          Min Points:
          ${minPoints}
          
          Point Step:
          ${pointStep}
          
          ${rubricsText ? `Rubrics: ${rubricsText}` : ''}
          
            ${
              modelSolution
                ? `Make sure to score according to this model solution which is the correct solution to this question!: 
          ${modelSolution}`
                : ''
            }
            
                      
          Student answer you need to score:
          
          ${answer}  
    
      `;
  }
}
