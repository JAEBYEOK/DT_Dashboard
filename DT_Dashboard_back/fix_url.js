const fs = require('fs');
const files = [
  'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src\\components\\dashboard\\TopKPIBar.jsx',
  'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src\\pages\\Comparison.jsx',
  'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src\\pages\\Dashboard.jsx',
  'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src\\pages\\hud\\CombinedHUD.jsx',
  'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src\\pages\\hud\\LeftMap.jsx',
  'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src\\pages\\hud\\RightCharts.jsx',
  'C:\\Users\\kaistys\\Desktop\\DT_Dashboard\\DT_Dashboard_front\\src\\pages\\RoutePlanning.jsx',
];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const updated = content.replace(
    'https://dt-dashboard-back.onrender.com/api',
    'http://localhost:3001/api'
  );
  fs.writeFileSync(f, updated, 'utf8');
  console.log('OK:', f.split('\\').pop());
}
console.log('완료');
