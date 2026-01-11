const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const notesDir = './src/site/notes/published';

fs.readdirSync(notesDir).forEach(file => {
  if (!file.endsWith('.md')) return;
  
  const filePath = path.join(notesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(content);
  
  if (parsed.data.title) {
    parsed.data.title = parsed.data.title.toLowerCase();
    const updated = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filePath, updated);
    console.log(`Updated: ${file}`);
  }
});