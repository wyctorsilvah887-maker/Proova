
# Proova - Log de Desenvolvimento

## 📝 Histórico de Alterações Recentes
- **Consentimento e retenção (Google) - [FINALIZADO]:** Formulário de coleta agora exige caixa de autorização de publicação (registrada em `consent` no depoimento: data, mídia e versão do texto `2026-11-v1`). Avaliações do Google lidas pelo Apify passam a ter `expireAt` e são apagadas após 30 dias pelo cron diário (`purgeExpiredReviews`); o painel mostra o prazo e o tour do dash explica. Termos e Privacidade atualizados (18/11/2026). Motivo: políticas do Google (Places/Business Profile) limitam guarda e redistribuição de avaliações; revisar com advogado antes de escalar.
- **Correção Crítica (FCM) - [FINALIZADO]:** Criado o arquivo `public/firebase-messaging-sw.js` e ajustado o hook `useNotifications` para registrar o service worker e salvar o token corretamente no Firestore.
- **Ajuste de Produção (FCM) - [EM ANDAMENTO]:** Identificada a necessidade de redeploy para injeção da `NEXT_PUBLIC_VAPID_KEY` via variáveis de ambiente do provedor de hospedagem.
- **Notificações Push (FCM) - [FINALIZADO]:** Implementada a infraestrutura completa para Web Push. Adicionado suporte a VAPID via variáveis de ambiente, registro de tokens no perfil do usuário e Service Worker para recebimento em background.
- **Mural em Tempo Real (Landing Page) - [FINALIZADO]:** Substituído o componente de depoimentos estático por um iframe dinâmico que exibe o mural oficial da Proova em tempo real, servindo como demonstração viva da tecnologia.
- **Acesso Direto à Coleta (Landing Page) - [FINALIZADO]:** Adicionado link estratégico discreto na Landing Page (`/c/proova`) para capturar depoimentos de clientes da própria plataforma Proova, reforçando a autoridade da marca.
- **Segurança de Suporte (Ajuste de Regras) - [FINALIZADO]:** Implementada permissão explícita de `list` na coleção de tickets de suporte, resolvendo o erro de permissão negada encontrado em ambientes de produção.
- **Suporte Humanizado de Elite - [FINALIZADO]:** Implementada a interface `/admin/support/[userId]`, permitindo que administradores respondam em tempo real. Adicionadas notificações por e-mail e indicadores visuais de presença (bolinhas verde/vermelha) nel Dashboard.
- **Auto-Curadoria (Fila de Revisão) - [FINALIZADO]:** Implementado motor de regras que filtra depoimentos de alta qualidade e os envia para uma fila de aprovação.
- **Consultor Proova 2.0 (Scanner de Saúde Digital) - [FINALIZADO]:** Auditoria técnica automatizada de perfis Google.
- **Otimização de Tutorial Mobile - [FINALIZADO]:** Correção crítica no sistema de rolagem do Tutorial.

## 🚀 Próximos Marcos Técnicos
- [ ] Implementação de **Insights de Sentimento** (Actionable AI).
- [ ] **ROI da Confiança**: Cálculo de valor gerado por prova social.
- [ ] **Daily Pick**: Notificação diária do melhor depoimento para o Instagram.
- [ ] Ativação da Moderação Automática com Genkit (Shield).

## 2026-11-19 — Inbox / Reputation Shield (`claude/inbox`)
- Feedbacks 1–3★ (ou destino "private") agora são gravados em `private_feedbacks` (status `new`), não vão mais ao público.
- `src/lib/inbox-alert.ts`: incrementa `users/{uid}.inboxNewCount` e envia push (Premium/PRO/trial); e-mail de alerta também só para planos pagos.
- `/private` reescrito: abas Críticas/Curadoria, filtros Novas/Resolvidas, responder por WhatsApp/e-mail com mensagem pronta, sugestão da IA, resolver/reabrir, publicar (com confirmação), excluir, opt-in de push e tour (`inboxTourDone`).
- Menu: selo do Inbox = curadoria pendente + `inboxNewCount`; dash mostra faixa com críticas novas.
- Atenção: métricas, cards e página pública leem só `testimonials`, então críticas privadas não entram nelas.
- Nota média real: `/metrics` e o relatório semanal agora somam as críticas privadas (`private_feedbacks`) à média e ao gráfico de notas.
- Lembrete diário (dias úteis, 09h Fortaleza): `/api/cron/review-reminder` manda push para planos pagos com token, convidando a enviar o link de coleta. Desligável por usuário com `reminderPush:false`.
