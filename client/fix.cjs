const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');
content = content.replace(/\0/g, ''); // strip null bytes
const badStart = content.indexOf('/* Monaco Editor Context Menu Cleanup */');
if (badStart !== -1) {
  content = content.substring(0, badStart);
}
content += `
/* Monaco Editor Context Menu Cleanup */
.monaco-menu .action-item:has([aria-label="Go to Definition"]),
.monaco-menu .action-item:has([aria-label="Go to References"]),
.monaco-menu .action-item:has([aria-label="Go to Symbol..."]),
.monaco-menu .action-item:has([aria-label^="Peek"]),
.monaco-menu .action-item:has([aria-label="Rename Symbol"]),
.monaco-menu .action-item:has([aria-label="Change All Occurrences"]),
.monaco-menu .action-item:has([aria-label="Format Document"]) {
  display: none !important;
}
`;
fs.writeFileSync('src/index.css', content, 'utf8');
