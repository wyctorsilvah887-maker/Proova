'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  if (authLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-8 md:py-12 relative font-body text-foreground overflow-y-auto">
      {/* Navigation & Theme */}
      <div className="fixed top-4 md:top-8 left-4 md:left-8 flex items-center gap-4 z-50">
        <Link href="/" className="flex items-center gap-1.5 text-[10px] md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest bg-background/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/20">
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Início
        </Link>
      </div>

      <div className="fixed top-4 md:top-8 right-4 md:right-8 z-50">
        <ThemeToggle className="border-none bg-transparent shadow-none" />
      </div>

      <div className="w-full max-w-md space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500 mt-8 md:mt-0">
        <div className="text-center space-y-1.5 md:space-y-2">
          <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tighter">Login</h1>
          <p className="text-muted-foreground text-sm font-medium">Acesse sua máquina de prova social inteligente.</p>
        </div>

        <Card className="w-full shadow-2xl border-none overflow-hidden bg-card">
          {/* Top Accent Line */}
          <div className="h-2 bg-primary w-full" />
          
          <CardHeader className="text-center space-y-3 md:space-y-4 pt-6 md:pt-8">
            <div className="mx-auto bg-primary/10 p-3 md:p-4 rounded-full w-fit ring-4 md:ring-8 ring-primary/5">
              <KeyRound className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl md:text-2xl font-black font-headline tracking-tight">Bem-vindo de Volta</CardTitle>
              <CardDescription className="text-xs md:text-sm font-medium">
                Insira suas credenciais para gerenciar sua autoridade digital.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 md:px-8 pb-8 md:pb-10">
            <form onSubmit={handleLogin} className="space-y-5 md:space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Acesso</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-10 md:h-11 bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Senha</label>
                    <Link href="/forgot-password" size="sm" className="text-[9px] md:text-[10px] font-black text-primary hover:underline uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha secreta"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-10 md:h-11 bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 md:h-14 text-base md:text-lg font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-xl md:rounded-2xl gap-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin h-5 w-5" /> Autenticando...</>
                ) : (
                  <>Entrar no Painel <CheckCircle2 className="w-5 h-5" /></>
                )}
              </Button>
              
              <div className="text-center pt-4 md:pt-6 border-t">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  Ainda não tem conta?{' '}
                  <Link href="/signup" className="text-primary font-black hover:underline tracking-tight">
                    Cadastre-se Grátis
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="flex flex-col items-center gap-4 opacity-40 pb-8 md:pb-0">
           <p className="text-[8px] md:text-[10px] text-center uppercase tracking-[0.2em] md:tracking-[0.3em] font-black">
             🔒 Autenticação Segura
           </p>
        </div>
      </div>
    </div>
  );
}
