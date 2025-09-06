import { getRunDifficultyConvention, RunDifficultyConvention } from "./RunDifficultyConvention";

describe("getRunDifficultyConvention", () => {
  it("should return JAPAN for locations in Japan", () => {
    // Point in Japan (Tokyo)
    const tokyoGeometry = {
      type: "Point" as const,
      coordinates: [139.6917, 35.6895]
    };

    expect(getRunDifficultyConvention(tokyoGeometry)).toBe(RunDifficultyConvention.JAPAN);
  });

  it("should return NORTH_AMERICA for locations in North America", () => {
    // Point in Colorado, USA
    const coloradoGeometry = {
      type: "Point" as const,
      coordinates: [-106.3731, 39.1911]
    };

    expect(getRunDifficultyConvention(coloradoGeometry)).toBe(RunDifficultyConvention.NORTH_AMERICA);

    // Point in British Columbia, Canada
    const bcGeometry = {
      type: "Point" as const,
      coordinates: [-123.1207, 49.2827]
    };

    expect(getRunDifficultyConvention(bcGeometry)).toBe(RunDifficultyConvention.NORTH_AMERICA);
  });

  it("should return EUROPE for locations in Europe", () => {
    // Point in the Alps (Chamonix, France)
    const chamonixGeometry = {
      type: "Point" as const,
      coordinates: [6.8694, 45.9237]
    };

    expect(getRunDifficultyConvention(chamonixGeometry)).toBe(RunDifficultyConvention.EUROPE);

    // Point in Austria
    const austriaGeometry = {
      type: "Point" as const,
      coordinates: [13.7558, 47.8095]
    };

    expect(getRunDifficultyConvention(austriaGeometry)).toBe(RunDifficultyConvention.EUROPE);
  });

  it("should return EUROPE as default for other locations", () => {
    // Point in South America (should default to Europe)
    const southAmericaGeometry = {
      type: "Point" as const,
      coordinates: [-58.3816, -34.6037] // Buenos Aires, Argentina
    };

    expect(getRunDifficultyConvention(southAmericaGeometry)).toBe(RunDifficultyConvention.EUROPE);
  });

  it("should work with LineString geometry", () => {
    // LineString crossing through Europe
    const lineGeometry = {
      type: "LineString" as const,
      coordinates: [[6.8, 45.9], [6.9, 46.0]]
    };

    expect(getRunDifficultyConvention(lineGeometry)).toBe(RunDifficultyConvention.EUROPE);
  });

  it("should work with Polygon geometry", () => {
    // Polygon in North America
    const polygonGeometry = {
      type: "Polygon" as const,
      coordinates: [[[-106.4, 39.1], [-106.3, 39.1], [-106.3, 39.2], [-106.4, 39.2], [-106.4, 39.1]]]
    };

    expect(getRunDifficultyConvention(polygonGeometry)).toBe(RunDifficultyConvention.NORTH_AMERICA);
  });
});