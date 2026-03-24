import fs from 'fs';

let css = fs.readFileSync('components/Layout.tsx', 'utf8');
// Just checking if we need anything else on layout, wait, let's fix index.css actually.
css = fs.readFileSync('index.css', 'utf8');

// Change @theme variables
css = css.replace('--color-primary: #3a5f4b;', '--color-primary: #2F7D6B;\n  --color-primary-hover: #27695A;\n  --color-primary-active: #1F5448;\n  --color-sidebar: #1E2A28;\n  --color-card: #FFFFFF;\n  --color-bd-lines: #E3E8E6;\n  --color-tx-primary: #1C1F1E;\n  --color-tx-secondary: #6B7280;');

css = css.replace('--color-background-light: #e3e8e5;', '--color-background-light: #F6F8F7;');

// Append a layer to protect dark mode
const darkOverride = `

@layer theme {
  .dark, [data-theme="dark"] {
    --color-primary: #3a5f4b;
    --color-background-light: #e3e8e5;
    /* Other values will naturally fall back or be overridden by dark: utility classes */
  }
}
`;

if (!css.includes('.dark, [data-theme="dark"] {')) {
  css += darkOverride;
}

fs.writeFileSync('index.css', css);
console.log('index.css successfully updated');
