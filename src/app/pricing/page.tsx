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
  CheckCircle2
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

export default function PricingPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [expandedPlan, setExpandedPlan] = useState<string | null>('gold');
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
    if (status === 'enterprise') return 'ENTERPRISE';
    if (status === 'gold') return 'GOLD';
    if (status === 'trial') return 'TRIAL';
    if (status === 'expired') return 'EXPIRADO';
    if (status === 'guest') return 'Visitante';
    return 'PLANO BASE';
  }, [status]);

  if (authLoading || (user && !effectiveUserData)) {
    return <LoadingScreen />;
  }

  const plans = [
    {
      id: 'base',
      name: "Plano Base",
      price: "R$ 0",
      period: "/sempre",
      description: "Fundação de Reputação",
      icon: Shield,
      highlight: false,
      cta: "Plano Ativo",
      disabled: status === 'base',
      benefits: [
        "1 Mural de Depoimentos",
        "5 Depoimentos Ativos no Link in Bio",
        "Inbox Privado (Reputation Shield)",
        "QR Code de Balcão Padrão",
        "Link de Coleta Proova"
      ]
    },
    {
      id: 'gold',
      name: "Plano Gold",
      price: "R$ 49,90",
      period: "/mês",
      description: "Aceleração de Vendas",
      icon: Star,
      highlight: true,
      cta: status === 'gold' ? "Plano Ativo" : "Garantir Acesso Gold",
      disabled: status === 'gold',
      checkoutUrl: "https://pay.cakto.com.br/gold-proova", // Exemplo
      benefits: [
        "Murais Ilimitados para seu Site",
        "50 Depoimentos Ativos no Link in Bio",
        "G-Boost (Ranqueamento no Google Maps)",
        "Editor VIP da Página Pública",
        "Auto-Publish (Postagem Automática)",
        "Relatórios de Performance Semanais",
        "Suporte VIP via Chat"
      ]
    },
    {
      id: 'enterprise',
      name: "Plano Enterprise",
      price: "R$ 97",
      period: "/mês",
      description: "Domínio de Mercado",
      icon: Zap,
      highlight: false,
      cta: status === 'enterprise' ? "Plano Ativo" : "Garantir Acesso Enterprise",
      disabled: status === 'enterprise',
      checkoutUrl: "https://pay.cakto.com.br/enterprise-proova", // Exemplo
      benefits: [
        "Tudo do Gold + Recursos Exclusivos",
        "Vídeo Reviews 4K de Alto Impacto",
        "Depoimentos Ativos Ilimitados",
        "Suporte VIP Dedicado no App",
        "Design de Página Ultra Customizado",
        "Análise Preditiva de Conversão"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background font-body text-foreground flex flex-col overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[100] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href={user ? "/dash" : "/"}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent select-none">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center group -ml-2">
            <div className="relative w-[200px] h-[52px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo" fill className="object-contain object-left hidden dark:block" priority unoptimized />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden sm:flex" />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 px-1 md:px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10 shadow-none focus-visible:ring-0">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px] group-hover:text-primary leading-tight">{effectiveUserData?.companyName || 'Empresa'}</span>
                    <span className="text-[7px] uppercase tracking-widest font-black text-muted-foreground">{membershipLabel}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors"><User className="w-4 h-4" /></div>
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

      <main className="flex-1 pt-32 pb-24 px-4 container max-w-4xl mx-auto flex flex-col space-y-16">
        <section className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
           <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-4 py-1">Níveis de Estratégia</Badge>
           <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter leading-tight">
             Escolha o seu Nível de <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-300 to-primary italic animate-text-shine bg-[length:200%_auto] pr-2">Autoridade.</span>
           </h1>
           <p className="text-muted-foreground font-medium text-sm md:text-lg max-w-xl mx-auto leading-relaxed">
             A reputação da sua marca é o seu maior ativo. Invista nas ferramentas certas para dominar o seu mercado local.
           </p>
        </section>

        <section className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            const isCurrent = status === plan.id;

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
                    <div className="p-6 md:p-8 cursor-pointer select-none">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 flex-1 w-full sm:w-auto">
                          <div className={cn(
                            "p-4 rounded-2xl shrink-0 transition-transform duration-500 shadow-inner",
                            plan.highlight ? "bg-white/10" : "bg-primary/10"
                          )}>
                            <plan.icon className={cn("w-7 h-7", plan.highlight ? "text-white" : "text-primary")} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={cn(
                                "text-2xl font-black uppercase tracking-tight",
                                plan.id === 'gold' && "inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-200 to-white animate-text-shine bg-[length:200%_auto]"
                              )}>{plan.name}</h3>
                              {plan.highlight && (
                                <Badge className="bg-white text-primary text-[8px] font-black uppercase h-4 px-1.5 border-none">RECOMENDADO</Badge>
                              )}
                              {isCurrent && (
                                <Badge className={cn("text-[8px] font-black uppercase h-4 px-1.5 border-none", plan.highlight ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>PLANO ATUAL</Badge>
                              )}
                            </div>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-70", plan.highlight ? "text-white" : "text-primary")}>
                              {plan.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-10 w-full sm:w-auto">
                          <div className="text-right">
                            <p className="text-2xl font-black leading-none">{plan.price}</p>
                            <p className="text-[10px] font-bold uppercase opacity-60">{plan.period}</p>
                          </div>
                          <div className={cn(
                            "p-2.5 rounded-full transition-transform duration-300",
                            isExpanded && "rotate-180",
                            plan.highlight ? "bg-white/10" : "bg-muted"
                          )}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className={cn(
                      "px-6 md:px-8 pb-8 pt-2 space-y-8",
                      plan.highlight ? "border-t border-white/10" : "border-t border-border"
                    )}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                        {plan.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={cn(
                              "mt-1 p-0.5 rounded-full shrink-0",
                              plan.highlight ? "bg-white/20" : "bg-primary/10"
                            )}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-bold leading-relaxed">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <Button 
                          onClick={() => plan.checkoutUrl && window.open(plan.checkoutUrl, '_blank')}
                          disabled={plan.disabled}
                          className={cn(
                            "w-full h-16 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 gap-3",
                            plan.highlight 
                              ? "bg-white text-primary hover:bg-zinc-100" 
                              : "bg-primary text-white hover:bg-primary/90"
                          )}
                        >
                          {plan.cta} <ArrowRight className="w-5 h-5" />
                        </Button>
                        {!plan.disabled && (
                          <p className={cn(
                            "text-[8px] font-black uppercase tracking-[0.2em] text-center mt-4 opacity-50",
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

        <section className="space-y-8 pt-8">
           <div className="text-center space-y-2">
              <h2 className="text-2xl font-black font-headline uppercase tracking-tight">Perguntas Frequentes</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Esclareça suas dúvidas técnicas e comerciais</p>
           </div>
           
           <Accordion type="single" collapsible className="w-full space-y-4">
             {[
               { q: "Posso cancelar minha assinatura quando quiser?", a: "Sim. A Proova não possui fidelidade. Você pode cancelar sua assinatura mensal diretamente no painel ou via suporte a qualquer momento, sem taxas ocultas." },
               { q: "O G-Boost realmente melhora meu posicionamento no Google?", a: "Absolutamente. O algoritmo do Google Maps prioriza perfis que recebem avaliações constantes e positivas. Ao automatizar o convite para elogios 5 estrelas, você aumenta sua visibilidade organicamente." },
               { q: "O que acontece com meus dados se eu voltar para o plano grátis?", a: "Seus dados permanecem seguros. No entanto, recursos premium como G-Boost, Editor VIP e Murais ilimitados serão desativados até que uma nova assinatura seja realizada." },
               { q: "Como funciona o suporte VIP?", a: "Clientes Gold e Enterprise possuem fila prioritária em nosso chat de suporte e atendimento especializado por consultores estratégicos de prova social." }
             ].map((faq, idx) => (
               <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-[1.5rem] px-6 bg-card shadow-sm overflow-hidden">
                 <AccordionTrigger className="hover:no-underline text-sm font-black uppercase tracking-tight text-left py-6">
                   {faq.q}
                 </AccordionTrigger>
                 <AccordionContent className="text-muted-foreground font-medium pb-6 leading-relaxed">
                   {faq.a}
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
        </section>

        <section className="p-8 md:p-12 rounded-[3rem] bg-muted/20 border-2 border-dashed border-muted-foreground/10 text-center space-y-8">
           <div className="mx-auto w-16 h-16 rounded-3xl bg-background flex items-center justify-center text-primary shadow-xl ring-1 ring-primary/5">
              <Handshake className="w-8 h-8" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black font-headline uppercase">Precisa de um Plano Corporativo?</h3>
              <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">Para redes de franquias ou agências com múltiplos clientes, oferecemos condições especiais.</p>
           </div>
           <Button variant="outline" onClick={() => router.push('/support')} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
              <MessageSquareQuote className="w-5 h-5" /> Falar com Consultor
           </Button>
        </section>
      </main>

      <footer className="py-20 border-t bg-background/50 flex flex-col items-center gap-8 text-center">
        <div className="relative w-[180px] h-[60px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="dark:hidden object-contain opacity-30 grayscale" priority unoptimized />
          <Image src="/logo-proova-dark-mode.gif" alt="Logo Footer" fill className="hidden dark:block object-contain opacity-30 grayscale" priority unoptimized />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">© 2026 PROOVA TECHNOLOGY - ESTRATÉGIA EM REPUTAÇÃO</p>
          <div className="flex items-center justify-center gap-4 pt-2">
             <Link href="/terms" className="text-[8px] font-bold uppercase text-muted-foreground hover:text-primary">Termos de Uso</Link>
             <Link href="/privacy" className="text-[8px] font-bold uppercase text-muted-foreground hover:text-primary">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MessageSquareQuote({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h6"/>
    </svg>
  );
}
