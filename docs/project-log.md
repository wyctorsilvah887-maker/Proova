
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
- Interruptor "Lembrete diário no celular" no dash (aba Link de coleta, planos pagos) grava `reminderPush`. Tabela e cards de planos em /pricing listam Inbox Reputation Shield, alertas, resposta rápida, lembrete e nota real.
- Plano Base visível em /pricing e na landing (cards de 3 colunas); /pricing: tema sempre visível (sem borda/fundo), ícone de usuário removido do cabeçalho; menu lateral ganhou "Planos e Preços".

## 2026-11-19 — Landing focada em conversão + vídeo "Como funciona"
- `public/video/como-funciona.mp4` (54s, 1280x720, 1,4 MB, sem áudio) + poster webp. Motion com réplicas das telas reais (dash, coleta, Inbox, resposta IA do Google, página pública). Fonte do vídeo (HTML + engine) fica fora do repo (scratchpad).
- Landing: hero com benefício e CTA "Criar conta grátis" + "Ver como funciona", selos (Base grátis, sem cartão, 1 minuto), vídeo logo abaixo (autoplay só quando visível, mudo, botão pausar), seção de dor/solução, 3 passos, FAQ de objeções (grátis, sem app, críticas privadas, autorização), CTA final e barra fixa no mobile (o widget do mural sobe 84px quando a barra aparece).
- Push: o token só era registrado em /support e /private, então quem nunca passou por lá não recebia nada (e quem dispensou o aviso no suporte nunca via o convite). Agora o menu lateral (todas as páginas, planos pagos) renova o token em silêncio, oferece "Ativar avisos no celular" e tem "Testar" (`/api/push-test` devolve o motivo da falha). Corrigido o ícone do service worker (arquivo inexistente).
- Push em primeiro plano: com a aba aberta o FCM não aciona o service worker, então o teste "enviava" mas nada aparecia. `listenForeground` (push-client) mostra o aviso na tela e a notificação do sistema.

## 2026-11-19 — Avisos de renovação do plano
- Removido o botão "Testar" do menu e a rota `/api/push-test`.
- Webhook Cakto grava `planRenewsAt` (de `data.subscription.next_payment_date`, ou hoje + `recurrence_period`) ao ativar/renovar e apaga ao cancelar.
- `src/lib/plan-renewal.ts`: 3 dias e 1 dia antes da cobrança, e-mail (Resend) + push, só Premium/PRO. Dedup por ciclo (`renewalNoticeFor`/`renewalNoticeStage`). Quem assinou antes do `planRenewsAt` existir usa estimativa: última cobrança (`planUpdatedAt`) + 30 dias, e o e-mail diz "por volta de".
- O cron `/api/cron/review-reminder` agora roda todo dia (Hobby = 2 crons): renovação todo dia, lembrete de avaliação só de segunda a sexta.
- Configurações: cartão do plano mostra "Próxima renovação: dd de mês (em N dias)" (ou "Renovação prevista" quando é estimativa) para Premium/PRO.

## 2026-11-20 — Analytics próprio do funil (estudo de taxas de sucesso, item 1)
- Sem ferramenta externa nem cookies de terceiros. `src/lib/track.ts` + `PageTracker` (layout) enviam eventos para `POST /api/track` (ignora bots por User-Agent; o admin é excluído via flag `proova_notrack`). Contador "único" = 1ª vez do dia por navegador.
- Eventos: `landing_view`, `pricing_view`, `signup_view`, `signup_click` (clique em link /signup), `signup_done` (e-mail e Google), `link_copied` (copiou o link de coleta no dash), `first_feedback` (servidor, 1ª avaliação recebida). Totais por dia e por origem (utm/referrer) em `analytics_daily/{AAAA-MM-DD}` (dia em America/Fortaleza), gravados só pelo Admin SDK.
- `/admin/growth`: novo cartão "Funil: visita → cadastro → ativação" com conversão por etapa e tabela por origem.
- `firestore.rules`: nova coleção `analytics_daily` (leitura só admin, escrita negada). **Publicar as regras no Console** (a Vercel não publica).
- Limites: único por dia somado no período (não é único real); só passa a medir após o deploy; sem histórico anterior.
- Cliques em "Criar conta" detalhados: cada botão da landing tem `data-cta` (nav, menu-mobile, hero, plano-base, cta-final, barra-mobile); o plano Base em /pricing (botão, não link) também conta. Novo evento `checkout_click` (planos pagos em /pricing). `/admin/growth` mostra cliques por botão (total) e checkout (únicos). Dados em `analytics_daily.{dia}.cta.{evento}.{botão}`.

## 2026-11-20 — Aberturas do link de coleta (funil enviado → aberto → avaliou)
- `POST /api/collection-view` (público, ignora bots e o robô de pré-visualização do WhatsApp) soma `users/{id}.collectionViewCount` e o evento diário `collection_view`. O navegador manda 1x por sessão e não manda se for do dono (`proova_owner`, gravado no dash) ou do admin (`proova_notrack`).
- Dono: cartão "Seu link de coleta" em /metrics (aberturas, avaliações recebidas, % que abriu e avaliou). Admin: total de aberturas de todos os clientes em /admin/growth.
- Limites: só conta após o deploy; `testimonialsCount` inclui avaliações privadas e públicas; a taxa é aproximada (aberturas por sessão vs avaliações do mesmo período total).
## 2026-11-20 — Ativação medida por conta
- `users/{uid}.firstLinkSharedAt` (gravado pelo dono na 1ª vez que copia o link de coleta ou toca em "WhatsApp" no dash) e `firstFeedbackAt` (gravado pelo servidor, Admin SDK, na 1ª avaliação recebida). `LinkShareBox` ganhou `onShare`.
- `/admin/growth`: cartão "Ativação" com cadastros do período → enviaram o 1º link → receberam a 1ª avaliação. Quem já tinha avaliações antes (testimonialsCount > 0) conta como ativado; o "enviou o link" só vale para quem usou depois do deploy.

## 2026-11-20 — Medição de resultados (1º depoimento aprovado, Link in Bio confiável, antes/depois)
- `users/{uid}.firstApprovedAt`: gravado pelo servidor quando o 1º depoimento já nasce aprovado e pelo dono (`src/lib/activation.ts`) ao aprovar/promover no Inbox. Evento `first_approved` no funil e no cartão "Ativação" do /admin/growth.
- `trackPPVisit`/`trackWhatsappClick`: ignoram bots (User-Agent) no servidor; o navegador conta 1x por dia por página e nunca conta o dono/admin (`proova_owner`/`proova_notrack`). Se o armazenamento do navegador estiver bloqueado, não conta (subconta em vez de inflar). Os contadores antigos continuam, mas só os novos são "únicos por dia".
- Antes/depois: o dono informa uma vez a nota e o nº de avaliações do Google (`users/{uid}.baseline`, autodeclarado) no /metrics; "hoje" vem ao vivo do Google (`/api/google-rating`). **Decisão de conformidade:** não gravamos nota/contagem do Google no banco, porque os Termos do Google Maps Platform restringem guardar esses dados. Por isso a linha de base é informada pelo cliente em vez de capturada automaticamente no cadastro.

## 2026-11-20 — Documentação
- `README.md` reescrito (stack, rodar local, variáveis de ambiente, publicação), `.env.example` (sem valores) e `docs/arquitetura.md` (planos, Inbox, Google, push, crons, cobrança, analytics, IA, segurança).

## 2026-11-20 — Cabeçalho de /pricing
- Removido o nome da clínica do cabeçalho; o menu da conta continua abrindo pelo rótulo do plano (um pouco maior, já que agora é o único texto).

## 2026-11-22 — Atalho "Blog" no menu lateral
- Novo item "Blog" no grupo Conta do `AppSideMenu`, abre https://blog.useproovaai.com.br na mesma aba (`external` no tipo `Item`).

## 2026-11-22 — Landing premium (animações e interações)
- Sem biblioteca nova. `src/components/landing-fx.tsx`: `Reveal` (entrada ao rolar, em cascata), `TiltCard` (inclinação 3D + brilho que segue o mouse, só com mouse), `CountUp`, `ScrollProgress` (barra de leitura no topo), `Aurora` (luzes e grade de pontos no hero). Todos respeitam `prefers-reduced-motion` e têm rede de segurança para nunca deixar conteúdo escondido.
- `src/components/landing-demo.tsx`: `HeroNotifications` (avisos que se alternam), `FactsStrip` (R$ 0, 1 min, 7 dias, 100% das notas do link na média: só fatos do produto, nada inventado) e `RatingSimulator` (seção "Teste na prática": o visitante toca nas estrelas e vê o destino: ≤3 Inbox privado com alerta; 4–5 prova social e convite ao Google).
- Landing: botão principal com brilho, cards com tilt, linha do tempo nos 3 passos, cards de planos com entrada em cascata, FAQ com abertura animada, luzes no CTA final. Novos keyframes `orb`, `orb-slow`, `pop` em `tailwind.config.ts`. Item "Teste na prática" no menu mobile.

## 2026-11-22 — Landing: cards de planos em 3D e tema chumbo/alaranjado
- Cards de planos com profundidade real: `preserve-3d`, borda inferior grossa, sombras em camadas e elementos em `translateZ` (selo, nome, preço, botão); inclinação até 11° com o mouse.
- Tema só da landing (`html:has(#landing-root)` em `globals.css`, o app não muda): escuro em preto chumbo (fundo `220 8% 5%`, cards e seções em grafite) e claro com fundo pêssego/alaranjado em vez de branco puro, mais luzes de fundo suaves. Seções que tinham `zinc-950` fixo agora usam o chumbo.

## 2026-11-22 — Landing: pontilhado no lugar do tema tingido
- Removido o tema tingido (chumbo/pêssego). Agora o fundo da landing é pontilhado em toda a página (`#landing-root` em `globals.css`): claro = muitos pontinhos laranja sobre o branco; escuro = pontinhos chumbo sobre o preto. Seções e rodapé ficam transparentes para o pontilhado aparecer (cards continuam sólidos); a seção do CTA final mantém o fundo escuro próprio (`#cta-final-section`). Removida a grade de pontos duplicada do `Aurora`.
