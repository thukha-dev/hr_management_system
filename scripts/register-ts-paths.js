// This file helps with module resolution in test scripts
const path = require('path');
const { config } = require('dotenv');

// Load environment variables first
config({ path: path.resolve(__dirname, '../.env.local') });

// Now load tsconfig-paths after environment is set up
const tsConfig = require('../tsconfig.json');
const tsConfigPaths = require('tsconfig-paths');

// Get the baseUrl from tsconfig
const baseUrl = path.resolve(process.cwd(), tsConfig.compilerOptions.baseUrl || '.');

// Register path aliases from tsconfig.json
tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});

console.log('TypeScript paths registered with baseUrl:', baseUrl);
