'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Handshake, 
  ArrowLeft, 
  ArrowRight,
  ExternalLink, 
  Gem, 
  CheckCircle2, 
  Rocket, 
  Target, 
  Zap, 
  ShieldCheck,
  Building2,
  Users,
  LogOut,
  TrendingUp,
  Inbox,
  Layout,
  Sun,
  Moon,
  Loader2,
  User,
  Star,
  Sparkles,
  Globe,
  Search,
  MousePointer2,
  Megaphone,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PartnersPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  const status = userData?.membershipStatus || 'base';
  const businessType = userData?.businessType || 'outros';
  const isEnterprise = status === 'enterprise';

  const membershipLabel = useMemo(() => {
    if (status === 'enterprise') return 'Membro Enterprise';
    if (status === 'gold') return 'Membro Gold';
    if (status === 'trial') return 'Período Trial';
    if (status === 'expired') return 'Plano Expirado';
    return 'Plano Base';
  }, [status]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const partners = [
    {
      id: 'fitbase',
      name: 'FitBase',
      category: 'Software de Gestão Fitness',
      description: 'O software de gestão mais completo que indicamos para academias, estúdios e centros de treinamento.',
      benefits: [
        'Controle de acesso e mensalidades',
        'Treinos e avaliações físicas via app',
        'Gestão financeira e administrativa',
        'Automação de cobranças Recorrentes'
      ],
      exclusiveOffer: isEnterprise && (businessType === 'academia' || businessType === 'artes_marciais') 
        ? 'BENEFÍCIO ENTERPRISE: ACESSO INCLUSO' 
        : 'Condição Especial para Clientes Proova',
      ctaLabel: isEnterprise && (businessType === 'academia' || businessType === 'artes_marciais') 
        ? 'Ativar Indicação' 
        : 'Conhecer Parceiro',
      ctaUrl: 'https://fitbase.com.br',
      highlight: true,
      icon: Rocket,
      featured: (businessType === 'academia' || businessType === 'artes_marciais')
    },
    {
      id: 'traffic-agency',
      name: 'Agência de Tráfego Homologada',
      category: 'Anúncios Online (Indicado)',
      description: 'Especialistas que recomendamos para atrair clientes locais via Google Ads e Meta Ads com ROI comprovado.',
      benefits: [
        'Gestão de orçamento inteligente',
        'Configuração de raio de atuação local',
        'Anúncios focados em conversão direta',
        'Relatórios mensais de performance'
      ],
      exclusiveOffer: 'Primeira Consultoria de Estratégia Grátis',
      ctaLabel: 'Falar com Especialista',
      ctaUrl: '#',
      highlight: false,
      icon: Target,
      featured: true
    },
    {
      id: 'web-design',
      name: 'Criação de Landing Pages',
      category: 'Design e Web (Indicado)',
      description: 'Designers parceiros que criam páginas ultra velozes integradas nativamente com a prova social do seu mural.',
      benefits: [
        'Design moderno e mobile-first',
        'Integração nativa com murais Proova',
        'Otimização para busca do Google',
        'Hospedagem e manutenção inclusas'
      ],
      exclusiveOffer: '20% de Desconto na primeira LP',
      ctaLabel: 'Solicitar Orçamento',
      ctaUrl: '#',
      highlight: false,
      icon: Globe,
      featured: false
    },
    {
      id: 'google-boost',
      name: 'Consultoria Especialista Maps',
      category: 'SEO Local (Indicado)',
      description: 'Profissionais certificados que indicamos para colocar sua empresa no topo das buscas orgânicas do Google.',
      benefits: [
        'Otimização completa do Google Business',
        'Estratégia de palavras-chave locais',
        'Auditoria de concorrência direta',
        'Aumento real de cliques no Maps'
      ],
      exclusiveOffer: 'Auditoria de Perfil Cortesia Proova',
      ctaLabel: 'Agendar Auditoria',
      ctaUrl: '#',
      highlight: false,
      icon: Search,
      featured: false
    }
  ];

  if (authLoading || userDataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-body text-foreground overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3">
          <Link href="/dash">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/dash" className="flex items-center group -ml-2">
            <div className="relative w-[180px] h-[60px] md:w-[280px] md:h-[90px] transition-transform group-hover:scale-105">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-2 gap-2 rounded-xl hover:bg-primary/5 group transition-all active:bg-primary/10">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold truncate max-w-[120px] transition-colors group-hover:text-primary leading-tight">
                    {userData?.companyName || 'Minha Empresa'}
                  </span>
                  <span className={cn(
                    "text-[8px] uppercase tracking-widest font-black leading-tight",
                    isEnterprise ? "text-primary animate-pulse" : "text-muted-foreground"
                  )}>
                    {membershipLabel}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                  <User className="w-4 h-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-headline font-black uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => router.push('/dash')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                <span>Dash</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/widgets')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Layout className="mr-2 h-4 w-4 text-primary" />
                <span>Meus Widgets</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/private')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Inbox className="mr-2 h-4 w-4 text-primary" />
                <span>Inbox Privado</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pricing')} className="rounded-xl cursor-pointer font-bold py-2.5">
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Upgrade</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/partners')} className="rounded-xl cursor-pointer font-bold py-2.5 bg-primary/5 text-primary">
                <Handshake className="mr-2 h-4 w-4 text-primary" />
                <span>Serviços de Parceiros</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl cursor-pointer font-bold py-2.5">{theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}<span>Tema</span></DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive focus:text-destructive cursor-pointer font-bold py-2.5"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-10 max-w-7xl mx-auto w-full">
        <section className="text-center space-y-4 py-8">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-[10px] sm:text-xs font-bold text-primary border border-primary/20 backdrop-blur-sm">
            🤝 Indicações que impulsionam seu faturamento
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight">
            Hub de <span className="text-primary italic">Parceiros e Indicações</span>.
          </h1>
          <p className="text-muted-foreground text-sm md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Conectamos seu negócio a serviços externos de elite que confiamos e indicamos para acelerar sua jornada rumo ao domínio do mercado local.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {partners.map((partner) => (
            <Card 
              key={partner.id} 
              className={cn(
                "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl flex flex-col h-full rounded-[2rem]",
                partner.highlight ? "border-primary/50 shadow-xl bg-background" : "border-border bg-card/50"
              )}
            >
              {partner.featured && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-lg z-20 flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-current" /> Sugestão Proova
                </div>
              )}
              
              <CardHeader className="p-6 md:p-8 shrink-0 space-y-4">
                <div className={cn(
                  "p-3 rounded-2xl w-fit",
                  partner.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <partner.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl font-black font-headline truncate">{partner.name}</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{partner.category}</CardDescription>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed font-medium">
                  {partner.description}
                </p>
              </CardHeader>

              <CardContent className="px-6 md:px-8 py-0 flex-1">
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Expertise do Parceiro:</p>
                  <ul className="space-y-2.5">
                    {partner.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="leading-tight opacity-80">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="p-6 md:p-8 mt-auto flex flex-col gap-4">
                <div className="w-full p-4 rounded-2xl bg-muted/30 border border-dashed flex flex-col items-center text-center gap-1">
                   <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Vantagem da Indicação:</p>
                   <p className="text-xs font-bold text-foreground">{partner.exclusiveOffer}</p>
                </div>
                <Button 
                  asChild
                  className={cn(
                    "w-full h-12 md:h-14 rounded-xl font-black uppercase tracking-widest text-xs gap-2 transition-all active:scale-95 shadow-lg",
                    partner.highlight ? "bg-primary hover:bg-primary/90" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  <a href={partner.ctaUrl} target="_blank" rel="noopener noreferrer">
                    {partner.ctaLabel} <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-center p-6 bg-muted/30 rounded-3xl border border-dashed gap-4 max-w-3xl mx-auto">
          <Info className="w-6 h-6 text-muted-foreground shrink-0" />
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-relaxed">
            <strong>Aviso Legal Proova:</strong> Os serviços acima são prestados por parceiros externos homologados que operam sob seus próprios Termos de Uso e Políticas de Privacidade. O Proova atua exclusivamente como facilitador da indicação e ponte de conexão estratégica.
          </p>
        </div>

        <section className="bg-primary/5 rounded-[2.5rem] p-8 md:p-12 border border-primary/10 relative overflow-hidden">
          <div className="relative z-10 grid md:grid-cols-[1fr_0.5fr] gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-black font-headline">Deseja ser um Parceiro Indicado?</h2>
              <p className="text-muted-foreground text-sm md:text-lg font-medium">
                Sua agência ou software atende negócios locais e possui alto nível de entrega? Junte-se ao nosso ecossistema de confiança.
              </p>
              <Button className="h-12 px-8 rounded-xl font-bold gap-2">
                Falar com nosso time de parcerias <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Handshake className="w-20 h-20 text-primary opacity-50" />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </section>
      </main>

      <footer className="py-12 border-t mt-auto flex flex-col items-center gap-8 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[200px] h-[65px] md:w-[320px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">© 2026 Proova Technology - Hub de Indicações Estratégicas</p>
      </footer>
    </div>
  );
}