import { Test, TestingModule } from '@nestjs/testing';
import { EvaluateService } from './evaluate.service';
import { QueueService } from '../queue/queue.service';
import { EvaluateRequestDTO } from './dto/evaluate-request-d-t.o';
import { LlmType } from '../enum/llm';
import { Status } from '../enum/status';

describe('EvaluateService', () => {
  let service: EvaluateService;
  let queueService: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluateService,
        {
          provide: QueueService,
          useValue: {
            addEvaluationJob: jest.fn(),
            getJobStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluateService>(EvaluateService);
    queueService = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add evaluation job to queue', async () => {
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
    jest.spyOn(queueService, 'addEvaluationJob').mockResolvedValue(jobResponse);

    const result = await service.evaluateAnswer(dto);

    expect(queueService.addEvaluationJob).toHaveBeenCalledWith(dto);
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

    jest.spyOn(queueService, 'getJobStatus').mockResolvedValue(statusResponse);

    const result = await service.checkStatus(jobId);

    expect(queueService.getJobStatus).toHaveBeenCalledWith(jobId);
    expect(result).toEqual(statusResponse);
  });
});
