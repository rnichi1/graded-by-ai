import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EvaluateService } from './evaluate.service';
import { EvaluateRequestDTO } from './dto/evaluate-request-d-t.o';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Evaluation')
@Controller('evaluate')
export class EvaluateController {
  constructor(private readonly evaluateService: EvaluateService) {}

  @Post()
  @ApiOperation({ summary: "Queue a user's answer for evaluation" })
  @ApiResponse({
    status: 201,
    description: 'Job ID for tracking the evaluation progress',
  })
  async evaluate(@Body() evaluateRequestDto: EvaluateRequestDTO) {
    return this.evaluateService.evaluateAnswer(evaluateRequestDto);
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Check the status of an evaluation job' })
  @ApiResponse({
    status: 200,
    description: 'Current status and result (if completed) of the evaluation job',
  })
  async checkStatus(@Param('jobId') jobId: string) {
    return this.evaluateService.checkStatus(jobId);
  }
}
