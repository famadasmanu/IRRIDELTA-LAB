import fs from 'fs';
import path from 'path';

function walk(dir) {
  let list = fs.readdirSync(dir);
  for (let file of list) {
    let fullPath = path.join(dir, file);
    let stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath);
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let newContent = content.replace(/\[#3A5F4B\]/gi, 'accent');
        
        // Sometimes it's used directly like color="#3A5F4B" or in style={{ color: '#3A5F4B' }}
        // But doing a blind replace to var(--color-accent) might break some raw uses. Let's just fix the brackets.
        
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent);
          console.log('Updated: ' + fullPath);
        }
      }
    }
  }
}

walk('./src');
console.log('Done replacing [#3A5F4B] with accent');
