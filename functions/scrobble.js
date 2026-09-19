import {parseCookies,json,lastfmPost} from './_utils.js';
export async function onRequestPost(context){
  const c=parseCookies(context.request);if(!c.lastfm_session)return json({error:'Conecte o Last.fm primeiro.'},401);
  let rows;try{rows=await context.request.json()}catch{return json({error:'JSON inválido.'},400)}
  if(!Array.isArray(rows)||rows.length<1||rows.length>50)return json({error:'Envie entre 1 e 50 scrobbles por lote.'},400);
  const params={method:'track.scrobble',sk:decodeURIComponent(c.lastfm_session)};
  rows.forEach((r,i)=>{params[`artist[${i}]`]=r.artist||'';params[`track[${i}]`]=r.track||'';params[`timestamp[${i}]`]=String(r.timestamp||'');if(r.album)params[`album[${i}]`]=r.album;if(r.albumArtist)params[`albumArtist[${i}]`]=r.albumArtist;if(Number.isFinite(r.duration))params[`duration[${i}]`]=String(Math.round(r.duration))});
  const r=await lastfmPost(params,context.env);
  if(!r.ok||r.data?.error)return json({error:r.data?.message||'Last.fm rejeitou o lote.',errorCode:Number(r.data?.error)||null,details:r.data},502);
  const sc=r.data?.scrobbles;
  const accepted=Number(sc?.['@attr']?.accepted||sc?.attr?.accepted||0);
  const ignored=Number(sc?.['@attr']?.ignored||sc?.attr?.ignored||0);
  const rawItems=sc?.scrobble;
  const sourceItems=rawItems?(Array.isArray(rawItems)?rawItems:[rawItems]):[];
  const items=sourceItems.map((item,i)=>{
    const code=Number(item?.ignoredMessage?.code??item?.ignoredMessage?.['@attr']?.code??0);
    return {
      index:i,
      artist:item?.artist?.['#text']||item?.artist||rows[i]?.artist||'',
      track:item?.track?.['#text']||item?.track||rows[i]?.track||'',
      album:item?.album?.['#text']||item?.album||rows[i]?.album||'',
      timestamp:item?.timestamp||rows[i]?.timestamp||'',
      code
    };
  });
  return json({accepted,ignored,failed:Math.max(0,rows.length-accepted-ignored),items});
}
