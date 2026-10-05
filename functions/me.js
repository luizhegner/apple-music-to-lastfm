import {json, tokenFrom, validateToken, parseCookies} from './_utils.js';

export async function onRequestGet(context){
  const token = tokenFrom(context.request);
  if(!token) return json({connected:false}, 401);
  const r = await validateToken(token);
  if(!r.ok || r.data?.valid !== true) return json({connected:false, error:r.data?.message || 'token inválido'}, 401);
  const c = parseCookies(context.request);
  return json({connected:true, user:r.data?.user_name || decodeURIComponent(c.lb_user || '')});
}
