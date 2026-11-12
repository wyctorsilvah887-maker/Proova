'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database, ShieldAlert, Gavel, Globe, Trash2, Settings2 } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PrivacyPage() {
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
              <ShieldCheck className="w-3.5 h-3.5" /> Segurança de Dados
           </div>
           <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter uppercase leading-tight">Política de Privacidade</h1>
           <p className="text-muted-foreground font-medium text-sm md:text-lg">Entenda como o Proova AI protege sua integridade digital e gerencia suas informações.</p>
        </section>

        <div className="grid gap-12">
          {/* SEÇÃO GOOGLE API - USO LIMITADO */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Uso de Dados das APIs do Google</h2>
            </div>
            <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2rem] p-8 md:p-10 space-y-6 animate-in zoom-in duration-500">
              <p className="text-sm md:text-base leading-relaxed font-bold text-foreground/90">
                O uso e a transferência de informações recebidas das APIs do Google pelo PROOVA AI obedecem à <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80 transition-opacity">Política de Dados do Usuário dos Serviços de API do Google (Google API Services User Data Policy)</a>, incluindo os requisitos de <strong>Uso Limitado (Limited Use)</strong>.
              </p>
              <div className="space-y-4 pt-4 border-t border-primary/10">
                <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed italic">
                  Declaramos expressamente que a <strong>única finalidade</strong> do processamento e uso dessas informações é a gestão estratégica de reputação e autoridade da própria clínica usuária. Os dados acessados destinam-se exclusivamente a permitir que a clínica monitore e responda às suas próprias avaliações no Google Business Profile, nunca sendo utilizados para fins publicitários, prospecção de terceiros ou comercialização de bases de dados.
                </p>
              </div>
            </div>
          </section>

          {/* SEÇÃO REVOGAÇÃO E LGPD */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted text-muted-foreground shadow-inner">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Revogação de Acesso e Exclusão (LGPD)</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
                Em total conformidade com a Lei Geral de Proteção de Dados (LGPD) e as normas de segurança do Google, garantimos o controle absoluto do titular sobre suas integrações:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-6 rounded-2xl bg-background border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Settings2 className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Como Desconectar</p>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">Você pode revogar o acesso do Proova AI à sua conta Google a qualquer momento através do nosso painel de configurações ou diretamente nas <strong>Configurações de Segurança da sua Conta Google</strong> (sessão "Aplicativos de terceiros com acesso à conta").</p>
                </Card>
                <Card className="p-6 rounded-2xl bg-background border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Trash2 className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Exclusão Definitiva</p>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">Para solicitar a exclusão permanente de todos os seus dados, registros de integração e histórico de uso dos nossos servidores, basta enviar uma solicitação para o e-mail oficial: <strong className="text-primary">contato@useproovaai.com.br</strong>.</p>
                </Card>
              </div>
            </div>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground shadow-inner">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Coleta de Informações</h2>
             </div>
             <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
               Coletamos informações essenciais para a prestação de nossos serviços, incluindo:
             </p>
             <ul className="space-y-3 list-none pl-1">
                {[
                  "Dados de Registro: Nome, e-mail corporativo e senha criptografada.",
                  "Dados do Perfil Comercial: Nome da empresa, setor de atuação e Place ID do Google Maps.",
                  "Conteúdo Gerado: Depoimentos e imagens enviados por seus clientes finais.",
                  "Logs Técnicos: Endereço IP e cookies para manutenção da sessão e segurança."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm md:text-base font-medium">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
             </ul>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Segurança e Retenção</h2>
             </div>
             <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
                Seus dados são armazenados em infraestrutura de nuvem com criptografia de ponta. Mantemos as informações apenas pelo período necessário para cumprir com as finalidades descritas nesta política ou conforme exigido por lei. Depoimentos excluídos pelo usuário são removidos permanentemente de nossos servidores ativos em até 30 dias.
             </p>
          </section>

          <section className="p-8 rounded-[2rem] bg-muted/20 border-2 border-dashed border-muted-foreground/10 text-center space-y-6">
             <div className="mx-auto w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-primary shadow-xl ring-1 ring-primary/5">
                <ShieldAlert className="w-6 h-6" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Dúvidas sobre Privacidade?</h3>
                <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-sm mx-auto">Nossa equipe jurídica e técnica está à disposição para esclarecer qualquer ponto sobre o tratamento dos seus dados.</p>
             </div>
             <Link href="/support">
               <Button variant="outline" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                  Contatar DPO / Suporte
               </Button>
             </Link>
          </section>
        </div>
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
        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">Compliance Jurídico • LGPD & Google API Policy</p>
      </footer>
    </div>
  );
}
