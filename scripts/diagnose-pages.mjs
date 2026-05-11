import dns from 'node:dns/promises';

const defaultUrls = [
  process.env.PAGES_CUSTOM_URL || 'https://flight.cian.fun/',
  process.env.PAGES_FALLBACK_URL || 'https://wishzichen.github.io/nexus-flight-analytics/',
  process.env.PAGES_CURRENT_URL || 'https://cian.fun/nexus-flight-analytics/',
];

const urls = [...new Set(process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultUrls)];
let hasFailure = false;

async function resolveHost(hostname) {
  const [cnames, ipv4, ipv6] = await Promise.all([
    dns.resolveCname(hostname).catch(() => []),
    dns.resolve4(hostname).catch(() => []),
    dns.resolve6(hostname).catch(() => []),
  ]);

  return { cnames, ipv4, ipv6 };
}

function classifyPage(status, html) {
  if (status === 404) {
    return {
      ok: false,
      label: '404 from Pages',
      hint: 'The custom domain is not attached to this Pages site, or the repository path is wrong.',
    };
  }

  if (html.includes('/src/main.tsx')) {
    return {
      ok: false,
      label: 'raw Vite source published',
      hint: 'GitHub Pages is still using the branch/Jekyll source instead of the Vite dist artifact.',
    };
  }

  if (/src=["']\.\/assets\/.+\.js/.test(html) && /href=["']\.\/assets\/.+\.css/.test(html)) {
    return {
      ok: true,
      label: 'Vite artifact published',
      hint: 'The page is serving built assets from dist/.',
    };
  }

  return {
    ok: status >= 200 && status < 400,
    label: `HTTP ${status}`,
    hint: 'The response did not match the expected Vite artifact markers.',
  };
}

async function fetchPage(url) {
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) return response;

    const nextUrl = new URL(location, currentUrl);
    if (nextUrl.protocol === 'http:') {
      nextUrl.protocol = 'https:';
    }
    currentUrl = nextUrl.toString();
  }

  throw new Error('too many redirects');
}

for (const url of urls) {
  const parsed = new URL(url);
  console.log(`\n[pages-diagnose] ${url}`);

  const dnsInfo = await resolveHost(parsed.hostname);
  console.log(`[pages-diagnose] DNS CNAME: ${dnsInfo.cnames.join(', ') || '(none)'}`);
  console.log(`[pages-diagnose] DNS A: ${dnsInfo.ipv4.join(', ') || '(none)'}`);
  console.log(`[pages-diagnose] DNS AAAA: ${dnsInfo.ipv6.join(', ') || '(none)'}`);

  try {
    const response = await fetchPage(url);
    const html = await response.text();
    const result = classifyPage(response.status, html);
    console.log(`[pages-diagnose] Final URL: ${response.url}`);
    console.log(`[pages-diagnose] Result: ${result.label}`);
    console.log(`[pages-diagnose] Hint: ${result.hint}`);
    hasFailure = hasFailure || !result.ok;
  } catch (error) {
    hasFailure = true;
    console.error(`[pages-diagnose] Request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (hasFailure) {
  console.error('\n[pages-diagnose] One or more URLs are not serving the expected Vite build.');
  process.exit(1);
}

console.log('\n[pages-diagnose] All checked URLs are serving the expected Vite build.');
