import {lastfmPost,json} from './_utils.js';
export async function onRequestGet(context){
  const url=new URL(context.request.url), token=url.searchParams.get('token');
  if(!token)return new Response('Token não recebido pelo Last.fm.',{status:400});
  const r=await lastfmPost({method:'auth.getSession',token},context.env);
  if(!r.ok||r.data?.error||!r.data?.session?.key)return new Response(`Falha na autenticação: ${r.data?.message||'resposta inválida'}`,{status:502});
  const session=r.data.session;const dest=new URL('/',context.request.url);const headers=new Headers({location:dest.href});headers.append('Set-Cookie',`lastfm_session=${encodeURIComponent(session.key)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);headers.append('Set-Cookie',`lastfm_user=${encodeURIComponent(session.name)}; Path=/; Secure; SameSite=Lax; Max-Age=31536000`);return new Response(null,{status:302,headers});
}
