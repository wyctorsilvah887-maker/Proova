'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, User, Building2, Lock, Loader2, Eye, EyeOff, Briefcase, CheckCircle2, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useFirestore, useAuth, useUser } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Termos Obrigatórios",
        description: "Você deve aceitar os termos de uso e política de privacidade para continuar.",
      });
      return;
    }

    if (!businessType) {
      toast({
        variant: "destructive",
        title: "Tipo de Negócio",
        description: "Por favor, selecione o tipo do seu negócio.",
      });
      return;
    }

    if (!name.trim() || !company.trim() || !email.trim() || !password.trim() || !db) return;

    setIsSubmitting(true);
    
    try {
      let userIp = 'Não capturado';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIp = ipData.ip;
      } catch (e) {
        console.error("Falha ao capturar IP para log jurídico", e);
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const slug = company.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

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

      await setDoc(doc(db, "users", newUser.uid), userData);
      
      toast({
        title: "Conta Criada!",
        description: "Seu cadastro foi validado com sucesso.",
      });
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
      <div className="fixed top-4 md:top-8 left-4 md:left-8 z-50">
        <Link href="/" className="flex items-center gap-1.5 text-[10px] md:text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest bg-background/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/20">
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Início
        </Link>
      </div>

      <div className="w-full max-w-xl space-y-6 md:space-y-8 mt-8 md:mt-0">
        <div className="flex flex-col items-center text-center space-y-1.5 md:space-y-2">
          <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tighter">Crie sua Conta</h1>
          <p className="text-muted-foreground text-sm md:text-lg font-medium">A primeira máquina de prova social inteligente.</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden bg-card">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="pt-6 md:pt-8 text-center space-y-1">
            <CardTitle className="text-xl md:text-2xl font-black font-headline">Configuração do Perfil</CardTitle>
            <CardDescription className="text-xs md:text-sm">Preencha os dados abaixo para começar a coletar elogios.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 sm:px-10 pb-8 md:pb-10">
            <form onSubmit={handleSignup} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qual é o seu tipo de negócio?</label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20">
                    <SelectValue placeholder="Selecione uma categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academia">Academia/ Studio de musculação</SelectItem>
                    <SelectItem value="artes_marciais">Artes marciais/ Lutas</SelectItem>
                    <SelectItem value="clinica">Clinica/ Consultório</SelectItem>
                    <SelectItem value="estetica">Estética/ Salão de Beleza</SelectItem>
                    <SelectItem value="barbearia">Barbearia</SelectItem>
                    <SelectItem value="restaurante">Restaurante/ Lanchonete</SelectItem>
                    <SelectItem value="oficina">Oficina/ Serviços automotivos</SelectItem>
                    <SelectItem value="petshop">Pet shop</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Seu Nome/CEO/Responsável</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        placeholder="Nome do Responsável"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 md:h-11 pl-10 bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Empresa</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        placeholder="Ex: Tech Soluções"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="h-10 md:h-11 pl-10 bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      type="email"
                      placeholder="seu@melhoremail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 md:h-11 pl-10 bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Segura</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 md:h-11 pl-10 pr-10 bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm"
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

              <div className="space-y-4">
                <div className="flex items-start space-x-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted} 
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor="terms" 
                      className="text-[10px] sm:text-xs font-bold leading-relaxed cursor-pointer"
                    >
                      Li e concordo com os <Link href="/terms" className="text-primary hover:underline underline-offset-4">Termos de Uso</Link> e a <Link href="/privacy" className="text-primary hover:underline underline-offset-4">Política de Privacidade</Link>.
                    </Label>
                    <p className="text-[9px] text-muted-foreground">
                      Ao clicar em "Começar Agora", seu IP e timestamp serão registrados como prova de aceite.
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 md:h-14 text-base md:text-lg font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-xl md:rounded-2xl gap-2"
                  disabled={isSubmitting || !termsAccepted}
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin h-5 w-5" /> Validando...</>
                  ) : (
                    <>Começar Agora <CheckCircle2 className="w-5 h-5" /></>
                  )}
                </Button>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  Já possui uma conta?{' '}
                  <Link href="/login" className="text-primary font-black hover:underline tracking-tight">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="flex flex-col items-center gap-4 opacity-40 pb-8 md:pb-0">
           <p className="text-[8px] md:text-[10px] text-center uppercase tracking-[0.2em] md:tracking-[0.3em] font-black flex items-center gap-2">
             <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" /> Compliance e Auditoria Proova
           </p>
        </div>
      </div>
    </div>
  );
}
