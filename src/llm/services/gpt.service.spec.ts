import { Test, TestingModule } from '@nestjs/testing';
import { GptService } from './gpt.service';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { LlmRequestDTO } from '../dto/llm-request.dto';
import { Status } from '../../enum/status';
import { VotingResult } from '../../evaluate/dto/evaluate-response-d-t.o';

jest.mock('openai');

describe('GptService', () => {
  let service: GptService;
  let openAIApiMock: jest.Mocked<OpenAI>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GptService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<GptService>(GptService);
    openAIApiMock = new OpenAI({ apiKey: 'test-key' }) as jest.Mocked<OpenAI>;

    openAIApiMock.beta = {
      chat: {
        completions: {
          parse: jest.fn(),
        },
      },
    } as any;

    (service as any).client = openAIApiMock;
    (service as any).delay = jest.fn().mockResolvedValue(undefined);
  });

  it('should evaluate answer successfully with single vote', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      modelSolution: '4',
      minPoints: 0,
      pointStep: 0.5,
      maxPoints: 1,
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: 0.5 },
        { id: '2', title: 'Clarity of Explanation', points: 0.5 },
      ],
    };

    const mockResponse = {
      choices: [
        {
          message: {
            parsed: {
              status: Status.CORRECT,
              feedback: 'Good job!',
              hint: null,
              points: 1,
            },
          },
        },
      ],
    };

    (openAIApiMock.beta.chat.completions.parse as jest.Mock).mockResolvedValue(
      mockResponse,
    );

    const result = await service.evaluate(requestDto);

    expect(result).toEqual({
      status: Status.CORRECT,
      feedback: 'Good job!',
      hint: null,
      points: 1,
      votingResult: VotingResult.ALL_SAME,
    });
    expect(openAIApiMock.beta.chat.completions.parse).toHaveBeenCalledTimes(1);
  });

  it('should evaluate with multiple votes and handle majority voting', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      modelSolution: '4',
      minPoints: 0,
      pointStep: 0.5,
      maxPoints: 1,
      votingCount: 3,
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: 0.5 },
        { id: '2', title: 'Clarity of Explanation', points: 0.5 },
      ],
    };

    const mockResponses = [
      {
        choices: [
          {
            message: {
              parsed: {
                status: Status.CORRECT,
                feedback: 'Good job!',
                hint: null,
                points: 1,
              },
            },
          },
        ],
      },
      {
        choices: [
          {
            message: {
              parsed: {
                status: Status.CORRECT,
                feedback: 'Well done!',
                hint: null,
                points: 1,
              },
            },
          },
        ],
      },
      {
        choices: [
          {
            message: {
              parsed: {
                status: Status.INCOMPLETE,
                feedback: 'Almost there!',
                hint: null,
                points: 0.5,
              },
            },
          },
        ],
      },
    ];

    (openAIApiMock.beta.chat.completions.parse as jest.Mock)
      .mockResolvedValueOnce(mockResponses[0])
      .mockResolvedValueOnce(mockResponses[1])
      .mockResolvedValueOnce(mockResponses[2]);

    const result = await service.evaluate(requestDto);

    expect(result).toEqual({
      status: Status.CORRECT,
      feedback: 'Good job!',
      hint: null,
      points: 1,
      votingResult: VotingResult.PARTIAL_AGREEMENT,
    });
    expect(openAIApiMock.beta.chat.completions.parse).toHaveBeenCalledTimes(3);
  });

  it('should handle API error with retry mechanism', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      modelSolution: '4',
      minPoints: 0,
      pointStep: 0.5,
      maxPoints: 1,
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: 0.5 },
        { id: '2', title: 'Clarity of Explanation', points: 0.5 },
      ],
    };

    (openAIApiMock.beta.chat.completions.parse as jest.Mock)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockRejectedValueOnce(new Error('API Error'))
      .mockRejectedValueOnce(new Error('API Error'));

    await expect(service.evaluate(requestDto)).rejects.toThrow(
      'LLM evaluation failed',
    );
    expect(openAIApiMock.beta.chat.completions.parse).toHaveBeenCalledTimes(3);
    expect((service as any).delay).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should handle empty responses', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      modelSolution: '4',
      minPoints: 0,
      pointStep: 0.5,
      maxPoints: 1,
      votingCount: 2,
    };

    const mockResponse = {
      choices: [
        {
          message: {
            parsed: null,
          },
        },
      ],
    };

    (openAIApiMock.beta.chat.completions.parse as jest.Mock)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockResponse);

    await expect(service.evaluate(requestDto)).rejects.toThrow(
      'LLM evaluation failed',
    );
    expect(openAIApiMock.beta.chat.completions.parse).toHaveBeenCalledTimes(6);
  }, 10000);
});
