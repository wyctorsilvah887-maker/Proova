'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, User, Building2, Lock, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, Briefcase, ChevronRight, Fingerprint } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { doc, setDoc, serverTimestamp, getDoc, writeBatch } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useFirestore, useAuth, useUser } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

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
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dash');
    }
  }, [user, authLoading, router]);

  const handleNextStep = () => {
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
      setStep(2);
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
      const slug = company.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const slugRef = doc(db, 'slugs', slug);
      const slugCheck = await getDoc(slugRef);
      if (slugCheck.exists()) {
        throw new Error("Este nome de empresa já está em uso. Tente uma pequena variação.");
      }

      let userIp = 'Não capturado';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIp = ipData.ip;
      } catch (e) {
        console.error("Falha ao capturar IP", e);
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const batch = writeBatch(db);

      batch.set(slugRef, {
        userId: newUser.uid,
        type: 'account',
        createdAt: serverTimestamp()
      });

      const userData = {
        name: name.trim(),
        companyName: company.trim(),
        companySlug: slug,
        email: email.trim().toLowerCase(),
        businessType: businessType,
        isAdmin: false,
        membershipStatus: 'base',
        testimonialsCount: 0,
        googleRedirectCount: 0,
        createdAt: serverTimestamp(),
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        userIp: userIp,
        legalConsentVersion: '4.0'
      };

      batch.set(doc(db, "users", newUser.uid), userData);
      
      await batch.commit();
      
      toast({ title: "Conta Criada!", description: "Bem-vindo à nova era da prova social." });
      router.push('/dash');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Cadastro",
        description: error.message || "Não foi possível criar sua conta agora.",
      });
      setIsSubmitting(false);
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
      {/* Navigation Minimalista */}
      <div className="fixed top-8 left-8 z-50">
        <Link 
          href="/" 
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary active:text-primary transition-all focus:outline-none select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Início
        </Link>
      </div>

      {/* Theme Toggle Clean */}
      <div className="fixed top-8 right-8 z-50">
        <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent" />
      </div>

      <div className="w-full max-w-xl space-y-6 md:space-y-8 mt-8 md:mt-0 animate-in fade-in duration-700">
        <div className="flex flex-col items-center text-center space-y-2">
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
                    <SelectContent className="max-h-64 rounded-2xl">
                      <SelectItem value="academia">Academia / Studio / Crossfit</SelectItem>
                      <SelectItem value="agencia">Agência de Marketing / Publicidade</SelectItem>
                      <SelectItem value="artes_marciais">Artes marciais / Lutas</SelectItem>
                      <SelectItem value="barbearia">Barbearia</SelectItem>
                      <SelectItem value="clinica">Clínica / Consultório Médico</SelectItem>
                      <SelectItem value="estetica">Estética / Salão / Spa</SelectItem>
                      <SelectItem value="oficina">Oficina / Estética Automotiva</SelectItem>
                      <SelectItem value="petshop">Pet shop / Veterinária</SelectItem>
                      <SelectItem value="servicos_digitais">Prestadores de Serviços Digitais / Freelancer</SelectItem>
                      <SelectItem value="restaurante">Restaurante / Gastronomia</SelectItem>
                      <SelectItem value="outros">Outros Setores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleNextStep}
                  className="w-full h-14 text-base font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl gap-3 bg-primary hover:bg-primary/90 text-white"
                >
                  Próximo Passo <ChevronRight className="w-5 h-5" />
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
                        className="h-11 pl-11 bg-muted/20 border-transparent focus:ring-primary/20 font-bold text-sm rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleNextStep}
                    className="w-full h-14 text-base font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl gap-3 bg-primary hover:bg-primary/90 text-white"
                  >
                    Próximo Passo <ChevronRight className="w-5 h-5" />
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
                    
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2 flex items-center justify-center gap-1.5"
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
        
        <div className="flex flex-col items-center gap-4 opacity-40 pb-8 md:pb-0">
           <p className="text-[8px] md:text-[10px] text-center uppercase tracking-[0.3em] font-black flex items-center gap-2">
             <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" /> Compliance e Auditoria de Dados Proova
           </p>
        </div>
      </div>
    </div>
  );
}
