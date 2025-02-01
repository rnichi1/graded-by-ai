import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvaluateModule } from './evaluate/evaluate.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [ConfigModule.forRoot(), EvaluateModule, QueueModule],
})
export class AppModule {}
