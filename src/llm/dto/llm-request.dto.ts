import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmptyString } from '../../decorators/IsNotEmptyString';
import {
  IsArray,
  IsNumber,
  IsString,
  isString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FewShotExampleDTO {
  @ApiProperty({
    description: 'The answer provided in the few-shot example',
    example: 'Polymorphism is the ability of an object to take on many forms.',
  })
  @IsNotEmptyString()
  answer: string;

  @ApiProperty({
    description:
      'The human-assigned grading for the example, provided as a stringified JSON. It can either be an integer or an array of rubric scores.',
    example: JSON.stringify([
      { rubric_id: '1', points_assigned: 0.5 },
      { rubric_id: '2', points_assigned: 1.0 },
    ]),
  })
  @IsNotEmptyString()
  points: string; // Stringified JSON for flexibility. This can be either a JSON or just a number
}

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

  @ApiPropertyOptional({
    description: 'Optional rubrics to evaluate the answer against',
    example: [
      {
        id: '1',
        title: 'Mention of Method Overriding',
        points: 0.5,
      },
    ],
    type: [RubricDTO],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricDTO) // Required for nested validation
  rubrics?: RubricDTO[];

  @ApiPropertyOptional({
    description: 'Optional model solution for comparison',
    example:
      'Polymorphism in OOP allows objects of different types to be treated as objects of a common super type.',
  })
  modelSolution?: string;

  @ApiPropertyOptional({
    description: 'The maximum points that can be awarded for this evaluation',
    example: 2,
    default: 1,
  })
  @IsNumber()
  @Min(0.25)
  maxPoints?: number = 1;

  @ApiPropertyOptional({
    description: 'The minimum points that can be awarded for this evaluation',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  minPoints?: number = 0;

  @ApiPropertyOptional({
    description:
      'The step increment for the points (e.g., 0.5 for half points)',
    example: 0.5,
    default: 0.5,
  })
  @IsNumber()
  @Min(0)
  pointStep?: number = 0.5;

  @ApiPropertyOptional({
    description:
      'Indicates whether chain-of-thought prompting should be applied. Is default true as it increases accuracy.',
    example: true,
    default: true,
  })
  chainOfThought?: boolean = true;

  @ApiPropertyOptional({
    description: 'The number of llm calls before confirming a final vote',
    example: 3,
  })
  @IsNumber()
  @Min(1)
  votingCount?: number = 1;

  @ApiPropertyOptional({
    description:
      'Temperature parameter for controlling diversity in LLM outputs. Lower values are more deterministic.',
    example: 0.2,
    default: 0.2,
  })
  @IsNumber()
  temperature?: number = 0.2;

  @ApiPropertyOptional({
    description:
      'Few-shot examples to provide context to the LLM for evaluation. Each example contains an answer and the corresponding human-assigned grading.',
    example: [
      {
        answer:
          'Polymorphism allows objects of different types to be treated uniformly.',
        points: JSON.stringify([
          { rubric_id: '1', points_assigned: 0.5 },
          { rubric_id: '2', points_assigned: 0.5 },
        ]),
      },
      {
        answer: 'Polymorphism enables method overriding in child classes.',
        points: JSON.stringify(1),
      },
    ],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FewShotExampleDTO)
  fewShotExamples?: FewShotExampleDTO[];

  @ApiPropertyOptional({
    description: 'Custom prompt text to be added before the context prompt',
    example: 'You are an expert in computer science education.',
    required: false,
  })
  prePrompt?: string;

  @ApiPropertyOptional({
    description: 'Custom prompt text to replace the default context prompt',
    example:
      'As an educational evaluator, assess the following answer based on accuracy and clarity.',
    required: false,
  })
  prompt?: string;

  @ApiPropertyOptional({
    description: 'Custom prompt text to be added after the context prompt',
    example: 'Focus particularly on technical accuracy in your evaluation.',
    required: false,
  })
  postPrompt?: string;

  @ApiPropertyOptional({
    description:
      'API Key for the LLM service. Make sure to pass the API key of the selected model family.',
    example: 'YOU_API_KEY',
    required: false,
  })
  apiKey: string;

  // Concrete Llm Model
  @ApiPropertyOptional({
    description: 'Which LLM model to use for evaluation.',
    default: 'claude-3-5-sonnet-latest',
  })
  llmModel?: string;
}
