import { Controller, Post, Body } from '@nestjs/common';
import { EvaluateService } from './evaluate.service';
import { EvaluateRequestDTO } from './dto/evaluate-request-d-t.o';
import { EvaluateResponseDTO } from './dto/evaluate-response-d-t.o';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Evaluation')
@Controller('evaluate')
export class EvaluateController {
  constructor(private readonly evaluateService: EvaluateService) {}

  @Post()
  @ApiOperation({ summary: "Evaluate a user's answer" })
  @ApiResponse({
    status: 201,
    description: 'The evaluation result provided by the LLM',
    type: EvaluateResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async evaluate(
    @Body() evaluateRequestDto: EvaluateRequestDTO,
  ): Promise<EvaluateResponseDTO> {
    return this.evaluateService.evaluateAnswer(evaluateRequestDto);
  }
}
