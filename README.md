# Apple Music → ListenBrainz

Web client local-first para unir dois exports CSV do Apple Music e enviar o histórico completo para o [ListenBrainz](https://listenbrainz.org).

## O que já funciona

- dois CSVs simultaneamente;
- parsing de CSV com aspas e vírgulas dentro de campos;
- detecção de separador `,`/`;`;
- suporte a cabeçalhos variantes de Play Activity / Play History;
- preservação de artista, faixa, álbum, album artist, duração e timestamp;
- deduplicação exata de eventos entre as duas contas;
- prévia tabular e estatísticas;
- exportação ListenBrainz JSON (`/1/submit-listens`), CSV e JSON normalizado;
- autenticação por **user token** e envio direto em lotes de até 500 listens usando Cloudflare Pages Functions;
- envio do histórico completo com `listen_type: import`, sem janela de 14 dias;
- relatório CSV do envio, discriminando lotes aceitos e falhos;
- preservação dos timestamps originais (`listened_at` em segundos UTC).

## Sobre o histórico antigo

Diferente do Last.fm, o ListenBrainz aceita listens com timestamps arbitrariamente antigos quando enviados como `listen_type: import` (até 1000 listens por requisição; aqui usamos lotes de 500 para ficar dentro do limite de tamanho do payload). Listens repetidos — mesmo `listened_at`, artista e faixa — são descartados pelo servidor, então reenviar um arquivo não duplica o histórico.

## Deploy recomendado

Use **Cloudflare Pages**. O front-end continua estático e o token do usuário fica em um cookie `HttpOnly`, nunca no `localStorage`.

1. Crie um projeto Pages apontando para este repositório.
2. Faça o deploy (não há secrets obrigatórios: o token é informado por quem usa o site).
3. Abra o site, carregue os CSVs do Apple Music.
4. Pegue seu user token em <https://listenbrainz.org/settings/>, cole no campo e clique em **Conectar ListenBrainz**.
5. Depois de revisar a prévia e as duplicatas, use **Enviar histórico completo**.

### Endpoints das Pages Functions

| Rota | Método | Função |
| --- | --- | --- |
| `/api/token` | POST | valida o user token em `/1/validate-token` e grava o cookie |
| `/api/me` | GET | revalida o token e devolve o nome do usuário |
| `/api/logout` | POST | limpa os cookies |
| `/api/submit` | POST | repassa um lote para `/1/submit-listens` |

## Uso sem backend

GitHub Pages também serve para a parte de conversão/exportação. Nesse modo os botões de exportação funcionam normalmente; para importar, use o JSON gerado com um cliente próprio, por exemplo:

```bash
curl -X POST https://api.listenbrainz.org/1/submit-listens \
  -H "Authorization: Token SEU_TOKEN" \
  -H "Content-Type: application/json" \
  --data @listenbrainz-submit-listens.json
```

(divida o arquivo em blocos de até 1000 listens).

## Segurança

Os CSVs não são enviados ao servidor pelo front-end: o navegador lê os arquivos localmente. O backend recebe somente os dados do lote no momento em que você escolhe enviar ao ListenBrainz. O user token trafega apenas entre o seu navegador e a sua própria instância das Pages Functions, armazenado em cookie `HttpOnly; Secure; SameSite=Lax`.
