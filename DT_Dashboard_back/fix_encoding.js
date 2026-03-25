const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src';
const brokenHex  = '3f8ceab3845f3f80';
const correctHex = Buffer.from('소계_대', 'utf8').toString('hex');

function fixFile(filePath) {
  const bytes = fs.readFileSync(filePath);
  const hex = bytes.toString('hex');
  const count = (hex.match(new RegExp(brokenHex, 'g')) || []).length;
  if (count > 0) {
    const fixedHex = hex.split(brokenHex).join(correctHex);
    fs.writeFileSync(filePath, Buffer.from(fixedHex, 'hex'));
    console.log(`수정: ${filePath.split('\\').slice(-2).join('/')} (${count}곳)`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f.endsWith('.jsx') || f.endsWith('.js')) fixFile(full);
  });
}

walk(srcDir);
console.log('전체 완료');
