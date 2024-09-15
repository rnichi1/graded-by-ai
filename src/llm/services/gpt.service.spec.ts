import { Test, TestingModule } from '@nestjs/testing';
import { GptService } from './gpt.service';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { LlmRequestDTO } from '../dto/llm-request.dto';
import { Status } from '../../enum/status';

jest.mock('openai');

describe('GptService', () => {
  let service: GptService;
  let openAIApiMock: jest.Mocked<OpenAI>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GptService, ConfigService],
    }).compile();

    service = module.get<GptService>(GptService);
    openAIApiMock = new OpenAI({ apiKey: 'test-key' }) as jest.Mocked<OpenAI>;

    // Mock the structure of beta.chat.completions.parse and cast it to a jest function
    openAIApiMock.beta = {
      chat: {
        completions: {
          parse: jest.fn() as jest.Mock,
        },
      },
    } as any;

    (service as any).client = openAIApiMock;
  });

  it('should evaluate answer successfully', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      rubrics: ['The answer should be 4.'],
    };

    const mockResponse = {
      choices: [
        {
          message: {
            parsed: {
              status: Status.CORRECT,
              feedback: 'Good job!',
              hint: null,
            },
          },
        },
      ],
    };

    // Cast parse as a jest function so mockResolvedValue can be used
    (openAIApiMock.beta.chat.completions.parse as jest.Mock).mockResolvedValue(
      mockResponse,
    );

    const result = await service.evaluate(requestDto);

    expect(result).toEqual({
      status: Status.CORRECT,
      feedback: 'Good job!',
      hint: null,
    });
    expect(openAIApiMock.beta.chat.completions.parse).toHaveBeenCalled();
  });

  it('should handle API error', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      rubrics: ['The answer should be 4.'],
    };

    // Cast parse as a jest function so mockRejectedValue can be used
    (openAIApiMock.beta.chat.completions.parse as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );

    await expect(service.evaluate(requestDto)).rejects.toThrow(
      'LLM evaluation failed',
    );
    expect(openAIApiMock.beta.chat.completions.parse).toHaveBeenCalled();
  });
});
