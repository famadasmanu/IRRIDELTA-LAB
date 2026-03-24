import { execSync } from 'child_process';
try {
  const result = execSync('npm run build', { cwd: '..', encoding: 'utf8' });
  console.log('Build Output:', result);
} catch (e) {
  console.error('Build Error:', e.stdout);
  console.error('Build Error stderr:', e.stderr);
}
