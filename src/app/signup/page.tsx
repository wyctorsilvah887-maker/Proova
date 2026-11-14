'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, User, Building2, Lock, Loader2, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, Briefcase, ChevronRight, Fingerprint } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { doc, setDoc, serverTimestamp, getDoc, writeBatch, type Firestore } from "firebase/firestore";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useFirestore, useAuth, useUser } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/loading-screen";
import { slugifyCompany, findAvailableVariation } from "@/lib/slug";

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

// O nome comercial vira o "slug" registrado na coleção "slugs"; se o documento existe, o nome está em uso.
async function isSlugTaken(db: Firestore, slug: string): Promise<boolean> {
  return (await getDoc(doc(db, 'slugs', slug))).exists();
}

function suggestCompanyName(db: Firestore, company: string): Promise<string | null> {
  return findAvailableVariation(company, (slug: string) => isSlugTaken(db, slug));
}

export default function SignupPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  
  const [step, setStep] = useState(0); // 0: Setor, 1: Identidade, 2: Acesso
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dash');
    }
  }, [user, authLoading, router]);

  // Verifica o nome comercial enquanto o cliente digita (com uma pequena pausa),
  // para ele descobrir no Passo 2 e não só no final do cadastro.
  useEffect(() => {
    if (step !== 1) return;

    const trimmed = company.trim();
    if (!trimmed) {
      setSlugStatus('idle');
      setSlugSuggestion(null);
      return;
    }

    const slug = slugifyCompany(trimmed);
    if (!slug) {
      setSlugStatus('invalid');
      setSlugSuggestion(null);
      return;
    }

    if (!db) return;

    let cancelled = false;
    setSlugStatus('checking');
    setSlugSuggestion(null);

    const timer = setTimeout(async () => {
      try {
        const taken = await isSlugTaken(db, slug);
        if (cancelled) return;
        if (!taken) {
          setSlugStatus('available');
          return;
        }
        setSlugStatus('taken');
        const suggestion = await suggestCompanyName(db, trimmed);
        if (!cancelled) setSlugSuggestion(suggestion);
      } catch (err) {
        // Sem rede ou erro do banco: não bloqueia. A verificação final do cadastro continua protegendo.
        console.error('Erro ao verificar o nome da empresa:', err);
        if (!cancelled) setSlugStatus('error');
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [company, db, step]);

  const handleNextStep = async () => {
    if (step === 0) {
      if (!businessType) {
        toast({ variant: "destructive", title: "Seleção Obrigatória", description: "Selecione o tipo do seu negócio." });
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!name.trim() || !company.trim()) {
        toast({ variant: "destructive", title: "Campos Obrigatórios", description: "Informe seu nome e o nome comercial da empresa." });
        return;
      }

      const slug = slugifyCompany(company);
      if (!slug) {
        setSlugStatus('invalid');
        toast({ variant: "destructive", title: "Nome Inválido", description: "Use letras ou números no nome da empresa." });
        return;
      }

      // Confirmação final no clique: garante o resultado mesmo se a verificação ao digitar ainda estiver em andamento.
      if (db) {
        setIsCheckingName(true);
        try {
          if (await isSlugTaken(db, slug)) {
            setSlugStatus('taken');
            setSlugSuggestion(await suggestCompanyName(db, company));
            toast({ variant: "destructive", title: "Nome já em uso", description: "Escolha outro nome comercial para continuar." });
            return;
          }
          setSlugStatus('available');
        } catch (err) {
          // Se a checagem falhar (ex.: sem rede), segue em frente: o cadastro ainda verifica no final.
          console.error('Erro ao verificar o nome da empresa:', err);
        } finally {
          setIsCheckingName(false);
        }
      }

      setStep(2);
    }
  };

  const handleGoogleSignup = async () => {
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
          companyName: 'Minha Empresa',
          companySlug: `empresa-${Math.random().toString(36).substring(2, 7)}`,
          email: result.user.email,
          businessType: 'clinica_estetica',
          isAdmin: false,
          membershipStatus: 'base',
          isSetupProcessDone: false,
          testimonialsCount: 0,
          googleRedirectCount: 0,
          createdAt: serverTimestamp(),
          termsAccepted: true,
          termsAcceptedAt: serverTimestamp(),
          googleConnected: true
        });
        toast({ title: "Bem-vindo!", description: "Sua conta foi criada com sucesso via Google." });
      }

      router.push('/dash');
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro no Cadastro", description: "Não foi possível conectar com the Google agora." });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({ variant: "destructive", title: "Termos Obrigatórios", description: "Você deve aceitar os termos de uso." });
      return;
    }
    if (!email.trim() || !password.trim() || !db) return;

    setIsSubmitting(true);
    
    try {
      const slug = slugifyCompany(company);

      if (!slug || slug === "") {
        throw new Error("O nome da empresa é inválido para gerar um link. Tente usar letras e números comuns.");
      }

      const slugRef = doc(db, 'slugs', slug);
      const slugCheck = await getDoc(slugRef);
      if (slugCheck.exists()) {
        // Outra pessoa pode ter ficado com o nome depois do Passo 2. Volta para lá sem perder o que foi preenchido.
        setSlugStatus('taken');
        setSlugSuggestion(await suggestCompanyName(db, company));
        setStep(1);
        setIsSubmitting(false);
        toast({ variant: "destructive", title: "Nome já em uso", description: "Esse nome acabou de ser usado. Escolha outro; seus dados foram mantidos." });
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = userCredential.user;
      
      const batch = writeBatch(db);
      batch.set(slugRef, { userId: newUser.uid, type: 'account', createdAt: serverTimestamp() });

      const userData = {
        name: name.trim(),
        companyName: company.trim(),
        companySlug: slug,
        email: email.trim().toLowerCase(),
        businessType: businessType,
        isAdmin: false,
        membershipStatus: 'base',
        isSetupProcessDone: false,
        testimonialsCount: 0,
        googleRedirectCount: 0,
        createdAt: serverTimestamp(),
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        legalConsentVersion: '4.0'
      };

      batch.set(doc(db, "users", newUser.uid), userData);
      await batch.commit();
      
      toast({ title: "Conta Criada!", description: "Bem-vindo à nova era da prova social." });
      router.push('/dash');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no Cadastro", description: error.message || "Não foi possível criar sua conta agora." });
      setIsSubmitting(false);
    }
  };

  if (authLoading || user) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-8 md:py-12 relative font-body text-foreground overflow-y-auto">
      <div className="fixed top-8 left-8 z-50">
        <Link href="/" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary active:text-primary transition-all focus:outline-none select-none">
          <ArrowLeft className="w-3.5 h-3.5" /> Início
        </Link>
      </div>

      <div className="fixed top-8 right-8 z-50">
        <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent" />
      </div>

      <div className="w-full max-w-xl space-y-6 md:space-y-8 mt-8 md:mt-0 animate-in fade-in duration-700">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative w-[180px] h-[60px] mx-auto mb-2">
             <Image src="/logo-proovaai-whitemode.png" alt="Logo" fill className="object-contain dark:hidden" />
             <Image src="/logo-proovaai-darkmode.png" alt="Logo" fill className="object-contain hidden dark:block" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">Criar Conta</h1>
          <p className="text-muted-foreground text-xs md:text-sm font-medium tracking-tight">
            {step === 0 && "Comece definindo sua atuação no mercado."}
            {step === 1 && "Agora, como devemos chamar você e sua empresa?"}
            {step === 2 && "Por fim, defina seus dados de acesso."}
          </p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden bg-card rounded-[2rem] ring-1 ring-border/50">
          <div className="h-1.5 bg-primary w-full" />
          
          <CardHeader className="pt-10 text-center space-y-4">
            <div className="mx-auto w-fit animate-in zoom-in duration-700">
              {step === 0 && <Briefcase className="w-12 h-12 text-primary" />}
              {step === 1 && <User className="w-12 h-12 text-primary" />}
              {step === 2 && <Fingerprint className="w-12 h-12 text-primary" />}
            </div>
            <CardTitle className="text-xl md:text-2xl font-black font-headline tracking-tight">
              {step === 0 && "Passo 1: Seu Negócio"}
              {step === 1 && "Passo 2: Identificação"}
              {step === 2 && "Passo 3: Acesso"}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-6 sm:px-10 pb-10 md:pb-12">
            {step === 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Em qual setor você atua?</label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm">
                      <SelectValue placeholder="Selecione sua categoria..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 rounded-2xl">
                      <SelectItem value="agencia">Agência de Marketing / Publicidade</SelectItem>
                      <SelectItem value="clinica_estetica">Clínica de Estética</SelectItem>
                      <SelectItem value="harmonizacao">Harmonização Facial</SelectItem>
                      <SelectItem value="biomedico">Biomédico(a) Esteta</SelectItem>
                      <SelectItem value="esteticista">Esteticista</SelectItem>
                      <SelectItem value="dentista">Dentista (Harmonização)</SelectItem>
                      <SelectItem value="dermatologista">Dermatologista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleNextStep}
                  className="w-full h-14 text-base font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl gap-3 bg-primary hover:bg-primary/90 text-white"
                >
                  Próximo Passo <ChevronRight className="w-5 h-5" />
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="bg-card px-3 text-muted-foreground">OU ATIVAÇÃO RÁPIDA</span></div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-3 border-primary/20 text-foreground hover:bg-primary/5 shadow-sm transition-all"
                  onClick={handleGoogleSignup}
                  disabled={isGoogleLoading}
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
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Seu Nome Completo</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
                      <Input
                        placeholder="Nome e Sobrenome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 pl-11 bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Empresa</label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
                      <Input
                        placeholder="Nome Comercial"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className={cn(
                          "h-11 pl-11 bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm rounded-xl",
                          (slugStatus === 'taken' || slugStatus === 'invalid') && "ring-1 ring-destructive/50"
                        )}
                        required
                      />
                    </div>
                    {company.trim() && slugStatus !== 'idle' && slugStatus !== 'error' && (
                      <div className="ml-1 text-[11px] font-bold" aria-live="polite">
                        {slugStatus === 'checking' && (
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidade...
                          </p>
                        )}
                        {slugStatus === 'available' && (
                          <p className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Nome disponível
                          </p>
                        )}
                        {slugStatus === 'invalid' && (
                          <p className="flex items-center gap-1.5 text-destructive">
                            <XCircle className="h-3.5 w-3.5" /> Use letras ou números no nome da empresa.
                          </p>
                        )}
                        {slugStatus === 'taken' && (
                          <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 text-destructive">
                              <XCircle className="h-3.5 w-3.5" /> Este nome já está em uso. Escolha outro.
                            </p>
                            {slugSuggestion && (
                              <button
                                type="button"
                                onClick={() => setCompany(slugSuggestion)}
                                className="text-primary underline underline-offset-4"
                              >
                                Usar "{slugSuggestion}"
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleNextStep}
                    disabled={isCheckingName || slugStatus === 'taken' || slugStatus === 'invalid'}
                    className="w-full h-14 text-base font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl gap-3 bg-primary hover:bg-primary/90 text-white"
                  >
                    {isCheckingName ? (
                      <><Loader2 className="animate-spin h-5 w-5" /> Verificando...</>
                    ) : (
                      <>Próximo Passo <ChevronRight className="w-5 h-5" /></>
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3 h-3" /> Voltar ao Passo 1
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSignup} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
                      <Input
                        type="email"
                        placeholder="seu@melhoremail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 pl-11 bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha de Acesso</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 pl-11 pr-11 bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm rounded-xl"
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

                <div className="space-y-6">
                  <div className="flex items-start space-x-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <Checkbox 
                      id="terms" 
                      checked={termsAccepted} 
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="terms" className="text-[10px] font-bold leading-relaxed cursor-pointer">
                        Li e concordo com os <Link href="/terms" className="text-primary hover:underline underline-offset-4">Termos de Uso</Link> e a <Link href="/privacy" className="text-primary hover:underline underline-offset-4">Política de Privacidade</Link>.
                      </Label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-base font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl gap-3 bg-primary hover:bg-primary/90 text-white"
                      disabled={isSubmitting || !termsAccepted}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="animate-spin h-5 w-5" /> Validando...</>
                      ) : (
                        <>Finalizar Cadastro <CheckCircle2 className="w-5 h-5" /></>
                      )}
                    </Button>
                    
                    <div className="relative py-2 my-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                      <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="bg-card px-3 text-muted-foreground">OU USE SOCIAL</span></div>
                    </div>

                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-3 border-primary/20 text-foreground hover:bg-primary/5 shadow-sm transition-all"
                      onClick={handleGoogleSignup}
                      disabled={isGoogleLoading || isSubmitting}
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

                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2 flex items-center justify-center gap-1.5 mt-2"
                    >
                      <ArrowLeft className="w-3 h-3" /> Voltar ao Passo 2
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="text-center pt-6 border-t border-border/50 mt-6">
              <p className="text-xs text-muted-foreground font-medium">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-primary font-black hover:underline tracking-tight">
                  Entrar Agora
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
