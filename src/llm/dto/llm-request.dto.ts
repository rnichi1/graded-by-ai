import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyString } from '../../decorators/IsNotEmptyString';
import {
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RubricDTO {
  @ApiProperty({
    description: 'The ID of the rubric',
    example: '1',
  })
  @IsNotEmptyString()
  id: string;

  @ApiProperty({
    description: 'The title of the rubric',
    example: 'Clarity',
  })
  @IsNotEmptyString()
  title: string;

  @ApiProperty({
    description: 'The points associated with the rubric',
    example: 0.5,
  })
  @IsNumber()
  points: number;
}

export class LlmRequestDTO {
  @ApiProperty({
    description: 'The question or prompt that is being evaluated',
    example:
      'Explain the concept of polymorphism in object-oriented programming.',
  })
  @IsNotEmptyString()
  question: string;

  @ApiProperty({
    description: "The student's answer to the question",
    example: 'Polymorphism is the ability of an object to take on many forms.',
  })
  @IsNotEmptyString()
  answer: string;

  @ApiProperty({
    description: 'Optional rubrics to evaluate the answer against',
    example: [
      {
        id: '1',
        title: 'Mention of Method Overriding',
        points: 0.5,
      },
    ],
    required: false,
    type: [RubricDTO],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricDTO) // Required for nested validation
  @IsOptional()
  rubrics?: RubricDTO[];

  @ApiProperty({
    description: 'Optional model solution for comparison',
    example:
      'Polymorphism in OOP allows objects of different types to be treated as objects of a common super type.',
    required: false,
  })
  @IsOptional()
  modelSolution?: string;

  @ApiProperty({
    description: 'The maximum points that can be awarded for this evaluation',
    example: 2,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPoints?: number = 1;

  @ApiProperty({
    description: 'The minimum points that can be awarded for this evaluation',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPoints?: number = 0;

  @ApiProperty({
    description:
      'The step increment for the points (e.g., 0.5 for half points)',
    example: 0.5,
    default: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pointStep?: number = 0.5;
}
