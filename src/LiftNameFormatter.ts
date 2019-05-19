import { LiftProperties, LiftType } from ".";

export function getLiftNameAndType(properties: LiftProperties) {
  const name = properties.name;

  let liftTypePrefix = "";
  let liftType =
    implicitOccupancyLiftType(properties) || getLiftType(properties);
  let liftTypeSuffix = "";

  if (!isOccupancyImplicit(properties)) {
    const occupancy = properties.occupancy;
    if (occupancy) {
      liftTypePrefix += occupancy + "p ";
    }
  }

  const duration = properties.duration;
  if (duration) {
    liftTypeSuffix = duration + " mins";
  }

  const heated = properties.heating;
  const bubble = properties.bubble;
  if (heated === true) {
    liftTypePrefix = "Heated " + liftTypePrefix;
  } else if (
    bubble === true &&
    properties.liftType !== LiftType.CableCar &&
    properties.liftType !== LiftType.Gondola
  ) {
    liftTypePrefix = "Bubble " + liftTypePrefix;
  }

  const isImplicit = isLiftTypeImplicit(properties);
  if (isImplicit) {
    if (liftTypePrefix) {
      liftType = liftTypePrefix.trim() + " - " + liftTypeSuffix;
    } else {
      liftType = liftTypeSuffix;
    }
  } else if (liftType) {
    liftType = liftTypePrefix + liftType + " - " + liftTypeSuffix;
  }

  if (name && liftType) {
    return name + " (" + liftType + ")";
  } else if (name) {
    return name;
  } else {
    return liftType;
  }
}

function implicitOccupancyLiftType(properties: LiftProperties) {
  const occupancy = properties.occupancy;
  if (properties.liftType === LiftType.ChairLift) {
    switch (occupancy) {
      case 1:
        return "Single";
      case 2:
        return "Double";
      case 3:
        return "Triple";
      case 4:
        return "Quad";
      default:
        return null;
    }
  }

  switch (properties.liftType) {
    case LiftType.TBar:
      return "T-bar";
    case LiftType.JBar:
      return "J-bar";
    case LiftType.Platter:
      return "Platter";
    case LiftType.RopeTow:
      return "Ropetow";
    case LiftType.MagicCarpet:
      return "Magic Carpet";
  }
  return null;
}

function getLiftType(properties: LiftProperties) {
  switch (properties.liftType) {
    case LiftType.CableCar:
      return "Cable Car";
    case LiftType.Gondola:
      return "Gondola";
    case LiftType.ChairLift:
      return "Chairlift";
    case LiftType.MixedLift:
      return "Hybrid";
    case LiftType.DragLift:
      return "Drag lift";
    case LiftType.TBar:
      return "T-bar";
    case LiftType.JBar:
      return "J-bar";
    case LiftType.Platter:
      return "Platter";
    case LiftType.RopeTow:
      return "Ropetow";
    case LiftType.MagicCarpet:
      return "Magic Carpet";
    case LiftType.Funicular:
      return "Funicular";
    default:
      return null;
  }
}

function isOccupancyImplicit(properties: LiftProperties) {
  const implicitLiftType = implicitOccupancyLiftType(properties);
  if (implicitLiftType) {
    return true;
  }

  return containsAny(properties.name, [
    "t-bar",
    "j-bar",
    "platter",
    "rope tow",
    "ropetow",
    "rope-tow",
    "carpet",
    "single",
    "double",
    "triple",
    "quad",
    "1er",
    "2er",
    "3er",
    "4er",
    "6er",
    "8er"
  ]);
}

function isLiftTypeImplicit(properties: LiftProperties) {
  return containsAny(properties.name, [
    "cable car",
    "tramway",
    "gondola",
    "telecabin",
    "t-bar",
    "j-bar",
    "drag",
    "platter",
    "rope tow",
    "ropetow",
    "rope-tow",
    "carpet",
    "sesselbahn",
    "single",
    "double",
    "triple",
    "quad",
    "1er",
    "2er",
    "3er",
    "4er",
    "6er",
    "8er",
    "funicular"
  ]);
}

function containsAny(input: string | null, lowerCaseSearchList: string[]) {
  if (input === null) {
    return false;
  }

  const lowerCaseInput = input.toLowerCase();
  return (
    lowerCaseSearchList.findIndex(searchItem => {
      return lowerCaseInput.includes(searchItem);
    }) !== -1
  );
}
