'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Check, 
  ArrowRight, 
  Zap, 
  Star, 
  Shield as ShieldIcon, 
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
  Handshake,
  Lock,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { ThemeToggle } from '@/components/theme-toggle';

export default function PricingPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const status = useMemo(() => {
    if (!user) return 'guest';
    return userData?.membershipStatus || 'base';
  }, [user, userData]);

  const membershipLabel = useMemo(() => {
    if (status === 'enterprise') return 'Membro Enterprise';
    if (status === 'gold') return 'Membro Gold';
    if (status === 'trial') return 'Período Trial';
    if (status === 'expired') return 'Plano Expirado';
    if (status === 'guest') return 'Visitante';
    return 'Plano Base';
  }, [status]);

  const checkoutLinks = useMemo(() => {
    const uidParam = user ? `?ext_id=${user.uid}` : '';
    return {
      gold: `https://pay.cakto.com.br/8c7bbit_1215637${uidParam}`,
      enterprise: `https://pay.cakto.com.br/yhtkwz4_1215645${uidParam}`
    };
  }, [user]);

  const plans = useMemo(() => {
    return [
      {
        id: 'base',
        name: "Base",
        price: "Grátis",
        period: "/sempre",
        description: "Fundação de Reputação",
        icon: ShieldIcon,
        cta: status === 'base' ? "Plano Atual" : "Começar Grátis",
        checkoutUrl: user ? "/dash" : "/signup",
        highlight: false,
        disabled: status === 'base'
      },
      {
        id: 'gold',
        name: "Gold",
        price: "R$ 49,90",
        period: "/mês",
        description: "Aceleração de Vendas",
        icon: Star,
        cta: status === 'gold' ? "Plano Atual" : "Ativar Gold",
        checkoutUrl: checkoutLinks.gold,
        highlight: true,
        disabled: status === 'gold'
      },
      {
        id: 'enterprise',
        name: "Enterprise",
        price: "R$ 97",
        period: "/mês",
        description: "Domínio de Mercado",
        icon: Zap,
        cta: status === 'enterprise' ? "Plano Atual" : "Seja Enterprise",
        checkoutUrl: checkoutLinks.enterprise,
        highlight: false,
        disabled: status === 'enterprise'
      }
    ];
  }, [user, checkoutLinks, status]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground flex flex-col overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-4 md:px-8 fixed top-0 w-full z-[100] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href={user ? "/dash" : "/"}>
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="relative w-[150px] h-[50px] md:w-[280px] md:h-[90px] transition-transform hover:scale-105">
            <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
            <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle className="border-none bg-transparent" />
          {!authLoading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-bold truncate max-w-[120px]">{userData?.companyName}</span>
                    <span className="text-[8px] uppercase font-black opacity-60">{membershipLabel}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20"><User className="w-4 h-4 text-primary" /></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border">
                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl font-bold cursor-pointer py-2.5"><TrendingUp className="mr-2 h-4 w-4 text-primary" />Dash</DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold cursor-pointer py-2.5"><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="flex-1 pt-32 pb-24 px-4 container max-w-7xl mx-auto flex flex-col">
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1">Estratégia de Autoridade</Badge>
           <h1 className="text-4xl md:text-7xl font-black font-headline tracking-tighter leading-[1] max-w-4xl mx-auto">
             O valor da sua marca é medido pela <span className="text-primary italic">Confiança</span>.
           </h1>
           <p className="text-muted-foreground text-sm md:text-xl font-medium max-w-2xl mx-auto">Selecione o motor de prova social ideal para o seu momento de mercado.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={cn(
                "relative overflow-hidden border-none shadow-2xl transition-all duration-500 rounded-[2.5rem] flex flex-col group",
                plan.highlight ? "bg-primary text-white scale-105 z-10" : "bg-card text-card-foreground hover:scale-[1.02]"
              )}
            >
              <CardHeader className="p-8 sm:p-10 pb-4 text-center space-y-6">
                <div className={cn(
                  "mx-auto p-4 rounded-3xl w-fit transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                  plan.highlight ? "bg-white/10" : "bg-primary/10"
                )}>
                  <plan.icon className={cn("w-10 h-10", plan.highlight ? "text-white" : "text-primary")} />
                </div>
                
                <div className="space-y-1">
                  <CardTitle className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tighter">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl md:text-4xl font-black">{plan.price}</span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", plan.highlight ? "text-white/60" : "text-muted-foreground")}>{plan.period}</span>
                  </div>
                </div>

                <p className={cn("text-[10px] font-black uppercase tracking-widest px-4 opacity-80", plan.highlight ? "text-white" : "text-primary")}>
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="px-8 py-4 flex-1">
                 {/* Conteúdo simplificado conforme solicitado - Apenas nomes e valor central */}
              </CardContent>

              <CardFooter className="p-8 pt-0">
                <Link href={plan.disabled ? "#" : plan.checkoutUrl} className="w-full" target={plan.checkoutUrl.startsWith('http') ? "_blank" : "_self"}>
                  <Button 
                    disabled={plan.disabled}
                    className={cn(
                      "w-full h-16 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all active:scale-95",
                      plan.highlight 
                        ? "bg-white text-primary hover:bg-zinc-100" 
                        : "bg-primary text-white hover:bg-primary/90"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <section className="mt-32 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-4xl font-black font-headline tracking-tighter">Entenda os Diferenciais</h2>
            <p className="text-muted-foreground text-sm font-medium">As respostas que você precisa para assumir o controle.</p>
          </div>

          <div className="max-w-3xl mx-auto bg-card rounded-[2.5rem] p-8 md:p-12 shadow-xl">
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: "O que é o G-Boost?", a: "O G-Boost é um acelerador de SEO Local. Ele detecta automaticamente elogios de 4 ou 5 estrelas e convida o cliente a postar no seu Google Maps, subindo sua posição nas buscas organicamente." },
                { q: "Como funcionam os Vídeo Reviews?", a: "Disponível no Enterprise, permite que o cliente grave um depoimento cinematográfico de até 30s direto no navegador, sem baixar nada. É a prova social que mais converte hoje." },
                { q: "Posso cancelar ou mudar de plano?", a: "Sim, a qualquer momento sem multas. No Proova, você tem total liberdade sobre sua assinatura diretamente no painel de gestão." }
              ].map((item, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-primary/10">
                  <AccordionTrigger className="text-left font-black text-sm uppercase tracking-tight py-6 hover:text-primary transition-colors">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground font-medium leading-relaxed pb-6 text-sm">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mt-32">
           <div className="bg-primary text-white rounded-[3rem] p-10 md:p-20 text-center space-y-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
              <div className="relative z-10 space-y-6">
                <Sparkles className="w-12 h-12 mx-auto text-white animate-bounce" />
                <h2 className="text-3xl md:text-6xl font-black font-headline tracking-tighter">Domine seu Mercado.</h2>
                <p className="text-white/80 font-bold text-lg md:text-2xl max-w-xl mx-auto leading-relaxed">
                  Não seja apenas mais uma opção. Seja a escolha óbvia do seu setor.
                </p>
                <div className="pt-6">
                   <Button variant="secondary" className="h-16 px-12 rounded-2xl text-sm md:text-xl font-black uppercase tracking-widest bg-white text-primary hover:bg-zinc-100 shadow-2xl transition-all hover:scale-105">
                     Começar agora
                   </Button>
                </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="py-20 border-t bg-background/50 flex flex-col items-center gap-8 text-center">
        <div className="relative w-[200px] h-[65px] opacity-40 grayscale">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" />
        </div>
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">© 2026 PROOVA TECHNOLOGY - INTELIGÊNCIA EM REPUTAÇÃO</p>
      </footer>
    </div>
  );
}
