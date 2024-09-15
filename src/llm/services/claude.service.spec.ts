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
      question: 'What is 2 + 2?',
      answer: '4',
      rubrics: ['The answer should be 4.'],
    };

    const mockResponse = {
      content: [
        {
          text: JSON.stringify({
            status: Status.CORRECT,
            feedback: 'Good job!',
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
      feedback: 'Good job!',
      hint: null,
    });
    expect(anthropicClientMock.messages.create).toHaveBeenCalled();
  });

  it('should handle API error', async () => {
    const requestDto: LlmRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      rubrics: ['The answer should be 4.'],
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
