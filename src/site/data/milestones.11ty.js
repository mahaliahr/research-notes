const fs = require('fs');

class Milestones {
  data() {
    return {
      permalink: "/data/milestones.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ collections }) {
    const milestones = [];
    
    // Regex to match task lines with #milestone and optional @date
    // Matches: - [ ] task text #milestone @2025-01-20
    const milestoneRegex = /^[\s]*-\s\[([ xX])\]\s+([^\n]+?)#milestone(?:\s+@(\d{4}-\d{2}-\d{2}))?/gim;

    for (const note of collections.all || []) {
      if (!note.inputPath || !note.inputPath.endsWith('.md')) continue;
      
      let content;
      try {
        content = fs.readFileSync(note.inputPath, 'utf8');
      } catch (e) {
        continue;
      }

      // Only process if it contains #milestone
      if (!content.includes('#milestone')) continue;
      
      let match;
      while ((match = milestoneRegex.exec(content)) !== null) {
        const isChecked = match[1].toLowerCase() === 'x';
        // Capture everything before #milestone, then clean up
        let taskText = match[2].trim();
        // Remove any trailing date markers
        taskText = taskText.replace(/@\d{4}-\d{2}-\d{2}.*$/g, '').trim();
        const dueDate = match[3] || null;
        
        milestones.push({
          title: taskText,
          due: dueDate,
          url: note.url,
          noteTitle: note.data.title || note.fileSlug,
          checked: isChecked
        });
      }
    }

    // Sort by due date (earliest first), nulls last
    // Completed ones go to the bottom
    milestones.sort((a, b) => {
      // Completed items go last
      if (a.checked !== b.checked) {
        return a.checked ? 1 : -1;
      }
      
      // Then sort by date
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    });

    return JSON.stringify(milestones, null, 2);
  }
}

module.exports = Milestones;