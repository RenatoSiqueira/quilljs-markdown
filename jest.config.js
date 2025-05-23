// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

export default {
  // All imported modules in your tests should be mocked automatically
  // automock: false,

  // Stop running tests after the first failure
  // bail: false,

  // Respect "browser" field in package.json when resolving modules
  // browser: false,

  // The directory where Jest should store its cached dependency information
  // cacheDirectory: "/var/folders/pk/f1qr8x290jn0xn57q3bj32_h0000gn/T/jest_dx",

  // Automatically clear mock calls and instances between every tests
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the tests
  // collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: null,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of regexp pattern strings used to skip coverage collection
  // coveragePathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // A listn of reporter names that Jest uses when writing coverage reports
  // coverageReporters: [
  //   "json",
  //   "text",
  //   "lcov",
  //   "clover"
  // ],

  // An object that configures minimum threshold enforcement for coverage results
  // coverageThreshold: null,

  // Make calling deprecated APIs throw helpful error messages
  // errorOnDeprecated: false,

  // Force coverage collection from ignored files usin a array of glob patterns
  // forceCoverageMatch: [],

  // A path to a module which exports an async function that is triggered once before all tests suites
  // globalSetup: null,

  // A path to a module which exports an async function that is triggered once after all tests suites
  // globalTeardown: null,

  // A set of global variables that need to be available in all tests environments
  // globals: {},

  // An array of directory names to be searched recursively up from the requiring module's location
  // moduleDirectories: [
  //   "node_modules"
  // ],

  // An array of file extensions your modules use
  // moduleFileExtensions: [
  //   "js",
  //   "json",
  //   "jsx",
  //   "node"
  // ],

  // A map from regular expressions to module names that allow to stub out resources with a single module
  // moduleNameMapper: {},

  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  // modulePathIgnorePatterns: [],

  // Activates notifications for tests results
  // notify: false,

  // An enum that specifies notification mode. Requires { notify: true }
  // notifyMode: "always",

  // A preset that is used as a base for Jest's configuration
  // preset: null,

  // Run tests from one or more projects
  // projects: null,

  // Use this configuration option to add custom reporters to Jest
  // reporters: undefined,

  // Automatically reset mock state between every tests
  // resetMocks: false,

  // Reset the module registry before running each individual tests
  // resetModules: false,

  // A path to a custom resolver
  // resolver: null,

  // Automatically restore mock state between every tests
  // restoreMocks: false,

  // The root directory that Jest should scan for tests and modules within
  // rootDir: null,

  // A listn of paths to directories that Jest should use to search for files in
  // roots: [
  //   "<rootDir>"
  // ],

  // Allows you to use a custom runner instead of Jest's default tests runner
  // runner: "jest-runner",

  // The paths to modules that run some code to configure or set up the testing environment before each tests
  // setupFiles: [],

  // The path to a module that runs some code to configure or set up the testing framework before each tests
  // setupTestFrameworkScriptFile: null,

  // A listn of paths to snapshot serializer modules Jest should use for snapshot testing
  // snapshotSerializers: [],

  // The tests environment that will be used for testing
  testEnvironment: "jsdom",

  // Options that will be passed to the testEnvironment
  // testEnvironmentOptions: {},

  // Adds a location field to tests results
  // testLocationInResults: false,

  // The glob patterns Jest uses to detect tests files
  // testMatch: [
  //   "**/__tests__/**/*.js?(x)",
  //   "**/?(*.)+(spec|tests).js?(x)"
  // ],

  // An array of regexp pattern strings that are matched against all tests paths, matched tests are skipped
  // testPathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // The regexp pattern Jest uses to detect tests files
  // testRegex: "",

  // This option allows the use of a custom results processor
  // testResultsProcessor: null,

  // This option allows use of a custom tests runner
  // testRunner: "jasmine2",

  // This option sets the URL for the jsdom environment. It is reflected in properties such as location.href
  // testURL: "http://localhost",

  // Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"
  // timers: "real",

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\.js$': 'babel-jest',
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  // transformIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them
  // unmockedModulePathPatterns: undefined,

  // Indicates whether each individual tests should be reported during the run
  // verbose: null,

  // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
  // watchPathIgnorePatterns: [],

  // Whether to use watchman for file crawling
  // watchman: true,
};
