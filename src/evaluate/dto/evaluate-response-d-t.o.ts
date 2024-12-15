import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../enum/status';
import { z } from 'zod';

export class EvaluateResponseDTO {
  @ApiProperty({
    enum: Status,
    description: 'Indicates if the answer is correct, incorrect, or incomplete',
  })
  status: Status;

  @ApiProperty({
    description: 'Feedback provided on the answer',
  })
  feedback: string;

  @ApiProperty({
    description: 'Points awarded for the answer',
  })
  points?: number;

  @ApiProperty({
    description: 'Additional hint to help improve the answer',
    required: false,
  })
  hint?: string;

  @ApiProperty({
    description: 'Rubrics the student passed',
    example: ['1', '2'],
  })
  passedRubricsIds: string[];

  @ApiProperty({
    description: 'Rubrics the student failed',
    example: ['3'],
  })
  failedRubricsIds: string[];
}

export const EvaluateResponseSchema = z.object({
  status: z.enum([Status.CORRECT, Status.INCORRECT, Status.INCOMPLETE]),
  feedback: z.string(),
  hint: z.string().optional(),
  points: z.number().optional(),
  passedRubricsIds: z.array(z.string()),
  failedRubricsIds: z.array(z.string()),
});
