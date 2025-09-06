import { RunDifficulty, RunFeature, RunUse } from "./Run";
import { RunDifficultyConvention } from "./RunDifficultyConvention";

/**
 * Represents a slope grading scale with steepness thresholds for different run types.
 * Used to estimate run difficulty based on slope steepness. Each scale defines
 * threshold points where the difficulty classification changes based on gradient.
 */
export type SlopeGradingScale = {
  /** Stops must be ordered ascending by steepness */
  stops: { maxSteepness: number; difficulty: RunDifficulty | null }[];
};

/**
 * Gets the appropriate slope grading scale for a run based on its use types.
 * Different run uses (downhill, nordic, etc.) have different steepness thresholds
 * for difficulty classification due to the nature of the activity and equipment used.
 * 
 * @param feature - The run feature to get the grading scale for
 * @returns The appropriate slope grading scale with steepness thresholds
 */
export function getSlopeGradingScale(feature: RunFeature): SlopeGradingScale {
  // Check for downhill or skitour uses first (they have the same scale)
  if (
    feature.properties.uses.includes(RunUse.Downhill) ||
    feature.properties.uses.includes(RunUse.Skitour)
  ) {
    return getSlopeGradingScaleForUse(RunUse.Downhill, feature.properties.difficultyConvention);
  } else if (feature.properties.uses.includes(RunUse.Nordic)) {
    return getSlopeGradingScaleForUse(RunUse.Nordic, feature.properties.difficultyConvention);
  } else {
    return { stops: [] };
  }
}

/**
 * Estimates the run difficulty based on steepness and the provided slope grading scale.
 * Uses the absolute value of steepness to handle both uphill and downhill slopes.
 * Finds the first threshold that the steepness falls under.
 * 
 * @param steepness - The steepness value (slope gradient as a decimal, e.g., 0.1 = 10%)
 * @param scale - The slope grading scale with steepness thresholds
 * @returns The estimated difficulty based on steepness, or null if no match or below minimum threshold
 */
export function getEstimatedRunDifficulty(
  steepness: number,
  scale: SlopeGradingScale
): RunDifficulty | null {
  const absoluteSteepness = Math.abs(steepness);
  return (
    scale.stops.find((stop) => stop.maxSteepness > absoluteSteepness)
      ?.difficulty || null
  );
}

/**
 * Gets the appropriate slope grading scale for a specific run use and region.
 * Different run uses (downhill, nordic, etc.) have different steepness thresholds
 * for difficulty classification. This function allows for regional variations
 * in the future if different conventions use different slope scales.
 * 
 * @param runUse - The type of run use to get the grading scale for
 * @param convention - The regional difficulty convention (currently not used but available for future regional variations)
 * @returns The appropriate slope grading scale with steepness thresholds
 */
export function getSlopeGradingScaleForUse(
  runUse: RunUse,
  convention: RunDifficultyConvention
): SlopeGradingScale {
  // Currently convention is not used, but is available for future regional variations
  switch (runUse) {
    case RunUse.Downhill:
    case RunUse.Skitour:
      return {
        stops: [
          { maxSteepness: 0.05, difficulty: null }, // No difficulty below 5%
          { maxSteepness: 0.25, difficulty: RunDifficulty.EASY },
          { maxSteepness: 0.4, difficulty: RunDifficulty.INTERMEDIATE },
          { maxSteepness: 0.8, difficulty: RunDifficulty.ADVANCED }, // Advanced up to 80%
          { maxSteepness: 1.2, difficulty: RunDifficulty.EXPERT }, // Expert up to 120%
        ],
      };
    case RunUse.Nordic:
      return {
        stops: [
          { maxSteepness: 0.1, difficulty: RunDifficulty.EASY },
          { maxSteepness: 0.15, difficulty: RunDifficulty.INTERMEDIATE },
          { maxSteepness: 0.3, difficulty: RunDifficulty.ADVANCED },
        ],
      };
    default:
      return { stops: [] };
  }
}