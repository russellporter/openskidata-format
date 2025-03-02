# OpenSkiData Format Repository Guidelines

## Build Commands
- Build: `npm run build`
- Release: `npm run build && npm publish`
- Test: `npm test`
- Test with watch mode: `npm run test:watch`
- Test with coverage: `npm run test:coverage`
- Run single test: `npm test -- path/to/file.test.ts`

## Code Style Guidelines
- **TypeScript**: Strict mode enabled with ES2020 target
- **Naming**: PascalCase for types/interfaces/enums, camelCase for variables/functions
- **Exports**: Each model in separate file with all exports in index.ts
- **Types**: Explicit typing with null for optional values (not undefined)
- **Documentation**: JSDoc style comments for all exported types
- **Error Handling**: Use exhaustiveMatchingGuard for switch statements 
- **Enums**: Use string values for better serialization
- **Imports**: Group by external then internal, no relative path traversal
- **GeoJSON**: Uses @types/geojson for typing
- **Turf.js**: Used for geospatial operations
- **Testing**: Place .test.ts files adjacent to source files

## Repository Structure
- `src/`: TypeScript source files with model definitions
- `dist/`: Compiled JavaScript output