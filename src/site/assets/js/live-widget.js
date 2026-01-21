console.log("Live widget loaded");

(async function () {
  const base = (window.BASE_URL || "/").replace(/\/+$/, "") + "/";
  async function fetchJson(url) {
    try {
      const r = await fetch(base + url.replace(/^\/+/, ""), { cache: "no-store" });
      if (!r.ok) return [];
      return await r.json();
    } catch (e) {
      console.warn("live-widget: failed", url, e);
      return [];
    }
  }
  function $(sel) { return document.querySelector(sel); }

  // Relative time formatter
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  function relativeTime(date) {
    const ms = new Date(date).getTime() - Date.now();
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
    const [sessions, milestones, stream] = await Promise.all([
      fetchJson("data/sessions.json"),
      fetchJson("data/milestones.json"),
      fetchJson("data/stream.json")
    ]);

    const now = Date.now();
    const parseStart = s => (s && s.start ? new Date(s.start).getTime() : 0);

    const liveNowEl = $("#live-now");
    const liveNextEl = $("#live-next");
    const liveStreamEl = $("#live-stream");
    const widgetTitleEl = $("#live-widget-title");
    if (!liveNowEl || !liveNextEl || !liveStreamEl) return;

    // Find current session
    const current = (sessions || []).find(s => {
      const st = parseStart(s);
      const en = s?.end ? new Date(s.end).getTime() : st + 2 * 60 * 60 * 1000;
      return st && now >= st && now <= en;
    });

    // Find upcoming session
    const upcoming = (sessions || [])
      .filter(s => parseStart(s) > now)
      .sort((a, b) => parseStart(a) - parseStart(b))[0];

    // Find most recent past session
    const recent = (sessions || [])
      .filter(s => {
        const st = parseStart(s);
        const en = s?.end ? new Date(s.end).getTime() : st + 2 * 60 * 60 * 1000;
        return en < now;
      })
      .sort((a, b) => parseStart(b) - parseStart(a))[0];

    // Update widget title based on live status
    if (widgetTitleEl) {
      if (current) {
        widgetTitleEl.innerHTML = '🔴 Live';
        widgetTitleEl.className = 'live-widget-title live-active';
      } else {
        widgetTitleEl.innerHTML = 'Most Recent Updates';
        widgetTitleEl.className = 'live-widget-title';
      }
    }

    // Render current or recent session
    if (current) {
      liveNowEl.innerHTML = `
        <div class="live-status live-active">
          <strong>Happening now:</strong> 
          <a href="${current.url}">${current.topic || "Session"}</a>
          <small>started ${relativeTime(current.start)}</small>
        </div>
      `;
    } else if (recent) {
      liveNowEl.innerHTML = `
        <div class="live-status live-recent">
          <span>Most recent session: <a href="${recent.url}">${recent.topic || "Session"}</a></span>
          <small>ended ${relativeTime(recent.end || recent.start)}</small>
        </div>
      `;
    } else {
      liveNowEl.innerHTML = `
        <div class="live-status live-idle">
          <em>No recent sessions recorded yet.</em>
        </div>
      `;
    }

    // Render next session
    liveNextEl.innerHTML = upcoming
      ? `<div class="live-next">
          <strong>Next session:</strong> 
          <a href="${upcoming.url}">${upcoming.topic || "Session"}</a>
          <small>${relativeTime(upcoming.start)}</small>
         </div>`
      : ``;

    // Render stream
    const latest = (stream || []).slice(0, 5);
    liveStreamEl.innerHTML = latest.length
      ? `<ul class="stream-list">${latest.map(i =>
          `<li>${i.date ? `<small>${relativeTime(i.date)}</small> ` : ""}${i.text || ""}</li>`
        ).join("")}</ul>`
      : ``;

    // Render sessions
    await renderSessions(sessions);
  }

  async function renderSessions(sessions) {
    if (!sessions?.length) return;
    const ongoing = sessions.filter(s => s.start && !s.end); // Sessions without end time
    const completed = sessions.filter(s => s.start && s.end);
    
    const items = [];
    
    // Show ongoing sessions first with "In Progress" indicator
    for (const s of ongoing.slice(0, 2)) {
      items.push(`
        <div class="session-item ongoing">
          <span class="session-topic">${s.topic || 'Working...'}</span>
          <span class="session-status">In Progress</span>
          <time>${relativeTime(s.start)}</time>
        </div>
      `);
    }
    
    // Then show completed sessions
    for (const s of completed.slice(0, 3)) {
      const duration = s.end ? 
        Math.round((new Date(s.end) - new Date(s.start)) / 60000) + ' min' : 
        '';
      items.push(`
        <div class="session-item">
          <span class="session-topic">${s.topic || 'Session'}</span>
          ${duration ? `<span class="session-duration">${duration}</span>` : ''}
          <time>${relativeTime(s.start)}</time>
        </div>
      `);
    }
    
    if (items.length) {
      $("#live-sessions").innerHTML = items.join('');
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  // Update every 30 seconds
  setInterval(render, 30000);
})();