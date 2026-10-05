const state={rows:[], visible:[], files:[], sendLog:[], sending:false};
const $=s=>document.querySelector(s);

const HEADER_ALIASES={
  title:['Title','Track','Track Name','Name'],
  artist:['Artist','Artist Name'],
  album:['Album','Album Name'],
  albumArtist:['Album Artist','AlbumArtist'],
  durationMs:['Duration (ms)','Duration (Milliseconds)','Duration ms'],
  playDate:['Play Date','Play Date (UTC)','Play Date UTC','Played At','Played At (UTC)','Date Played','Date'],
  playCount:['Play Count','Plays','Play count'],
  complete:['Is Complete','Complete','Completed'],
  trackId:['Track ID','Track Id','TrackID']
};

function clean(v){return String(v??'').replace(/^\uFEFF/,'').trim()}
function detectDelimiter(text){const first=text.replace(/^\uFEFF/,'').split(/\r?\n/,1)[0]||'';const commas=(first.match(/,/g)||[]).length;const semis=(first.match(/;/g)||[]).length;return semis>commas?';':','}
function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');const delim=detectDelimiter(text);const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')q=false;else cell+=c;}
    else if(c==='"')q=true;else if(c===delim){row.push(cell);cell='';}else if(c==='\n'){row.push(cell);if(row.some(x=>clean(x)!==''))rows.push(row);row=[];cell='';}else if(c!=='\r')cell+=c;}
  if(cell!==''||row.length){row.push(cell);if(row.some(x=>clean(x)!==''))rows.push(row)}
  if(!rows.length)return[];const headers=rows[0].map(clean);return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,clean(r[i]??'')])));
}
function pick(obj,aliases){for(const a of aliases){if(Object.prototype.hasOwnProperty.call(obj,a)&&clean(obj[a])!=='')return clean(obj[a])}return ''}
function parseDate(v){if(!v)return null;const d=new Date(v);if(!Number.isNaN(d.valueOf()))return d;const m=v.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})(?:\s+(.+))?$/);if(m){const d2=new Date(`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}T${m[4]||'00:00:00'}`);if(!Number.isNaN(d2.valueOf()))return d2}return null}
function durationSeconds(v){if(!v)return null;const n=Number(v.replace(',','.'));if(!Number.isFinite(n))return null;return n>1000?n/1000:n}
function normalize(records,source,fileName){
  return records.map((r,i)=>{const title=pick(r,HEADER_ALIASES.title),artist=pick(r,HEADER_ALIASES.artist),album=pick(r,HEADER_ALIASES.album);const date=parseDate(pick(r,HEADER_ALIASES.playDate));return{source,fileName,row:i+2,title,artist,album,albumArtist:pick(r,HEADER_ALIASES.albumArtist),duration:durationSeconds(pick(r,HEADER_ALIASES.durationMs)),playCount:Number(pick(r,HEADER_ALIASES.playCount))||null,complete:pick(r,HEADER_ALIASES.complete),trackId:pick(r,HEADER_ALIASES.trackId),date,raw:r};}).filter(x=>x.title&&x.artist);
}
async function readFile(f,source){const txt=await f.text();const parsed=parseCSV(txt);return normalize(parsed,source,f.name)}
function fmtDate(d){return d?d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—'}
function fmtDur(s){if(!Number.isFinite(s))return '—';s=Math.round(s);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
function key(r){return [r.date?.toISOString()||'',r.artist.toLowerCase(),r.title.toLowerCase(),r.album.toLowerCase()].join('\u001f')}
function csvEscape(v){const s=String(v??'');return `"${s.replaceAll('"','""')}"`}
function download(name,content,type='text/csv;charset=utf-8'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

function currentRows(){let rows=[...state.rows];if($('#dedupeToggle').checked){const m=new Map();for(const r of rows)m.set(key(r),r);rows=[...m.values()]}
  const source=$('#sourceFilter').value;if(source!=='all')rows=rows.filter(r=>r.source===source);const ord=$('#sortOrder').value==='asc'?1:-1;rows.sort((a,b)=>(Number(a.date||0)-Number(b.date||0))*ord);return rows}
function render(){state.visible=currentRows();const rows=state.visible;$('#previewBody').innerHTML=rows.slice(0,500).map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${esc(r.artist)}</td><td>${esc(r.title)}</td><td>${esc(r.album)}</td><td>${r.source}</td><td>${fmtDur(r.duration)}</td></tr>`).join('');$('#tableNote').textContent=rows.length>500?`Mostrando 500 de ${rows.length.toLocaleString('pt-BR')} registros.`:`Mostrando ${rows.length.toLocaleString('pt-BR')} registros.`;renderStats()}
function renderStats(){const rows=state.visible;const dated=rows.filter(r=>r.date);const oldest=dated.length?new Date(Math.min(...dated.map(r=>r.date.valueOf()))):null;const newest=dated.length?new Date(Math.max(...dated.map(r=>r.date.valueOf()))):null;const recentCut=Date.now()-14*86400000;const recent=dated.filter(r=>r.date.valueOf()>=recentCut).length;$('#stats').innerHTML=[['Listens',rows.length.toLocaleString('pt-BR')],['Com data',dated.length.toLocaleString('pt-BR')],['Últimos 14 dias',recent.toLocaleString('pt-BR')],['Período',oldest&&newest?`${oldest.getFullYear()}–${newest.getFullYear()}`:'—']].map(([a,b])=>`<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');$('#sourceSummary').textContent=`${rows.filter(r=>r.source==='A').length.toLocaleString('pt-BR')} A + ${rows.filter(r=>r.source==='B').length.toLocaleString('pt-BR')} B`;
  if(oldest){$('#oldNotice').className='notice '+(oldest.valueOf()<Date.now()-30*86400000?'warn':'');$('#oldNotice').textContent='O histórico completo é enviado em lotes com listen_type import. O ListenBrainz aceita timestamps antigos; apenas listens duplicados (mesmo listened_at, artista e faixa) são descartados pelo servidor.'}
}
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}

function toListen(r){const info={artist_name:r.artist,track_name:r.title};if(r.album)info.release_name=r.album;const extra={media_player:'Apple Music',submission_client:'apple-music-to-listenbrainz'};if(r.albumArtist)extra.albumartist=r.albumArtist;if(Number.isFinite(r.duration))extra.duration=Math.round(r.duration);info.additional_info=extra;return{listened_at:Math.floor(r.date.valueOf()/1000),track_metadata:info}}
function exportListenBrainz(){const rows=currentRows().filter(r=>r.date);download('listenbrainz-submit-listens.json',JSON.stringify({listen_type:'import',payload:rows.map(toListen)},null,2),'application/json;charset=utf-8')}
function exportCSV(){const rows=currentRows();const lines=[['artist','track','album','listened_at','albumArtist','duration'].map(csvEscape).join(',')];for(const r of rows)lines.push([r.artist,r.title,r.album,r.date?Math.floor(r.date.valueOf()/1000):'',r.albumArtist||'',Number.isFinite(r.duration)?Math.round(r.duration):''].map(csvEscape).join(','));download('apple-music-listens.csv',lines.join('\n'));}
function exportJSON(){const rows=currentRows().map(r=>({artist:r.artist,track:r.title,album:r.album,albumArtist:r.albumArtist||null,listened_at:r.date?Math.floor(r.date.valueOf()/1000):null,duration:Number.isFinite(r.duration)?Math.round(r.duration):null,source:r.source}));download('apple-music-listenbrainz.json',JSON.stringify({version:1,rows},null,2),'application/json;charset=utf-8')}

async function analyze(){const f1=$('#file1').files[0],f2=$('#file2').files[0];if(!f1&&!f2){alert('Selecione pelo menos um CSV.');return}state.rows=[];if(f1)state.rows.push(...await readFile(f1,'A'));if(f2)state.rows.push(...await readFile(f2,'B'));$('#resultsCard').classList.remove('hidden');$('#exportCard').classList.remove('hidden');render();checkBackend()}
function clearAll(){state.rows=[];state.sendLog=[];state.sending=false;$('#resultsCard').classList.add('hidden');$('#exportCard').classList.add('hidden');for(const id of ['file1','file2'])$(`#${id}`).value='';$('#name1').textContent='nenhum arquivo';$('#name2').textContent='nenhum arquivo'}

async function checkBackend(){try{const r=await fetch('/api/me',{credentials:'include'});if(!r.ok)throw 0;const j=await r.json();$('#accountStatus').className='hint success';$('#accountStatus').textContent=`Conectado ao ListenBrainz como ${j.user}`;$('#sendAllBtn').disabled=false;$('#tokenInput').value=''}catch{$('#accountStatus').className='hint';$('#accountStatus').textContent='Cole o seu user token e clique em Conectar ListenBrainz para habilitar o envio direto.';$('#sendAllBtn').disabled=true}}

async function connect(){
  const token=$('#tokenInput').value.trim();
  if(!token){alert('Cole o user token do ListenBrainz.');return}
  $('#connectBtn').disabled=true;
  try{
    const r=await fetch('/api/token',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({token})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'Não foi possível validar o token.');
    await checkBackend();
  }catch(e){
    $('#accountStatus').className='hint warn';
    $('#accountStatus').textContent=e.message;
  }finally{$('#connectBtn').disabled=false}
}

function resetSendUI(){
  state.sendLog=[];
  $('#progress').classList.remove('hidden');
  $('#progressBar').style.width='0%';
  $('#sendReportBtn').disabled=true;
  $('#sendStatus').className='hint';
  $('#sendStatus').textContent='';
  $('#sendBreakdown').innerHTML='';
}

function addSendResult(batch,status,detail=''){
  for(const r of batch){
    state.sendLog.push({
      listened_at:Math.floor(r.date.valueOf()/1000),
      artist:r.artist,
      track:r.title,
      album:r.album||'',
      status,
      detail
    });
  }
}

function renderSendBreakdown(extra={}){
  const accepted=state.sendLog.filter(x=>x.status==='aceito').length;
  const failed=state.sendLog.filter(x=>x.status==='falhou').length;
  const notAttempted=extra.notAttempted||0;
  const summary=[`Aceitos: ${accepted.toLocaleString('pt-BR')}`,`Falhos: ${failed.toLocaleString('pt-BR')}`];
  if(notAttempted)summary.push(`Não enviados: ${notAttempted.toLocaleString('pt-BR')}`);
  const errors=new Map();
  for(const x of state.sendLog)if(x.status==='falhou'&&x.detail)errors.set(x.detail,(errors.get(x.detail)||0)+1);
  const parts=[...errors.entries()].map(([msg,n])=>`${msg}: ${n.toLocaleString('pt-BR')}`);
  $('#sendBreakdown').innerHTML=`<b>${summary.join(' · ')}</b>${parts.length?`<span>${parts.join(' · ')}</span>`:''}`;
}

function exportSendReport(){
  if(!state.sendLog.length){return}
  const head=['listened_at','artist','track','album','status','detail'];
  const lines=[head.map(csvEscape).join(',')];
  for(const x of state.sendLog)lines.push([x.listened_at,x.artist,x.track,x.album,x.status,x.detail].map(csvEscape).join(','));
  download('listenbrainz-envio-relatorio.csv',lines.join('\n'));
}

async function sendAll(){
  if(state.sending)return;
  const all=currentRows();
  const rows=all.filter(r=>r.date).sort((a,b)=>a.date-b.date);
  const missingDate=all.length-rows.length;
  if(!rows.length){alert('Não há registros com data válida para enviar ao ListenBrainz.');return}

  state.sending=true;
  resetSendUI();
  $('#sendAllBtn').disabled=true;
  $('#logoutBtn').disabled=true;

  const BATCH=500;
  let processed=0,batches=0,stopped=false;
  const totalBatches=Math.ceil(rows.length/BATCH);

  for(let i=0;i<rows.length;i+=BATCH){
    const batch=rows.slice(i,i+BATCH); batches++;
    try{
      const r=await fetch('/api/submit',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify(batch.map(x=>({artist:x.artist,track:x.title,album:x.album,albumArtist:x.albumArtist,timestamp:Math.floor(x.date.valueOf()/1000),duration:Number.isFinite(x.duration)?Math.round(x.duration):undefined})))});
      const j=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(j.error||`Falha ao enviar o lote (HTTP ${r.status}).`);
      addSendResult(batch,'aceito');
      processed+=batch.length;
      renderSendBreakdown({notAttempted:rows.length-processed});
      $('#sendStatus').textContent=`Lote ${batches}/${totalBatches} enviado.`;
      $('#progressBar').style.width=`${Math.min(100,(processed/rows.length)*100)}%`;
    }catch(e){
      addSendResult(batch,'falhou',e.message||'erro desconhecido');
      processed+=batch.length;
      stopped=true;
      renderSendBreakdown({notAttempted:rows.length-processed});
      $('#sendStatus').className='hint warn';
      $('#sendStatus').textContent=`Envio interrompido no lote ${batches}/${totalBatches}: ${e.message}`;
      $('#progressBar').style.width=`${Math.min(100,(processed/rows.length)*100)}%`;
      break;
    }
    await new Promise(resolve=>setTimeout(resolve,500));
  }

  renderSendBreakdown({notAttempted:rows.length-processed});
  if(!stopped){
    $('#sendStatus').className='hint success';
    $('#sendStatus').textContent=`Envio concluído: ${processed.toLocaleString('pt-BR')} listens enviados.`+(missingDate?` ${missingDate.toLocaleString('pt-BR')} sem data foram ignorados antes do envio.`:'');
    $('#progressBar').style.width='100%';
  }else if(missingDate){
    $('#sendStatus').textContent+=` ${missingDate.toLocaleString('pt-BR')} registros sem data também ficaram fora do envio.`;
  }
  $('#sendReportBtn').disabled=state.sendLog.length===0;
  $('#sendAllBtn').disabled=false;
  $('#logoutBtn').disabled=false;
  state.sending=false;
}

async function logout(){await fetch('/api/logout',{method:'POST',credentials:'include'});checkBackend()}
function bindDrop(id,fileId,nameId){const dz=$(id),input=$(fileId),name=$(nameId);['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag')}));['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag')}));dz.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f){const dt=new DataTransfer();dt.items.add(f);input.files=dt.files;name.textContent=f.name}});input.addEventListener('change',()=>name.textContent=input.files[0]?.name||'nenhum arquivo')}

bindDrop('#drop1','#file1','#name1');bindDrop('#drop2','#file2','#name2');$('#analyzeBtn').addEventListener('click',analyze);$('#clearBtn').addEventListener('click',clearAll);$('#dedupeToggle').addEventListener('change',render);$('#sourceFilter').addEventListener('change',render);$('#sortOrder').addEventListener('change',render);$('#lbJsonBtn').addEventListener('click',exportListenBrainz);$('#csvBtn').addEventListener('click',exportCSV);$('#jsonBtn').addEventListener('click',exportJSON);$('#sendAllBtn').addEventListener('click',sendAll);$('#sendReportBtn').addEventListener('click',exportSendReport);$('#logoutBtn').addEventListener('click',logout);$('#connectBtn').addEventListener('click',connect);$('#tokenInput').addEventListener('keydown',e=>{if(e.key==='Enter')connect()});checkBackend();
