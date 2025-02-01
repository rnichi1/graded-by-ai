import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { EvaluationProcessor } from './evaluation.processor';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'evaluation',
    }),
    LlmModule,
  ],

  providers: [QueueService, EvaluationProcessor],
  exports: [QueueService],
})
export class QueueModule {}
