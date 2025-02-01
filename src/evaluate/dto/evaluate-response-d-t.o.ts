import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../enum/status';
import { z } from 'zod';

export class EvaluateResponseDTO {
  @ApiProperty({
    description: 'Feedback provided on the answer',
  })
  feedback: string;

  @ApiProperty({
    enum: Status,
    description: 'Indicates if the answer is correct, incorrect, or incomplete',
  })
  status: Status;

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
    description: 'Voting Result evaluated through multiple llm calls',
    example: 'ALL_SAME',
  })
  votingResult?: VotingResult;
}

export enum VotingResult {
  ALL_SAME = 'ALL_SAME',
  PARTIAL_AGREEMENT = 'PARTIAL_AGREEMENT',
  ALL_DIFFERENT = 'ALL_DIFFERENT',
}

export const EvaluateResponseSchema = z.object({
  feedback: z.string(),
  status: z.enum([Status.CORRECT, Status.INCORRECT, Status.INCOMPLETE]),
  hint: z.string(),
  points: z.number(),
});
