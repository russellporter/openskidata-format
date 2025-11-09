import { RunDifficulty, RunUse } from "./Run";
import { getEstimatedRunDifficulty, getSlopeGradingScale } from "./SlopeGradingScale";

describe("getEstimatedRunDifficulty", () => {
  it("should return null for steepness below minimum threshold", () => {
    const downhillScale = getSlopeGradingScale({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {
        type: "Run" as any,
        uses: [RunUse.Downhill],
        id: "test",
        name: null,
        ref: null,
        status: "operating" as any,
        description: null,
        difficulty: null,
        difficultyConvention: "europe" as any,
        oneway: null,
        lit: null,
        gladed: null,
        patrolled: null,
        grooming: null,
        skiAreas: [],
        elevationProfile: null,
        sources: [],
        websites: [],
        wikidataID: null,
      },
    });

    expect(getEstimatedRunDifficulty(0.03, downhillScale)).toBeNull(); // 3% steepness
  });

  it("should return correct difficulty for downhill slopes", () => {
    const downhillScale = getSlopeGradingScale({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {
        type: "Run" as any,
        uses: [RunUse.Downhill],
        id: "test",
        name: null,
        ref: null,
        status: "operating" as any,
        description: null,
        difficulty: null,
        difficultyConvention: "europe" as any,
        oneway: null,
        lit: null,
        gladed: null,
        patrolled: null,
        grooming: null,
        skiAreas: [],
        elevationProfile: null,
        sources: [],
        websites: [],
        wikidataID: null,
      },
    });

    expect(getEstimatedRunDifficulty(0.1, downhillScale)).toBe(RunDifficulty.EASY); // 10%
    expect(getEstimatedRunDifficulty(0.3, downhillScale)).toBe(RunDifficulty.INTERMEDIATE); // 30%
    expect(getEstimatedRunDifficulty(0.6, downhillScale)).toBe(RunDifficulty.ADVANCED); // 60%
    expect(getEstimatedRunDifficulty(0.9, downhillScale)).toBe(RunDifficulty.EXPERT); // 90%
    expect(getEstimatedRunDifficulty(1.0, downhillScale)).toBe(RunDifficulty.FREERIDE); // 100%
  });

  it("should return correct difficulty for nordic slopes", () => {
    const nordicScale = getSlopeGradingScale({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {
        type: "Run" as any,
        uses: [RunUse.Nordic],
        id: "test",
        name: null,
        ref: null,
        status: "operating" as any,
        description: null,
        difficulty: null,
        difficultyConvention: "europe" as any,
        oneway: null,
        lit: null,
        gladed: null,
        patrolled: null,
        grooming: null,
        skiAreas: [],
        elevationProfile: null,
        sources: [],
        websites: [],
        wikidataID: null,
      },
    });

    expect(getEstimatedRunDifficulty(0.05, nordicScale)).toBe(RunDifficulty.EASY); // 5%
    expect(getEstimatedRunDifficulty(0.12, nordicScale)).toBe(RunDifficulty.INTERMEDIATE); // 12%
    expect(getEstimatedRunDifficulty(0.25, nordicScale)).toBe(RunDifficulty.ADVANCED); // 25%
  });

  it("should handle negative steepness (uphill)", () => {
    const downhillScale = getSlopeGradingScale({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {
        type: "Run" as any,
        uses: [RunUse.Downhill],
        id: "test",
        name: null,
        ref: null,
        status: "operating" as any,
        description: null,
        difficulty: null,
        difficultyConvention: "europe" as any,
        oneway: null,
        lit: null,
        gladed: null,
        patrolled: null,
        grooming: null,
        skiAreas: [],
        elevationProfile: null,
        sources: [],
        websites: [],
        wikidataID: null,
      },
    });

    expect(getEstimatedRunDifficulty(-0.1, downhillScale)).toBe(RunDifficulty.EASY); // -10%
  });
});