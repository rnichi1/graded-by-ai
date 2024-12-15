import { Test, TestingModule } from '@nestjs/testing';
import { ClaudeService } from './claude.service';
import { ConfigService } from '@nestjs/config';
import { Anthropic } from '@anthropic-ai/sdk';
import { LlmRequestDTO } from '../dto/llm-request.dto';
import { Status } from '../../enum/status';

jest.mock('@anthropic-ai/sdk');

describe('ClaudeService', () => {
  let service: ClaudeService;
  let anthropicClientMock: jest.Mocked<Anthropic>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaudeService, ConfigService],
    }).compile();

    service = module.get<ClaudeService>(ClaudeService);
    anthropicClientMock = new Anthropic({
      apiKey: 'test-key',
    }) as jest.Mocked<Anthropic>;

    // Cast the messages object to any to avoid TypeScript errors
    anthropicClientMock.messages = {
      create: jest.fn() as jest.Mock,
    } as any;

    (service as any).anthropicClient = anthropicClientMock;
  });

  it('should evaluate answer successfully', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is polymorphism in object-oriented programming?',
      answer: 'Polymorphism is the ability of an object to take on many forms.',
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: '0.5' },
        { id: '2', title: 'Clarity of Explanation', points: '0.5' },
      ],
    };

    const mockResponse = {
      content: [
        {
          text: JSON.stringify({
            status: Status.CORRECT,
            feedback: 'Great job! Your answer meets all the rubric criteria.',
            passedRubrics: ['1', '2'],
            failedRubrics: [],
            hint: null,
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
      passedRubrics: ['1', '2'],
      failedRubrics: [],
      hint: null,
    });
    expect(anthropicClientMock.messages.create).toHaveBeenCalled();
  });

  it('should handle API error', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is polymorphism in object-oriented programming?',
      answer: 'Polymorphism is the ability of an object to take on many forms.',
      rubrics: [
        { id: '1', title: 'Definition Accuracy', points: '0.5' },
        { id: '2', title: 'Clarity of Explanation', points: '0.5' },
      ],
    };

    (anthropicClientMock.messages.create as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );

    await expect(service.evaluate(requestDto)).rejects.toThrow(
      'LLM evaluation failed',
    );
    expect(anthropicClientMock.messages.create).toHaveBeenCalled();
  });
});
