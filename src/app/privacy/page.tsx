'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database, ShieldAlert, Gavel } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground pb-20">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-4 md:px-8 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center">
          <Link href="/" className="flex items-center group -ml-2 md:-ml-4">
            <div className="relative w-[200px] h-[65px] md:w-[320px] md:h-[105px] transition-transform group-hover:scale-105">
              <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
              <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent" />
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] font-black uppercase tracking-widest gap-1.5 h-8 px-2 text-muted-foreground hover:text-primary hover:bg-transparent active:text-primary transition-all focus-visible:ring-0 shadow-none border-none"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-6 pt-32 pb-12 space-y-12">
        <div className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 p-5 rounded-full w-fit text-primary animate-in zoom-in duration-500">
            <Lock className="w-12 h-12" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight leading-tight">Declaração de Política de Privacidade e <br className="hidden md:block" /> Proteção de Dados Pessoais</h1>
          <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] bg-primary/5 py-2 px-4 rounded-full w-fit mx-auto border border-primary/10">
            Compliance Digital v4.0 - Estrita Conformidade com a Lei 13.709/2018 (LGPD)
          </p>
        </div>

        <div className="bg-card border rounded-[2.5rem] p-8 md:p-16 shadow-2xl space-y-12 text-sm md:text-base leading-relaxed text-muted-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          {/* SEÇÃO 1 - PREÂMBULO E DEFINIÇÕES */}
          <section className="space-y-6 relative">
            <h2 className="text-xl md:text-2xl font-bold font-headline text-foreground flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" /> 1. DO PREÂMBULO E ESCOPO DE APLICAÇÃO
            </h2>
            <div className="space-y-4 text-justify">
              <p>A <strong>PROOVA TECHNOLOGY</strong> reafirma seu compromisso inabalável com a privacidade e a segurança dos dados pessoais. Este documento estabelece, de forma exaustiva e transparente, como os dados são coletados, processados e armazenados, operando como parte integrante do contrato de licenciamento de software (SaaS).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-6 rounded-3xl border border-dashed">
                <p className="text-xs italic"><strong className="text-foreground">Controlador:</strong> O Contratante (Cliente Proova) que define as finalidades de uso.</p>
                <p className="text-xs italic"><strong className="text-foreground">Operador:</strong> O Proova, que realiza o tratamento em nome do Controlador.</p>
                <p className="text-xs italic"><strong className="text-foreground">Titular:</strong> O Consumidor Final que insere voluntariamente seu depoimento.</p>
                <p className="text-xs italic"><strong className="text-foreground">Dado Pessoal:</strong> Informação relacionada a pessoa natural identificada ou identificável.</p>
              </div>
            </div>
          </section>

          {/* SEÇÃO 2 - COLETA E MINIMIZAÇÃO */}
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold font-headline text-foreground flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" /> 2. DA COLETA, TRATAMENTO E MINIMIZAÇÃO DE DADOS
            </h2>
            <div className="space-y-4 text-justify">
              <p>O PROOVA aplica o princípio da <strong>Minimização de Dados (Privacy by Design)</strong>, coletando estritamente o necessário para a viabilidade técnica da prova social:</p>
              <ul className="list-disc pl-5 space-y-3 marker:text-primary">
                <li><strong className="text-foreground">Dados do Contratante:</strong> Nome, e-mail corporativo, dados de faturamento e metadados da empresa para fins de gestão de conta e adimplemento contratual.</li>
                <li><strong className="text-foreground">Dados do Consumidor Final (Titular):</strong> Nome e e-mail vinculados ao depoimento. Tais dados são fornecidos mediante <strong className="text-foreground">consentimento inequívoco</strong> no ato da submissão do formulário.</li>
                <li><strong className="text-foreground">Finalidade Específica:</strong> O tratamento visa exclusivamente a exibição pública de depoimentos autorizados ou o roteamento privado para resolução de conflitos via "Reputation Shield".</li>
              </ul>
            </div>
          </section>

          {/* SEÇÃO 3 - SEGURANÇA E CRIPTOGRAFIA */}
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold font-headline text-foreground flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" /> 3. DA SEGURANÇA DA INFORMAÇÃO E BLINDAGEM TÉCNICA
            </h2>
            <div className="bg-primary/5 p-6 md:p-8 rounded-3xl border border-primary/20 space-y-4">
              <p className="text-foreground/90 font-medium italic">
                Implementamos medidas de segurança técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda ou alteração.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-foreground/80">
                <li>Criptografia em trânsito (SSL/TLS) de 256 bits;</li>
                <li>Armazenamento em infraestrutura Google Cloud (Firebase) com certificação ISO 27001;</li>
                <li>Políticas estritas de controle de acesso (IAM) e logs de auditoria;</li>
                <li>Backups geodistribuidos para garantir a disponibilidade e integridade.</li>
              </ul>
            </div>
          </section>

          {/* SEÇÃO 4 - COMPARTILHAMENTO E TRANSFERÊNCIA */}
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold font-headline text-foreground flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-primary" /> 4. DO NÃO COMPARTILHAMENTO COM TERCEIROS
            </h2>
            <p className="text-justify">É expressamente vedada a comercialização, cessão ou compartilhamento da base de dados dos clientes (leads) ou consumidores para fins publicitários de terceiros (*data brokers*). O compartilhamento de dados ocorrerá apenas em situações de:</p>
            <ol className="list-decimal pl-5 space-y-3 opacity-90">
              <li>Cumprimento de obrigação legal ou ordem judicial expedida por autoridade competente;</li>
              <li>Integração técnica estritamente necessária (ex: processadores de pagamento com certificação PCI);</li>
              <li>Proteção do crédito e prevenção a fraudes no âmbito da plataforma.</li>
            </ol>
          </section>

          {/* SEÇÃO 5 - DIREITOS E EXCLUSÃO */}
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold font-headline text-foreground flex items-center gap-3">
              <Gavel className="w-6 h-6 text-primary" /> 5. DOS DIREITOS DO TITULAR E RETENÇÃO DE DADOS
            </h2>
            <p className="text-justify">Em observância ao Art. 18 da LGPD, o Titular possui o direito de solicitar a qualquer tempo a confirmação de existência de tratamento, o acesso aos dados, a correção de dados incompletos e a <strong>exclusão total (Direito ao Esquecimento)</strong>.</p>
            <div className="bg-muted/50 p-6 rounded-3xl border text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Canal Direto de Requisição (DPO):</p>
              <p className="text-primary font-bold">contato@wsstudioscompany.com.br</p>
              <p className="text-[9px] opacity-60">Prazo de resposta: Até 15 dias úteis conforme previsão legal.</p>
            </div>
          </section>

          {/* SEÇÃO 6 - FORO */}
          <section className="pt-8 border-t space-y-4">
            <p className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-tighter">
              <Gavel className="w-3.5 h-3.5" /> Eleição de Foro e Jurisdição
            </p>
            <p className="text-[11px] text-justify">Fica eleito o Foro da Comarca da sede da detentora dos direitos da plataforma Proova para dirimir qualquer controvérsia oriunda deste instrumento, renunciando as partes a qualquer outro, por mais privilegiado que seja ou venha a ser. Esta política é regida e interpretada de acordo com as leis da República Federativa do Brasil.</p>
          </section>

          <div className="pt-12 text-center">
            <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black opacity-40">
              © 2026 PROOVA TECHNOLOGY
            </p>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t mt-auto text-center flex flex-col items-center gap-6">
        <div className="relative w-[180px] h-[60px] opacity-30 grayscale">
          <Image src="/Logotipo%20PROOVA%20white%20mode%201.png" alt="Logo Gray" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Gray" fill className="object-contain hidden dark:block" priority />
        </div>
        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Proteção Ativa contra Vazamentos e Uso Indevido</p>
      </footer>
    </div>
  );
}
