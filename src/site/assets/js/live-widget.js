(function () {
  async function fetchJson(url) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(r.statusText);
      return await r.json();
    } catch (e) {
      console.warn("live-widget: failed", url, e);
      return [];
    }
  }
  function $(sel) { return document.querySelector(sel); }

  async function render() {
    const [sessions, milestones, stream] = await Promise.all([
      fetchJson("/data/sessions.json"),
      fetchJson("/data/milestones.json"),
      fetchJson("/data/stream.json")
    ]);

    const now = Date.now();
    const parseStart = s => (s && s.start ? new Date(s.start).getTime() : 0);

    // Current session = started and not ended (or within 2h window)
    const current = (sessions || []).find(s => {
      const st = parseStart(s);
      const en = s?.end ? new Date(s.end).getTime() : st + 2 * 60 * 60 * 1000;
      return st && now >= st && now <= en;
    });

    // Next upcoming = next future start
    const upcoming = (sessions || [])
      .filter(s => parseStart(s) > now)
      .sort((a, b) => parseStart(a) - parseStart(b))[0];

    const liveNowEl = $("#live-now");
    const liveNextEl = $("#live-next");
    const liveStreamEl = $("#live-stream");

    if (current) {
      liveNowEl.innerHTML =
        `🔴 <strong>LIVE</strong>: <a href="${current.url}">${current.topic || "Session"}</a>`;
    } else if (sessions && sessions.length) {
      const last = [...sessions].sort((a,b) => parseStart(b) - parseStart(a))[0];
      liveNowEl.innerHTML =
        `Not live. Last session: <a href="${last.url}">${last.topic || "Session"}</a>`;
    } else {
      liveNowEl.innerHTML = `<em>No sessions yet.</em>`;
    }

    if (upcoming) {
      liveNextEl.innerHTML =
        `<strong>Next:</strong> ${new Date(upcoming.start).toLocaleString()} — <a href="${upcoming.url}">${upcoming.topic || "Session"}</a>`;
    } else {
      liveNextEl.innerHTML = ``;
    }

    const latest = (stream || []).slice(0, 5);
    liveStreamEl.innerHTML = latest.length
      ? `<ul>${latest.map(i =>
          `<li>${i.date ? `<small>${i.date}</small> ` : ""}${i.text || ""}</li>`
        ).join("")}</ul>`
      : `<em>No recent stream items yet.</em>`;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();