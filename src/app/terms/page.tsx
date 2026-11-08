
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
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
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
              className="text-[10px] font-black uppercase tracking-widest gap-1.5 h-8 px-2 text-muted-foreground hover:text-primary transition-all shadow-none border-none"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-6 pt-32 pb-12 space-y-12">
        {/* Terms content... */}
      </main>

      <footer className="py-12 border-t mt-auto text-center flex flex-col items-center gap-6">
        <div className="relative w-[180px] h-[60px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Gray" fill className="object-contain dark:hidden opacity-30 grayscale" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Gray" fill className="object-contain hidden dark:block opacity-30 grayscale" priority />
        </div>
        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Compliance Jurídico e Transparência Digital</p>
      </footer>
    </div>
  );
}
