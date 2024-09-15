import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyString } from '../../decorators/IsNotEmptyString';
import { IsArray, IsNotEmpty } from 'class-validator';

// Defined shape and structure of properties visible to the LLMs
export class LlmRequestDTO {
  @ApiProperty()
  @IsNotEmptyString()
  question: string;

  @ApiProperty()
  @IsNotEmptyString()
  answer: string;

  @ApiProperty()
  @IsArray()
  rubrics?: string[];
}
