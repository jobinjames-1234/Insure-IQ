import fs from 'fs';
import path from 'path';

const errors = [
  { file: 'src/pages/b2b/LoginPage.tsx', vars: ['Link'] },
  { file: 'src/pages/customer/ClaimTrackerPage.tsx', vars: ['Download', 'Phone', 'Search'] },
  { file: 'src/pages/customer/CustomerHomePage.tsx', vars: ['Bell'] },
  { file: 'src/pages/superadmin/LoginPage.tsx', vars: ['Link'] },
  { file: 'src/pages/underwriting/AdminActivityView.tsx', vars: ['PersonAdd', 'NotificationsActive', 'Policy', 'LockOpen', 'FileDownload', 'index'] },
  { file: 'src/pages/underwriting/AdminDashboardPage.tsx', vars: ['FactCheck', 'PersonAdd', 'NotificationsActive', 'Policy'] },
  { file: 'src/pages/underwriting/AgentPolicyDetailPage.tsx', vars: ['isHome'] },
  { file: 'src/pages/underwriting/ApplicationDetailPage.tsx', vars: ['AlertTriangle', 'setRiskScore', 'isSuccess'] },
  { file: 'src/pages/underwriting/CommissionTrackerPage.tsx', vars: ['DollarSign'] },
  { file: 'src/pages/underwriting/DecisionHistoryPage.tsx', vars: ['ChevronUp'] },
  { file: 'src/pages/underwriting/GlobalSettingsPage.tsx', vars: ['React', 'Settings', 'Bell'] },
  { file: 'src/pages/underwriting/ModelPerformancePage.tsx', vars: ['Download'] },
  { file: 'src/pages/underwriting/PlatformUsersPage.tsx', vars: ['React'] },
  { file: 'src/pages/underwriting/PolicyConfigPage.tsx', vars: ['ChevronRight'] },
  { file: 'src/pages/underwriting/SLATrackerPage.tsx', vars: ['Home', 'Car'] },
];

for (const { file, vars } of errors) {
  const fullPath = path.join('/home/user/1Projects/Insure-IQ/frontend', file);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  for (const v of vars) {
    if (v === 'index') {
      content = content.replace(/\(activity,\s*index\)\s*=>/g, '(activity) =>');
      content = content.replace(/\(\w+,\s*index\)\s*=>/g, '($1) =>');
      continue;
    }
    
    if (v === 'React') {
      content = content.replace(/import React,\s*\{/g, 'import {');
      content = content.replace(/import React\s+from\s+['"]react['"];?\n?/g, '');
      continue;
    }
    
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.includes('import ') || line.includes('const ') || line.includes('let ')) {
        // Special handle for imports
        if (line.includes(` ${v},`) || line.includes(`, ${v}`) || line.includes(`{ ${v} }`)) {
          line = line.replace(new RegExp(`\\b${v}\\b\\s*,\\s*`), '');
          line = line.replace(new RegExp(`,\\s*\\b${v}\\b`), '');
          line = line.replace(new RegExp(`{\\s*\\b${v}\\b\\s*}`), '{}');
          line = line.replace(/\{\s*\}/, '');
          if (line.trim() === "import  from 'lucide-react'" || line.trim() === "import  from '@mui/icons-material'") {
             line = "";
          }
          lines[i] = line;
        } else if (line.includes('const [') && line.includes(v)) {
          lines[i] = `// ${line} (removed unused)`;
        } else if (line.includes(`const ${v} =`) || line.includes(`const ${v}=`)) {
          lines[i] = `// ${line} (removed unused)`;
        }
      }
    }
    // clear empty imports
    content = lines.join('\n');
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?/g, '');
  }
  
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', file);
}
