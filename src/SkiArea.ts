import { Activity } from "./Activity";
import { FeatureType } from "./FeatureType";
import { LiftType } from "./Lift";
import { RunConvention, RunDifficulty } from "./Run";
import Source from "./Source";
import { Status } from "./Status";

export type SkiAreaFeature = GeoJSON.Feature<
  SkiAreaGeometry,
  SkiAreaProperties
>;

export type SkiAreaGeometry = GeoJSON.Point;

export interface SkiAreaProperties {
  type: FeatureType.SkiArea;
  id: string;
  name: string | null;
  sources: Source[];
  activities: Activity[];
  generated: boolean;
  statistics?: SkiAreaStatistics;
  status: Status | null;
  runConvention: RunConvention;
}

export interface SkiAreaStatistics {
  runs: RunStatistics;
  lifts: LiftStatistics;
  minElevation?: number;
  maxElevation?: number;
}

export interface RunStatistics {
  minElevation?: number;
  maxElevation?: number;
  byActivity: RunStatisticsByActivityAndDifficulty;
}

export type RunStatisticsByActivityAndDifficulty = {
  [key in Activity | "other"]: { byDifficulty: RunStatisticsByDifficulty };
};

export type RunStatisticsByDifficulty = {
  [key in RunDifficulty | "other"]: { count: number; lengthInKm: number };
};

export interface LiftStatistics {
  minElevation?: number;
  maxElevation?: number;
  byType: {
    [key in LiftType | "other"]: { count: number; lengthInKm: number };
  };
}

export interface MapObjectStatistics {
  count: number;
  lengthInKm: number;
  minElevation?: number;
  maxElevation?: number;
  combinedElevationChange?: number;
}
