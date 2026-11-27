# Arquitetura do Proova AI

Atualizado em 20/11/2026. Descreve o que o código faz hoje; em caso de dúvida, vale o código e o [`project-log.md`](project-log.md).

## Visão geral

```
Cliente final ──► /c/[slug] (link de coleta) ──► server action (testimonial-actions)
                                                   ├─ nota 4–5 com texto/mídia → testimonials (approved)
                                                   ├─ nota 1–3 ou destino "privado" → private_feedbacks (Inbox)
                                                   └─ só nota → testimonials (pending, moderação)
Visitante ──► /pp/[slug] (página pública) e widgets (/widgetpublic, /widgets)
Dono ──► /dash, /private (Inbox), /metrics, /settings, /ppeditor, /widgetconfig, /social-cards
Admin ──► /admin (inclui /admin/growth)
```

## Planos e acesso

`users/{uid}.membershipStatus`:

| Valor | Plano |
|---|---|
| `base` | Conta nova ou legada **sem plano**: painel e páginas públicas bloqueados até assinar |
| `trial` | Só contas que JÁ estavam em teste antigo: valem até `trialEndsAt`; não se cria mais teste |
| `gold` | Premium |
| `enterprise` | PRO |
| `expired` | Teste antigo vencido ou plano cancelado/reembolsado: sem acesso |

- Limites e benefícios por plano ficam em `src/lib/pp-plans.ts` (e a landing ainda tem alguns benefícios do Base escritos à mão).
- **Só o servidor muda o plano.** O webhook da Cakto (`/api/webhook/cakto`) usa o Admin SDK, que ignora as regras do Firestore. As regras impedem o dono de alterar `membershipStatus`, `isAdmin`, datas de plano etc.
- Data de renovação: `planRenewsAt` (vinda da Cakto; se faltar, estimada em `planUpdatedAt` + 30 dias).

## Reputation Shield e Inbox

- Notas de 1 a 3 estrelas nunca vão para a página pública: caem em `users/{uid}/private_feedbacks` (status `new`) e geram aviso (contador `inboxNewCount`, push e e-mail nos planos pagos, via `src/lib/inbox-alert.ts`).
- O dono pode responder pelo WhatsApp/e-mail, marcar como resolvido ou promover para público (consentimento verificado).
- A nota média em `/metrics` e no relatório semanal **inclui** os feedbacks privados.

## Avaliações do Google

- A nota e a contagem do Google são lidas ao vivo (`/api/google-rating`, cache de 6 h). **Não são gravadas no banco**: os Termos do Google Maps Platform restringem guardar esses dados.
- As avaliações vêm do Apify (`/api/cron/reviews`, `/api/webhooks/apify`, `src/lib/reviews/`) e são mantidas por 30 dias (`REVIEW_RETENTION_DAYS`).
- Não solicitamos avaliações de forma seletiva (proibido pelo Google).

## Notificações

- **Push (FCM, só dados):** o Service Worker `public/firebase-messaging-sw.js` monta a notificação. Com o app aberto o SW não é chamado, então `src/lib/push-client.ts` (`listenForeground`) mostra toast + notificação.
- Tokens em `user_push/{uid}`, registrados por `POST /api/push-token`; a sincronização silenciosa roda do menu lateral, uma vez por sessão.
- **E-mail:** Resend (`src/lib/mail.ts`).

## Crons (Vercel Hobby: máximo 2)

| Rota | Horário (UTC) | O que faz |
|---|---|---|
| `/api/cron/reviews` | 11:00 | Dispara a busca de avaliações do Google e apaga as que passaram de 30 dias |
| `/api/cron/review-reminder` | 12:00 | Avisos de renovação (todo dia, 3 e 1 dia antes) e lembrete push para pedir avaliações (seg a sex; `reminderPush:false` desliga) |

Ambos exigem `CRON_SECRET`.

## Cobrança

Cakto → `/api/webhook/cakto` (ativa/desativa plano e grava `planRenewsAt`); `/api/refund` registra o pedido de reembolso do cliente (a devolução é feita manualmente na Cakto) e `/api/billing/claim/*` faz o resgate de uma compra por código enviado ao e-mail usado no pagamento.

## Analytics próprio (sem cookies de terceiros)

- Cliente: `src/lib/track.ts` + `PageTracker` enviam eventos para `POST /api/track` (ignora bots; o admin e o dono ficam de fora por flags no navegador).
- Servidor: `src/lib/analytics-server.ts` soma contadores em `analytics_daily/{AAAA-MM-DD}` (dia em America/Fortaleza). Leitura só admin, escrita só Admin SDK.
- Eventos: `landing_view`, `pricing_view`, `signup_view`, `signup_click` (com o botão), `signup_done`, `checkout_click`, `link_copied`, `first_feedback`, `first_approved`, `collection_view`.
- Ativação por conta: `firstLinkSharedAt`, `firstFeedbackAt`, `firstApprovedAt` em `users/{uid}`.
- Link de coleta: `collectionViewCount` (abertura, 1x por sessão). Link in Bio: `ppVisitCount` e `whatsappClickCount` (1x por dia por navegador; bots ignorados).
- Linha de base (antes/depois no Google): `users/{uid}.baseline`, informada pelo dono.
- Painel: `/admin/growth` (funil, origem por UTM, ativação, MRR estimado por preço fixo R$ 147 e R$ 270).

## IA

Genkit + Gemini em `src/ai/` (`reply.ts` gera respostas, `resilience.ts` faz fallback entre `AI_MODEL` e `AI_FALLBACK_MODEL`). Cotas por plano em `src/lib/ai-quota.ts`.

## Segurança

- `firestore.rules` e `storage.rules`: dono só edita o próprio perfil; visitantes só somam +1 em contadores permitidos; listagem de usuários exige `limit(1)`.
- Rotas públicas (`/api/track`, `/api/collection-view`, `/api/google-click`) só incrementam contadores, validam entrada e ignoram bots.
- **Painel admin em endereço secreto:** `ADMIN_PATH` + `src/middleware.ts` (reescreve `/<ADMIN_PATH>` para `/admin` e devolve 404 em `/admin`). O endereço só é entregue a administradores por `POST /api/admin/entry` (não vai no código público; links internos usam `useAdminBase`). Isso só esconde o caminho: a proteção real é o login + `isAdmin` protegido nas regras do Firestore. `/admin` não aparece mais no `robots.txt`.
- A chave de serviço do Firebase só existe como variável de ambiente na Vercel.

## Pendências conhecidas

- Publicar manualmente as regras do Firestore após cada mudança.
- `docs/backend.json` e `docs/blueprint.md` não foram revisados contra o código atual.
- Revisão jurídica do texto de consentimento e dos Termos (LGPD e regras de publicidade em saúde).
