// Cloudflare Pages Middleware
// Runs at the edge for EVERY request before static assets are served.
// Ensures HTML, sw.js, and version.json are NEVER cached by any browser.

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const path = url.pathname;

  // For HTML pages, service worker, and version file: aggressive no-cache
  if (
    path === '/' ||
    path.endsWith('.html') ||
    path === '/sw.js' ||
    path === '/version.json' ||
    path === '/manifest.json'
  ) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    newResponse.headers.set('Pragma', 'no-cache');
    newResponse.headers.set('Expires', '0');
    newResponse.headers.set('X-Wanda-Version', '3.1');
    // Ensure service worker can be updated
    newResponse.headers.delete('ETag');
    return newResponse;
  }

  return response;
}
