import { Test, TestingModule } from '@nestjs/testing';
import { EvaluateService } from './evaluate.service';
import { EvaluateRequestDTO } from './dto/evaluate-request-d-t.o';
import { EvaluateResponseDTO } from './dto/evaluate-response-d-t.o';
import { GptService } from '../llm/services/gpt.service';
import { ClaudeService } from '../llm/services/claude.service';
import { LlmType } from '../enum/llm';
import { Status } from '../enum/status';

describe('EvaluateService', () => {
  let service: EvaluateService;
  let gptService: GptService;
  let claudeService: ClaudeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluateService,
        {
          provide: GptService,
          useValue: {
            evaluate: jest.fn(),
          },
        },
        {
          provide: ClaudeService,
          useValue: {
            evaluate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluateService>(EvaluateService);
    gptService = module.get<GptService>(GptService);
    claudeService = module.get<ClaudeService>(ClaudeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use GPT service when llmType is GPT', async () => {
    const evaluateSpy = jest.spyOn(gptService, 'evaluate').mockResolvedValue({
      status: Status.CORRECT,
      feedback: 'Test feedback from GPT',
    } as EvaluateResponseDTO);

    const dto: EvaluateRequestDTO = {
      question: 'What is the capital of France?',
      answer: 'Paris',
      rubrics: ['The answer should be Paris.'],
      llmType: LlmType.GPT,
    };

    const result = await service.evaluateAnswer(dto);

    expect(evaluateSpy).toHaveBeenCalledWith({
      question: dto.question,
      answer: dto.answer,
      rubrics: dto.rubrics,
    });
    expect(result.feedback).toBe('Test feedback from GPT');
  });

  it('should use Claude service when llmType is CLAUDE', async () => {
    const evaluateSpy = jest
      .spyOn(claudeService, 'evaluate')
      .mockResolvedValue({
        status: Status.CORRECT,
        feedback: 'Test feedback from Claude',
      } as EvaluateResponseDTO);

    const dto: EvaluateRequestDTO = {
      question: 'What is the capital of France?',
      answer: 'Paris',
      rubrics: ['The answer should be Paris.'],
      llmType: LlmType.CLAUDE,
    };

    const result = await service.evaluateAnswer(dto);

    expect(evaluateSpy).toHaveBeenCalledWith({
      question: dto.question,
      answer: dto.answer,
      rubrics: dto.rubrics,
    });
    expect(result.feedback).toBe('Test feedback from Claude');
  });

  it('should default to GPT service when llmType is not provided', async () => {
    const evaluateSpy = jest.spyOn(gptService, 'evaluate').mockResolvedValue({
      status: Status.CORRECT,
      feedback: 'Default feedback from GPT',
    } as EvaluateResponseDTO);

    const dto: EvaluateRequestDTO = {
      question: 'What is the capital of France?',
      answer: 'Paris',
      rubrics: ['The answer should be Paris.'],
      // llmType is not provided
    };

    const result = await service.evaluateAnswer(dto);

    expect(evaluateSpy).toHaveBeenCalledWith({
      question: dto.question,
      answer: dto.answer,
      rubrics: dto.rubrics,
    });
    expect(result.feedback).toBe('Default feedback from GPT');
  });
});
