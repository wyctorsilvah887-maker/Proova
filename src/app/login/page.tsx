'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff, Fingerprint, CheckCircle2 } from 'lucide-react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoadingScreen } from '@/components/loading-screen';

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

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      toast({ 
        title: "Bem-vindo de volta!", 
        description: "Login realizado com sucesso." 
      });
      router.push('/dash');
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Erro de Acesso", 
        description: "Credenciais inválidas. Verifique seu e-mail e senha." 
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
          membershipStatus: 'base',
          createdAt: serverTimestamp(),
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-8 md:py-12 relative font-body text-foreground overflow-y-auto">
      <div className="fixed top-4 md:top-8 left-4 md:left-8 z-50">
        <Link 
          href="/" 
          className="flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary active:text-primary transition-all focus:outline-none select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Início
        </Link>
      </div>

      <div className="fixed top-4 md:top-8 right-4 md:right-8 z-50">
        <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent" />
      </div>

      <div className="w-full max-w-md space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-700 mt-8 md:mt-0">
        <div className="text-center space-y-2">
          <div className="relative w-[180px] h-[60px] mx-auto mb-4">
             <Image src="/logo-proovaai-whitemode.png" alt="Logo" fill className="object-contain dark:hidden" />
             <Image src="/logo-proovaai-darkmode.png" alt="Logo" fill className="object-contain hidden dark:block" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">Login</h1>
          <p className="text-muted-foreground text-xs md:text-sm font-medium tracking-tight">Acesse sua máquina de prova social inteligente.</p>
        </div>

        <Card className="w-full shadow-2xl border-none overflow-hidden bg-card rounded-[2rem] ring-1 ring-border/50">
          <div className="h-1.5 bg-primary w-full" />
          
          <CardHeader className="text-center space-y-4 pt-8 md:pt-10">
            <div className="mx-auto w-fit animate-in zoom-in duration-700">
              <Fingerprint className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl md:text-2xl font-black font-headline tracking-tight">Gestão de Autoridade</CardTitle>
              <CardDescription className="text-xs font-medium">
                Gerencie sua presença digital e automações.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 md:px-10 pb-10 md:pb-12 space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-11 bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Senha</label>
                    <Link href="/forgot-password" size="sm" className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest opacity-80 hover:opacity-100 transition-opacity">
                      Esqueceu?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha secreta"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-11 bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-muted-foreground/40 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl gap-3 bg-primary hover:bg-primary/90 text-white" 
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin h-5 w-5" /> Autenticando...</>
                ) : (
                  <>Acessar Painel <CheckCircle2 className="w-5 h-5" /></>
                )}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="bg-card px-3 text-muted-foreground">OU CONTINUAR COM</span></div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-3 border-primary/20 text-foreground hover:bg-primary/5 shadow-sm transition-all"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? <Loader2 className="animate-spin" /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continuar com Google
            </Button>
            
            <div className="text-center pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-medium">
                Novo por aqui?{' '}
                <Link href="/signup" className="text-primary font-black hover:underline tracking-tight">
                  Criar Conta Grátis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col items-center gap-4 opacity-40 pb-8 md:pb-0">
           <p className="text-[8px] text-center uppercase tracking-[0.3em] font-black flex items-center gap-2">
             <CheckCircle2 className="w-3 h-3" /> Sistema de Autenticação Segura via Firebase
           </p>
        </div>
      </div>
    </div>
  );
}
