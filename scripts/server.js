const { execSync, spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!existsSync(distDir)) {
  console.log('📁 Creating dist directory...');
  execSync('mkdir dist', { cwd: path.join(__dirname, '..') });
}

// Compile TypeScript server to JavaScript
console.log('🔨 Compiling TypeScript server...');
try {
  execSync('npx tsc server/index.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --strict --skipLibCheck --resolveJsonModule', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ TypeScript compilation completed');
} catch (error) {
  console.error('❌ TypeScript compilation failed:', error.message);
  process.exit(1);
}

// Start the server
console.log('🚀 Starting monitoring server...');
const serverPath = path.join(__dirname, '..', 'dist', 'server', 'index.js');

if (!existsSync(serverPath)) {
  console.error('❌ Compiled server file not found at:', serverPath);
  process.exit(1);
}

// Use spawn to keep the process running
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

serverProcess.on('error', (error) => {
  console.error('❌ Server process error:', error);
});

serverProcess.on('exit', (code) => {
  console.log(`🔌 Server process exited with code ${code}`);
});
