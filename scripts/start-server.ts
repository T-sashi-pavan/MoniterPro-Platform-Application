import { execSync } from 'child_process';
import { existsSync } from 'fs';

// Check if the compiled server exists, if not, compile it
if (!existsSync('./dist/server/index.js')) {
  console.log('Compiling TypeScript...');
  execSync('npx tsc server/index.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --strict --skipLibCheck', { stdio: 'inherit' });
}

console.log('Starting server...');
execSync('node dist/server/index.js', { stdio: 'inherit' });
