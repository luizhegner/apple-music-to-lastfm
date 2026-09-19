import {authUrl} from './_utils.js';
export function onRequestGet(context){
  if(!context.env.LASTFM_API_KEY||!context.env.LASTFM_SHARED_SECRET)return new Response('Configure LASTFM_API_KEY e LASTFM_SHARED_SECRET nos secrets do Cloudflare Pages.',{status:500});
  return Response.redirect(authUrl(context.env,context.request),302);
}
