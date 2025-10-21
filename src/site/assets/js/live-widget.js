(function () {
  async function safeJson(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw 0;
      return await r.json();
    } catch {
      return [];
    }
  }

  (async function () {
  const $ = (sel) => document.querySelector(sel);
  const safeFetch = async (url) => {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(r.statusText);
      return await r.json();
    } catch (e) {
      console.warn("live-widget: failed", url, e);
      return []; // be graceful
    }
  };

  const [sessions, milestones, stream] = await Promise.all([
    safeFetch("/data/sessions.json"),
    safeFetch("/data/milestones.json"),
    safeFetch("/data/stream.json"),
  ]);

  // Live now / next from sessions
  const now = Date.now();
  const parse = (s) => (s && s.start ? new Date(s.start).getTime() : 0);
  const current = sessions.find(s => {
    const st = parse(s), en = s.end ? new Date(s.end).getTime() : st + 2*60*60*1000;
    return st && now >= st && now <= en;
  });
  const upcoming = sessions
    .filter(s => parse(s) > now)
    .sort((a,b)=>parse(a)-parse(b))[0];

  if (current) {
    $("#live-now").innerHTML =
      `<strong>Live now:</strong> <a href="${current.url}">${current.topic||"Session"}</a>`;
  } else {
    $("#live-now").innerHTML = `<em>Not live right now</em>`;
  }

  if (upcoming) {
    $("#live-next").innerHTML =
      `<strong>Next:</strong> ${new Date(upcoming.start).toLocaleString()} — <a href="${upcoming.url}">${upcoming.topic||"Session"}</a>`;
  }

  // Stream (latest 5)
  const latest = (stream || []).slice(0, 5);
  $("#live-stream").innerHTML = latest.length
    ? `<ul>${latest.map(i => `<li>${i.date ? `<small>${i.date}</small> `:""}${i.text||""}</li>`).join("")}</ul>`
    : `<em>No recent stream items yet.</em>`;
})();


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
