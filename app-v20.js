/* =========================================================================
   Real data, sourced from "Europe region OPPs.xlsx" (won opportunities):
     - COUNTRY_DATA      (country-data.js)   country -> {name,count,amount,cats,subs,customers}
     - PARTNER_DETAILS   (partner-details.js) country -> [{name,count,products}], per-partner
                                               product breakdown for the click-to-reveal panel
     - COUNTRY_PATHS     (country-paths.js)  ISO alpha-3 -> {name,d,cx,cy} map geometry
   ========================================================================= */
function fmtUSD(n){
  if(n >= 1e9) return "$" + (n/1e9).toFixed(2) + "B";
  if(n >= 1e6) return "$" + (n/1e6).toFixed(1) + "M";
  if(n >= 1e3) return "$" + (n/1e3).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}
function fmtNum(n){ return n.toLocaleString("en-US"); }

/* map geometry (alpha-3) <-> real data (alpha-2) */
const A3_TO_A2 = {
  FRA:"fr", CHE:"ch", DEU:"de", ITA:"it", IRL:"ie", DNK:"dk", ESP:"es", BEL:"be",
  FIN:"fi", NOR:"no", POL:"pl", AUT:"at", GBR:"gb", PRT:"pt", NLD:"nl", GRC:"gr",
  CZE:"cz", HUN:"hu", ROU:"ro", BGR:"bg", HRV:"hr", SVN:"si", LTU:"lt", LVA:"lv", ALB:"al"
};
const A2_TO_A3 = Object.fromEntries(Object.entries(A3_TO_A2).map(([a3,a2])=>[a2,a3]));

/* =========================================================================
   Flags — real vector artwork, no image files / network calls needed.
   ========================================================================= */
const FLAG_SVG = {
  al:`<rect width="3" height="2" fill="#E41E20"/><g fill="#000" transform="translate(1.5,1)"><path d="M0 -0.55 L-0.42 -0.15 L-0.75 -0.22 L-0.55 0.05 L-0.85 0.15 L-0.5 0.28 L-0.55 0.5 L-0.2 0.32 L0 0.5 L0.2 0.32 L0.55 0.5 L0.5 0.28 L0.85 0.15 L0.55 0.05 L0.75 -0.22 L0.42 -0.15 Z"/><circle cx="-0.17" cy="-0.42" r="0.1"/><circle cx="0.17" cy="-0.42" r="0.1"/></g>`,
  at:`<rect width="3" height="2" fill="#ED2939"/><rect y="0.667" width="3" height="0.667" fill="#fff"/>`,
  be:`<rect width="1" height="2" fill="#000"/><rect x="1" width="1" height="2" fill="#FAE042"/><rect x="2" width="1" height="2" fill="#ED2939"/>`,
  bg:`<rect width="3" height="0.667" fill="#fff"/><rect y="0.667" width="3" height="0.667" fill="#00966E"/><rect y="1.333" width="3" height="0.667" fill="#D62612"/>`,
  hr:`<rect width="3" height="0.667" fill="#FF0000"/><rect y="0.667" width="3" height="0.667" fill="#fff"/><rect y="1.333" width="3" height="0.667" fill="#171796"/><rect x="1.25" y="0.55" width="0.5" height="0.6" fill="#fff" stroke="#171796" stroke-width="0.02"/><g fill="#FF0000"><rect x="1.25" y="0.55" width="0.1" height="0.15"/><rect x="1.45" y="0.55" width="0.1" height="0.15"/><rect x="1.65" y="0.55" width="0.1" height="0.15"/><rect x="1.35" y="0.7" width="0.1" height="0.15"/><rect x="1.55" y="0.7" width="0.1" height="0.15"/><rect x="1.25" y="0.85" width="0.1" height="0.15"/><rect x="1.45" y="0.85" width="0.1" height="0.15"/><rect x="1.65" y="0.85" width="0.1" height="0.15"/></g>`,
  cy:`<rect width="3" height="2" fill="#fff"/><path d="M1.05 0.85 Q1.5 0.62 1.95 0.85 Q1.85 1.05 1.5 1.0 Q1.15 1.05 1.05 0.85 Z" fill="#D57800"/><path d="M1.15 1.25 Q1.35 1.4 1.5 1.28" stroke="#4E7A34" stroke-width="0.05" fill="none"/><path d="M1.85 1.25 Q1.65 1.4 1.5 1.28" stroke="#4E7A34" stroke-width="0.05" fill="none"/>`,
  cz:`<rect width="3" height="1" fill="#fff"/><rect y="1" width="3" height="1" fill="#D7141A"/><path d="M0 0 L1.5 1 L0 2 Z" fill="#11457E"/>`,
  dk:`<rect width="3" height="2" fill="#C60C30"/><rect x="1.0" width="0.35" height="2" fill="#fff"/><rect y="0.825" width="3" height="0.35" fill="#fff"/>`,
  fi:`<rect width="3" height="2" fill="#fff"/><rect x="1.0" width="0.35" height="2" fill="#002F6C"/><rect y="0.825" width="3" height="0.35" fill="#002F6C"/>`,
  fr:`<rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#EF4135"/>`,
  de:`<rect width="3" height="0.667" fill="#000"/><rect y="0.667" width="3" height="0.667" fill="#DD0000"/><rect y="1.333" width="3" height="0.667" fill="#FFCC00"/>`,
  gr:`<rect width="3" height="2" fill="#0D5EAF"/><rect y="0.222" width="3" height="0.222" fill="#fff"/><rect y="0.667" width="3" height="0.222" fill="#fff"/><rect y="1.111" width="3" height="0.222" fill="#fff"/><rect y="1.556" width="3" height="0.222" fill="#fff"/><rect width="1.2" height="1.111" fill="#0D5EAF"/><rect x="0.45" width="0.3" height="1.111" fill="#fff"/><rect y="0.4" width="1.2" height="0.3" fill="#fff"/>`,
  hu:`<rect width="3" height="0.667" fill="#CE2939"/><rect y="0.667" width="3" height="0.667" fill="#fff"/><rect y="1.333" width="3" height="0.667" fill="#477050"/>`,
  ie:`<rect width="1" height="2" fill="#169B62"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#FF883E"/>`,
  it:`<rect width="1" height="2" fill="#008C45"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CD212A"/>`,
  lv:`<rect width="3" height="2" fill="#9E3039"/><rect y="0.85" width="3" height="0.3" fill="#fff"/>`,
  lt:`<rect width="3" height="0.667" fill="#FDB913"/><rect y="0.667" width="3" height="0.667" fill="#006A44"/><rect y="1.333" width="3" height="0.667" fill="#C1272D"/>`,
  mt:`<rect width="1.5" height="2" fill="#fff"/><rect x="1.5" width="1.5" height="2" fill="#CF142B"/><g transform="translate(0.34,0.34)"><rect x="-0.18" y="-0.18" width="0.36" height="0.36" fill="#CF142B"/><rect x="-0.14" y="-0.14" width="0.28" height="0.28" fill="silver"/><rect x="-0.05" y="-0.14" width="0.1" height="0.28" fill="#CF142B"/><rect x="-0.14" y="-0.05" width="0.28" height="0.1" fill="#CF142B"/></g>`,
  nl:`<rect width="3" height="0.667" fill="#AE1C28"/><rect y="0.667" width="3" height="0.667" fill="#fff"/><rect y="1.333" width="3" height="0.667" fill="#21468B"/>`,
  no:`<rect width="3" height="2" fill="#EF2B2D"/><rect x="0.9" width="0.55" height="2" fill="#fff"/><rect y="0.725" width="3" height="0.55" fill="#fff"/><rect x="1.05" width="0.25" height="2" fill="#002868"/><rect y="0.875" width="3" height="0.25" fill="#002868"/>`,
  pl:`<rect width="3" height="1" fill="#fff"/><rect y="1" width="3" height="1" fill="#DC143C"/>`,
  pt:`<rect width="1.2" height="2" fill="#046A38"/><rect x="1.2" width="1.8" height="2" fill="#DA020E"/><circle cx="1.2" cy="1" r="0.32" fill="#FFCC00" stroke="#fff" stroke-width="0.03"/><circle cx="1.2" cy="1" r="0.2" fill="#DA020E"/>`,
  ro:`<rect width="1" height="2" fill="#002B7F"/><rect x="1" width="1" height="2" fill="#FCD116"/><rect x="2" width="1" height="2" fill="#CE1126"/>`,
  si:`<rect width="3" height="0.667" fill="#fff"/><rect y="0.667" width="3" height="0.667" fill="#005CB9"/><rect y="1.333" width="3" height="0.667" fill="#ED1C24"/><g transform="translate(0.55,0.55)"><path d="M-0.14 0 L0 -0.18 L0.14 0 L0.14 0.22 L0 0.32 L-0.14 0.22 Z" fill="#ED1C24" stroke="#005CB9" stroke-width="0.02"/><path d="M-0.14 0.15 Q0 0.05 0.14 0.15 L0.14 0.22 L0 0.32 L-0.14 0.22 Z" fill="#fff"/></g>`,
  es:`<rect width="3" height="2" fill="#AA151B"/><rect y="0.5" width="3" height="1" fill="#F1BF00"/><rect x="0.55" y="0.78" width="0.32" height="0.44" fill="#AD1519" stroke="#8a6d00" stroke-width="0.02"/>`,
  ch:`<rect width="3" height="2" fill="#D52B1E"/><rect x="1.28" y="0.6" width="0.44" height="0.8" fill="#fff"/><rect x="1.08" y="0.8" width="0.84" height="0.4" fill="#fff"/>`,
  tr:`<rect width="3" height="2" fill="#E30A17"/><circle cx="1.25" cy="1" r="0.5" fill="#fff"/><circle cx="1.4" cy="1" r="0.42" fill="#E30A17"/><path d="M1.75 0.86 L1.783 0.955 L1.883 0.955 L1.802 1.017 L1.832 1.113 L1.75 1.055 L1.668 1.113 L1.698 1.017 L1.617 0.955 L1.717 0.955 Z" fill="#fff"/>`,
  gb:`<rect width="3" height="2" fill="#012169"/><path d="M0 0 L1.2 0.8 L0.9 0.8 Z M3 0 L1.8 0.8 L2.1 0.8 Z M0 2 L1.2 1.2 L0.9 1.2 Z M3 2 L1.8 1.2 L2.1 1.2 Z" fill="#fff"/><path d="M0 0 L1.35 0.9 L1.15 0.9 Z M3 0 L1.65 0.9 L1.85 0.9 Z M0 2 L1.35 1.1 L1.15 1.1 Z M3 2 L1.65 1.1 L1.85 1.1 Z" fill="#C8102E"/><rect x="1.2" width="0.6" height="2" fill="#fff"/><rect y="0.7" width="3" height="0.6" fill="#fff"/><rect x="1.32" width="0.36" height="2" fill="#C8102E"/><rect y="0.82" width="3" height="0.36" fill="#C8102E"/>`,
};
function flagSVG(code){
  const inner = FLAG_SVG[code] || `<rect width="3" height="2" fill="#333"/>`;
  return `<svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

/* =========================================================================
   Partner logo tiles — real logos (via PARTNER_LOGOS / partnerLogoURL,
   loaded from partner-logos.js) for partners we could confidently verify,
   with a graceful initials-badge fallback for everyone else (or if the
   real logo image fails to load).
   ========================================================================= */
function hashHue(str){
  let h = 0;
  for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h % 360;
}
function initialsFor(name){
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if(words.length === 0) return "?";
  if(words.length === 1) return words[0].slice(0,2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
function logoTileHTML(name, size){
  const hue = hashHue(name);
  const ini = initialsFor(name);
  const sizeClass = size === "sm" ? " logo-sm" : "";
  const url = typeof partnerLogoURL === "function" ? partnerLogoURL(name) : null;
  if(url){
    return `<div class="cp-logo${sizeClass}" style="--fallback-hue:${hue}">
      <img src="${url}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('img-failed')">
      <span class="cp-logo-fallback">${ini}</span>
    </div>`;
  }
  return `<div class="cp-logo no-domain${sizeClass}" style="--fallback-hue:${hue}">
    <span class="cp-logo-fallback">${ini}</span>
  </div>`;
}

/* =========================================================================
   "OUR PRESENCE IN EUROPE" coverage grid
   ========================================================================= */
const coverageEntries = Object.keys(COUNTRY_DATA)
  .map(code => ({ code, ...COUNTRY_DATA[code] }))
  .sort((a,b)=>a.name.localeCompare(b.name));

const CATEGORY_ORDER = ["Power Cables", "Special Cables", "Telecom Cabling", "Transformers", "EPC Power Generation", "Accessories", "Plastics"];
const coverageCategories = CATEGORY_ORDER.filter(name =>
  coverageEntries.some(c => c.cats.some(x => x.name === name))
);

/* shared selection state, driving both the map + the partners panel below it */
let selectedCategory = "All";
let selectedCountryCode = null; // alpha-2, or null

const coverageFiltersEl = document.getElementById("coverage-filters");
const coverageGridEl = document.getElementById("coverage-grid");

function renderCoverageChips(){
  const all = ["All", ...coverageCategories];
  coverageFiltersEl.innerHTML = all.map(c=>`<div class="chip ${c===selectedCategory?'active':''}" data-c="${c}">${c}</div>`).join("");
  coverageFiltersEl.querySelectorAll(".chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      selectedCategory = chip.dataset.c;
      renderCoverageChips();
      applyCoverageFilter();
      applyMapFilter();
      renderPartnersPanel();
    });
  });
}
renderCoverageChips();

coverageGridEl.innerHTML = coverageEntries.map(c=>`
  <div class="coverage-card" data-code="${c.code}" data-tags="${c.cats.map(x=>x.name).join('|')}" title="Click for details">
    <div class="flag-circle">${flagSVG(c.code)}</div>
    <div class="cname">${c.name}</div>
  </div>
`).join("");

/* When a specific country is selected (via map click or flag-icon click),
   that country's card is the only one highlighted — every other card dims.
   Otherwise, fall back to category-chip filtering as before. */
function applyCoverageFilter(){
  document.querySelectorAll(".coverage-card").forEach(el=>{
    const code = el.dataset.code;
    if(selectedCountryCode){
      const isSelected = code === selectedCountryCode;
      el.classList.toggle("selected", isSelected);
      el.classList.toggle("dimmed", !isSelected);
      return;
    }
    el.classList.remove("selected");
    const tags = el.dataset.tags.split("|");
    const match = selectedCategory==="All" || tags.includes(selectedCategory);
    el.classList.toggle("dimmed", !match);
  });
}

const coverageIO = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in-view"); coverageIO.unobserve(e.target);} });
},{threshold:0.1});
document.querySelectorAll(".coverage-card").forEach(c=>coverageIO.observe(c));

/* Clicking a country's flag highlights it (dimming every other flag) and on
   the map above, and jumps straight down to the partners panel at the bottom. */
coverageGridEl.addEventListener("click", (e)=>{
  const card = e.target.closest(".coverage-card");
  if(!card) return;
  toggleCountry(card.dataset.code, { scroll:true });
});

/* =========================================================================
   Stats row — static, non-interactive summary numbers.
   ========================================================================= */
const statsRowEl = document.getElementById("stats-row");

const allPartnerNames = new Set();
Object.values(PARTNER_DETAILS).forEach(list => list.forEach(p => allPartnerNames.add(p.name)));

const totalRevenue = coverageEntries.reduce((s,c)=>s+c.amount, 0);
const revenueFigure = (totalRevenue/1e9).toFixed(1) + "B+";

const STATS_FIGURES = [
  { num:String(coverageEntries.length),    lbl:"Countries" },
  { num:String(allPartnerNames.size),      lbl:"Partners" },
  { num:revenueFigure,                     lbl:"Revenue in USD" },
  { num:"85+",     lbl:"Years of Evolution" },
  { num:"10,000+", lbl:"Delivered Solutions" },
  { num:"1",       lbl:"Production Facility" },
  { num:"5",       lbl:"International Offices" },
];
statsRowEl.innerHTML = STATS_FIGURES
  .map(f=>`<div class="stat-item"><div class="num">${f.num}</div><div class="lbl">${f.lbl}</div></div>`)
  .join("");

/* =========================================================================
   Partners panel — appears below the map, populated only once the user
   clicks a specific country (map or coverage grid) or a product chip.
   ========================================================================= */
const cpEmptyEl = document.getElementById("cp-empty");
const cpPanelEl = document.getElementById("cp-panel");
const cpHeadEl = document.getElementById("cp-head");
const cpGridEl = document.getElementById("cp-grid");

/* Clicking the currently-selected country a second time deselects it,
   restoring every flag/country to its normal (non-dimmed) state. */
function toggleCountry(code, opts={}){
  if(selectedCountryCode === code){
    clearSelection();
  } else {
    selectCountry(code, opts);
  }
}

function selectCountry(code, opts={}){
  selectedCountryCode = code;
  renderPartnersPanel();
  highlightMapCountry(code);
  applyCoverageFilter();
  if(opts.scroll){
    const targetId = opts.scrollTo === "map" ? "map" : "country-partners";
    document.getElementById(targetId).scrollIntoView({behavior:"smooth", block:"start"});
  }
  if(opts.spotlightPartner){
    setTimeout(()=>{
      const card = [...document.querySelectorAll(".cp-card")].find(c=>c.dataset.name === opts.spotlightPartner);
      if(card){
        card.scrollIntoView({behavior:"smooth", block:"center"});
        card.classList.add("spotlight");
        setTimeout(()=>card.classList.remove("spotlight"), 1800);
      }
    }, 300);
  }
}

function clearSelection(){
  selectedCountryCode = null;
  selectedCategory = "All";
  renderCoverageChips();
  applyCoverageFilter();
  applyMapFilter();
  highlightMapCountry(null);
  renderPartnersPanel();
}

function partnerCardHTML(p, countryName){
  return `
    <div class="cp-card" data-name="${p.name}">
      <div class="cp-card-top">
        ${logoTileHTML(p.name)}
        <div class="cp-card-title">
          <div class="cp-name">${p.name}</div>
          ${countryName ? `<div class="cp-country">${countryName}</div>` : ``}
        </div>
      </div>
      <div class="cp-count"><b>${fmtNum(p.count)}</b> Project${p.count===1?'':'s'}</div>
      <div class="cp-tags">${p.products.map(t=>`<span class="cp-tag">${t}</span>`).join("")}</div>
    </div>
  `;
}

function renderPartnersPanel(){
  const hasCountry = !!selectedCountryCode;
  const hasCategory = selectedCategory !== "All";

  if(!hasCountry && !hasCategory){
    cpEmptyEl.style.display = "";
    cpPanelEl.classList.remove("show");
    return;
  }
  cpEmptyEl.style.display = "none";
  cpPanelEl.classList.add("show");

  if(hasCountry){
    const d = COUNTRY_DATA[selectedCountryCode];
    const list = (PARTNER_DETAILS[selectedCountryCode]||[])
      .filter(p => !hasCategory || p.products.includes(selectedCategory));

    cpHeadEl.innerHTML = `
      <div class="cp-head-left">
        <div class="cp-flag">${flagSVG(selectedCountryCode)}</div>
        <div>
          <div class="cp-title">Partners in ${d ? d.name : selectedCountryCode.toUpperCase()}</div>
          <div class="cp-subtitle">${hasCategory ? `Showing ${selectedCategory} partners · ` : ``}<b>${list.length} partner${list.length===1?'':'s'}</b>${d ? ` · <b>${fmtNum(d.count)} Projects won</b>` : ``}</div>
        </div>
      </div>
      <button class="cp-clear" id="cp-clear-inline">Clear selection</button>
    `;
    cpHeadEl.querySelector("#cp-clear-inline").addEventListener("click", clearSelection);

    cpGridEl.innerHTML = list.length
      ? list.map(p=>partnerCardHTML(p, null)).join("")
      : `<div class="cp-empty" style="grid-column:1/-1;">No partners tagged "${selectedCategory}" in ${d?d.name:''} yet.</div>`;
  } else {
    // product-only mode: aggregate across every country
    const all = [];
    Object.entries(PARTNER_DETAILS).forEach(([code, list])=>{
      list.forEach(p=>{
        if(p.products.includes(selectedCategory)) all.push({ ...p, code });
      });
    });
    all.sort((a,b)=>b.count-a.count);
    const shown = all.slice(0, 40);

    cpHeadEl.innerHTML = `
      <div class="cp-head-left">
        <div>
          <div class="cp-title">Partners providing ${selectedCategory}</div>
          <div class="cp-subtitle"><b>${all.length} partner${all.length===1?'':'s'}</b> across Europe · click a country on the map to narrow this down</div>
        </div>
      </div>
      <button class="cp-clear" id="cp-clear-inline">Clear selection</button>
    `;
    cpHeadEl.querySelector("#cp-clear-inline").addEventListener("click", clearSelection);

    cpGridEl.innerHTML = shown.map(p=>partnerCardHTML(p, COUNTRY_DATA[p.code] ? COUNTRY_DATA[p.code].name : "")).join("")
      + (all.length > shown.length ? `<div class="cp-truncnote" style="grid-column:1/-1;">Showing top ${shown.length} of ${all.length} by Project count.</div>` : ``);
  }

  const cpIO = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in-view"); cpIO.unobserve(e.target);} });
  },{threshold:0.1});
  cpGridEl.querySelectorAll(".cp-card").forEach(c=>cpIO.observe(c));
}
renderPartnersPanel();

/* ---------------- tooltip (map hover) ---------------- */
const tooltip = document.getElementById("tooltip");
function showTooltip(a2, evt){
  const d = COUNTRY_DATA[a2];
  if(!d) return;
  const top = (PARTNER_DETAILS[a2]||[]).slice(0,3);
  tooltip.innerHTML = `
    <div class="tt-country">📍 ${d.name}</div>
    <div style="font-size:12px; color:var(--text-1); margin-bottom:8px;">${fmtNum(d.count)} Project${d.count===1?'':'s'}</div>
    ${top.map(p=>`
      <div class="tt-partner">
        ${logoTileHTML(p.name, "sm")}
        <div class="tt-info">
          <div class="tt-name">${p.name}</div>
          <div class="tt-meta">${p.products.join(", ")}</div>
        </div>
      </div>
    `).join("")}
    <div style="margin-top:8px; font-size:11px; color:var(--ew-gold); font-weight:600;">Click to see all partners ↓</div>
  `;
  positionTooltip(evt);
  tooltip.classList.add("show");
}
function positionTooltip(evt){
  const pad = 18;
  let x = evt.clientX + pad;
  let y = evt.clientY + pad;
  const tw = 250, th = tooltip.offsetHeight || 140;
  if(x + tw > window.innerWidth - 10) x = evt.clientX - tw - pad;
  if(y + th > window.innerHeight - 10) y = evt.clientY - th - pad;
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
}
function hideTooltip(){ tooltip.classList.remove("show"); }

/* ---------------- map filter (dims countries that don't match selectedCategory) ---------------- */
function applyMapFilter(){
  document.querySelectorAll(".country.has-partner").forEach(el=>{
    const a2 = A3_TO_A2[el.dataset.id];
    const d = a2 && COUNTRY_DATA[a2];
    const match = selectedCategory==="All" || (d && d.cats.some(c=>c.name===selectedCategory));
    el.classList.toggle("dimmed", !match);
  });
}
function highlightMapCountry(a2){
  document.querySelectorAll(".country.has-partner.selected").forEach(el=>el.classList.remove("selected"));
  if(!a2) return;
  const a3 = A2_TO_A3[a2];
  const el = a3 && document.querySelector(`.country[data-id="${a3}"]`);
  if(el) el.classList.add("selected");
}

/* ---------------- map rendering (static embedded paths from country-paths.js) ---------------- */
const svgNS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("map-svg");
const g = document.createElementNS(svgNS, "g");
svg.appendChild(g);

Object.keys(COUNTRY_PATHS).forEach(id=>{
  const c = COUNTRY_PATHS[id];
  const a2 = A3_TO_A2[id];
  const isPartner = !!(a2 && COUNTRY_DATA[a2]);
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", c.d);
  path.setAttribute("class", "country " + (isPartner ? "has-partner" : "no-partner"));
  path.setAttribute("data-id", id);

  if(isPartner){
    path.addEventListener("mouseenter", (evt)=>{
      path.classList.add("focus");
      showTooltip(a2, evt);
    });
    path.addEventListener("mousemove", (evt)=> positionTooltip(evt));
    path.addEventListener("mouseleave", ()=>{
      path.classList.remove("focus");
      hideTooltip();
    });
    path.addEventListener("click", ()=>{
      toggleCountry(a2, { scroll:true });
    });
  }

  const title = document.createElementNS(svgNS, "title");
  title.textContent = c.name;
  path.appendChild(title);

  g.appendChild(path);
});

/* ---------------- terrain texture overlay ----------------
   A single low-opacity fractal-noise layer laid over the whole map, blended
   with mix-blend-mode:overlay (in CSS). This gives the flat vector country
   shapes a subtle relief/grain, satellite-map feel — no glow, no blur, no
   brightening. Active countries stay exactly var(--ew-red) / #D71920
   underneath; the noise only adds texture. */
const defs = document.createElementNS(svgNS, "defs");
defs.innerHTML = `
  <filter id="terrainNoise" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/>
  </filter>
`;
svg.insertBefore(defs, svg.firstChild);

const terrainOverlay = document.createElementNS(svgNS, "rect");
terrainOverlay.setAttribute("x", "0");
terrainOverlay.setAttribute("y", "0");
terrainOverlay.setAttribute("width", "980");
terrainOverlay.setAttribute("height", "720");
terrainOverlay.setAttribute("filter", "url(#terrainNoise)");
terrainOverlay.setAttribute("class", "terrain-overlay");
g.appendChild(terrainOverlay);

/* country name labels — drawn in a second pass so every label sits on top of all fills */
Object.keys(COUNTRY_PATHS).forEach(id=>{
  const c = COUNTRY_PATHS[id];
  const isPartner = !!(A3_TO_A2[id] && COUNTRY_DATA[A3_TO_A2[id]]);
  const label = document.createElementNS(svgNS, "text");
  label.setAttribute("x", c.cx);
  label.setAttribute("y", c.cy);
  label.setAttribute("class", "country-label " + (isPartner ? "partner" : ""));
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "middle");
  label.textContent = c.name;
  g.appendChild(label);
});
