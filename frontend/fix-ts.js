import fs from 'fs';
import path from 'path';

const logOutput = fs.readFileSync('/home/user/.gemini/antigravity-ide/brain/d3681f3c-9cbd-4b9e-ba3c-eb104e0db0f1/.system_generated/tasks/task-5.log', 'utf-8');

const regex = /src\/pages\/[a-zA-Z0-9_\/]+\.tsx:\d+:\d+ - error TS6133: '([^']+)' is declared but its value is never read./g;
let match;
const replacements = new Map();

while ((match = regex.exec(logOutput)) !== null) {
  const filePathMatch = match[0].match(/src\/pages\/[a-zA-Z0-9_\/]+\.tsx/);
  if (!filePathMatch) continue;
  const filePath = filePathMatch[0];
  const variable = match[1];
  
  if (!replacements.has(filePath)) {
    replacements.set(filePath, new Set());
  }
  replacements.get(filePath).add(variable);
}

for (const [filePath, vars] of replacements.entries()) {
  const fullPath = path.join('/home/user/1Projects/Insure-IQ/frontend', filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  for (const v of vars) {
    if (v === 'index') {
      content = content.replace(/\(activity,\s*index\)\s*=>/g, '(activity) =>');
      content = content.replace(/\(\w+,\s*index\)\s*=>/g, '($1) =>');
      continue;
    }
    
    // For React
    if (v === 'React') {
      content = content.replace(/import React(?:,\s*\{[^}]+\})?\s+from\s+['"]react['"];?/g, (m) => {
        if (m.includes('{')) {
          return m.replace(/React,\s*/, '');
        }
        return '';
      });
      continue;
    }
    
    // Remove from import { a, b, c } from '...'
    const importRegex = new RegExp(`(\\b${v}\\b\\s*,\\s*|\\s*,\\s*\\b${v}\\b|\\s*{\\s*\\b${v}\\b\\s*}\\s*from|\\b${v}\\b)`, 'g');
    
    // It's safer to just do a simple replace on the lines with imports
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import ') || lines[i].includes('const ')) {
        // Special handle for imports
        let line = lines[i];
        if (line.includes(` ${v},`) || line.includes(`, ${v}`) || line.includes(`{ ${v} }`)) {
          line = line.replace(new RegExp(`\\b${v}\\b\\s*,\\s*`), '');
          line = line.replace(new RegExp(`,\\s*\\b${v}\\b`), '');
          line = line.replace(new RegExp(`{\\s*\\b${v}\\b\\s*}`), '');
          lines[i] = line;
        } else if (line.includes('const [') && line.includes(v)) {
          // e.g. const [isSuccess] =
          lines[i] = `// ${line} (removed unused)`;
        } else if (line.includes(`const ${v} =`)) {
          lines[i] = `// ${line} (removed unused)`;
        }
      }
    }
    content = lines.join('\n');
  }
  
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', filePath);
}
