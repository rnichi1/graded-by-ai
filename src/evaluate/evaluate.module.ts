import { Module } from '@nestjs/common';
import { EvaluateController } from './evaluate.controller';
import { EvaluateService } from './evaluate.service';
import { LlmModule } from '../llm/llm.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [LlmModule, QueueModule],
  controllers: [EvaluateController],
  providers: [EvaluateService],
})
export class EvaluateModule {}
