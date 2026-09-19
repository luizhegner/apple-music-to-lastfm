# Apple Music → Last.fm

Web client local-first para unir dois exports CSV do Apple Music e gerar arquivos para importação/scrobbling no Last.fm.

## O que já funciona

- dois CSVs simultaneamente;
- parsing de CSV com aspas e vírgulas dentro de campos;
- detecção de separador `,`/`;`;
- suporte a cabeçalhos variantes de Play Activity / Play History;
- preservação de artista, faixa, álbum, album artist, duração e timestamp;
- deduplicação exata de eventos entre as duas contas;
- prévia tabular e estatísticas;
- exportação Last.fm CSV, Universal Scrobbler CSV e JSON;
- autenticação e envio direto em lotes de até 50 usando Cloudflare Pages Functions;
- envio do histórico completo, sem cortar automaticamente em 14 dias;
- relatório CSV do envio, discriminando aceitos e ignorados por código;
- preservação dos timestamps originais.

## Sobre o histórico antigo

A API atual do Last.fm aceita lotes de até 50 scrobbles. Cada scrobble da resposta pode ser aceito ou ignorado; entre os códigos documentados estão timestamp muito antigo, timestamp futuro e limite diário de scrobbles. A documentação atual não estabelece uma janela fixa de 14 dias. Por isso, este projeto tenta o histórico completo e registra o resultado de cada evento, em vez de cortar a importação antecipadamente.

## Deploy recomendado

Use **Cloudflare Pages**, não GitHub Pages, caso queira o botão de envio direto ao Last.fm. O front-end continua estático e os segredos ficam em Pages Functions.

1. Crie um projeto Pages apontando para este repositório.
2. Cadastre uma aplicação no Last.fm e defina o callback como `https://SEU-DOMINIO/api/callback`.
3. Em **Settings → Variables and Secrets**, crie:
   - `LASTFM_API_KEY`
   - `LASTFM_SHARED_SECRET`
4. Faça o deploy.
5. Abra o site, carregue os dois CSVs e clique em **Conectar Last.fm**.
6. Depois de revisar a prévia e as duplicatas, use **Enviar histórico completo**.

## Uso sem backend

GitHub Pages também serve para a parte de conversão/exportação. Nesse modo, os botões CSV/JSON funcionam normalmente, mas o login e o envio direto ao Last.fm não estarão disponíveis.

## Segurança

Os CSVs não são enviados ao servidor pelo front-end. O navegador lê os arquivos localmente. O backend recebe somente os dados do lote no momento em que você escolhe enviar ao Last.fm. A chave e o segredo do Last.fm permanecem nas variáveis protegidas do Cloudflare Pages.
