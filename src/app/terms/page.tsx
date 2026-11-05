'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Scale, Gavel, FileWarning, AlertOctagon, Lock } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export default function TermsPage() {
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
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit text-primary">
            <Scale className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight">Instrumento Particular de Termos e Condições de Uso</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Versão 3.0 - Última Revisão Jurídica: Outubro de 2026</p>
        </div>

        <div className="bg-card border rounded-[2rem] p-8 md:p-12 shadow-xl space-y-10 text-sm md:text-base leading-relaxed text-muted-foreground">
          
          {/* CLÁUSULA 1 - PREÂMBULO */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold font-headline text-foreground flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary" /> 1. DO OBJETO E ACEITAÇÃO
            </h2>
            <p>O presente instrumento regula o licenciamento de uso da plataforma tecnológica <strong>PROOVA</strong>, de propriedade intelectual exclusiva da <strong>PROOVA TECHNOLOGY</strong> (doravante "CONTRATADA"). A utilização da plataforma por parte do <strong>CONTRATANTE</strong> (seja pessoa física ou jurídica) implica na aceitação plena, irrevogável e irretratável de todos os termos aqui dispostos, operando como contrato de adesão imediato nos termos da legislação civil brasileira.</p>
          </section>

          {/* CLÁUSULA 2 - REPUTATION SHIELD E ANTI-GATING */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold font-headline text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> 2. DO ESCUDO DE REPUTAÇÃO E SOBERANIA DO FEEDBACK
            </h2>
            <div className="bg-primary/5 p-6 md:p-8 rounded-3xl border border-primary/20 space-y-4">
              <p className="text-foreground font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-primary" /> Parágrafo Único: Natureza Jurídica do Fluxo de Dados
              </p>
              <p className="text-foreground/90 font-medium italic">
                O PROOVA implementa uma tecnologia de intermediação passiva denominada "Roteamento Soberano de Opinião". 
              </p>
              <ul className="list-disc pl-5 space-y-4 text-xs md:text-sm">
                <li><strong>Escolha Eletiva do Consumidor:</strong> O sistema não automatiza filtros. Ele apresenta ao Consumidor Final opções claras de destino para sua manifestação. A decisão de tornar a crítica pública ou canalizá-la ao Inbox Privado de Conciliação é ato de vontade livre e espontânea do consumidor, isentando a Contratada de qualquer alegação de manipulação algorítmica (*Review Gating*).</li>
                <li><strong>Compliance com Órgãos Reguladores:</strong> Este mecanismo foi desenhado em estrito cumprimento às diretrizes da Federal Trade Commission (FTC) e do Código de Defesa do Consumidor, garantindo que nenhum feedback seja deletado ou suprimido, mas sim direcionado conforme a conveniência do titular do dado.</li>
              </ul>
            </div>
          </section>

          {/* CLÁUSULA 3 - EXCLUSÃO DE RESPONSABILIDADE PERANTE TERCEIROS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold font-headline text-foreground">3. DA LIMITAÇÃO DE RESPONSABILIDADE PERANTE TERCEIROS (GOOGLE, BING, ETC)</h2>
            <p>O CONTRATANTE declara ciência inequívoca de que o <strong>Google Business (Google Maps)</strong> e outras plataformas de busca possuem termos de serviço próprios e algoritmos proprietários de detecção de spam e comportamento inautêntico. A CONTRATADA não garante, sob qualquer hipótese:</p>
            <ul className="list-decimal pl-5 space-y-2 opacity-80">
              <li>A manutenção de notas médias em perfis externos;</li>
              <li>A não ocorrência de banimentos, suspensões ou "shadowbans" por parte do Google caso o CONTRATANTE utilize a ferramenta de forma abusiva ou contra as diretrizes vigentes das referidas plataformas;</li>
              <li>A indexação obrigatória de depoimentos coletados.</li>
            </ul>
          </section>

          {/* CLÁUSULA 4 - INDENIDADE E BLINDAGEM PATRIMONIAL */}
          <section className="space-y-4 border-l-4 border-primary pl-6">
            <h2 className="text-xl font-bold font-headline text-foreground italic">4. DA CLÁUSULA DE INDENIDADE</h2>
            <p>O CONTRATANTE obriga-se a manter a CONTRATADA, seus sócios e colaboradores, isentos e indenes de quaisquer reclamações, processos, perdas, danos, passivos, custos ou despesas (incluindo honorários advocatícios) decorrentes de:</p>
            <ul className="list-disc pl-5 space-y-2 opacity-80">
              <li>Uso indevido da plataforma para coleta de depoimentos fraudulentos ou comprados;</li>
              <li>Violação de direitos de imagem ou privacidade de terceiros por meio dos widgets;</li>
              <li>Eventual queda de faturamento ou "dano à imagem" alegado pelo CONTRATANTE em decorrência de feedbacks negativos recebidos através da ferramenta.</li>
            </ul>
          </section>

          {/* CLÁUSULA 5 - VEDAÇÕES E ANTIFRAUDE */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold font-headline text-foreground">5. DAS CONDUTAS VEDADAS E RESILIÇÃO UNILATERAL</h2>
            <p>É expressamente proibido ao CONTRATANTE, sob pena de rescisão imediata sem direito a reembolso e denúncia às autoridades competentes:</p>
            <ul className="list-decimal pl-5 space-y-2 opacity-80">
              <li>A inserção de depoimentos simulados (Fake Reviews);</li>
              <li>O uso de "bots" para inflar métricas de redirecionamento para o Google;</li>
              <li>Qualquer tentativa de engenharia reversa nos scripts de embutimento do mural.</li>
            </ul>
          </section>

          {/* CLÁUSULA 6 - EXCLUSÃO DE LUCROS CESSANTES */}
          <section className="space-y-4 bg-muted/30 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-foreground">6. DA EXCLUSÃO DE DANOS INDIRETOS E LUCROS CESSANTES</h2>
            <p className="text-xs uppercase font-black text-destructive">Atenção: Cláusula de Exclusão de Danos</p>
            <p>Em nenhum caso a CONTRATADA será responsável por lucros cessantes, interrupção de negócios, perda de informações comerciais ou qualquer outra perda pecuniária decorrente do uso ou da impossibilidade de uso desta plataforma, mesmo que a CONTRATADA tenha sido avisada da possibilidade de tais danos.</p>
          </section>

          {/* CLÁUSULA 7 - FORO DE ELEIÇÃO */}
          <section className="space-y-4 border-t pt-8">
            <div className="flex items-center gap-2 text-primary">
              <Lock className="w-5 h-5" />
              <h3 className="font-bold font-headline">7. DA ELEIÇÃO DE FORO E LEGISLAÇÃO APLICÁVEL</h3>
            </div>
            <p>As partes elegem o foro da Comarca da sede da CONTRATADA para dirimir quaisquer controvérsias oriundas deste contrato, com exclusão de qualquer outro, por mais privilegiado que seja. Este instrumento é regido pelas leis da República Federativa do Brasil.</p>
          </section>

          <div className="bg-muted/50 p-8 rounded-3xl border border-dashed text-[10px] text-center space-y-3">
            <p className="font-bold text-foreground opacity-70 uppercase tracking-widest">Aviso de Compliance Legal:</p>
            <p>Este documento possui validade de contrato digital e sua aceitação é registrada via log de IP e TIMESTAMP no momento do cadastro. O uso continuado da plataforma após revisões destes termos constitui aceitação tácita das novas cláusulas.</p>
            <p className="font-bold">Proova Technology | Departamento de Compliance e Risco Digital</p>
          </div>
        </div>
      </main>
    </div>
  );
}
