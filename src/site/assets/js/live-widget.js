console.log("Live widget loaded");

(async function () {
  const base = (window.BASE_URL || "/").replace(/\/+$/, "") + "/";
  async function fetchJson(url) {
    try {
      const r = await fetch(base + url.replace(/^\/+/, ""), { cache: "no-store" });
      if (!r.ok) throw new Error(r.statusText);
      return await r.json();
    } catch {
      return [];
    }
  }

  function el(id) { return document.getElementById(id); }

  async function render() {
    const [sessions, milestones, stream] = await Promise.all([
      fetchJson("data/sessions.json"),
      fetchJson("data/milestones.json"),
      fetchJson("data/stream.json")
    ]);

    const now = Date.now();
    const nowEl = el('live-now');
    const nextEl = el('live-next');
    const streamEl = el('live-stream');

    const liveNowEl = $("#live-now");
    const liveNextEl = $("#live-next");
    const liveStreamEl = $("#live-stream");
    if (!liveNowEl || !liveNextEl || !liveStreamEl) return; // guard

    const current = (sessions || []).find(s => {
      const st = parseStart(s);
      const en = s?.end ? new Date(s.end).getTime() : st + 2 * 60 * 60 * 1000;
      return st && now >= st && now <= en;
    });
    const upcoming = (sessions || [])
      .filter(s => parseStart(s) > now)
      .sort((a, b) => parseStart(a) - parseStart(b))[0];

    if (current) {
      liveNowEl.innerHTML =
        `🔴 <strong>LIVE</strong>: <a href="${current.url}">${current.topic || "Session"}</a>`;
    } else if (sessions && sessions.length) {
      const last = [...sessions].sort((a,b) => parseStart(b) - parseStart(a))[0];
      liveNowEl.innerHTML =
        `Currently not live. Last session: <a href="${last.url}">${last.topic || "Session"}</a>`;
    } else {
      liveNowEl.innerHTML = `<em>No sessions yet.</em>`;
    }

    liveNextEl.innerHTML = upcoming
      ? `<strong>Next:</strong> ${new Date(upcoming.start).toLocaleString()} — <a href="${upcoming.url}">${upcoming.topic || "Session"}</a>`
      : ``;

    const latest = (stream || []).slice(0, 5);
    liveStreamEl.innerHTML = latest.length
      ? `<ul>${latest.map(i =>
          `<li>${i.date ? `<small>${i.date}</small> ` : ""}${i.text || ""}</li>`
        ).join("")}</ul>`
      : `<em>No recent stream items yet.</em>`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();