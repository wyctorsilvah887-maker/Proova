
'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Star, 
  Eye,
  MessageSquare,
  Check,
  User,
  LayoutGrid,
  Play,
  CheckCircle2,
  Monitor,
  Copy,
  Layout,
  Palette,
  ChevronDown,
  LogOut,
  TrendingUp,
  Gem,
  Shield,
  Sun,
  Moon,
  Zap,
  Settings2,
  Sparkles,
  ExternalLink,
  Lock,
  X,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc, useCollection, useAuth } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

export default function EmbedEditorPage({ params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const widgetRef = useMemo(() => (db && user ? doc(db, 'users', user.uid, 'widgets', widgetId) : null), [db, user, widgetId]);
  const { data: widgetData, loading: widgetLoading } = useDoc(widgetRef);

  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);

  if (authLoading || widgetLoading || userDataLoading || (user && !userData)) {
    return <div className="flex h-screen items-center justify-center bg-muted/30"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>;
  }

  return (
    <div className="h-screen flex flex-col font-body w-full overflow-hidden bg-background">
      <header className="bg-background border-b h-20 md:h-28 flex items-center px-2 md:px-4 fixed top-0 w-full z-[60] shadow-sm backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/widgets">
            <Button variant="ghost" size="sm" className="h-10 px-2 gap-2 text-muted-foreground hover:text-primary transition-all border-none shadow-none bg-transparent hover:bg-transparent focus:bg-transparent focus-visible:ring-0 rounded-xl shadow-none">
               <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Voltar</span>
            </Button>
          </Link>
          <div className="relative w-[160px] h-[52px] md:w-[240px] md:h-[78px]">
            <Image src="/logo-proova-white-mode.gif" alt="Logo" fill className="object-contain object-left dark:hidden" priority />
            <Image src="/Logotipo%20PROOVA%20dark%20mode%201.png" alt="Logo" fill className="object-contain object-left hidden dark:block" priority />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={() => router.push('/widgets')} className="font-bold h-10 md:h-12 px-4 rounded-xl">Concluído</Button>
        </div>
      </header>

      {/* Editor Main Section... */}
    </div>
  );
}
