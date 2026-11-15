'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Scale, 
  Briefcase, 
  Globe, 
  Bot, 
  Star, 
  CreditCard, 
  ShieldAlert, 
  FileText 
} from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground pb-20">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-4 md:px-8 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image 
                src="/logo-proovaai-whitemode.png" 
                alt="Logo Proova Light" 
                fill 
                className="dark:hidden object-contain object-left" 
                priority 
              />
              <Image 
                src="/logo-proovaai-darkmode.png" 
                alt="Logo Proova Dark" 
                fill 
                className="hidden dark:block object-contain object-left" 
                priority 
              />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent" />
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] font-black uppercase tracking-widest gap-1.5 h-8 px-2 text-muted-foreground hover:text-primary hover:bg-transparent transition-all shadow-none border-none"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 pt-32 pb-12 space-y-12">
        <section className="space-y-4 text-center md:text-left animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
              <Scale className="w-3.5 h-3.5" /> Acordo de Serviço
           </div>
           <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter uppercase leading-tight">Termos de Uso</h1>
           <p className="text-muted-foreground font-medium text-sm md:text-lg">Regras e diretrizes para o uso da plataforma Proova AI. Última atualização: 15 de novembro de 2026.</p>
        </section>

        <div className="grid gap-6">
          {/* 1. OBJETO */}
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-background group hover:shadow-md transition-shadow">
            <CardHeader className="p-6 md:p-8 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <Briefcase className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">1. Objeto e Natureza do Serviço (B2B)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
                O Proova AI (useproovaai.com.br) é uma plataforma SaaS (Software como Serviço) voltada exclusivamente para empresas, clínicas e profissionais liberais gerenciarem sua própria reputação digital. Ao utilizar a plataforma, o usuário declara ser o proprietário legal ou gestor devidamente autorizado dos perfis comerciais conectados, sendo estritamente proibido o uso do sistema para coleta não autorizada de dados ou monitoramento de estabelecimentos de terceiros.
              </p>
            </CardContent>
          </Card>

          {/* 2. GOOGLE */}
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-background group hover:shadow-md transition-shadow">
            <CardHeader className="p-6 md:p-8 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <Globe className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">2. Integração com o Google e Leitura de Avaliações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
                Para exibir as avaliações da empresa no painel, o Proova AI lê as avaliações <strong>públicas</strong> da ficha do Google Maps indicada pelo usuário (identificada pelo Place ID), por meio de um provedor de coleta terceirizado. Nessa modalidade o Proova AI <strong>não publica respostas</strong> no Google em nome do usuário: ele recebe a resposta sugerida e a publica por conta própria. Quando disponível, a integração oficial com o Google Business Profile exigirá autorização explícita do usuário via protocolo OAuth do Google, e qualquer publicação automática ocorrerá somente conforme essa autorização e as configurações escolhidas pelo usuário. O usuário compromete-se a utilizar a plataforma em estrita conformidade com as Políticas de Conteúdo e Diretrizes do Google Business Profile, abstendo-se de publicar respostas com conteúdo ofensivo, spam, desinformação ou violação de privacidade de pacientes.
              </p>
            </CardContent>
          </Card>

          {/* 3. IA */}
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-background group hover:shadow-md transition-shadow">
            <CardHeader className="p-6 md:p-8 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">3. Responsabilidade sobre Respostas Geradas por IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
                O Proova AI utiliza modelos avançados de inteligência artificial para sugerir e automatizar respostas às avaliações recebidas, com base no tom de voz e nas diretrizes configuradas pelo próprio usuário. Embora nossa IA seja treinada para manter padrões éticos e profissionais, a <strong>responsabilidade editorial e jurídica final</strong> pelo conteúdo publicado no perfil público da empresa pertence integralmente ao titular da conta, que dispõe de ferramentas de moderação, edição e aprovação manual no painel. As respostas sugeridas são rascunhos: o usuário deve revisá-las antes de publicá-las.
                <br /><br />
                <strong>A partir de quando a IA atua.</strong> A IA responde apenas a feedbacks recebidos <strong>enquanto o plano Proova AI Premium ou PRO estiver ativo</strong>. Depoimentos recebidos pelo link de coleta antes da contratação (ou em período sem plano ativo) <strong>não recebem resposta automática</strong>; o usuário pode, se desejar, pedir uma sugestão manualmente no painel. Nas avaliações do Google, a primeira sincronização lê as avaliações públicas dos <strong>últimos 30 dias</strong> (o que pode incluir avaliações anteriores à contratação) e, depois, apenas as mais recentes, sugerindo resposta somente para as que ainda não foram respondidas pelo titular. Avaliações mais antigas não são lidas nem respondidas.
                <br /><br />
                <strong>O que é publicado.</strong> Respostas a avaliações do Google nunca são publicadas pelo Proova AI: são sugestões que o usuário copia e publica por conta própria. Nos depoimentos recebidos pelo link de coleta, a resposta gerada só aparece na página pública do Proova do usuário se o próprio usuário escolher exibir aquele depoimento. Em depoimentos de 1 a 3 estrelas, a resposta fica como rascunho até a aprovação do usuário.
              </p>
            </CardContent>
          </Card>

          {/* 4. PROVA SOCIAL */}
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-background group hover:shadow-md transition-shadow">
            <CardHeader className="p-6 md:p-8 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <Star className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">4. Prova Social e Coleta de Depoimentos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
                Os links de coleta, QR Codes e páginas públicas de prova social disponibilizados pelo sistema destinam-se à captação orgânica de feedbacks reais de clientes atendidos. É vedada a prática de compra de avaliações falsas ou incentivo financeiro condicionado a notas máximas, em conformidade com as leis de defesa do consumidor e regras das plataformas integradas.
              </p>
            </CardContent>
          </Card>

          {/* 5. PAGAMENTOS */}
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-background group hover:shadow-md transition-shadow">
            <CardHeader className="p-6 md:p-8 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <CreditCard className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">5. Planos, Pagamentos e Cancelamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
                O acesso aos recursos do Proova AI é regido pelo plano de assinatura contratado (<strong>Proova AI Premium</strong> ou <strong>Proova AI PRO</strong>), cobrado de forma recorrente conforme o ciclo e o valor exibidos no checkout, além de eventuais taxas informadas no ato da adesão. Os pagamentos são processados pela plataforma <strong>Cakto</strong>; o Proova AI não armazena dados de cartão. O cancelamento pode ser solicitado a qualquer momento pelo e-mail <strong>contato@useproovaai.com.br</strong> ou pela plataforma de pagamento, sem multa rescisória, e o acesso aos recursos do plano pago é encerrado quando o cancelamento é processado. <strong>Garantia de 7 dias:</strong> o contratante pode solicitar o reembolso integral em até 7 dias corridos após a contratação, em Configurações → Garantia de 7 dias no painel ou pelo e-mail acima; confirmado o reembolso, a conta retorna ao plano gratuito.
              </p>
            </CardContent>
          </Card>

          {/* 6. RESPONSABILIDADE */}
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-background group hover:shadow-md transition-shadow">
            <CardHeader className="p-6 md:p-8 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">6. Disponibilidade e Limitação de Responsabilidade</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
                Empregamos infraestrutura em nuvem de alta disponibilidade para garantir o funcionamento contínuo do agente de IA. Contudo, o Proova AI não se responsabiliza por instabilidades temporárias, alterações de regras ou suspensões aplicadas diretamente pelas APIs de terceiros (como o Google) ou por configurações inadequadas inseridas pelo próprio usuário.
              </p>
            </CardContent>
          </Card>

          {/* 7. VINCULAÇÃO DA COMPRA */}
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-background group hover:shadow-md transition-shadow">
            <CardHeader className="p-6 md:p-8 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <CreditCard className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">7. Ativação do Plano e E-mail da Compra</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
                O plano é ativado automaticamente na conta cujo e-mail coincide com o e-mail informado na compra. Se a compra for feita com outro e-mail, o contratante pode vincular o plano à sua conta em Configurações, confirmando um código de 6 dígitos enviado ao e-mail da compra. O contratante é responsável por manter acesso a esse e-mail e por não compartilhar o código.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="p-8 rounded-[2rem] bg-primary/5 border-2 border-dashed border-primary/20 text-center space-y-6">
           <div className="mx-auto w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-primary shadow-xl ring-1 ring-primary/5">
              <FileText className="w-6 h-6" />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight">Precisa de esclarecimentos?</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-sm mx-auto">Nossa equipe de suporte estratégico está pronta para tirar suas dúvidas sobre estes termos.</p>
           </div>
           <Link href="/support">
             <Button className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 bg-primary shadow-lg hover:bg-primary/90">
                Suporte Estratégico
             </Button>
           </Link>
        </section>
      </main>

      <footer className="py-12 border-t mt-auto text-center flex flex-col items-center gap-6">
        <div className="relative w-[180px] h-[60px] opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <Image 
            src="/logo-proovaai-whitemode.png" 
            alt="Logo Footer Light" 
            fill 
            className="dark:hidden object-contain" 
          />
          <Image 
            src="/logo-proovaai-darkmode.png" 
            alt="Logo Footer Dark" 
            fill 
            className="hidden dark:block object-contain" 
          />
        </div>
        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">Compliance Jurídico B2B • Proova AI Technology</p>
      </footer>
    </div>
  );
}
