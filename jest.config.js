// jest.config.js
export default {
    testEnvironment: 'node',
    transform: {}, // Required for pure ESM
    moduleNameMapper: {
      '^#src/(.*)$': '<rootDir>/src/$1',
    },
    // REMOVE extensionsToTreatAsEsm completely!
    // It's not needed anymore with "type": "module"
  };