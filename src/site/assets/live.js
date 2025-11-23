// Minimal relative-time formatter
const rt = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
function rel(ms){
  const s = Math.round(ms/1000), m = Math.round(s/60), h = Math.round(m/60), d = Math.round(h/24);
  if (Math.abs(s) < 45) return rt.format(s, "second");
  if (Math.abs(m) < 45) return rt.format(m, "minute");
  if (Math.abs(h) < 22) return rt.format(h, "hour");
  return rt.format(d, "day");
}

async function hydrateLiveStrip() {
  try {
    const bar = document.querySelector("[data-livebar]");
    if (!bar) return;
    const text = bar.querySelector("[data-livebar-text]");
    const dot  = bar.querySelector("[data-livebar-dot]");

    const [sessions, milestones] = await Promise.all([
      fetch("/data/sessions.json").then(r=>r.ok?r.json():[]).catch(()=>[]),
      fetch("/data/milestones.json").then(r=>r.ok?r.json():[]).catch(()=>[]),
    ]);

    const now = Date.now();
    const live = (sessions||[]).find(s => s.start && !s.end);
    if (live) {
      const started = new Date(live.start).getTime();
      const tick = () => {
        const mins = Math.max(0, Math.floor((Date.now()-started)/60000));
        text.innerHTML = `<strong>LIVE</strong> for ${mins} min — <a href="${live.url||'#'}">${live.topic||'In session'}</a>`;
      };
      bar.dataset.state = "on";
      tick();
      setInterval(tick, 60_000); // update minutes only
      return;
    }

    const next = (milestones||[]).filter(m=>m.due).sort((a,b)=> new Date(a.due)-new Date(b.due))[0];
    if (next) {
      const due = new Date(next.due).getTime();
      const tick = () => { text.innerHTML = `Next: <a href="${next.url||'#'}">${next.title||'Milestone'}</a> ${rel(due - Date.now())}`; };
      bar.dataset.state = "idle";
      tick();
      setInterval(tick, 60_000);
    } else {
      bar.dataset.state = "idle";
      text.textContent = "No upcoming milestones";
    }
  } catch (e) {
    console.error("[live] hydrate error", e);
  }
}

if (document.readyState !== "loading") hydrateLiveStrip();
else document.addEventListener("DOMContentLoaded", hydrateLiveStrip);
