import {json, validateToken} from './_utils.js';

export async function onRequestPost(context){
  let body;
  try{ body = await context.request.json() }catch{ return json({error:'JSON inválido.'}, 400) }
  const token = String(body?.token || '').trim();
  if(!token) return json({error:'Informe o seu user token do ListenBrainz.'}, 400);

  const r = await validateToken(token);
  if(!r.ok || r.data?.valid !== true){
    return json({error: r.data?.message || 'Token inválido para o ListenBrainz.'}, 401);
  }

  const user = r.data?.user_name || '';
  const headers = new Headers({'content-type':'application/json;charset=UTF-8'});
  headers.append('Set-Cookie', `lb_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);
  headers.append('Set-Cookie', `lb_user=${encodeURIComponent(user)}; Path=/; Secure; SameSite=Lax; Max-Age=31536000`);
  return new Response(JSON.stringify({connected:true, user}), {headers});
}
