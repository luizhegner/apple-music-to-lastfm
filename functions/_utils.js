export const API_ROOT='https://ws.audioscrobbler.com/2.0/';
export function cookie(name){return (documentCookie(arguments) || '').match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}=([^;]*)`))?.[1] || null}
function documentCookie(request){return request.headers.get('Cookie')||''}
export function parseCookies(request){const h=request.headers.get('Cookie')||'';return Object.fromEntries(h.split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2))}
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8',...headers}})}
export function signParams(params,secret){const base=Object.keys(params).filter(k=>k!=='format'&&k!=='callback').sort().map(k=>`${k}${params[k]}`).join('')+secret;return md5(base)}
export function authUrl(env,request){const u=new URL('/api/callback',request.url);return `https://www.last.fm/api/auth/?api_key=${encodeURIComponent(env.LASTFM_API_KEY)}&cb=${encodeURIComponent(u.href)}`}
export async function lastfmPost(params,env){const payload={...params,api_key:env.LASTFM_API_KEY,api_sig:signParams(params,env.LASTFM_SHARED_SECRET),format:'json'};const body=new URLSearchParams(payload).toString();const r=await fetch(API_ROOT,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded; charset=UTF-8','user-agent':'AppleMusicToLastFM/1.0'},body});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}if(!r.ok)return{ok:false,status:r.status,data};return{ok:true,data}}

function md5(input){
  const x=new TextEncoder().encode(input); const len=((x.length+8>>>6)+1)*16; const m=new Uint32Array(len);
  for(let i=0;i<x.length;i++) m[i>>2]|=x[i]<<((i&3)*8); m[x.length>>2]|=0x80<<((x.length&3)*8); m[len-2]=x.length*8;
  let a=0x67452301,b=0xefcdab89,c=0x98badcfe,d=0x10325476;
  const K=Array.from({length:64},(_,i)=>Math.floor(Math.abs(Math.sin(i+1))*2**32)>>>0);
  const S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21]; const add=(a,b)=>(a+b)>>>0; const rol=(v,n)=>(v<<n)|(v>>>(32-n));
  for(let i=0;i<len;i+=16){let A=a,B=b,C=c,D=d;
    for(let j=0;j<64;j++){
      let F,g,s= S[(j>>4)*4+(j&3)];
      if(j<16){F=(B&C)|((~B)&D);g=j}else if(j<32){F=(D&B)|((~D)&C);g=(5*j+1)&15}else if(j<48){F=B^C^D;g=(3*j+5)&15}else{F=C^(B|(~D));g=(7*j)&15}
      const T=add(add(add(A,F),m[i+g]),K[j]); A=D;D=C;C=B;B=add(B,rol(T,s));
    }
    a=add(a,A);b=add(b,B);c=add(c,C);d=add(d,D);
  }
  const out=new Uint8Array(16),v=[a,b,c,d]; for(let i=0;i<4;i++){out[i*4]=v[i]&255;out[i*4+1]=(v[i]>>>8)&255;out[i*4+2]=(v[i]>>>16)&255;out[i*4+3]=(v[i]>>>24)&255}
  return [...out].map(b=>b.toString(16).padStart(2,'0')).join('');
}
