const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src';

function findBrokenChars(filePath) {
  const bytes = fs.readFileSync(filePath);
  let hasBroken = false;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0x3F && i + 1 < bytes.length && bytes[i+1] > 0x7F) {
      hasBroken = true;
      break;
    }
  }
  return hasBroken;
}

function walk(dir) {
  const broken = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) broken.push(...walk(full));
    else if ((f.endsWith('.jsx') || f.endsWith('.js')) && findBrokenChars(full)) {
      broken.push(full);
    }
  });
  return broken;
}

const brokenFiles = walk(srcDir);
console.log('깨진 파일 목록:');
brokenFiles.forEach(f => console.log(' -', f.replace(srcDir + '\\', '')));
console.log(`총 ${brokenFiles.length}개`);
