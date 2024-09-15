import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { LlmType } from './../src/enum/llm';
import { EvaluateRequestDTO } from '../src/evaluate/dto/evaluate-request-d-t.o';
import { Status } from '../src/enum/status';

describe('EvaluateController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable validation pipe
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/evaluate (POST) - Success', async () => {
    const evaluateRequest: EvaluateRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      rubrics: ['The answer should be 4.'],
      llmType: LlmType.GPT,
    };

    const response = await request(app.getHttpServer())
      .post('/evaluate')
      .send(evaluateRequest)
      .expect(201);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('feedback');
    expect(Object.values(Status)).toContain(response.body.status);
  });

  it('/evaluate (POST) - Validation Error', async () => {
    const invalidRequest = {
      question: '', // Invalid: empty string
      answer: '4',
      rubrics: ['The answer should be 4.'],
    };

    const response = await request(app.getHttpServer())
      .post('/evaluate')
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      'question must be a non-empty string',
    );
  });

  it('/evaluate (POST) - Invalid LLM Type', async () => {
    const invalidRequest: EvaluateRequestDTO = {
      question: 'What is 2 + 2?',
      answer: '4',
      rubrics: ['The answer should be 4.'],
      llmType: 'invalid_llm' as LlmType, // Casting to bypass TypeScript error for testing
    };

    const response = await request(app.getHttpServer())
      .post('/evaluate')
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });
});
