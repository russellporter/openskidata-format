# OpenSkiData Format Repository Guidelines

## Build Commands

- Build: `npm run build`
- Test: `npm test`
- Test with watch mode: `npm run test:watch`
- Test with coverage: `npm run test:coverage`
- Run single test: `npx vitest run path/to/file.test.ts`
- Type check (includes tests): `npm run check-types`
- Format: `npm run format` / check only: `npm run format:check`

## Release Process

When releasing a new version:

1. Update the version in `package.json` following semantic versioning:
   - Major version (X.0.0): Breaking changes (e.g., renaming properties, changing types)
   - Minor version (0.X.0): New features, backwards compatible
   - Patch version (0.0.X): Bug fixes, backwards compatible
2. Commit all changes including the version bump
3. Push to master. The GitHub Actions workflow detects the changed version, creates the `vX.Y.Z`
   tag and GitHub release, and publishes to npm
4. After the format is released, update openskidata-processor and openskimap.org repos to use the new version

## Code Style Guidelines

- **TypeScript**: TypeScript 7 (native compiler), strict mode, ES2022 target
- **Modules**: Pure ESM (`"type": "module"`, `moduleResolution: nodenext`). Relative imports
  MUST carry an explicit `.js` extension, even from `.ts` sources.
- **Testing**: Vitest with `globals: true` — no need to import `describe`/`it`/`expect`
- **Naming**: PascalCase for types/interfaces/enums, camelCase for variables/functions
- **Exports**: Each model in separate file with all exports in index.ts
- **Types**: Explicit typing with null for optional values (not undefined)
- **Documentation**: JSDoc style comments for all exported types
- **Error Handling**: Use exhaustiveMatchingGuard for switch statements
- **Enums**: Use string values for better serialization
- **Imports**: Group by external then internal, no relative path traversal
- **GeoJSON**: Uses @types/geojson for typing
- **Turf.js**: Used for geospatial operations
- **Test placement**: Place .test.ts files adjacent to source files

## Repository Structure

- `src/`: TypeScript source files with model definitions
- `dist/`: Compiled JavaScript output (the only thing published; `src/` is not shipped)

## Packaging

The package is ESM-only and uses an `exports` map, so consumers can only import the package
root. The one extra exported subpath is `./package.json`, which openskidata-processor reads to
report the format version. `src/testUtils.ts` is intentionally excluded from the build.
