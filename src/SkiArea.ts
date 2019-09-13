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
  statistics?: Statistics;
  status: Status | null;
  runConvention: RunConvention;
}

export interface Statistics {
  runs: RunStatistics;
  lifts: LiftStatistics;
}

export interface RunStatistics {
  byActivity: RunStatisticsByActivityAndDifficulty;
}

export type RunStatisticsByActivityAndDifficulty = {
  [key in Activity | "other"]: { byDifficulty: RunStatisticsByDifficulty };
};

export type RunStatisticsByDifficulty = {
  [key in RunDifficulty | "other"]: { count: number; lengthInKm: number };
};

export interface LiftStatistics {
  byType: {
    [key in LiftType | "other"]: { count: number; lengthInKm: number };
  };
}
