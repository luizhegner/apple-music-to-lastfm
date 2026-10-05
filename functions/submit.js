import {json, tokenFrom, submitListens, MAX_LISTENS_PER_REQUEST} from './_utils.js';

function buildListen(r){
  const info = {artist_name:String(r.artist || ''), track_name:String(r.track || '')};
  if(r.album) info.release_name = String(r.album);
  const extra = {media_player:'Apple Music', submission_client:'apple-music-to-listenbrainz'};
  if(r.albumArtist) extra.albumartist = String(r.albumArtist);
  if(Number.isFinite(r.duration)) extra.duration = Math.round(r.duration);
  info.additional_info = extra;
  return {listened_at:Math.floor(Number(r.timestamp)), track_metadata:info};
}

export async function onRequestPost(context){
  const token = tokenFrom(context.request);
  if(!token) return json({error:'Conecte o ListenBrainz primeiro.'}, 401);

  let rows;
  try{ rows = await context.request.json() }catch{ return json({error:'JSON inválido.'}, 400) }
  if(!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_LISTENS_PER_REQUEST){
    return json({error:`Envie entre 1 e ${MAX_LISTENS_PER_REQUEST} listens por lote.`}, 400);
  }

  const invalid = rows.filter(r => !r?.artist || !r?.track || !Number.isFinite(Number(r?.timestamp)));
  const payload = rows.filter(r => r?.artist && r?.track && Number.isFinite(Number(r?.timestamp))).map(buildListen);
  if(!payload.length) return json({error:'Nenhum listen válido no lote.', invalid:invalid.length}, 400);

  const r = await submitListens(token, {listen_type:'import', payload});
  if(!r.ok){
    return json({
      error: r.data?.error || r.data?.message || 'O ListenBrainz rejeitou o lote.',
      status: r.status,
      details: r.data
    }, r.status === 429 ? 429 : 502);
  }

  return json({accepted:payload.length, invalid:invalid.length, failed:0, status:r.data?.status || 'ok'});
}
