# OpenSkiData Format Repository Guidelines

## Build Commands
- Build: `npm run build`
- Test: `npm test`
- Test with watch mode: `npm run test:watch`
- Test with coverage: `npm run test:coverage`
- Run single test: `npm test -- path/to/file.test.ts`

## Release Process
When releasing a new version:
1. Update the version in `package.json` following semantic versioning:
   - Major version (X.0.0): Breaking changes (e.g., renaming properties, changing types)
   - Minor version (0.X.0): New features, backwards compatible
   - Patch version (0.0.X): Bug fixes, backwards compatible
2. Commit all changes including the version bump
3. Push to master
4. Create a GitHub release with tag `vX.Y.Z` (e.g., `v6.0.0`)
5. The GitHub Actions workflow will automatically build and publish to npm
6. After the format is released, update openskidata-processor and openskimap.org repos to use the new version

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