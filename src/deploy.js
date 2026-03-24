const { execSync } = require('child_process');
try {
  console.log('Building...');
  execSync('npm run build', { cwd: '..', stdio: 'inherit' });
  console.log('Deploying to Firebase...');
  execSync('npx firebase deploy --only hosting', { cwd: '..', stdio: 'inherit' });
  console.log('Done!');
} catch (e) {
  console.error(e.message);
}
