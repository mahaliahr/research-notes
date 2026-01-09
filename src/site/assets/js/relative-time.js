const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

function rel(deltaMs) {
  const sec = Math.round(deltaMs / 1000);
  const min = Math.round(sec / 60);
  const hr  = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (Math.abs(sec) < 45) return rtf.format(sec, "second");
  if (Math.abs(min) < 45) return rtf.format(min, "minute");
  if (Math.abs(hr)  < 22) return rtf.format(hr, "hour");
  return rtf.format(day, "day");
}

function update() {
  document.querySelectorAll("time[data-dt]").forEach((el) => {
    const t = Date.parse(el.dataset.dt);
    if (Number.isNaN(t)) return;
    el.textContent = rel(t - Date.now());
  });
}

if (document.readyState !== "loading") update();
else document.addEventListener("DOMContentLoaded", update);

setInterval(update, 60_000);
