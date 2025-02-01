import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { EvaluateRequestDTO } from 'src/evaluate/dto/evaluate-request-d-t.o';

const log = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message: string, error: any) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}:`);
    console.error('Error details:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  },
  debug: (message: string, ...args: any[]) => {
    console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, ...args);
  },
};

describe('EvaluateController (e2e)', () => {
  let app: INestApplication;
  let server: any;

  // Increase global timeout to 2 minutes
  jest.setTimeout(120000);

  // Add environment check logging
  beforeAll(async () => {
    // Log environment status
    log.info('Environment check:', {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      REDIS_HOST: process.env.REDIS_HOST ? 'Set' : 'Not set',
      REDIS_PORT: process.env.REDIS_PORT ? 'Set' : 'Not set',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    });

    try {
      log.info('Starting test module compilation');
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      log.info('Initializing application');
      app = moduleFixture.createNestApplication();

      // Add error handlers
      app
        .getHttpAdapter()
        .getInstance()
        .on('error', (error: Error) => {
          log.error('Server error:', error);
        });

      await app.init();
      server = app.getHttpServer();
      log.info('Application initialized successfully');
    } catch (error) {
      log.error('Failed to initialize test environment', error);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    try {
      log.info('Cleaning up test environment');
      if (server) {
        await new Promise((resolve) => server.close(resolve));
        log.info('Server closed');
      }
      await app.close();
      log.info('Application closed successfully');
    } catch (error) {
      log.error('Error during cleanup', error);
    }
  }, 10000);

  it('/evaluate (POST) - Success', async () => {
    try {
      log.info('Starting POST evaluation test');
      const evaluateRequest: EvaluateRequestDTO = {
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
      log.info('Evaluation request prepared:', evaluateRequest);

      log.info('Creating request object');
      const req = request(server).post('/evaluate').send(evaluateRequest);

      log.info('Setting request timeout');
      req.timeout(50000); // 50 second timeout for the request

      log.info('Sending POST request');
      const response = await req.expect(201);

      log.debug('Raw response:', response);
      log.info('POST request successful, response:', response.body);
      expect(response.body).toHaveProperty('jobId');
      expect(typeof response.body.jobId).toBe('string');
      log.info('POST test completed successfully');
    } catch (error) {
      log.error('POST test failed', error);
      // Log server state
      if (server) {
        log.debug('Server connections:', server._connections);
        log.debug('Server listening:', server.listening);
      }
      throw error;
    }
  }, 60000);

  it('/evaluate/:jobId (GET) - Check Status', async () => {
    try {
      log.info('Starting GET status test');
      const evaluateRequest: EvaluateRequestDTO = {
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

      log.info('Creating evaluation job');
      const createResponse = await request(server)
        .post('/evaluate')
        .send(evaluateRequest);

      expect(createResponse.status).toBe(201);
      const jobId = createResponse.body.jobId;
      log.info(`Job created with ID: ${jobId}`);

      // Poll for status with timeout
      const maxAttempts = 10;
      const pollInterval = 3000; // 3 seconds
      let attempts = 0;
      let finalResponse;

      log.info(
        `Starting polling with ${maxAttempts} attempts, ${pollInterval}ms interval`,
      );
      while (attempts < maxAttempts) {
        attempts++;
        log.info(`Polling attempt ${attempts}/${maxAttempts}`);

        const response = await request(server)
          .get(`/evaluate/${jobId}`)
          .expect(200);

        log.info(`Poll response - Status: ${response.body.status}`);

        if (
          response.body.status === 'completed' ||
          response.body.status === 'failed'
        ) {
          finalResponse = response;
          log.info('Job finished with status:', response.body);
          break;
        }

        if (attempts < maxAttempts) {
          log.info(`Waiting ${pollInterval}ms before next attempt`);
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      }

      if (finalResponse) {
        log.info('Verifying final response');
        expect(finalResponse.body).toHaveProperty('status');
        expect(['completed', 'failed']).toContain(finalResponse.body.status);

        if (finalResponse.body.status === 'completed') {
          log.info('Job completed successfully, verifying result structure');
          expect(finalResponse.body).toHaveProperty('result');
          expect(finalResponse.body.result).toHaveProperty('feedback');
          expect(finalResponse.body.result).toHaveProperty('points');
          log.info('Result structure verified');
        }
      } else {
        log.error('Job processing timed out', { attempts, maxAttempts });
        throw new Error('Job processing timed out');
      }

      log.info('GET status test completed successfully');
    } catch (error) {
      log.error('GET status test failed', error);
      throw error;
    }
  }, 90000);

  it('/evaluate/:jobId (GET) - Not Found', async () => {
    try {
      log.info('Starting GET not found test');
      const response = await request(server)
        .get('/evaluate/999999')
        .expect(200);

      log.info('Not found response received:', response.body);
      expect(response.body).toHaveProperty('status', 'not_found');
      log.info('GET not found test completed successfully');
    } catch (error) {
      log.error('GET not found test failed', error);
      throw error;
    }
  }, 10000);

  it('/evaluate (POST) - Invalid Input', async () => {
    try {
      log.info('Starting invalid input test');
      const invalidRequest = {
        question: 'What is 2 + 2?',
        // Missing required fields
      };

      const response = await request(server)
        .post('/evaluate')
        .send(invalidRequest)
        .expect(400);

      log.info('Invalid input response:', response.body);
      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    } catch (error) {
      log.error('Invalid input test failed', error);
      throw error;
    }
  }, 10000);
});
