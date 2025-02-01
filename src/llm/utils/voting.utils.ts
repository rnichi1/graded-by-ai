import {
  EvaluateResponseDTO,
  VotingResult,
} from '../../evaluate/dto/evaluate-response-d-t.o';

/**
 * Classifies the voting result based on multiple LLM responses and returns the majority response
 * with the appropriate voting result attached.
 * 
 * @param responses Array of evaluation responses from the LLM
 * @returns The majority response with voting result classification
 */
export function classifyVoting(
  responses: EvaluateResponseDTO[],
): EvaluateResponseDTO {
  const responseCounts: Record<number, number> = {};

  // Count occurrences of each points value
  responses.forEach((response: EvaluateResponseDTO) => {
    const points = response.points;
    if (points !== undefined) {
      responseCounts[points] = (responseCounts[points] || 0) + 1;
    }
  });

  const uniquePointsCount = Object.keys(responseCounts).length;

  let votingResult: VotingResult;

  // Determine the voting result based on unique points
  if (uniquePointsCount === 1) {
    votingResult = VotingResult.ALL_SAME;
  } else if (uniquePointsCount === responses.length) {
    votingResult = VotingResult.ALL_DIFFERENT;
  } else {
    votingResult = VotingResult.PARTIAL_AGREEMENT;
  }

  // Find the most common points value
  const [mostCommonPoints] = Object.entries(responseCounts).reduce(
    (max, entry) => (entry[1] > max[1] ? entry : max),
    ['', 0],
  );

  // Find a representative response with the most common points value
  const majorityResponse = responses.find(
    (response) => response.points === Number(mostCommonPoints),
  ) as EvaluateResponseDTO;

  // Attach the voting result to the majority response
  majorityResponse.votingResult = votingResult;

  return majorityResponse;
} 