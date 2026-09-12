const names = {
  'aberdeen-city':'Aberdeen City','aberdeenshire':'Aberdeenshire','angus':'Angus','argyll-and-bute':'Argyll and Bute','clackmannanshire':'Clackmannanshire','dumfries-and-galloway':'Dumfries and Galloway','dundee-city':'Dundee City','east-ayrshire':'East Ayrshire','east-dunbartonshire':'East Dunbartonshire','east-lothian':'East Lothian','east-renfrewshire':'East Renfrewshire','city-of-edinburgh':'City of Edinburgh','na-h-eileanan-an-iar':'Na h-Eileanan an Iar','falkirk':'Falkirk','fife':'Fife','glasgow-city':'Glasgow City','highland':'Highland','inverclyde':'Inverclyde','midlothian':'Midlothian','moray':'Moray','north-ayrshire':'North Ayrshire','north-lanarkshire':'North Lanarkshire','orkney-islands':'Orkney Islands','perth-and-kinross':'Perth and Kinross','renfrewshire':'Renfrewshire','scottish-borders':'Scottish Borders','shetland-islands':'Shetland Islands','south-ayrshire':'South Ayrshire','south-lanarkshire':'South Lanarkshire','stirling':'Stirling','west-dunbartonshire':'West Dunbartonshire','west-lothian':'West Lothian'
};

const authorities = [
  'aberdeen-city','aberdeenshire','angus','argyll-and-bute','clackmannanshire','dumfries-and-galloway','dundee-city','east-ayrshire','east-dunbartonshire','east-lothian','east-renfrewshire','city-of-edinburgh','na-h-eileanan-an-iar','falkirk','fife','glasgow-city','highland','inverclyde','midlothian','moray','north-ayrshire','north-lanarkshire','orkney-islands','perth-and-kinross','renfrewshire','scottish-borders','shetland-islands','south-ayrshire','south-lanarkshire','stirling','west-dunbartonshire','west-lothian'
].map((id,i)=>{
  const [d,cx,cy] = BOUNDARIES[id.replace(/-/g,'_')];
  return {id,name:names[id],d,cx,cy,number:i+1};
});

let details = {};

function parseDetailsMarkdown(markdown) {
  const map = {};
  markdown.split(/\n(?=##\s)/).forEach(section => {
    const match = section.match(/^##\s*(.+)\n([\s\S]*)$/);
    if (!match) return;
    map[match[1].trim()] = match[2].trim();
  });
  return map;
}

function markdownToHtml(markdown) {
  return markdown.split(/\n\s*\n/).map(paragraph => {
    const escaped = paragraph.trim()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return `<p>${escaped}</p>`;
  }).join('');
}

const hotspots = document.querySelector('#hotspots');
const panel = document.querySelector('#info-panel');
const search = document.querySelector('#authority-search');
const mapWrap = document.querySelector('.map-wrap');
const tooltip = document.querySelector('#map-tooltip');
const svg = document.querySelector('#scotland-map');
const zoomInBtn = document.querySelector('#zoom-in');
const zoomOutBtn = document.querySelector('#zoom-out');
const zoomResetBtn = document.querySelector('#zoom-reset');

const BASE_W = 627.6;
const BASE_H = 900;
const ZOOM_STEP = 0.5;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3.0;

let zoomScale = 1.0;
let viewX = 0;
let viewY = 0;

let isDragging = false;
let startX = 0;
let startY = 0;
let startViewX = 0;
let startViewY = 0;
let hasDragged = false;

function updateViewBox() {
  const currentW = BASE_W / zoomScale;
  const currentH = BASE_H / zoomScale;

  const maxX = BASE_W - currentW;
  const maxY = BASE_H - currentH;
  viewX = Math.max(0, Math.min(maxX, viewX));
  viewY = Math.max(0, Math.min(maxY, viewY));

  svg.setAttribute('viewBox', `${viewX} ${viewY} ${currentW} ${currentH}`);

  if (zoomInBtn) zoomInBtn.disabled = zoomScale >= MAX_ZOOM;
  if (zoomOutBtn) zoomOutBtn.disabled = zoomScale <= MIN_ZOOM;
  if (zoomResetBtn) zoomResetBtn.disabled = (zoomScale === 1.0 && viewX === 0 && viewY === 0);

  if (mapWrap) {
    if (zoomScale > 1.0) {
      mapWrap.classList.add('is-zoomed');
    } else {
      mapWrap.classList.remove('is-zoomed');
    }
  }
}

function setZoom(newScale) {
  const targetScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
  if (targetScale === zoomScale) return;

  const oldW = BASE_W / zoomScale;
  const oldH = BASE_H / zoomScale;
  const centerX = viewX + oldW / 2;
  const centerY = viewY + oldH / 2;

  zoomScale = targetScale;
  const newW = BASE_W / zoomScale;
  const newH = BASE_H / zoomScale;

  viewX = centerX - newW / 2;
  viewY = centerY - newH / 2;

  updateViewBox();
}

function resetZoom() {
  zoomScale = 1.0;
  viewX = 0;
  viewY = 0;
  updateViewBox();
}

if (zoomInBtn) zoomInBtn.addEventListener('click', () => setZoom(zoomScale + ZOOM_STEP));
if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoom(zoomScale - ZOOM_STEP));
if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);

if (svg) {
  svg.addEventListener('pointerdown', e => {
    if (zoomScale <= 1 || e.button !== 0) return;
    isDragging = true;
    hasDragged = false;
    startX = e.clientX;
    startY = e.clientY;
    startViewX = viewX;
    startViewY = viewY;
  });

  svg.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      hasDragged = true;
      mapWrap.classList.add('is-panning');
      hideTooltip();
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    }

    if (hasDragged) {
      const svgRect = svg.getBoundingClientRect();
      const currentW = BASE_W / zoomScale;
      const currentH = BASE_H / zoomScale;

      const svgScaleX = currentW / svgRect.width;
      const svgScaleY = currentH / svgRect.height;

      viewX = startViewX - dx * svgScaleX;
      viewY = startViewY - dy * svgScaleY;

      updateViewBox();
    }
  });

  const stopDrag = e => {
    if (!isDragging) return;
    isDragging = false;
    mapWrap.classList.remove('is-panning');
    try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  svg.addEventListener('pointerup', stopDrag);
  svg.addEventListener('pointercancel', stopDrag);
}

function showTooltip(text, x, y) {
  if (!tooltip) return;
  tooltip.textContent = text;
  tooltip.classList.add('is-visible');
  tooltip.setAttribute('aria-hidden', 'false');
  updateTooltipPosition(x, y);
}

function hideTooltip() {
  if (!tooltip) return;
  tooltip.classList.remove('is-visible');
  tooltip.setAttribute('aria-hidden', 'true');
}

function updateTooltipPosition(x, y) {
  if (!tooltip || !mapWrap) return;
  const wrapRect = mapWrap.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = x;
  let top = y - 10;
  let isFlipped = false;

  const halfWidth = tooltipRect.width / 2;
  if (left - halfWidth < 8) {
    left = halfWidth + 8;
  } else if (left + halfWidth > wrapRect.width - 8) {
    left = wrapRect.width - halfWidth - 8;
  }

  if (top - tooltipRect.height < 8) {
    top = y + 20;
    isFlipped = true;
  }

  if (isFlipped) {
    tooltip.classList.add('is-flipped');
    tooltip.style.transform = 'translate(-50%, 0)';
  } else {
    tooltip.classList.remove('is-flipped');
    tooltip.style.transform = 'translate(-50%, -100%)';
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function selectAuthority(authority) {
  document.querySelectorAll('.hotspot').forEach(el=>el.classList.remove('is-selected'));
  document.querySelector(`[data-id="${authority.id}"]`)?.classList.add('is-selected');
  const body = details[authority.name] ? markdownToHtml(details[authority.name]) : '<p>Add your own project information here.</p>';
  panel.innerHTML = `
    <div class="selected-content">
      <div class="number">Local authority ${authority.number} of 32</div>
      <h2>${authority.name}</h2>
      ${body}
      <a href="https://www.gov.scot/publications/local-authority-maps-of-scotland/" target="_blank" rel="noopener">Official Scottish Government map information ↗</a>
    </div>`;
}

function renderMap() {
  hotspots.innerHTML = authorities.map(a => `
    <g class="hotspot" data-id="${a.id}" tabindex="0" role="button" aria-label="${a.name}">
      <path d="${a.d}"></path><text x="${a.cx}" y="${a.cy}">${a.number}</text>
    </g>`).join('');
  hotspots.querySelectorAll('.hotspot').forEach(el=>{
    const authority = authorities.find(a=>a.id===el.dataset.id);
    el.addEventListener('click', () => {
      if (hasDragged) {
        hasDragged = false;
        return;
      }
      selectAuthority(authority);
    });
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectAuthority(authority)}});

    el.addEventListener('mouseenter', e => {
      if (isDragging && hasDragged) return;
      const rect = mapWrap.getBoundingClientRect();
      showTooltip(authority.name, e.clientX - rect.left, e.clientY - rect.top);
    });
    el.addEventListener('mousemove', e => {
      if (isDragging && hasDragged) {
        hideTooltip();
        return;
      }
      const rect = mapWrap.getBoundingClientRect();
      updateTooltipPosition(e.clientX - rect.left, e.clientY - rect.top);
    });
    el.addEventListener('mouseleave', () => {
      hideTooltip();
    });
    el.addEventListener('focus', () => {
      const elRect = el.getBoundingClientRect();
      const wrapRect = mapWrap.getBoundingClientRect();
      const x = elRect.left + elRect.width / 2 - wrapRect.left;
      const y = elRect.top + elRect.height / 2 - wrapRect.top;
      showTooltip(authority.name, x, y);
    });
    el.addEventListener('blur', () => {
      hideTooltip();
    });
  });
}

search.addEventListener('input',()=>{
  const q=search.value.trim().toLowerCase();
  document.querySelectorAll('.hotspot').forEach(el=>{
    const a=authorities.find(x=>x.id===el.dataset.id);
    el.style.opacity=!q || a.name.toLowerCase().includes(q)?'1':'.18';
  });
});

renderMap();
updateViewBox();

fetch('data/details.md', { cache: 'no-store' })
  .then(res => res.text())
  .then(markdown => { details = parseDetailsMarkdown(markdown); })
  .catch(err => console.error('Could not load data/details.md', err));
