import { Test, TestingModule } from '@nestjs/testing';
import { EvaluateController } from './evaluate.controller';
import { EvaluateService } from './evaluate.service';
import { EvaluateRequestDTO } from './dto/evaluate-request-d-t.o';
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
            checkStatus: jest.fn(),
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

  it('should queue evaluation request and return job ID', async () => {
    const dto: EvaluateRequestDTO = {
      question: 'What is the capital of France?',
      answer: 'Paris',
      rubrics: [
        {
          id: '1',
          points: 1,
          title: 'The answer should be Paris.',
        },
      ],
      llmType: LlmType.GPT,
    };

    const jobResponse = { jobId: '123' };
    jest.spyOn(service, 'evaluateAnswer').mockResolvedValue(jobResponse);

    const result = await controller.evaluate(dto);

    expect(service.evaluateAnswer).toHaveBeenCalledWith(dto);
    expect(result).toEqual(jobResponse);
  });

  it('should check job status', async () => {
    const jobId = '123';
    const statusResponse = {
      status: Status.CORRECT,
      result: {
        status: Status.CORRECT,
        feedback: 'Well done!',
      },
    };

    jest.spyOn(service, 'checkStatus').mockResolvedValue(statusResponse);

    const result = await controller.checkStatus(jobId);

    expect(service.checkStatus).toHaveBeenCalledWith(jobId);
    expect(result).toEqual(statusResponse);
  });
});
