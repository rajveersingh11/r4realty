export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.toLowerCase();

  // Route Firewall: Block direct access to protected resources and data files
  if (
    pathname.startsWith('/data') ||
    pathname.startsWith('/.git') ||
    pathname.startsWith('/.gemini') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.env') ||
    pathname.endsWith('.yaml') ||
    pathname.endsWith('.yml') ||
    pathname.endsWith('.lock') ||
    pathname === '/server.js' ||
    pathname.includes('package')
  ) {
    return new Response(JSON.stringify({ error: 'Access Denied: Protected System Resource' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);

  // Security Headers (equivalent to Helmet configuration)
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://cdnjs.cloudflare.com 'unsafe-inline'; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://*.google.com https://www.googletagmanager.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://*.doubleclick.net; img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://*.google.com https://www.googletagmanager.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://*.doubleclick.net; style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; frame-src 'self';"
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
