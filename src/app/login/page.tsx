'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { getAttribution } from '@/lib/attribution';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';
import { canAttempt, clearAttempts, formatWait, LOGIN_LIMIT, recordAttempt } from '@/lib/client-rate-limit';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dash');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    const gate = canAttempt(LOGIN_LIMIT);
    if (!gate.allowed) {
      toast({
        variant: "destructive",
        title: "Muitas tentativas",
        description: `Por segurança, aguarde ${formatWait(gate.retryInMs)} ou use "Esqueceu?" para redefinir a senha.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      clearAttempts(LOGIN_LIMIT.key);
      toast({ 
        title: "Bem-vindo de volta!", 
        description: "Login realizado com sucesso." 
      });
      router.push('/dash');
    } catch (error: any) {
      console.error(error);
      recordAttempt(LOGIN_LIMIT);
      toast({ 
        variant: "destructive", 
        title: error?.code === 'auth/too-many-requests' ? "Muitas tentativas" : "Erro de Acesso", 
        description: error?.code === 'auth/too-many-requests'
          ? "O acesso foi bloqueado temporariamente por segurança. Aguarde alguns minutos ou redefina sua senha."
          : "Credenciais inválidas. Verifique seu e-mail e senha." 
      });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!db || isGoogleLoading) return;
    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/business.manage');
      provider.setCustomParameters({
        access_type: 'offline',
        prompt: 'consent'
      });

      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: result.user.displayName || 'Usuário Google',
          email: result.user.email,
          companyName: 'Minha Empresa',
          companySlug: `empresa-${Math.random().toString(36).substring(2, 7)}`,
          businessType: 'clinica_estetica',
          isAdmin: false,
          onboardingDone: false,
          membershipStatus: 'base',
          createdAt: serverTimestamp(),
          attribution: getAttribution(),
          googleConnected: true,
          lastGoogleSync: serverTimestamp()
        });
        toast({ title: "Bem-vindo!", description: "Sua conta Proova foi criada com o Google." });
      } else {
        toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
      }

      router.push('/dash');
    } catch (error: any) {
      console.error("Erro no Login Google:", error);
      toast({ 
        variant: "destructive", 
        title: "Erro no Login Google", 
        description: "Não foi possível conectar com sua conta Google agora." 
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (authLoading || user) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-body text-foreground bg-background">
      {/* Painel da marca (só no computador) */}
      <aside className="hidden lg:flex flex-col justify-between bg-zinc-950 text-white p-12 xl:p-16">
        <div className="relative w-[180px] h-[56px]">
          <Image src="/logo-proovaai-darkmode.png" alt="Proova AI" fill className="object-contain object-left" priority />
        </div>
        <div className="space-y-8 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-extrabold font-headline tracking-tight leading-tight">
            Sua reputação no Google, <span className="text-primary">sob controle.</span>
          </h2>
          <ul className="space-y-4 text-sm text-white/70 font-medium">
            {[
              "Respostas prontas com IA para cada avaliação",
              "Depoimentos reunidos em um inbox unificado",
              "Página pública de autoridade para o seu link da bio",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-white/40 font-medium">© 2026 Proova AI</p>
      </aside>

      {/* Formulário */}
      <main className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute top-4 left-4 md:top-6 md:left-6">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Início
          </Link>
        </div>
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent" />
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="relative w-[150px] h-[48px] mx-auto lg:hidden mb-4">
              <Image src="/logo-proovaai-whitemode.png" alt="Proova AI" fill className="object-contain dark:hidden" priority />
              <Image src="/logo-proovaai-darkmode.png" alt="Proova AI" fill className="object-contain hidden dark:block" priority />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-headline tracking-tight">Entrar na sua conta</h1>
            <p className="text-sm text-muted-foreground font-medium">Acesse o painel da sua reputação digital.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-muted-foreground">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-lg text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-muted-foreground">Senha</label>
                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">Esqueceu?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-lg text-sm"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground/60 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 rounded-lg text-sm font-bold gap-2" disabled={isLoading || isGoogleLoading}>
              {isLoading ? (<><Loader2 className="animate-spin h-4 w-4" /> Entrando...</>) : "Entrar"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider"><span className="bg-background px-3 text-muted-foreground">ou</span></div>
          </div>

          <Button variant="outline" className="w-full h-11 rounded-lg text-sm font-bold gap-3" onClick={handleGoogleLogin} disabled={isGoogleLoading || isLoading}>
            {isGoogleLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continuar com Google
          </Button>

          <p className="text-center text-sm text-muted-foreground font-medium">
            Novo por aqui?{' '}
            <Link href="/signup" className="text-primary font-bold hover:underline">Criar conta grátis</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
