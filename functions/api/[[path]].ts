/// <reference types="@cloudflare/workers-types" />

export interface Env {
  VITE_API_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params } = context;
  const url = new URL(request.url);
  
  // Construct the target backend URL
  // context.params.path is an array of path segments after /api/
  const pathSegments = params.path as string[];
  const targetPath = pathSegments ? pathSegments.join('/') : '';
  
  // Use environment variable for backend URL
  const backendBaseUrl = context.env.VITE_API_URL;
  
  if (!backendBaseUrl) {
    return new Response(JSON.stringify({ 
      error: 'Configuration Error', 
      message: 'VITE_API_URL is not defined in Cloudflare Pages environment variables.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Ensure backendBaseUrl has a trailing slash for reliable concatenation
  const normalizedBase = backendBaseUrl.endsWith('/') ? backendBaseUrl : `${backendBaseUrl}/`;
  
  let targetUrl: URL;
  try {
    targetUrl = new URL(`${normalizedBase}${targetPath}${url.search}`);
  } catch (err) {
    return new Response(JSON.stringify({ 
      error: 'Invalid Configuration', 
      message: 'Failed to construct the target URL. Please check your VITE_API_URL.',
      details: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://code829.com',
      'https://www.code829.com',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    let corsOrigin = 'https://code829.com';
    if (origin && allowedOrigins.includes(origin)) {
      corsOrigin = origin;
    }

    newResponse.headers.set('Access-Control-Allow-Origin', corsOrigin);
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

    return newResponse;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to proxy request', details: err instanceof Error ? err.message : String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Handle OPTIONS requests (preflight)
export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin');
  const allowedOrigins = [
    'https://code829.com',
    'https://www.code829.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];
  
  let corsOrigin = 'https://code829.com';
  if (origin && allowedOrigins.includes(origin)) {
    corsOrigin = origin;
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
};
