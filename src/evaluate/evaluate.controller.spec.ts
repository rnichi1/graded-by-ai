import { Test, TestingModule } from '@nestjs/testing';
import { EvaluateController } from './evaluate.controller';
import { EvaluateService } from './evaluate.service';
import { EvaluateRequestDTO } from './dto/evaluate-request-d-t.o';
import { EvaluateResponseDTO } from './dto/evaluate-response-d-t.o';
import { LlmType } from '../enum/llm';
import { Status } from '../enum/status';

describe('EvaluateController', () => {
  let controller: EvaluateController;
  let service: EvaluateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluateController],
      providers: [
        {
          provide: EvaluateService,
          useValue: {
            evaluateAnswer: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EvaluateController>(EvaluateController);
    service = module.get<EvaluateService>(EvaluateService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call evaluateAnswer on the service', async () => {
    const dto: EvaluateRequestDTO = {
      question: 'What is the capital of France?',
      answer: 'Paris',
      rubrics: ['The answer should be Paris.'],
      llmType: LlmType.GPT,
    };

    const response: EvaluateResponseDTO = {
      status: Status.CORRECT,
      feedback: 'Well done!',
    };

    jest.spyOn(service, 'evaluateAnswer').mockResolvedValue(response);

    const result = await controller.evaluate(dto);

    expect(service.evaluateAnswer).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });
});
