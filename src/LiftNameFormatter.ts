import { LiftProperties, LiftType, getFormattedLiftType } from './Lift'

export function getLiftNameAndType(properties: LiftProperties) {
  const name = properties.name

  const liftType = getAugmentedLiftType(properties)

  if (name && liftType) {
    return `${name} (${liftType})`
  } else if (name) {
    return name
  } else {
    return liftType
  }
}

function getAugmentedLiftType(properties: LiftProperties): string | null {
  const components = []

  const heated = properties.heating
  const bubble = properties.bubble
  if (heated === true) {
    components.push('Heated')
  }

  if (
    bubble === true &&
    properties.liftType !== LiftType.CableCar &&
    properties.liftType !== LiftType.Gondola
  ) {
    components.push('Bubble')
  }

  if (!isOccupancyImplicit(properties) && properties.occupancy) {
    components.push(properties.occupancy + 'p')
  }

  const liftType =
    implicitOccupancyLiftType(properties) ||
    getFormattedLiftType(properties.liftType)
  if (liftType !== null) {
    components.push(liftType)
  }

  return components.join(' ')
}

function implicitOccupancyLiftType(properties: LiftProperties): string | null {
  const occupancy = properties.occupancy
  if (properties.liftType === LiftType.ChairLift) {
    switch (occupancy) {
      case 1:
        return 'Single'
      case 2:
        return 'Double'
      case 3:
        return 'Triple'
      case 4:
        return 'Quad'
      default:
        return null
    }
  }

  switch (properties.liftType) {
    case LiftType.TBar:
      return 'T-bar'
    case LiftType.JBar:
      return 'J-bar'
    case LiftType.Platter:
      return 'Platter'
    case LiftType.RopeTow:
      return 'Ropetow'
    case LiftType.MagicCarpet:
      return 'Magic Carpet'
  }
  return null
}

function isOccupancyImplicit(properties: LiftProperties) {
  const implicitLiftType = implicitOccupancyLiftType(properties)
  if (implicitLiftType) {
    return true
  }

  return containsAny(properties.name, [
    't-bar',
    'j-bar',
    'platter',
    'rope tow',
    'ropetow',
    'rope-tow',
    'carpet',
    'single',
    'double',
    'triple',
    'quad',
    '1er',
    '2er',
    '3er',
    '4er',
    '6er',
    '8er',
  ])
}

function containsAny(input: string | null, lowerCaseSearchList: string[]) {
  if (input === null) {
    return false
  }

  const lowerCaseInput = input.toLowerCase()
  return lowerCaseSearchList.some((searchItem) => {
    return lowerCaseInput.includes(searchItem)
  })
}
