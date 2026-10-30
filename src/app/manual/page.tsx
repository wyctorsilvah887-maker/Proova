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
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export default function ManualPage() {
  const manualImages = {
    gboost: PlaceHolderImages.find(img => img.id === 'manual-gboost'),
    shield: PlaceHolderImages.find(img => img.id === 'manual-shield'),
    widgets: PlaceHolderImages.find(img => img.id === 'manual-widgets'),
    social: PlaceHolderImages.find(img => img.id === 'manual-social'),
  };

  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground flex flex-col overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-4 md:px-8 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href="/dash">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center group">
            <div className="relative w-[180px] h-[60px] md:w-[280px] md:h-[90px] transition-transform group-hover:scale-105">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain hidden dark:block" priority />
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 h-7 font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary border-none">
            <BookOpen className="w-3 h-3" /> Central de Inteligência
          </Badge>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto p-4 md:p-12 space-y-12 flex-1">
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight leading-tight">
            Manual de Estratégia e <br className="hidden md:block" /> Domínio de Mercado
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-medium leading-relaxed italic">
            "Não use apenas uma ferramenta. Domine um método de vendas baseado em confiança."
          </p>
        </header>

        <Tabs defaultValue="principais" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-12 bg-muted/50 p-1.5 h-14 rounded-2xl max-w-2xl mx-auto">
            <TabsTrigger value="principais" className="rounded-xl gap-2 font-black text-xs uppercase tracking-widest transition-all data-[state=active]:shadow-lg">
              <Target className="w-4 h-4" /> Pilares Principais
            </TabsTrigger>
            <TabsTrigger value="geral" className="rounded-xl gap-2 font-black text-xs uppercase tracking-widest transition-all data-[state=active]:shadow-lg">
              <BookOpen className="w-4 h-4" /> Manual do Usuário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="principais" className="mt-0 space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* PILLAR 1: G-BOOST */}
            <section className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary"><MapPin className="w-8 h-8" /></div>
                  <h2 className="text-2xl md:text-4xl font-black font-headline tracking-tight">Ativar G-Boost: Autoridade Local</h2>
                </div>
                <p className="text-muted-foreground text-base md:text-xl leading-relaxed font-medium">
                  O G-Boost é o seu acelerador no Google. Ele foca em aumentar drasticamente suas <span className="text-foreground font-bold">chances de estar entre os 3 primeiros</span> no Google Maps através de avaliações reais.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-2xl bg-background border border-primary/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="text-foreground">O Gatilho:</strong> O sistema detecta automaticamente experiências de 4 e 5 estrelas.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-background border border-primary/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="text-foreground">A Ação:</strong> Exibimos um botão especial convidando o cliente a replicar a nota no seu perfil do Google Business.
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                   <Badge variant="outline" className="h-8 px-4 rounded-full border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                     Estratégia: Ganhar relevância no ranking orgânico sem gastar com anúncios.
                   </Badge>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-2 bg-primary/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative aspect-[16/10] bg-background border-4 border-white dark:border-muted rounded-[2rem] shadow-2xl overflow-hidden">
                  <Image 
                    src="/gboost.png" 
                    alt="Guia G-Boost" 
                    fill 
                    className="object-cover" 
                  />
                </div>
              </div>
            </section>

            {/* PILLAR 2: SHIELD */}
            <section className="grid gap-12 lg:grid-cols-2 items-center lg:flex-row-reverse">
              <div className="lg:order-2 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-3 rounded-2xl text-orange-600"><ShieldCheck className="w-8 h-8" /></div>
                  <h2 className="text-2xl md:text-4xl font-black font-headline tracking-tight">Reputation Shield</h2>
                </div>
                <p className="text-muted-foreground text-base md:text-xl leading-relaxed font-medium">
                  Evite que uma falha momentânea vire uma mancha eterna na sua reputação pública através do roteamento inteligente.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-2xl bg-background border border-orange-500/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-6 w-6 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="text-foreground">Compliance Total:</strong> Exibimos o botão de envio público para todos os usuários para seguir estritamente as diretrizes de transparência do Google.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-background border border-orange-500/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-6 w-6 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="text-foreground">O Direcionamento:</strong> Depoimentos de 1 a 3 estrelas são fortemente incentivados ao seu <strong className="text-foreground">Inbox Privado</strong> para resolução interna imediata.
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                   <Badge variant="outline" className="h-8 px-4 rounded-full border-orange-500/20 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                     Estratégia: Blindagem contra crises e melhoria contínua de processos.
                   </Badge>
                </div>
              </div>
              <div className="lg:order-1 relative group">
                <div className="absolute -inset-2 bg-orange-500/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative aspect-[16/10] bg-background border-4 border-white dark:border-muted rounded-[2rem] shadow-2xl overflow-hidden">
                  {manualImages.shield?.imageUrl && (
                    <Image 
                      src={manualImages.shield.imageUrl} 
                      alt="Guia Shield" 
                      fill 
                      className="object-cover" 
                      data-ai-hint="private inbox customer feedback interface"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* PILLAR 3: WIDGETS */}
            <section className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-600"><Layout className="w-8 h-8" /></div>
                  <h2 className="text-2xl md:text-4xl font-black font-headline tracking-tight">Elite Widgets</h2>
                </div>
                <p className="text-muted-foreground text-base md:text-xl leading-relaxed font-medium">
                  Sua Landing Page não vende apenas pelo texto, mas pela <span className="text-foreground font-bold">pressão social</span> dos murais.
                </p>
                <div className="space-y-4">
                   <div className="flex gap-4 p-4 rounded-2xl bg-background border border-blue-500/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="text-foreground">Efeito Manada:</strong> O Mural Masonry ou Carrossel prova visualmente que muitas pessoas escolheram você.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-background border border-blue-500/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="text-foreground">Página Pública VIP:</strong> Use seu link personalizado no Instagram para converter seguidores em compradores imediatos.
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                   <Badge variant="outline" className="h-8 px-4 rounded-full border-blue-500/20 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                     Estratégia: Reduzir o tempo de decisão do cliente no seu site.
                   </Badge>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-2 bg-blue-500/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative aspect-[16/10] bg-background border-4 border-white dark:border-muted rounded-[2rem] shadow-2xl overflow-hidden">
                  {manualImages.widgets?.imageUrl && (
                    <Image 
                      src={manualImages.widgets.imageUrl} 
                      alt="Guia Widgets" 
                      fill 
                      className="object-cover" 
                      data-ai-hint="website widget layout guide interface"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* PILLAR 4: SOCIAL */}
            <section className="grid gap-12 lg:grid-cols-2 items-center lg:flex-row-reverse">
              <div className="lg:order-2 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 p-3 rounded-2xl text-purple-600"><Share2 className="w-8 h-8" /></div>
                  <h2 className="text-2xl md:text-4xl font-black font-headline tracking-tight">Viral Content Power</h2>
                </div>
                <p className="text-muted-foreground text-base md:text-xl leading-relaxed font-medium">
                  Não deixe seu melhor elogio morrer em um banco de dados. Leve-o até o feed do seu cliente.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-2xl bg-background border border-purple-500/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="text-foreground">Social Card One-Click:</strong> Transforme qualquer depoimento em um post profissional para Instagram com um clique.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-background border border-purple-500/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="text-foreground">Prova Social em Vídeo:</strong> Compartilhe a emoção e o tom de voz do cliente. É o conteúdo que mais converte hoje.
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                   <Badge variant="outline" className="h-8 px-4 rounded-full border-purple-500/20 text-purple-600 text-[10px] font-black uppercase tracking-widest">
                     Estratégia: Marketing viral e onipresença digital através de depoimentos reais.
                   </Badge>
                </div>
              </div>
              <div className="lg:order-1 relative group">
                <div className="absolute -inset-2 bg-purple-500/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative aspect-[16/10] bg-background border-4 border-white dark:border-muted rounded-[2rem] shadow-2xl overflow-hidden">
                  {manualImages.social?.imageUrl && (
                    <Image 
                      src={manualImages.social.imageUrl} 
                      alt="Guia Social" 
                      fill 
                      className="object-cover" 
                      data-ai-hint="instagram card generator guide interface"
                    />
                  )}
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="geral" className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-6 md:grid-cols-3">
              {/* SECTION: DASHBOARD */}
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-background group hover:shadow-xl transition-all">
                <div className="h-1.5 w-full bg-primary" />
                <CardHeader>
                  <CardTitle className="text-lg font-black font-headline flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Dashboard
                  </CardTitle>
                  <CardDescription className="text-xs">O centro de comando da sua reputação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        <strong className="text-foreground">Resumo Analytics:</strong> Acompanhe o volume de depoimentos em 7, 30 ou todo o período.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        <strong className="text-foreground">Consultor Proova:</strong> Auditoria automática que avisa sobre falhas no SEO Local.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION: COLETA */}
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-background group hover:shadow-xl transition-all">
                <div className="h-1.5 w-full bg-primary" />
                <CardHeader>
                  <CardTitle className="text-lg font-black font-headline flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-primary" /> Coleta Ativa
                  </CardTitle>
                  <CardDescription className="text-xs">Como capturar elogios de forma eficiente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        <strong className="text-foreground">Link de Coleta:</strong> Envie via WhatsApp após cada atendimento concluído.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        <strong className="text-foreground">QR de Balcão:</strong> Baixe o PDF e coloque no caixa ou mesa para coleta física.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION: MODERAÇÃO */}
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-background group hover:shadow-xl transition-all">
                <div className="h-1.5 w-full bg-primary" />
                <CardHeader>
                  <CardTitle className="text-lg font-black font-headline flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-primary" /> Moderação
                  </CardTitle>
                  <CardDescription className="text-xs">O filtro de qualidade da sua marca.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        <strong className="text-foreground">Curadoria:</strong> Aprove depoimentos qualificados para injetar nos seus murais.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-xs font-medium leading-relaxed">
                        <strong className="text-foreground">Auto-Publish:</strong> Automatize a publicação baseada em regras de nota mínima e caracteres.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-primary/5 rounded-[2.5rem] p-8 md:p-16 border border-primary/10 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
               <div className="relative z-10 space-y-6">
                 <h3 className="text-2xl md:text-3xl font-black font-headline flex items-center gap-3">
                   <Zap className="w-8 h-8 text-primary" /> Dicas de Alta Performance
                 </h3>
                 <div className="grid gap-6 md:grid-cols-2">
                   <div className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                      <div className="space-y-1">
                        <p className="font-bold text-sm">O momento perfeito para pedir feedback</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Peça no "Aha Moment" do seu cliente (logo após o tratamento ou entrega do produto), quando a dopamina da compra ainda está alta.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                      <div className="space-y-1">
                        <p className="font-bold text-sm">Depoimentos em Vídeo: Ouro Digital</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Vídeos geram 10x mais confiança que texto. Ofereça um pequeno bônus ou café VIP para clientes que gravarem via Proova.</p>
                      </div>
                   </div>
                 </div>
               </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-20 border-t mt-auto flex flex-col items-center gap-10 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[220px] h-[75px] md:w-[340px] md:h-[105px]">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Footer" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" priority />
        </div>
        <div className="space-y-2">
           <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-40">© 2026 Proova Technology - Inteligência de Mercado v2.0</p>
           <p className="text-[9px] font-bold text-primary uppercase tracking-widest">A confiança é a nova moeda do mercado digital.</p>
        </div>
      </footer>
    </div>
  );
}
