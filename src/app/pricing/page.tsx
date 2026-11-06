'use client';

import React, { useMemo, useState } from 'react';
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
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Monitor,
  Video,
  BarChart3,
  MousePointer2
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
import { ThemeToggle } from '@/components/theme-toggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function PricingPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

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
        disabled: status === 'base',
        benefits: [
          "1 Mural de Depoimentos",
          "10 Depoimentos Ativos",
          "Inbox Privado (Shield)",
          "QR Code de Balcão",
          "Link de Coleta Padrão"
        ]
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
        disabled: status === 'gold',
        benefits: [
          "Murais Ilimitados",
          "50 Depoimentos Ativos",
          "G-Boost (Google Maps Ranking)",
          "Editor de Página Pública VIP",
          "Auto-Publish Inteligente",
          "Relatórios de Performance Semanais"
        ]
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
        disabled: status === 'enterprise',
        benefits: [
          "Vídeo Reviews 4K (Até 30s)",
          "Depoimentos Ativos Ilimitados",
          "Suporte Prioritário Via WhatsApp",
          "Design de Página Ultra Customizado",
          "Analytics Avançado de Conversão",
          "Acesso Antecipado a Novas Funções"
        ]
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

      <main className="flex-1 pt-32 pb-24 px-4 container max-w-4xl mx-auto flex flex-col">
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1">Estratégia de Autoridade</Badge>
           <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter leading-[1] max-w-4xl mx-auto">
             O valor da sua marca é medido pela <span className="text-primary italic">Confiança</span>.
           </h1>
           <p className="text-muted-foreground text-sm md:text-lg font-medium max-w-2xl mx-auto">Escolha o seu nível de influência no mercado.</p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            
            return (
              <Collapsible
                key={plan.id}
                open={isExpanded}
                onOpenChange={() => setExpandedPlan(isExpanded ? null : plan.id)}
                className="w-full"
              >
                <Card 
                  className={cn(
                    "relative overflow-hidden border-none shadow-xl transition-all duration-300 rounded-3xl",
                    plan.highlight ? "bg-primary text-white" : "bg-card text-card-foreground hover:bg-muted/30"
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-6 cursor-pointer select-none">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 flex-1 w-full sm:w-auto">
                          <div className={cn(
                            "p-3 rounded-2xl shrink-0 transition-transform duration-500",
                            plan.highlight ? "bg-white/10" : "bg-primary/10"
                          )}>
                            <plan.icon className={cn("w-6 h-6", plan.highlight ? "text-white" : "text-primary")} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                              {plan.highlight && (
                                <Badge className="bg-white text-primary text-[8px] font-black uppercase h-4 px-1.5 border-none">POPULAR</Badge>
                              )}
                            </div>
                            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-70", plan.highlight ? "text-white" : "text-primary")}>
                              {plan.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                          <div className="text-right">
                            <p className="text-xl font-black leading-none">{plan.price}</p>
                            <p className="text-[10px] font-bold uppercase opacity-60">{plan.period}</p>
                          </div>
                          <div className={cn(
                            "p-2 rounded-full transition-transform duration-300",
                            isExpanded && "rotate-180",
                            plan.highlight ? "bg-white/10" : "bg-muted"
                          )}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className={cn(
                      "px-6 pb-6 pt-2 space-y-6",
                      plan.highlight ? "border-t border-white/10" : "border-t border-border"
                    )}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                        {plan.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={cn(
                              "mt-1 p-0.5 rounded-full shrink-0",
                              plan.highlight ? "bg-white/20" : "bg-primary/10"
                            )}>
                              <Check className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-bold leading-relaxed">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <Link href={plan.disabled ? "#" : plan.checkoutUrl} className="w-full" target={plan.checkoutUrl.startsWith('http') ? "_blank" : "_self"}>
                          <Button 
                            disabled={plan.disabled}
                            className={cn(
                              "w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 gap-2",
                              plan.highlight 
                                ? "bg-white text-primary hover:bg-zinc-100" 
                                : "bg-primary text-white hover:bg-primary/90"
                            )}
                          >
                            {plan.cta} <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        <section className="mt-24 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tighter">Perguntas Frequentes</h2>
            <p className="text-muted-foreground text-sm font-medium">Esclareça suas dúvidas agora.</p>
          </div>

          <div className="grid gap-4">
            {[
              { q: "O que é o G-Boost?", a: "O G-Boost detecta elogios nota 5 e convida o cliente a postar no Google Maps automaticamente." },
              { q: "Posso cancelar quando quiser?", a: "Sim. Você tem total controle sobre sua assinatura, sem fidelidade ou multas." },
              { q: "O pagamento é seguro?", a: "Sim. Processamos via Cakto, com criptografia de ponta e checkout 100% verificado." }
            ].map((item, idx) => (
              <Card key={idx} className="border-none bg-muted/20 p-5 rounded-2xl">
                <p className="text-xs font-black uppercase tracking-tight mb-1 text-primary">{item.q}</p>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.a}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-24">
           <div className="bg-zinc-950 text-white rounded-[2.5rem] p-10 md:p-16 text-center space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10 space-y-6">
                <Sparkles className="w-10 h-10 mx-auto text-primary" />
                <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">Domine seu Mercado.</h2>
                <p className="text-zinc-400 font-bold text-base md:text-xl max-w-xl mx-auto leading-relaxed">
                  Não seja apenas mais uma opção. Seja a escolha óbvia do seu setor através da prova social de elite.
                </p>
                <div className="pt-4">
                   <Button size="lg" className="h-14 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white hover:bg-primary/90 shadow-2xl transition-all hover:scale-105">
                     COMEÇAR MINHA JORNADA
                   </Button>
                </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="py-20 border-t bg-background/50 flex flex-col items-center gap-8 text-center">
        <div className="relative w-[180px] h-[60px] opacity-30 grayscale">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" />
        </div>
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">© 2026 PROOVA TECHNOLOGY - ESTRATÉGIA EM REPUTAÇÃO</p>
      </footer>
    </div>
  );
}
