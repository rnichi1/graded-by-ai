import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmServiceInterface } from '../interfaces/llm.service.interface';
import { Anthropic } from '@anthropic-ai/sdk';

import { LlmRequestDTO } from '../dto/llm-request.dto';
import { Status } from '../../enum/status';
import { context } from '../../constants/llmContext';
import {
  EvaluateResponseDTO,
  VotingResult,
} from '../../evaluate/dto/evaluate-response-d-t.o';
import { classifyVoting } from '../utils/voting.utils';

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
      this.logger.error('Error during Claude evaluation', error);
      throw new InternalServerErrorException('LLM evaluation failed');
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
    const retryDelay = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.anthropicClient.messages.create({
          model: 'claude-3-5-sonnet-latest',
          messages: [{ role: 'user', content: prompt }],
          system: `${prePrompt} ${contextPrompt} ${postPrompt}`,
          temperature: temperature ?? 0.2,
          max_tokens: 1024,
        });

        const content = this.parseEvaluation(
          (response.content[0] as { text: string }).text,
        );
        if (content) {
          return content;
        }
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt} failed: ${error.message}. Retrying in ${
            retryDelay / 1000
          } seconds...`,
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
    const fewShotExamplesText =
      fewShotExamples
        ?.map(
          (example, index) =>
            `Example ${index + 1}:\n` +
            `Answer: ${example.answer}\n` +
            `Points Assigned: ${example.points}`,
        )
        .join('\n\n') ?? '';

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
          
          Answer you need to score:
          
          ${answer}
          
          Exercise that the student had to solve:
          ${question}
          
          ${
            fewShotExamplesText
              ? `Examples of answers to this question by other students and their respective scores:\n\n${fewShotExamplesText}\n\n`
              : ''
          }
          
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
          
          Your evaluation should be in the following JSON format without any additional text:
          
          {
            "status": "correct" or "incorrect" or "incomplete",
            "feedback": "Your feedback here.",
            "hint": "Optional hint",
            "points": number
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
      const points = data.points;

      return {
        status,
        feedback,
        hint,
        points,
      };
    } catch (error) {
      this.logger.error('Error parsing Claude response', error);
      throw new InternalServerErrorException('Failed to parse LLM response');
    }
  }
}
