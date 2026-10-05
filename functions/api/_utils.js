export const API_ROOT = 'https://api.listenbrainz.org';
export const USER_AGENT = 'AppleMusicToListenBrainz/1.0 (+https://github.com/luizhegner/apple-music-to-listenbrainz)';
export const MAX_LISTENS_PER_REQUEST = 1000;

export function parseCookies(request){
  const h = request.headers.get('Cookie') || '';
  return Object.fromEntries(h.split(';').map(x => x.trim().split('=').map(decodeURIComponent)).filter(x => x.length === 2));
}

export function json(data, status = 200, headers = {}){
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json;charset=UTF-8', ...headers}});
}

export function tokenFrom(request){
  const c = parseCookies(request);
  return c.lb_token ? decodeURIComponent(c.lb_token) : null;
}

async function lbFetch(path, token, init = {}){
  const r = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers:{
      'authorization': `Token ${token}`,
      'user-agent': USER_AGENT,
      ...(init.body ? {'content-type':'application/json'} : {}),
      ...(init.headers || {})
    }
  });
  const text = await r.text();
  let data;
  try{ data = JSON.parse(text) }catch{ data = {raw:text} }
  return {ok:r.ok, status:r.status, data};
}

export function validateToken(token){
  return lbFetch('/1/validate-token', token);
}

export function submitListens(token, body){
  return lbFetch('/1/submit-listens', token, {method:'POST', body:JSON.stringify(body)});
}
