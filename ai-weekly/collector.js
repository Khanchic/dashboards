#!/usr/bin/env node
'use strict';

// Standalone Cloud Collector for AI Weekly (runs inside GitHub Actions in Khanchic/dashboards).
// Zero external dependencies (Node 20+ built-in fetch & crypto).
// Reads:  ai-weekly/sources.json, ai-weekly/seen.json, ai-weekly/feed.json
// Writes: ai-weekly/seen.json, ai-weekly/feed.json

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = __dirname;
const SOURCES_PATH = path.join(DIR, 'sources.json');
const SEEN_PATH    = path.join(DIR, 'seen.json');
const FEED_PATH    = path.join(DIR, 'feed.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const TZ = 'Europe/Kyiv';

function kyivDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
function sha(s) { return crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12); }
function readJSON(f, fallback) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')); } catch { return fallback; }
}
function writeJSON(f, obj) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}
function domainOf(url) {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const parts = h.split('.');
    if (parts.length > 2 && /^(co|com|org|ac|gov)$/.test(parts[parts.length - 2])) return parts.slice(-3).join('.');
    return parts.slice(-2).join('.');
  } catch { return ''; }
}
function canonical(url) {
  try {
    const u = new URL(url.trim());
    u.hash = '';
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
    for (const k of [...u.searchParams.keys()]) {
      if (/^(utm_|ref$|ref_|source$|fbclid|gclid|mc_)/i.test(k)) u.searchParams.delete(k);
    }
    let s = u.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s.replace(/^http:/, 'https:');
  } catch { return url; }
}

async function get(url, timeoutMs = 25000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const headers = {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    const r = await fetch(url, { headers, signal: ac.signal, redirect: 'follow' });
    const text = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return text;
  } finally { clearTimeout(t); }
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
function decode(s) {
  return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return isNaN(n) ? m : String.fromCodePoint(n);
    }
    return ENT[e.toLowerCase()] !== undefined ? ENT[e.toLowerCase()] : m;
  });
}
function clean(s) {
  if (!s) return '';
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  s = decode(s);
  s = s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  return decode(s).replace(/\s+/g, ' ').trim();
}
function tag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i');
  const m = block.match(re);
  return m ? m[1] : '';
}

function parseFeed(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map(b => {
    let link = clean(tag(b, 'link'));
    if (!/^https?:/i.test(link)) {
      const m = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)/i) || b.match(/<link[^>]*href=["']([^"']+)/i);
      link = m ? decode(m[1]) : '';
    }
    if (!/^https?:/i.test(link)) {
      const g = clean(tag(b, 'guid'));
      if (/^https?:/i.test(g)) link = g;
    }
    const date = clean(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    const summary = clean(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded') || tag(b, 'content'));
    const parsedDate = date ? new Date(date) : null;
    return {
      title: clean(tag(b, 'title')),
      url: link,
      published_at: parsedDate && !isNaN(parsedDate) ? parsedDate.toISOString() : null,
      summary: summary.slice(0, 600),
    };
  }).filter(x => x.title && x.url);
}

const MONTHS = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
function utcDate(s) {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s);
  const d = new Date(iso ? s + 'T12:00:00Z' : s.replace(/,/, '').replace(/\./, '') + ' 12:00 UTC');
  return isNaN(d) ? null : d;
}
const DATE_RE = new RegExp(`((?:${MONTHS})\\.? \\d{1,2},? \\d{4})|(\\d{4}-\\d{2}-\\d{2})|(\\d{1,2} (?:${MONTHS}) \\d{4})`, 'i');

function parseHtmlLinks(html, src) {
  const re = new RegExp(src.link_pattern);
  const dates = [];
  const dRe = new RegExp(DATE_RE.source, 'gi');
  let dm;
  while ((dm = dRe.exec(html))) { const d = utcDate(dm[0]); if (d) dates.push({ pos: dm.index, d }); }
  const out = new Map();
  const aRe = /<a\b[^>]*href=["']([^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = aRe.exec(html))) {
    const href = decode(m[1]);
    if (!re.test(href)) continue;
    const url = href.startsWith('http') ? href : src.base + href;
    const chunks = m[2].split(/<[^>]+>/).map(s => decode(s).replace(/\s+/g, ' ').trim()).filter(Boolean);
    const alt = (m[2].match(/alt=["']([^"']{20,})["']/i) || [])[1];
    if (alt) chunks.push(decode(alt));
    const title = chunks.filter(c => !DATE_RE.test(c) && c.length >= 20).sort((a, b) => b.length - a.length)[0] || '';
    let near = null;
    for (const x of dates) {
      const dist = Math.abs(x.pos - m.index);
      if (dist < 1500 && (!near || dist < near.dist)) near = { dist, d: x.d };
    }
    const prev = out.get(url);
    const item = {
      title: title || (prev && prev.title) || '',
      url,
      published_at: near ? near.d.toISOString() : (prev && prev.published_at) || null,
      summary: '',
    };
    if (!prev || (!prev.title && item.title) || (!prev.published_at && item.published_at)) out.set(url, item);
  }
  return [...out.values()].filter(x => x.title);
}

function parseHeadings(html, src) {
  const out = [];
  const hRe = /<h([23])\b[^>]*?(?:id=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = hRe.exec(html))) {
    const title = clean(m[3]);
    if (title.length < 4 || title.length > 160) continue;
    const dm = title.match(DATE_RE);
    out.push({
      title: `${src.name}: ${title}`,
      url: src.url + '#' + (m[2] || sha(title)),
      published_at: dm && utcDate(dm[0]) ? utcDate(dm[0]).toISOString() : null,
      summary: '',
    });
  }
  return out;
}

async function fetchHN(src, maxAgeDays) {
  const since = Math.floor(Date.now() / 1000) - maxAgeDays * 86400;
  const url = `${src.url}?tags=story&hitsPerPage=200&numericFilters=points>${src.min_points || 100},created_at_i>${since}`;
  const j = JSON.parse(await get(url));
  return (j.hits || []).map(h => ({
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    published_at: h.created_at,
    summary: `HN: ${h.points} points, ${h.num_comments} comments. https://news.ycombinator.com/item?id=${h.objectID}`,
  }));
}

// Rule-based heuristic scoring & clustering for newly collected cloud items
const STOP_WORDS = new Set(['the','and','for','with','from','that','this','into','over','after','more','than','new','how','why','what','when','where','who','will','can','are','was','were','has','have','had','not','but','you','your','our','its','their','about','via','using','now','out']);
function tokenize(text) {
  return String(text || '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
}
function inferKind(title, summary) {
  const t = `${title} ${summary}`.toLowerCase();
  if (/\b(launch|releas|ship|introduc|announc|available|roll ?out|v\d+\.\d+)\b/.test(t)) return 'launch';
  if (/\b(sdk|api|tool|cli|plugin|mcp|framework|open-source|benchmark)\b/.test(t)) return 'tool';
  if (/\b(paper|study|research|survey|dataset|arxiv|proof)\b/.test(t)) return 'research';
  if (/\b(policy|safety|regulation|alignment|law|court|copyright)\b/.test(t)) return 'policy';
  return 'business';
}
function inferTags(title, summary, srcId) {
  const t = `${title} ${summary}`.toLowerCase();
  const tags = new Set();
  const map = [
    ['openai', /\b(openai|chatgpt|gpt-\d|codex|sora)\b/],
    ['anthropic', /\b(anthropic|claude)\b/],
    ['google', /\b(google|deepmind|gemini)\b/],
    ['meta', /\b(meta|llama)\b/],
    ['mistral', /\b(mistral)\b/],
    ['huggingface', /\b(hugging ?face)\b/],
    ['agents', /\b(agents?|agentic|mcp|computer-use|autopilot|workflow)\b/],
    ['marketing', /\b(marketing|smm|crm|seo|search|ads?|brand|content|sales|martech)\b/],
    ['igaming', /\b(igaming|casino|betting|gambling|sweepstakes|slots?|sportsbook)\b/],
    ['coding', /\b(coding|code|developer|ide|cursor|github|copilot)\b/],
    ['open-weights', /\b(open-weight|open-source|llama\.cpp|gguf|local)\b/],
  ];
  for (const [tag, re] of map) if (re.test(t)) tags.add(tag);
  if (['igb', 'sbc'].includes(srcId)) tags.add('igaming');
  if (['maii', 'martech'].includes(srcId)) tags.add('marketing');
  return [...tags].slice(0, 5);
}
function scoreStoryCard(card) {
  const tiers = new Set((card.items || []).map(i => i.tier));
  const domains = new Set((card.items || []).map(i => i.domain).filter(Boolean));
  card.domains = [...domains];
  card.has_t1 = tiers.has('T1');
  card.status = card.rumor ? 'rumor' : (card.has_t1 || domains.size >= 2) ? 'confirmed' : 'unconfirmed';
  card.last_update = (card.items || []).map(i => i.published_at).filter(Boolean).sort().pop() || card.first_seen;

  // Keep LLM score if already scored by Claude locally
  if (card.total && card.scores && card.scores.significance) return card;

  let base = tiers.has('T1') ? 3.5 : tiers.has('T4') ? 3.2 : tiers.has('T2') ? 3.1 : 2.7;
  if (domains.size >= 2) base += 0.45;
  if (domains.size >= 3) base += 0.25;
  const fullText = `${card.title} ${card.summary || ''} ${(card.items || []).map(x => x.summary || '').join(' ')}`;
  const hnMatch = fullText.match(/HN:\s*(\d+)\s*points/i);
  if (hnMatch) {
    const pts = Number(hnMatch[1]);
    if (pts >= 400) base += 0.55;
    else if (pts >= 200) base += 0.35;
    else base += 0.15;
  }
  if (/\b(agents?|agentic|mcp|automation|workflow|marketing|crm|seo|igaming|casino|claude code)\b/i.test(fullText)) {
    base += 0.4;
  }
  card.total = Math.min(5, Math.round(base * 100) / 100);
  return card;
}

async function main() {
  const conf = readJSON(SOURCES_PATH, { sources: [], max_age_days: 7, blocked_tlds: ['.ru', '.su', '.by'], ai_keywords: [] });
  const maxAge = conf.max_age_days || 7;
  const keepDays = 14;
  const aiRe = new RegExp((conf.ai_keywords || []).join('|'), 'i');
  const today = kyivDate();
  const nowMs = Date.now();

  const seen = readJSON(SEEN_PATH, { urls: {}, baselined: [] });
  const feed = readJSON(FEED_PATH, {
    generated_at: null,
    last_collect_date: null,
    sources_report: [],
    totals: {},
    stories: [],
    raw_items: [],
    issues: [],
  });

  const report = [];
  const fresh = [];

  await Promise.all((conf.sources || []).filter(s => s.enabled !== false).map(async src => {
    const r = { id: src.id, name: src.name, tier: src.tier, type: src.type, url: src.url, fetched: 0, kept: 0, new: 0, error: null, note: '' };
    try {
      let items;
      if (src.type === 'rss') items = parseFeed(await get(src.url));
      else if (src.type === 'html') items = parseHtmlLinks(await get(src.url), src);
      else if (src.type === 'changelog') items = parseHeadings(await get(src.url), src);
      else if (src.type === 'hn') items = await fetchHN(src, maxAge);
      else throw new Error('unknown type ' + src.type);

      r.fetched = items.length;
      if (!items.length) r.note = src.type === 'rss' ? 'feed empty/unparsed' : 'no links found (JS-only page?)';
      const firstRun = (src.type === 'changelog' || src.type === 'html') && !seen.baselined.includes(src.id);

      for (const it of items) {
        if (/[\u0400-\u04FF]/.test(it.title)) continue; // EN only
        if ((conf.blocked_tlds || []).some(t => { try { return new URL(it.url).hostname.endsWith(t); } catch { return false; } })) continue;
        if (src.ai_filter && !aiRe.test(it.title + ' ' + it.summary)) continue;

        const cUrl = canonical(it.url);
        const age = it.published_at ? (nowMs - Date.parse(it.published_at)) / 864e5 : null;
        if (age !== null && (age > maxAge || age < -1)) continue;
        r.kept++;

        if (seen.urls[cUrl]) continue;
        seen.urls[cUrl] = today;
        if (firstRun) continue;

        r.new++;
        fresh.push({
          id: sha(cUrl),
          source_id: src.id,
          source_name: src.name,
          tier: src.tier,
          signal_only: !!src.signal_only,
          title: it.title,
          url: cUrl,
          domain: domainOf(cUrl),
          published_at: it.published_at || new Date().toISOString(),
          collected_on: today,
          summary: it.summary,
        });
      }
      if (firstRun && r.kept > 0) {
        seen.baselined.push(src.id);
        r.note = `baseline recorded (${r.kept} items); new entries from next run`;
      }
    } catch (e) {
      r.error = e.message;
    }
    report.push(r);
  }));

  report.sort((a, b) => a.tier.localeCompare(b.tier) || a.id.localeCompare(b.id));

  // Prune seen.urls older than 45 days
  for (const [u, d] of Object.entries(seen.urls)) {
    if ((nowMs - Date.parse(d + 'T12:00:00Z')) / 864e5 > 45) delete seen.urls[u];
  }

  // Merge raw_items (keep last 14 days, dedup by id)
  const rawMap = new Map();
  for (const it of [...fresh, ...(feed.raw_items || [])]) {
    if (!it || !it.id) continue;
    const age = it.published_at ? (nowMs - Date.parse(it.published_at)) / 864e5 : 0;
    if (age <= keepDays && !rawMap.has(it.id)) rawMap.set(it.id, it);
  }
  const mergedRaw = [...rawMap.values()].sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')));

  // Cluster fresh non-signal items into stories
  const storiesMap = new Map((feed.stories || []).map(s => [s.story_id, s]));
  const itemInStory = new Set();
  for (const s of storiesMap.values()) {
    for (const it of (s.items || [])) itemInStory.add(it.id);
  }

  for (const it of fresh) {
    if (it.signal_only || itemInStory.has(it.id)) continue;
    const toks = new Set(tokenize(it.title));
    let bestStory = null, bestOverlap = 0;
    for (const s of storiesMap.values()) {
      const sToks = tokenize(s.title);
      if (!sToks.length || !toks.size) continue;
      let hit = 0;
      for (const w of sToks) if (toks.has(w)) hit++;
      const ratio = hit / Math.min(toks.size, sToks.length);
      if (hit >= 3 && ratio >= 0.5 && ratio > bestOverlap) {
        bestOverlap = ratio;
        bestStory = s;
      }
    }
    const itemEntry = {
      id: it.id,
      url: it.url,
      title: it.title,
      source: it.source_name,
      tier: it.tier,
      domain: it.domain,
      published_at: it.published_at,
      summary: (it.summary || '').slice(0, 400),
    };
    if (bestStory) {
      bestStory.items = bestStory.items || [];
      if (!bestStory.items.some(x => x.id === it.id)) bestStory.items.push(itemEntry);
      scoreStoryCard(bestStory);
    } else {
      const slug = tokenize(it.title).slice(0, 5).join('-') || ('story-' + it.id);
      const storyId = storiesMap.has(slug) ? `${slug}-${it.id.slice(0, 4)}` : slug;
      const card = scoreStoryCard({
        story_id: storyId,
        first_seen: today,
        title: it.title,
        summary: (it.summary || '').slice(0, 320),
        so_what: '',
        tags: inferTags(it.title, it.summary, it.source_id),
        kind: inferKind(it.title, it.summary),
        rumor: false,
        auto_clustered: true,
        items: [itemEntry],
      });
      storiesMap.set(storyId, card);
    }
    itemInStory.add(it.id);
  }

  // Re-score & prune old stories (> 14 days)
  const allStories = [...storiesMap.values()]
    .map(scoreStoryCard)
    .filter(s => {
      const age = s.last_update ? (nowMs - Date.parse(s.last_update)) / 864e5 : 0;
      return age <= keepDays;
    })
    .sort((a, b) => (b.total || 0) - (a.total || 0) || String(b.last_update || '').localeCompare(String(a.last_update || '')));

  feed.generated_at = new Date().toISOString();
  feed.last_collect_date = today;
  feed.sources_report = report;
  feed.totals = {
    sources: report.length,
    failed: report.filter(s => s.error).length,
    empty: report.filter(s => !s.error && s.fetched === 0).length,
    fetched: report.reduce((a, s) => a + s.fetched, 0),
    kept: report.reduce((a, s) => a + s.kept, 0),
    new_items: fresh.length,
    stories_total: allStories.length,
    stories_confirmed: allStories.filter(s => s.status === 'confirmed').length,
    stories_eligible: allStories.filter(s => s.status === 'confirmed' && (s.total || 0) >= 3.5).length,
    raw_total: mergedRaw.length,
  };
  feed.stories = allStories;
  feed.raw_items = mergedRaw;

  writeJSON(SEEN_PATH, seen);
  writeJSON(FEED_PATH, feed);
  console.log(`AI Weekly Cloud Collect [${today}]: ${fresh.length} new items, ${allStories.length} stories (${feed.totals.stories_confirmed} confirmed), ${feed.totals.failed} failed sources.`);
}

if (require.main === module) {
  main().catch(e => { console.error('ERROR:', e); process.exit(1); });
}
module.exports = { main };
