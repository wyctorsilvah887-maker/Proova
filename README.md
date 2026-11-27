# Proova AI

Plataforma de prova social para negócios locais (clínicas, consultórios, serviços): coleta avaliações de clientes, protege a reputação (críticas vão para um Inbox privado), publica depoimentos em uma página pública e em widgets e ajuda a gerar avaliações no Google.

Site: https://www.useproovaai.com.br

## Stack

- Next.js 15 (App Router, React 19, Tailwind, shadcn/ui)
- Firebase: Auth, Firestore, Storage e Cloud Messaging (push), com SDK de cliente e Admin SDK no servidor
- Genkit + Gemini para respostas e sugestões com IA
- Resend (e-mails), Cakto (cobrança), Apify e Google Places API (avaliações do Google)
- Hospedagem na Vercel (plano Hobby: só 2 crons diários)

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis (veja abaixo)
npm run dev                  # http://localhost:9002
npm run typecheck            # checagem de tipos
npm run build                # build de produção
```

Para testar os fluxos de IA isoladamente: `npm run genkit:dev`.

## Variáveis de ambiente

Configure na Vercel (Settings → Environment Variables). Nunca coloque chaves no repositório.

| Variável | Para que serve | Obrigatória |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço do Firebase (Admin SDK), em uma linha | Sim |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Chave pública de push (Firebase → Cloud Messaging) | Para push |
| `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`) | Chave do Gemini lida pelo Genkit | Para IA |
| `AI_MODEL`, `AI_FALLBACK_MODEL` | Modelo principal e reserva da IA (têm padrão no código) | Não |
| `RESEND_API_KEY` | Envio de e-mails | Para e-mails |
| `RESEND_FROM_ADDRESS`, `RESEND_FROM` | Remetente dos e-mails do sistema e de cobrança | Não |
| `CAKTO_WEBHOOK_SECRET` | Valida o webhook de pagamentos | Sim |
| `CRON_SECRET` | Protege as rotas `/api/cron/*` (a Vercel envia no cabeçalho) | Sim |
| `GOOGLE_MAPS_API_KEY` | Places API: busca de empresa e nota do Google | Para Google |
| `APIFY_TOKEN`, `APIFY_WEBHOOK_SECRET` | Coleta das avaliações do Google | Para Google |
| `SUPPORT_ALERT_EMAILS` | E-mails (separados por vírgula) que recebem alerta de suporte | Não |
| `ADMIN_PATH` | Endereço secreto do painel admin (ex.: `ops-7k2m9x4p`, sem barra). Com ele, `/admin` responde 404. Vazio = painel em `/admin` | Recomendada |
| `APP_URL` | URL base usada em links gerados no servidor | Não |

A configuração pública do Firebase (cliente) fica em `src/firebase/config.ts`.

## Publicação

1. **Código:** push no GitHub e merge no `main`; a Vercel faz o deploy.
2. **Regras do Firestore e do Storage:** a Vercel **não** publica `firestore.rules` nem `storage.rules`. Copie o conteúdo no Firebase Console (ou use `firebase deploy --only firestore:rules,storage`).
3. **Crons:** definidos em `vercel.json` (horários em UTC).
4. **Webhooks:** Cakto aponta para `/api/webhook/cakto`; Apify para `/api/webhooks/apify`.

## Documentação

- [`docs/arquitetura.md`](docs/arquitetura.md): como o sistema funciona por dentro (planos, cobrança, push, crons, analytics).
- [`docs/project-log.md`](docs/project-log.md): diário técnico com decisões e pendências.
- [`docs/blueprint.md`](docs/blueprint.md) e [`docs/strategy.md`](docs/strategy.md): visão e estratégia de produto.
- [`docs/backend.json`](docs/backend.json): esquema das entidades (pode estar defasado em relação ao código).
