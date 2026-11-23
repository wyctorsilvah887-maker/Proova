'use client';

import { trialDaysLeft } from '@/lib/trial';
import { trackEvent } from '@/lib/track';
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Check, 
  ArrowRight, 
  Zap, 
  Star, 
  Shield, 
  ArrowLeft, 
  LogOut, 
  TrendingUp, 
  Layout, 
  Inbox, 
  Gem, 
  Sun, 
  Moon,
  Loader2,
  Lock,
  Sparkles,
  ChevronDown,
  Handshake,
  BadgeCheck,
  Headphones,
  CheckCircle2,
  Bot
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';
import { ppCaps, AI_MONTHLY_LIMIT } from '@/lib/pp-plans';

const FREE = ppCaps('free');
const PREMIUM = ppCaps('premium');
const PRO = ppCaps('pro');
const num = (n: number) => (n === Infinity ? 'Ilimitados' : String(n));

// Valores de página pública vêm de pp-plans.ts (mesma fonte do editor), então a tabela nunca diverge.
const COMPARE_ROWS: { label: string; base: string | boolean; premium: string | boolean; pro: string | boolean }[] = [
  { label: 'Link de coleta e QR Code de balcão', base: true, premium: true, pro: true },
  { label: 'Depoimentos na página pública', base: num(PREMIUM.selectionLimit), premium: num(PREMIUM.selectionLimit), pro: num(PRO.selectionLimit) },
  { label: 'Layouts de depoimentos', base: String(PREMIUM.layouts.length), premium: String(PREMIUM.layouts.length), pro: String(PRO.layouts.length) },
  { label: 'Blocos Sobre e Horários', base: PREMIUM.blocks.about, premium: PREMIUM.blocks.about, pro: PRO.blocks.about },
  { label: 'Perguntas frequentes, redes sociais e mapa', base: PREMIUM.blocks.faq, premium: PREMIUM.blocks.faq, pro: PRO.blocks.faq },
  { label: 'Reordenar os blocos da página', base: PREMIUM.reorder, premium: PREMIUM.reorder, pro: PRO.reorder },
  { label: 'Botão de WhatsApp e botão do site', base: PREMIUM.whatsappButton, premium: PREMIUM.whatsappButton, pro: PRO.whatsappButton },
  { label: 'Cor secundária e link personalizado', base: PREMIUM.secondaryColor, premium: PREMIUM.secondaryColor, pro: PRO.secondaryColor },
  { label: 'Seções de texto livres', base: String(PREMIUM.customSections), premium: String(PREMIUM.customSections), pro: String(PRO.customSections) },
  { label: 'Ocultar "Powered by Proova AI"', base: PREMIUM.removeBranding, premium: PREMIUM.removeBranding, pro: PRO.removeBranding },
  { label: 'Busca automática de novas avaliações do Google', base: true, premium: true, pro: true },
  { label: 'Respostas por IA (por mês)', base: String(AI_MONTHLY_LIMIT.premium), premium: String(AI_MONTHLY_LIMIT.premium), pro: String(AI_MONTHLY_LIMIT.pro) },
  { label: 'Resposta automática assim que o depoimento chega', base: true, premium: true, pro: true },
  { label: 'Inbox privado de críticas (Reputation Shield)', base: true, premium: true, pro: true },
  { label: 'Alerta de crítica por e-mail e push no celular', base: true, premium: true, pro: true },
  { label: 'Responder crítica por WhatsApp/e-mail com mensagem pronta', base: true, premium: true, pro: true },
  { label: 'Lembrete diário no celular para pedir avaliação', base: true, premium: true, pro: true },
  { label: 'Nota média real (inclui críticas privadas)', base: true, premium: true, pro: true },
  { label: 'Social Cards VIP (post e story)', base: true, premium: true, pro: true },
  { label: 'Métricas e relatório semanal', base: true, premium: true, pro: true },
  { label: 'Coleta de depoimento em vídeo', base: false, premium: false, pro: true },
];

export default function PricingPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [cachedUserData, setCachedUserData] = useState<any>(null);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  // Link compartilhável: /pricing?plan=gold|pro abre o plano já expandido.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('plan');
      if (p === 'gold' || p === 'pro') setExpandedPlan(p);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const cached = localStorage.getItem(`proova_user_profile_${user.uid}`);
      if (cached) {
        try {
          setCachedUserData(JSON.parse(cached));
        } catch (e) {
          console.error("Erro ao ler cache:", e);
        }
      }
    }
  }, [user]);

  const effectiveUserData = userData || cachedUserData;

  const status = useMemo(() => {
    if (!user) return 'guest';
    return (effectiveUserData?.membershipStatus || 'base').toLowerCase();
  }, [user, effectiveUserData]);

  const trialLeft = status === 'trial' ? trialDaysLeft((effectiveUserData as any)?.trialEndsAt) : 0;

  const membershipLabel = useMemo(() => {
    if (status === 'enterprise' || status === 'pro') return 'PRO';
    if (status === 'gold') return 'PREMIUM';
    if (status === 'trial') return 'TESTE GRÁTIS';
    if (status === 'guest') return 'Visitante';
    return 'SEM PLANO';
  }, [status]);

  if (authLoading || (user && !effectiveUserData)) {
    return <LoadingScreen />;
  }

  const plans = [
    {
      id: 'base',
      name: "Teste grátis de 14 dias",
      price: "R$ 0",
      period: "por 14 dias",
      description: "Todos os recursos Premium, sem cartão",
      icon: Gem,
      highlight: false,
      cta: !user ? "Começar teste grátis" : status === 'trial' ? `Teste em andamento (${trialLeft} ${trialLeft === 1 ? 'dia' : 'dias'})` : (status === 'base' ? "Teste liberado ao abrir o painel" : "Teste já utilizado"),
      disabled: !!user,
      checkoutUrl: "",
      benefits: [
        "Sem cartão de crédito: a conta já começa com o teste",
        "Link de coleta, QR Code de balcão e página pública completa",
        "Inbox privado: críticas de 1 a 3 estrelas ficam só com você",
        `Respostas por IA (Gemini): até ${AI_MONTHLY_LIMIT.premium} por mês`,
        "Busca automática das novas avaliações do Google",
        "Social Cards, métricas e relatório semanal",
        "Ao fim dos 14 dias, escolha Premium ou PRO para manter tudo (seus dados ficam salvos)",
      ]
    },
    {
      id: 'gold',
      name: "Proova AI Premium",
      price: "R$ 147",
      period: "/mês",
      description: "Aceleração de Vendas",
      icon: Star,
      highlight: true,
      cta: status === 'gold' ? "Plano Ativo" : "Garantir meu acesso",
      disabled: status === 'gold',
      checkoutUrl: "https://pay.cakto.com.br/8c7bbit_1215637",
      benefits: [
        "Página pública completa: 4 layouts, até 50 depoimentos, cores, WhatsApp e site",
        "Studio da página: Sobre, Horários, Perguntas, Redes sociais e Mapa",
        "Busca automática das novas avaliações do Google",
        `Respostas por IA (Gemini): até ${AI_MONTHLY_LIMIT.premium} por mês, com resposta automática`,
        "Aviso por e-mail quando chega avaliação negativa",
        "G-Boost (mais avaliações no Google Maps)",
        "Social Cards VIP (Post e Story)",
        "Métricas e relatório semanal por e-mail",
        "Link personalizado da sua página",
        "Inbox Reputation Shield: críticas de 1 a 3 estrelas ficam privadas, com alerta por e-mail e push no celular",
        "Responda o cliente em 1 toque pelo WhatsApp ou e-mail, com mensagem pronta e sugestão da IA",
        "Nota média real: as críticas privadas entram nas métricas e no relatório semanal",
        "Lembrete diário no celular para pedir avaliação (pode desligar quando quiser)",
        "Autorização de publicação registrada em cada depoimento coletado",
        "Suporte prioritário no chat do app"
      ]
    },
    {
      id: 'pro',
      name: "Proova AI PRO",
      price: "R$ 270",
      period: "/mês",
      description: "Domínio de Mercado",
      icon: Zap,
      highlight: false,
      cta: (status === 'pro' || status === 'enterprise') ? "Plano Ativo" : "Garantir meu acesso",
      disabled: status === 'pro' || status === 'enterprise',
      checkoutUrl: "https://pay.cakto.com.br/yhtkwz4_1215645",
      benefits: [
        "Tudo do Premium, mais:",
        `Até ${AI_MONTHLY_LIMIT.pro} respostas por IA por mês`,
        "Depoimentos ilimitados na página pública",
        "Coleta de depoimento em vídeo",
        "Remova o \"Powered by Proova AI\" da sua página",
        "Até 20 seções de texto livres",
        "Suporte dedicado com consultor",
        "Consultoria de reputação mensal",
        "Domínio próprio (sob consulta)"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background font-body text-foreground flex flex-col overflow-x-hidden">
      <header className="bg-background border-b h-16 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[100] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <Link href={user ? "/dash" : "/"}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent select-none">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center group -ml-2">
            <div className="relative w-[140px] h-[46px] md:w-[320px] md:h-[106px]">
              <Image src="/logo-proovaai-whitemode.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/logo-proovaai-darkmode.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="flex border-none bg-transparent shadow-none hover:bg-transparent" />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 md:h-12 px-1 md:px-2 gap-1.5 md:gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] md:text-[11px] uppercase tracking-widest font-black text-primary leading-tight group-hover:opacity-80 transition-opacity">{membershipLabel}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl bg-background border">
                <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-1" />
                <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl font-bold py-2.5 cursor-pointer">Dashboard</DropdownMenuItem>
                <DropdownMenuSeparator className="mx-1" />
                <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold py-2.5 cursor-pointer">Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="flex-1 pt-24 md:pt-40 pb-20 px-4 container max-w-4xl mx-auto flex flex-col space-y-12 md:space-y-16">
        <section className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
           <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1">Níveis de Estratégia</Badge>
           <h1 className="text-3xl md:text-6xl font-black font-headline tracking-tighter leading-[1.1]">
             Escolha o seu Nível de <br className="hidden sm:block" />
             <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">Autoridade.</span>
           </h1>
           <p className="text-muted-foreground font-medium text-xs md:text-lg max-w-xl mx-auto leading-relaxed px-4">
             A reputação da sua marca é o seu maior ativo. Invista nas ferramentas certas para dominar o seu mercado local.
           </p>
           {status === 'expired' && (
             <p className="mx-auto max-w-xl rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs md:text-sm font-bold">Seu teste de 14 dias terminou. Assine Premium ou PRO para voltar a usar o painel: seus dados estão salvos.</p>
           )}
           {status === 'trial' && trialLeft <= 3 && (
             <p className="mx-auto max-w-xl rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs md:text-sm font-bold">Seu teste termina em {trialLeft === 0 ? 'poucas horas' : `${trialLeft} ${trialLeft === 1 ? 'dia' : 'dias'}`}. Assine agora para não perder o acesso.</p>
           )}
        </section>

        <section className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            const isCurrent = status === plan.id || (plan.id === 'pro' && status === 'enterprise');

            return (
              <Collapsible
                key={plan.id}
                open={isExpanded}
                onOpenChange={() => setExpandedPlan(isExpanded ? null : plan.id)}
                className="w-full"
              >
                <Card 
                  className={cn(
                    "relative overflow-hidden border-none shadow-xl transition-all duration-300 rounded-[2rem]",
                    plan.highlight ? "bg-primary text-white" : "bg-card text-card-foreground hover:bg-muted/10 border"
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-5 md:p-8 cursor-pointer select-none">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
                        <div className="flex items-center gap-4 md:gap-5 flex-1 w-full sm:w-auto">
                          <div className={cn(
                            "p-3 md:p-4 rounded-2xl shrink-0 transition-transform duration-500 shadow-inner",
                            plan.highlight ? "bg-white/10" : "bg-primary/10"
                          )}>
                            <plan.icon className={cn("w-5 h-5 md:w-7 md:h-7", plan.highlight ? "text-white" : "text-primary")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={cn(
                                "text-lg md:text-2xl font-black uppercase tracking-tight truncate",
                                plan.id === 'gold' && "inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-200 to-white animate-text-shine bg-[length:200%_auto]"
                              )}>{plan.name}</h3>
                              
                              {isCurrent && (
                                <div className="flex items-center gap-1 animate-in zoom-in duration-500">
                                   <BadgeCheck className="w-5 h-5 text-green-500" />
                                   <span className={cn(
                                     "text-[7px] md:text-[8px] font-black uppercase tracking-widest",
                                     plan.highlight ? "text-white/80" : "text-primary"
                                   )}>PLANO ATUAL</span>
                                </div>
                              )}

                              {plan.highlight && !isCurrent && (
                                <Badge className="bg-white text-primary text-[7px] md:text-[8px] font-black uppercase h-4 px-1.5 border-none">RECOMENDADO</Badge>
                              )}
                            </div>
                            <p className={cn("text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-70", plan.highlight ? "text-white" : "text-primary")}>
                              {plan.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-10 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-none border-white/10">
                          <div className="text-left sm:text-right">
                            <p className="text-lg md:text-2xl font-black leading-none">{plan.price}</p>
                            <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-60">{plan.period}</p>
                          </div>
                          <div className={cn(
                            "p-2 md:p-2.5 rounded-full transition-transform duration-300",
                            isExpanded && "rotate-180",
                            plan.highlight ? "bg-white/10" : "bg-muted"
                          )}>
                            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className={cn(
                      "px-5 md:px-8 pb-8 pt-2 space-y-6 md:space-y-8",
                      plan.highlight ? "border-t border-white/10" : "border-t border-border"
                    )}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6">
                        {plan.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={cn(
                              "mt-1 p-0.5 rounded-full shrink-0",
                              plan.highlight ? "bg-white/20" : "bg-primary/10"
                            )}>
                              <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            </div>
                            <span className="text-xs md:sm font-bold leading-relaxed">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <Button 
                          onClick={() => {
                            if (plan.id === 'base') { trackEvent('signup_click', 'planos-teste'); router.push('/signup'); }
                            else if (plan.checkoutUrl) { trackEvent('checkout_click', `planos-${plan.id}`); window.open(plan.checkoutUrl, '_blank'); }
                          }}
                          disabled={plan.disabled}
                          className={cn(
                            "w-full h-14 md:h-16 rounded-2xl text-[9px] sm:text-sm font-black uppercase tracking-tight sm:tracking-widest shadow-2xl transition-all active:scale-95 gap-3",
                            plan.highlight 
                              ? "bg-white text-primary hover:bg-zinc-100" 
                              : "bg-primary text-white hover:bg-primary/90"
                          )}
                        >
                          {plan.cta} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                        {!plan.disabled && plan.id !== 'base' && (
                          <p className={cn(
                            "text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-center mt-4 opacity-50 px-2",
                            plan.highlight ? "text-white" : "text-muted-foreground"
                          )}>
                             Pagamento Seguro via Cakto • Cancelamento instantâneo
                          </p>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </section>

        <section className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight">Compare os planos</h2>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">O que cada nível libera</p>
          </div>
          <Card className="rounded-[1.5rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] md:text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 font-black uppercase tracking-widest">
                    <th className="p-3 md:p-4">Recurso</th>
                    <th className="p-3 md:p-4 text-center">Teste 14 dias</th>
                    <th className="p-3 md:p-4 text-center text-primary">Premium</th>
                    <th className="p-3 md:p-4 text-center">PRO</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="p-3 md:p-4 font-bold leading-snug">{row.label}</td>
                      {([row.base, row.premium, row.pro] as (string | boolean)[]).map((v, i) => (
                        <td key={i} className="p-3 md:p-4 text-center font-black">
                          {v === true ? <Check className="w-4 h-4 mx-auto text-green-600" /> : v === false ? <span className="opacity-25">—</span> : v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="space-y-6 md:space-y-8 pt-4 md:pt-8">
           <div className="text-center space-y-2">
              <h2 className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight">Perguntas Frequentes</h2>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Esclareça suas dúvidas técnicas e comerciais</p>
           </div>
           
           <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
             {[
               { q: "Posso cancelar minha assinatura quando quiser?", a: "Sim. A Proova não possui fidelidade. Você pode cancelar sua assinatura mensal diretamente no painel ou via suporte a qualquer momento, sem taxas ocultas." },
               { q: "O G-Boost realmente melhora meu posicionamento no Google?", a: "Absolutamente. O algoritmo do Google Maps prioriza perfis que recebem avaliações constantes e positivas. Ao automatizar o convite para elogios 5 estrelas, você aumenta sua visibilidade organicamente." },
               { q: "O que acontece se eu cancelar ou trocar de plano?", a: "Nada é apagado. Seus depoimentos, a configuração da página e o Studio ficam salvos. Os recursos que o novo plano não cobre deixam de aparecer na sua página pública e voltam assim que você reativar o plano." },
               { q: "Como funciona o suporte VIP?", a: "Clientes Premium e PRO possuem fila prioritária em nosso chat de suporte e atendimento especializado por consultores estratégicos de prova social." }
             ].map((faq, idx) => (
               <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-[1.5rem] px-5 md:px-6 bg-card shadow-sm overflow-hidden">
                 <AccordionTrigger className="hover:no-underline text-[11px] md:text-sm font-black uppercase tracking-tight text-left py-5 md:py-6">
                   {faq.q}
                 </AccordionTrigger>
                 <AccordionContent className="text-muted-foreground font-medium pb-5 md:pb-6 text-xs md:text-base leading-relaxed">
                   {faq.a}
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
        </section>

        <section className="p-6 md:p-12 rounded-[2.5rem] md:rounded-[3rem] bg-muted/20 border-2 border-dashed border-muted-foreground/10 text-center space-y-6 md:space-y-8">
           <div className="mx-auto w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-background flex items-center justify-center text-primary shadow-xl ring-1 ring-primary/5">
              <Handshake className="w-6 h-6 md:w-8 md:h-8" />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-black font-headline uppercase">Plano Corporativo?</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-sm mx-auto">Para redes de franquias ou agências com múltiplos clientes, oferecemos condições especiais.</p>
           </div>
           <Button variant="outline" onClick={() => router.push('/support')} className="w-full sm:w-auto h-12 md:h-14 px-10 rounded-xl md:rounded-2xl font-black uppercase tracking-widest gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-[10px] md:text-xs">
              <Headphones className="w-4 h-4 md:w-5 md:h-5" /> Falar com Consultor
           </Button>
        </section>
      </main>

      <footer className="py-12 md:py-20 border-t bg-background/50 flex flex-col items-center gap-6 md:gap-8 text-center mt-auto">
        <div className="relative w-[140px] h-[46px] md:w-[220px] h-[73px]">
          <Image src="/logo-proovaai-whitemode.png" alt="Logo Footer" fill className="dark:hidden object-contain opacity-30 grayscale" priority />
          <Image src="/logo-proovaai-darkmode.png" alt="Logo Footer" fill className="hidden dark:block object-contain opacity-30 grayscale" priority />
        </div>
        <div className="space-y-1">
          <p className="text-[8px] md:text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] px-4">© 2026 PROOVA TECHNOLOGY - ESTRATÉGIA EM REPUTAÇÃO</p>
          <div className="flex items-center justify-center gap-4 pt-2">
             <Link href="/terms" className="text-[8px] font-bold uppercase text-muted-foreground hover:text-primary transition-colors">Termos</Link>
             <Link href="/privacy" className="text-[8px] font-bold uppercase text-muted-foreground hover:text-primary transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
