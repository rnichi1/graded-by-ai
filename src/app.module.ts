import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvaluateModule } from './evaluate/evaluate.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EvaluateModule,
  ],
})
export class AppModule {}
