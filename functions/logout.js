export function onRequestPost(){
  const headers = new Headers({'content-type':'application/json;charset=UTF-8'});
  headers.append('Set-Cookie', 'lb_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  headers.append('Set-Cookie', 'lb_user=; Path=/; Secure; SameSite=Lax; Max-Age=0');
  return new Response(JSON.stringify({ok:true}), {headers});
}
