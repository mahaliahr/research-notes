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

(function() {
  const base = (window.BASE_URL || '/').replace(/\/+$/, '') + '/';
  
  // Process wikilinks
  function processWikilinks(text) {
    if (!text) return text;
    return text.replace(/\[\[([^\]|#]+)(?:#[^\]]+)?(?:\|([^\]]+))?\]\]/g, (match, link, alias) => {
      const displayText = alias || link;
      const slug = link.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const url = `/notes/${slug}/`;
      return `<a href="${url}" class="internal-link">${displayText}</a>`;
    });
  }

  // Relative time
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  function relTime(d) {
    const ms = new Date(d).getTime() - Date.now();
    const m = Math.round(ms/60000);
    if(Math.abs(m)>=60) return rtf.format(Math.round(m/60),'hour');
    return rtf.format(m,'minute');
  }

  async function updateLive() {
    try {
      const data = await fetch(base + 'data/sessions.json').then(r=>r.json());
      if(!data?.length) return;
      
      const now = Date.now();
      const active = data.find(s => {
        const st=new Date(s.start).getTime();
        const en=s.end?new Date(s.end).getTime():null;
        return st<=now && (!en||en>=now);
      });
      
      const bar = document.querySelector('[data-livebar]');
      if(!bar) return;
      
      if(active) {
        const processedTopic = processWikilinks(active.topic || 'Working');
        bar.innerHTML = `<span class="dot"></span> <strong>Live:</strong> ${processedTopic} <small>(${relTime(active.start)})</small>`;
        bar.style.display='flex';
      } else {
        const upcoming = data.find(s=>new Date(s.start).getTime()>now);
        if(upcoming) {
          const processedTopic = processWikilinks(upcoming.topic || 'Session');
          bar.innerHTML = `<span class="dot off"></span> Next: ${processedTopic} <small>(${relTime(upcoming.start)})</small>`;
          bar.style.display='flex';
        } else {
          bar.style.display='none';
        }
      }
    } catch(e) {
      console.warn('Live bar fetch failed', e);
    }
  }

  if(document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', updateLive);
  } else {
    updateLive();
  }
  setInterval(updateLive, 30000);
})();
