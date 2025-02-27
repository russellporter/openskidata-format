export const exhaustiveMatchingGuard = (value: never): never => {
  throw new Error(`Unhandled case: ${value}`)
}
