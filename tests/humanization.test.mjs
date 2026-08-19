import assert from 'assert';
import fs from 'fs';

// Simple test to ensure README and logo exist (humanization smoke test)
const readmeExists = fs.existsSync('./README.md');
const logoExists = fs.existsSync('./public/icons/skillsconnect-logo.svg');

assert.strictEqual(readmeExists, true, 'README.md should exist');
assert.strictEqual(logoExists, true, 'Custom logo should exist at public/icons/skillsconnect-logo.svg');

console.log('Humanization checks passed.');
