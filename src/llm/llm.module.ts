import { Module } from '@nestjs/common';
import { GptService } from './services/gpt.service';
import { ClaudeService } from './services/claude.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [GptService, ClaudeService],
  exports: [GptService, ClaudeService],
})
export class LlmModule {}
