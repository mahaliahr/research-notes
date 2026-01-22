console.log("Live widget loaded");

(async function () {
  const base = (window.BASE_URL || "/").replace(/\/+$/, "") + "/";
  
  async function fetchJson(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("Failed to fetch", url, e);
      return null;
    }
  }
  
  function $(sel) { return document.querySelector(sel); }

  // Process wikilinks in text
  function processWikilinks(text) {
    if (!text) return text;
    
    // Match [[link]] or [[link|alias]]
    return text.replace(/\[\[([^\]|#]+)(?:#[^\]]+)?(?:\|([^\]]+))?\]\]/g, (match, link, alias) => {
      const displayText = alias || link;
      const slug = link.toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      
      const url = `/notes/${slug}/`;
      return `<a href="${url}" class="internal-link">${displayText}</a>`;
    });
  }

  // Relative time formatter
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  function relativeTime(date) {
    if (!date) return "unknown time";
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.error("Invalid date:", date);
      return "invalid date";
    }
    
    const ms = d.getTime() - Date.now();
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    
    if (Math.abs(day) >= 1) return rtf.format(day, "day");
    if (Math.abs(hr) >= 1) return rtf.format(hr, "hour");
    if (Math.abs(min) >= 1) return rtf.format(min, "minute");
    return rtf.format(sec, "second");
  }

  async function render() {
    const sessions = await fetchJson(`${base}data/sessions.json`);
    const stream = await fetchJson(`${base}data/stream.json`);
    
    console.log("Loaded sessions:", sessions);
    console.log("Loaded stream:", stream);

    if (sessions) await renderSessions(sessions);
    if (stream) await renderStream(stream);
  }

  async function renderSessions(sessions) {
    const nowContainer = $("#live-now");
    const nextContainer = $("#live-next");
    
    if (!nowContainer || !nextContainer) {
      console.warn("Missing #live-now or #live-next containers");
      return;
    }

    if (!sessions || sessions.length === 0) {
      nowContainer.innerHTML = '<p class="no-data">No work sessions tracked yet</p>';
      nextContainer.innerHTML = '';
      return;
    }

    const now = Date.now();
    let currentSession = null;
    let nextSession = null;
    
    for (const s of sessions) {
      const start = new Date(s.start);
      const end = s.end ? new Date(s.end) : null;
      
      if (start.getTime() <= now && (!end || end.getTime() >= now)) {
        currentSession = s;
        break;
      }
    }
    
    for (const s of sessions) {
      const start = new Date(s.start);
      if (start.getTime() > now) {
        nextSession = s;
        break;
      }
    }
    
    if (!currentSession && sessions.length > 0) {
      currentSession = sessions[0];
    }

    if (currentSession) {
      const s = currentSession;
      const start = new Date(s.start);
      const end = s.end ? new Date(s.end) : null;
      const isActive = start.getTime() <= now && (!end || end.getTime() >= now);
      
      // Clear status text - either LIVE NOW or Most Recent
      const statusLabel = isActive ? 
        '<span class="status active">LIVE NOW</span>' : 
        '<span class="status">Most Recent</span>';
      
      const processedTopic = processWikilinks(s.topic || "Session");
      
      let duration = '';
      if (start && end) {
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const mins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        duration = `<span class="session-duration">${hours}h ${mins}m</span>`;
      }
      
      nowContainer.innerHTML = `
        <div class="session-card ${isActive ? 'active' : ''}">
          <div class="session-header">
            <h3>${processedTopic}</h3>
            ${statusLabel}
          </div>
          <div class="session-meta">
            <span>Started ${relativeTime(start)}</span>
            ${duration}
            ${!isActive && end ? `<span style="margin-left: 1rem;">Ended ${relativeTime(end)}</span>` : ''}
          </div>
          ${s.url ? `<a href="${s.url}" class="session-link">View full session →</a>` : ''}
        </div>
      `;
    } else {
      nowContainer.innerHTML = '<p class="no-data">No recent work sessions</p>';
    }

    if (nextSession) {
      const s = nextSession;
      const start = new Date(s.start);
      const processedTopic = processWikilinks(s.topic || "Upcoming session");
      
      nextContainer.innerHTML = `
        <div class="session-card upcoming">
          <div class="session-header">
            <h3>${processedTopic}</h3>
            <span class="status">Scheduled ${relativeTime(start)}</span>
          </div>
          ${s.url ? `<a href="${s.url}" class="session-link">View details →</a>` : ''}
        </div>
      `;
    } else {
      nextContainer.innerHTML = '';
    }
  }

  async function renderStream(items) {
    const container = $("#live-stream");
    if (!container) {
      console.warn("No #live-stream container found");
      return;
    }

    if (!items || items.length === 0) {
      container.innerHTML = '<p class="no-data">No stream updates yet</p>';
      return;
    }

    const html = items.slice(0, 5).map(item => {
      const time = relativeTime(item.date);
      // Process wikilinks in stream text
      const processedText = processWikilinks(item.text);
      
      return `
        <div class="stream-item">
          <span class="stream-time">${time}</span>
          <span class="stream-text">${processedText}</span>
          ${item.noteUrl ? `<a href="${item.noteUrl}" class="stream-link">→</a>` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="stream-list">${html}</div>`;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  setInterval(render, 30000);
})();