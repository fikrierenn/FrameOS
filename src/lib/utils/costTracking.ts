/**
 * OpenAI API Cost Tracking
 * 
 * Track token usage and calculate costs for monitoring
 */

interface ModelPricing {
  input: number;  // $ per 1K tokens
  output: number; // $ per 1K tokens
}

const PRICING: Record<string, ModelPricing> = {
  'gpt-4o': {
    input: 0.005 / 1000,
    output: 0.015 / 1000,
  },
  'gpt-4-turbo': {
    input: 0.01 / 1000,
    output: 0.03 / 1000,
  },
  'gpt-4-turbo-preview': {
    input: 0.01 / 1000,
    output: 0.03 / 1000,
  },
  'whisper-1': {
    input: 0.006 / 60, // $0.006 per minute
    output: 0,
  },
  'tts-1': {
    input: 0.015 / 1000, // $0.015 per 1K characters
    output: 0,
  },
};

export interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Calculate cost for a given model and token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number = 0
): CostEstimate {
  const pricing = PRICING[model] || PRICING['gpt-4o'];
  
  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;
  const estimatedCost = inputCost + outputCost;

  return {
    model,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost,
  };
}

/**
 * Calculate cost for Whisper (duration-based)
 */
export function calculateWhisperCost(durationSeconds: number): CostEstimate {
  const durationMinutes = durationSeconds / 60;
  const cost = durationMinutes * 0.006;

  return {
    model: 'whisper-1',
    inputTokens: Math.round(durationMinutes * 60), // Approximate
    outputTokens: 0,
    totalTokens: Math.round(durationMinutes * 60),
    estimatedCost: cost,
  };
}

/**
 * Calculate cost for TTS (character-based)
 */
export function calculateTTSCost(characterCount: number): CostEstimate {
  const cost = (characterCount / 1000) * 0.015;

  return {
    model: 'tts-1',
    inputTokens: characterCount,
    outputTokens: 0,
    totalTokens: characterCount,
    estimatedCost: cost,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(2)}m`; // Show in millicents
  }
  return `$${cost.toFixed(4)}`;
}
