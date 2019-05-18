import * as GeoJSON from "geojson";
import { FeatureType } from "./FeatureType";

export type RunGeometry = GeoJSON.LineString | GeoJSON.Polygon;

export type RunFeature = GeoJSON.Feature<RunGeometry, RunProperties>;

export type RunProperties = {
  type: FeatureType.Run;
  uses: RunUse[];
  id: string;
  name: string | null;
  ref: string | null;
  description: string | null;
  difficulty: RunDifficulty | null;
  oneway: boolean | null;
  lit: boolean | null;
  gladed: boolean | null;
  patrolled: boolean | null;
  color: string;
  colorName: ColorName;
  grooming: RunGrooming | null;
  skiAreas: string[];
};

export enum RunUse {
  Downhill = "downhill",
  Nordic = "nordic",
  Skitour = "skitour",
  Sled = "sled",
  Hike = "hike",
  Sleigh = "sleigh",
  IceSkate = "ice_skate",
  SnowPark = "snow_park",
  Playground = "playground",
  Connection = "connection"
}

export enum RunGrooming {
  Classic = "classic",
  Mogul = "mogul",
  ClassicAndSkating = "classic+skating",
  Skating = "skating",
  Scooter = "scooter",
  Backcountry = "backcountry"
}

export enum RunDifficulty {
  NOVICE = "novice",
  EASY = "easy",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  EXPERT = "expert",
  FREERIDE = "freeride",
  EXTREME = "extreme"
}

export enum ColorName {
  GREEN = "green",
  BLUE = "blue",
  RED = "red",
  BLACK = "black",
  ORANGE = "orange",
  PURPLE = "purple"
}
