/// <reference types="@cloudflare/workers-types" />

export const onRequest: PagesFunction<any> = async (context) => {
  const { request, params } = context;
  const url = new URL(request.url);
  
  // Construct the target backend URL
  // context.params.path is an array of path segments after /api/
  const pathSegments = params.path as string[];
  const targetPath = pathSegments ? pathSegments.join('/') : '';
  
  // Use environment variable for backend URL to avoid hardcoding
  const backendBaseUrl = (context.env as any).BACKEND_URL;
  if (!backendBaseUrl) {
    return new Response(JSON.stringify({ error: 'BACKEND_URL environment variable is not set in Cloudflare' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const targetUrl = new URL(`${backendBaseUrl}${targetPath}${url.search}`);

  // Prepare the forwarded request
  const newRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(newRequest);
    
    // Create a new response so we can modify headers if needed
    const newResponse = new Response(response.body, response);
    
    // Add CORS headers to the response from the proxy
    // This ensures the browser is happy even if the backend's CORS is strict
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return newResponse;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to proxy request', details: err instanceof Error ? err.message : String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Handle OPTIONS requests (preflight)
export const onRequestOptions: PagesFunction<any> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};
