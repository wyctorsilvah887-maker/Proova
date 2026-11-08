'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  Layout, 
  Share2, 
  Sparkles, 
  ChevronRight, 
  Info, 
  Target,
  Zap,
  Globe,
  Inbox,
  MousePointer2,
  BarChart3,
  CheckCircle2,
  Lock,
  Star,
  Rocket,
  Shield,
  MessageSquare,
  ImageIcon,
  FileVideo,
  Palette,
  LayoutGrid,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export default function ManualPage() {
  const images = useMemo(() => {
    return {
      gboost: PlaceHolderImages.find(img => img.id === 'manual-gboost')?.imageUrl || 'https://picsum.photos/seed/m1/800/500',
      shield: PlaceHolderImages.find(img => img.id === 'manual-shield')?.imageUrl || 'https://picsum.photos/seed/m2/800/500',
      widgets: PlaceHolderImages.find(img => img.id === 'manual-widgets')?.imageUrl || 'https://picsum.photos/seed/m3/800/500',
      social: PlaceHolderImages.find(img => img.id === 'manual-social')?.imageUrl || 'https://picsum.photos/seed/m4/800/500',
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground flex flex-col overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-4 md:px-8 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/dash">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent h-10 w-10 focus-visible:ring-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center group">
            <div className="relative w-[180px] h-[60px] md:w-[320px] md:h-[105px]">
              <Image 
                src="/logo-proova-white-mode.gif" 
                alt="Logo Proova" 
                fill 
                className="object-contain object-left dark:hidden" 
                priority 
                unoptimized
              />
              <Image 
                src="/logo-proova-dark-mode.gif" 
                alt="Logo Proova" 
                fill 
                className="object-contain object-left hidden dark:block" 
                priority 
                unoptimized
              />
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle className="hidden sm:flex" />
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 h-7 font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary border-none">
            <BookOpen className="w-3 h-3" /> Central de Inteligência
          </Badge>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto p-4 md:p-12 space-y-12 flex-1 pt-24 md:pt-36">
        <section className="space-y-4 text-center md:text-left">
           <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">Manual de Estratégia</h1>
              <p className="text-muted-foreground text-sm md:text-lg font-medium">Domine as ferramentas que vão consolidar sua autoridade no mercado.</p>
           </div>
        </section>

        <Tabs defaultValue="introducao" className="w-full">
           <TabsList className="bg-background border rounded-2xl h-auto p-1.5 gap-1 mb-8 shadow-sm flex flex-wrap md:flex-row">
              <TabsTrigger value="introducao" className="flex-1 min-w-[120px] rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                 <Rocket className="w-4 h-4" /> Start
              </TabsTrigger>
              <TabsTrigger value="gboost" className="flex-1 min-w-[120px] rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 py-3">
                 <Zap className="w-4 h-4" /> G-Boost
              </TabsTrigger>
              <TabsTrigger value="shield" className="flex-1 min-w-[120px] rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 py-3">
                 <Shield className="w-4 h-4" /> Shield
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex-1 min-w-[120px] rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 py-3">
                 <Share2 className="w-4 h-4" /> Cards
              </TabsTrigger>
              <TabsTrigger value="linkinbio" className="flex-1 min-w-[120px] rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 py-3">
                 <Globe className="w-4 h-4" /> Link in Bio
              </TabsTrigger>
           </TabsList>

           <TabsContent value="introducao" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-background">
                 <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-8 md:p-12 space-y-6">
                       <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest">Passo Inicial</Badge>
                       <h2 className="text-3xl font-black font-headline tracking-tight uppercase">Bem-vindo à Nova Era da Prova Social</h2>
                       <p className="text-muted-foreground leading-relaxed font-medium">A Proova não é apenas um coletor de depoimentos, é uma <b>máquina de autoridade digital</b> projetada para reduzir a fricção de venda do seu negócio.</p>
                       <div className="space-y-4">
                          {[
                             { icon: CheckCircle2, text: "Aumente seu ranking orgânico no Google Maps." },
                             { icon: CheckCircle2, text: "Blinde sua marca contra reclamações públicas." },
                             { icon: CheckCircle2, text: "Exiba depoimentos verificados onde importa: seu site." },
                          ].map((item, idx) => (
                             <div key={idx} className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 text-primary shrink-0" />
                                <span className="text-sm font-bold">{item.text}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="bg-primary/5 p-8 flex items-center justify-center relative">
                       <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                       <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-background">
                          <Image src="https://picsum.photos/seed/intro99/800/500" alt="Intro" fill className="object-cover" />
                       </div>
                    </div>
                 </div>
              </Card>
           </TabsContent>

           <TabsContent value="gboost" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <div className="grid gap-6 md:grid-cols-2">
                 <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden p-8 md:p-12 space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center"><Zap className="w-7 h-7" /></div>
                    <h2 className="text-3xl font-black font-headline uppercase tracking-tight">G-Boost: Aceleração de SEO Local</h2>
                    <p className="text-muted-foreground leading-relaxed">O G-Boost detecta automaticamente quando você recebe um elogio de <b>5 estrelas</b> e convida o cliente a avaliar também no Google Maps.</p>
                    <div className="p-6 rounded-2xl bg-muted/30 border border-muted space-y-3">
                       <p className="text-[10px] font-black uppercase text-primary tracking-widest">Como Configurar:</p>
                       <ol className="text-xs font-bold space-y-2 list-decimal ml-4 text-muted-foreground">
                          <li>Acesse a aba <b>Google</b> nas suas Configurações.</li>
                          <li>Pesquise pelo nome da sua empresa no motor de busca oficial.</li>
                          <li>Clique em <b>Salvar Alterações</b> e o G-Boost será ativado instantaneamente.</li>
                       </ol>
                    </div>
                 </Card>
                 <div className="relative aspect-square md:aspect-auto rounded-[2rem] overflow-hidden shadow-xl">
                    <Image src={images.gboost} alt="G-Boost" fill className="object-cover" />
                 </div>
              </div>
           </TabsContent>

           <TabsContent value="shield" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <div className="grid gap-6 md:grid-cols-2">
                 <div className="relative aspect-square md:aspect-auto rounded-[2rem] overflow-hidden shadow-xl order-2 md:order-1">
                    <Image src={images.shield} alt="Reputation Shield" fill className="object-cover" />
                 </div>
                 <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden p-8 md:p-12 space-y-6 order-1 md:order-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Shield className="w-7 h-7" /></div>
                    <h2 className="text-3xl font-black font-headline uppercase tracking-tight">Reputation Shield</h2>
                    <p className="text-muted-foreground leading-relaxed">Sua marca protegida contra feedbacks impulsivos. Avaliações de <b>1 a 3 estrelas</b> são filtradas para o seu Inbox Privado.</p>
                    <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-3">
                       <p className="text-[10px] font-black uppercase text-destructive tracking-widest">O Diferencial Estratégico:</p>
                       <p className="text-xs font-medium leading-relaxed">Em vez da crítica ir a público no Google ou Instagram, ela cai em um canal direto com você, permitindo a resolução interna e a recuperação do cliente.</p>
                    </div>
                 </Card>
              </div>
           </TabsContent>

           <TabsContent value="cards" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-background">
                 <div className="p-8 md:p-16 text-center space-y-8 max-w-3xl mx-auto">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"><Share2 className="w-8 h-8" /></div>
                    <div className="space-y-4">
                       <h2 className="text-3xl md:text-5xl font-black font-headline uppercase tracking-tight">Social Cards Studio</h2>
                       <p className="text-muted-foreground text-lg leading-relaxed font-medium">Transforme depoimentos de texto em artes profissionais para o seu Instagram em segundos.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {[
                          { icon: ImageIcon, label: "Exportação PNG" },
                          { icon: FileVideo, label: "Vídeo Reels" },
                          { icon: Palette, label: "Temas VIP" },
                          { icon: LayoutGrid, label: "Layouts Story" },
                       ].map((item, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-muted/20 border border-muted text-center space-y-2">
                             <item.icon className="w-5 h-5 mx-auto text-primary" />
                             <p className="text-[9px] font-black uppercase tracking-tight">{item.label}</p>
                          </div>
                       ))}
                    </div>
                    <Button onClick={() => window.location.href = '/social-cards'} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-xl">Abrir Studio Agora</Button>
                 </div>
              </Card>
           </TabsContent>

           <TabsContent value="linkinbio" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <div className="grid gap-6 md:grid-cols-2">
                 <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden p-8 md:p-12 space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Globe className="w-7 h-7" /></div>
                    <h2 className="text-3xl font-black font-headline uppercase tracking-tight">Link in Bio Estratégico</h2>
                    <p className="text-muted-foreground leading-relaxed">Sua Página Pública é um hub de conversão. Ela reúne seus melhores depoimentos e fornece um caminho direto para o seu WhatsApp.</p>
                    <div className="grid grid-cols-2 gap-3">
                       {[
                          { icon: Palette, label: 'Temas Custom' },
                          { icon: MessageCircle, label: 'Botão WhatsApp' },
                          { icon: Smartphone, label: 'Mobile First' },
                          { icon: LayoutGrid, label: '4 Layouts VIP' },
                       ].map((feat, i) => (
                          <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-muted/20">
                             <feat.icon className="w-4 h-4 text-primary" />
                             <span className="text-[9px] font-black uppercase tracking-tight">{feat.label}</span>
                          </div>
                       ))}
                    </div>
                 </Card>
                 <div className="relative aspect-square md:aspect-auto rounded-[2rem] overflow-hidden shadow-xl">
                    <Image src={images.widgets} alt="Link in Bio Preview" fill className="object-cover" />
                 </div>
              </div>
           </TabsContent>
        </Tabs>
      </main>

      <footer className="py-20 border-t mt-auto flex flex-col items-center gap-10 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[220px] h-[75px] md:w-[340px] md:h-[105px]">
          <Image 
            src="/logo-proova-white-mode.gif" 
            alt="Logo Footer" 
            fill 
            className="object-contain dark:hidden opacity-30 grayscale" 
            unoptimized
          />
          <Image 
            src="/logo-proova-dark-mode.gif" 
            alt="Logo Footer" 
            fill 
            className="object-contain hidden dark:block opacity-30 grayscale" 
            unoptimized
          />
        </div>
        <div className="space-y-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-40">© 2026 Proova Technology - Inteligência em Reputação</p>
          <div className="flex items-center justify-center gap-6 pt-4">
            <Link href="/terms" className="text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">Termos</Link>
            <Link href="/privacy" className="text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
