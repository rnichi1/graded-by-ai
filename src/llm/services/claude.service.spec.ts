import { Test, TestingModule } from '@nestjs/testing';
import { ClaudeService } from './claude.service';
import { ConfigService } from '@nestjs/config';
import { Anthropic } from '@anthropic-ai/sdk';
import { LlmRequestDTO } from '../dto/llm-request.dto';
import { Status } from '../../enum/status';
import { VotingResult } from '../../evaluate/dto/evaluate-response-d-t.o';

jest.mock('@anthropic-ai/sdk');

describe('ClaudeService', () => {
  let service: ClaudeService;
  let anthropicClientMock: jest.Mocked<Anthropic>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaudeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<ClaudeService>(ClaudeService);
    anthropicClientMock = new Anthropic({
      apiKey: 'test-key',
    }) as jest.Mocked<Anthropic>;

    anthropicClientMock.messages = {
      create: jest.fn(),
    } as any;

    (service as any).anthropicClient = anthropicClientMock;
    (service as any).delay = jest.fn().mockResolvedValue(undefined);
  });

  it('should evaluate answer successfully with single vote', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is polymorphism in object-oriented programming?',
      answer: 'Polymorphism is the ability of an object to take on many forms.',
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: 0.5 },
        { id: '2', title: 'Clarity of Explanation', points: 0.5 },
      ],
    };

    const mockResponse = {
      content: [
        {
          text: JSON.stringify({
            status: Status.CORRECT,
            feedback: 'Great job! Your answer meets all the rubric criteria.',
            hint: null,
            points: 1,
          }),
        },
      ],
    };

    (anthropicClientMock.messages.create as jest.Mock).mockResolvedValue(
      mockResponse,
    );

    const result = await service.evaluate(requestDto);

    expect(result).toEqual({
      status: Status.CORRECT,
      feedback: 'Great job! Your answer meets all the rubric criteria.',
      hint: null,
      points: 1,
      votingResult: VotingResult.ALL_SAME,
    });
    expect(anthropicClientMock.messages.create).toHaveBeenCalledTimes(1);
  });

  it('should evaluate with multiple votes and handle majority voting', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is polymorphism in OOP?',
      answer: 'Polymorphism is the ability of an object to take on many forms.',
      votingCount: 3,
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: 0.5 },
        { id: '2', title: 'Clarity of Explanation', points: 0.5 },
      ],
    };

    const mockResponses = [
      {
        content: [
          {
            text: JSON.stringify({
              status: Status.CORRECT,
              feedback: 'Perfect answer!',
              hint: null,
              points: 1,
            }),
          },
        ],
      },
      {
        content: [
          {
            text: JSON.stringify({
              status: Status.CORRECT,
              feedback: 'Excellent explanation!',
              hint: null,
              points: 1,
            }),
          },
        ],
      },
      {
        content: [
          {
            text: JSON.stringify({
              status: Status.INCOMPLETE,
              feedback: 'Could be more detailed.',
              hint: 'Consider adding examples.',
              points: 0.5,
            }),
          },
        ],
      },
    ];

    (anthropicClientMock.messages.create as jest.Mock)
      .mockResolvedValueOnce(mockResponses[0])
      .mockResolvedValueOnce(mockResponses[1])
      .mockResolvedValueOnce(mockResponses[2]);

    const result = await service.evaluate(requestDto);

    expect(result).toEqual({
      status: Status.CORRECT,
      feedback: 'Perfect answer!',
      hint: null,
      points: 1,
      votingResult: VotingResult.PARTIAL_AGREEMENT,
    });
    expect(anthropicClientMock.messages.create).toHaveBeenCalledTimes(3);
  });

  it('should handle API error with retry mechanism', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is polymorphism in OOP?',
      answer: 'Polymorphism is the ability of an object to take on many forms.',
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: 0.5 },
        { id: '2', title: 'Clarity of Explanation', points: 0.5 },
      ],
    };

    (anthropicClientMock.messages.create as jest.Mock)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockRejectedValueOnce(new Error('API Error'))
      .mockRejectedValueOnce(new Error('API Error'));

    await expect(service.evaluate(requestDto)).rejects.toThrow(
      'LLM evaluation failed',
    );
    expect(anthropicClientMock.messages.create).toHaveBeenCalledTimes(3);
    expect((service as any).delay).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should handle invalid JSON response', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is polymorphism in OOP?',
      answer: 'Polymorphism is the ability of an object to take on many forms.',
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: 0.5 },
        { id: '2', title: 'Clarity of Explanation', points: 0.5 },
      ],
    };

    const mockResponse = {
      content: [
        {
          text: 'Invalid JSON response',
        },
      ],
    };

    (anthropicClientMock.messages.create as jest.Mock)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(mockResponse);

    await expect(service.evaluate(requestDto)).rejects.toThrow(
      'LLM evaluation failed',
    );
    expect(anthropicClientMock.messages.create).toHaveBeenCalledTimes(3);
    expect((service as any).delay).toHaveBeenCalledTimes(2);
  }, 10000);
});
