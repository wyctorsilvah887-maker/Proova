
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
  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground flex flex-col overflow-x-hidden">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-4 md:px-8 sticky top-0 z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-4">
          <Link href="/dash">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full text-muted-foreground hover:text-primary transition-all bg-transparent border-none shadow-none h-10 w-10 select-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center group">
            <div className="relative w-[180px] h-[60px] md:w-[280px] md:h-[90px] transition-transform group-hover:scale-105">
              <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain dark:hidden" priority />
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
        {/* Manual content... */}
      </main>

      <footer className="py-20 border-t mt-auto flex flex-col items-center gap-10 bg-background/50 text-center">
        <div className="flex items-center gap-2 relative w-[220px] h-[75px] md:w-[340px] md:h-[105px]">
          <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain dark:hidden" priority />
          <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo Footer" fill className="object-contain hidden dark:block" priority />
        </div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-40">© 2026 Proova Technology</p>
      </footer>
    </div>
  );
}
