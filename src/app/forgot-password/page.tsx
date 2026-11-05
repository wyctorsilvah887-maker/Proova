'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, Fingerprint, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { sendResetPasswordEmail } from '@/app/actions/auth-actions';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    
    if (!targetEmail) return;

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      const result = await sendResetPasswordEmail(targetEmail, `${window.location.origin}/login`);

      if (result.success) {
        setIsSent(true);
        toast({
          title: "Instruções Enviadas",
          description: "Verifique sua caixa de entrada para prosseguir.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Falha na Solicitação",
        description: error.message || "Verifique se o e-mail está correto e tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 font-body text-foreground relative">
      <div className="fixed top-8 left-8 flex items-center gap-4">
        <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </div>

      <div className="fixed top-8 right-8">
        <ThemeToggle className="border-none bg-transparent shadow-none" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden bg-card">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="mx-auto w-fit animate-in zoom-in duration-700">
            <Fingerprint className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-headline font-bold tracking-tight">Recuperar Senha</CardTitle>
            <CardDescription className="text-sm font-medium">
              {isSent 
                ? "Siga as instruções enviadas para seu e-mail." 
                : "Informe o e-mail associado à sua conta para receber o link de acesso."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {isSent ? (
            <div className="space-y-8 text-center py-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Um e-mail de recuperação foi enviado para <br />
                <span className="font-bold text-foreground">{email}</span>.
              </p>
              <Button asChild className="w-full h-14 text-lg font-bold shadow-xl">
                <Link href="/login">Voltar ao Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Acesso</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-muted/20 border-transparent focus:ring-primary/20 text-base"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-bold shadow-xl transition-all hover:translate-y-[-2px] active:translate-y-0" disabled={isLoading}>
                {isLoading ? (
                  <>< Loader2 className="animate-spin mr-2 h-5 w-5" /> Processando...</>
                ) : 'Enviar Link de Recuperação'}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-40">
                🚀 Powered by Proova
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
