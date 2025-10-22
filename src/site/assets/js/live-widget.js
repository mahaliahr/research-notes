(async function () {
  async function fetchJson(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw 0;
      return await r.json();
    } catch {
      return [];
    }
  }

  function el(id) { return document.getElementById(id); }

  async function render() {
    const [milestones, sessions, stream] = await Promise.all([
      safeJson('/data/milestones.json'),
      safeJson('/data/sessions.json'),
      safeJson('/data/stream.json'),
    ]);

    const now = Date.now();
    const nowEl = el('live-now');
    const nextEl = el('live-next');
    const streamEl = el('live-stream');

    const live = Array.isArray(sessions)
      ? sessions.find(s => s && !s.end && (now - new Date(s.start).getTime()) < 2 * 60 * 60 * 1000)
      : null;

    nowEl.innerHTML = live
      ? `🔴 <strong>LIVE</strong>: <a href="${live.url}">${live.topic || 'Session'}</a>`
      : (Array.isArray(sessions) && sessions.length
          ? `Last session: <a href="${sessions[0].url}">${sessions[0].topic || 'Session'}</a>`
          : `No sessions yet.`);

    const upcoming = (Array.isArray(milestones) ? milestones : [])
      .filter(m => m && m.due && new Date(m.due) >= new Date())
      .slice(0, 5);

    nextEl.innerHTML = `<h4>Next milestones</h4>` + (
      upcoming.length
        ? `<ul>${upcoming.map(m => `<li><a href="${m.url}">${m.title}</a> — ${m.due} <em>${m.status || 'planned'}</em></li>`).join('')}</ul>`
        : `<p>Nothing scheduled.</p>`
    );

    const streamList = (Array.isArray(stream) ? stream : []).slice(0, 5);
    streamEl.innerHTML = `<h4>Stream</h4>` + (
      streamList.length
        ? `<ul>${streamList.map(s => `<li>${s.date || ''} — <a href="${s.url}">entry</a></li>`).join('')}</ul>`
        : `<p>No recent entries.</p>`
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();