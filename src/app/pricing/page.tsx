'use client';

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
  User, 
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
} from "@/components/accordion";
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';

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

  const membershipLabel = useMemo(() => {
    if (status === 'enterprise' || status === 'pro') return 'PRO';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'guest') return 'Visitante';
    return 'PLANO BASE';
  }, [status]);

  if (authLoading || (user && !effectiveUserData)) {
    return <LoadingScreen />;
  }

  const plans = [
    {
      id: 'gold',
      name: "Plano Gold",
      price: "R$ 147",
      period: "/mês",
      description: "Aceleração de Vendas",
      icon: Star,
      highlight: true,
      cta: status === 'gold' ? "Plano Ativo" : "Garantir Acesso Gold",
      disabled: status === 'gold',
      checkoutUrl: "https://pay.cakto.com.br/gold-proova",
      benefits: [
        "Página Pública VIP de Autoridade",
        "Automação de Respostas via IA (Gemini)",
        "G-Boost (Ranqueamento no Google Maps)",
        "Social Cards Studio (Post/Story)",
        "Relatórios de Performance Automáticos",
        "Inbox Privado (Reputation Shield)",
        "Suporte VIP via Chat no App"
      ]
    },
    {
      id: 'pro',
      name: "Plano PRO",
      price: "R$ 270",
      period: "/mês",
      description: "Domínio de Mercado",
      icon: Zap,
      highlight: false,
      cta: (status === 'pro' || status === 'enterprise') ? "Plano Ativo" : "Garantir Acesso PRO",
      disabled: status === 'pro' || status === 'enterprise',
      checkoutUrl: "https://pay.cakto.com.br/enterprise-proova",
      benefits: [
        "Tudo do Plano Gold + Exclusivos",
        "Coleta de Vídeo Reviews 4K",
        "Suporte VIP Dedicado com Consultor",
        "Métricas de ROI Avançadas",
        "Design de Página Ultra Customizado",
        "Consultoria de Reputação Mensal",
        "Uplink para Domínio Próprio"
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
            <div className="relative w-[140px] h-[46px] md:w-[320px] md:h-[105px]">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex border-none bg-transparent shadow-none" />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 md:h-12 px-1 md:px-2 gap-1.5 md:gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] md:text-xs font-bold truncate max-w-[70px] sm:max-w-[120px] group-hover:text-primary leading-tight transition-colors">{effectiveUserData?.companyName || 'Empresa'}</span>
                    <span className="text-[6px] md:text-[8px] uppercase tracking-widest font-black text-primary leading-tight">{membershipLabel}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                    <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
                            <span className="text-xs md:text-sm font-bold leading-relaxed">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <Button 
                          onClick={() => plan.checkoutUrl && window.open(plan.checkoutUrl, '_blank')}
                          disabled={plan.disabled}
                          className={cn(
                            "w-full h-14 md:h-16 rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 gap-3",
                            plan.highlight 
                              ? "bg-white text-primary hover:bg-zinc-100" 
                              : "bg-primary text-white hover:bg-primary/90"
                          )}
                        >
                          {plan.cta} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                        {!plan.disabled && (
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

        <section className="space-y-6 md:space-y-8 pt-4 md:pt-8">
           <div className="text-center space-y-2">
              <h2 className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight">Perguntas Frequentes</h2>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Esclareça suas dúvidas técnicas e comerciais</p>
           </div>
           
           <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
             {[
               { q: "Posso cancelar minha assinatura quando quiser?", a: "Sim. A Proova não possui fidelidade. Você pode cancelar sua assinatura mensal diretamente no painel ou via suporte a qualquer momento, sem taxas ocultas." },
               { q: "O G-Boost realmente melhora meu posicionamento no Google?", a: "Absolutamente. O algoritmo do Google Maps prioriza perfis que recebem avaliações constantes e positivas. Ao automatizar o convite para elogios 5 estrelas, você aumenta sua visibilidade organicamente." },
               { q: "Como funciona o suporte VIP?", a: "Clientes Gold e PRO possuem fila prioritária em nosso chat de suporte e atendimento especializado por consultores estratégicos de prova social." }
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
        <div className="relative w-[140px] h-[46px] md:w-[180px] md:h-[60px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="dark:hidden object-contain opacity-30 grayscale" priority unoptimized />
          <Image src="/logo-proova-dark-mode.gif" alt="Logo Footer" fill className="hidden dark:block opacity-30 grayscale" priority unoptimized />
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
