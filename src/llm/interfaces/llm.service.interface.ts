import { EvaluateResponseDTO } from '../../evaluate/dto/evaluate-response-d-t.o';
import { LlmRequestDTO } from '../dto/llm-request.dto';

export interface LlmServiceInterface {
  evaluate(req: LlmRequestDTO): Promise<EvaluateResponseDTO>;
}
