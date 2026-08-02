const fs = require('fs');
const parser = require('@babel/parser');

function parseFile(path) {
  const code = fs.readFileSync(path, 'utf8');
  try {
    parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'optionalChaining'] });
    console.log(path + ': OK');
  } catch (err) {
    console.error('Error parsing', path);
    console.error(err.message);
    if (err.loc) {
      console.error('Line', err.loc.line, 'Column', err.loc.column);
      const lines = code.split('\n');
      const start = Math.max(0, err.loc.line - 5);
      const end = Math.min(lines.length, err.loc.line + 5);
      console.error(lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n'));
    }
  }
}

parseFile('./app/dashboard/customer/enquiries/[id]/page.js');
parseFile('./app/dashboard/customer/page.js');
