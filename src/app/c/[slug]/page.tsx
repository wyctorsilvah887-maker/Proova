'use client';

import { useState, use, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Star, CheckCircle2, MessageSquare, Loader2, Send, Video, Search, MapPin, Shield, ArrowLeft, Globe, Copy } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { submitTestimonialAction } from '@/app/actions/testimonial-actions';

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = use(params);
  const db = useFirestore();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0); 
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectionPending, setSelectionPending] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string | null>(null);
  const [companyNameDisplay, setCompanyNameDisplay] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [finalDest, setFinalDest] = useState<'public' | 'private' | null>(null);
  
  // Anti-bot state
  const [honeypot, setHoneypot] = useState('');
  const [loadTime] = useState(Date.now());

  useEffect(() => {
    async function findCompany() {
      if (!db || !rawSlug) return;
      
      try {
        setIsLoadingCompany(true);
        const decodedSlug = decodeURIComponent(rawSlug);
        const normalizedSlug = decodedSlug.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const usersRef = collection(db, 'users');
        
        const q1 = query(usersRef, where('companySlug', '==', normalizedSlug), limit(1));
        const snap1 = await getDocs(q1);
        
        if (!snap1.empty) {
          const data = snap1.docs[0].data();
          setTargetUserId(snap1.docs[0].id);
          setCompanyNameDisplay(data.companyName);
          setGoogleMapsUrl(data.googleMapsUrl || null);
          setMembershipStatus(data.membershipStatus || 'lead');
          setIsLoadingCompany(false);
          return;
        }

        const q2 = query(usersRef, where('companySlug', '==', decodedSlug.toLowerCase()), limit(1));
        const snap2 = await getDocs(q2);

        if (!snap2.empty) {
          const data = snap2.docs[0].data();
          setTargetUserId(snap2.docs[0].id);
          setCompanyNameDisplay(data.companyName);
          setGoogleMapsUrl(data.googleMapsUrl || null);
          setMembershipStatus(data.membershipStatus || 'lead');
          setIsLoadingCompany(false);
          return;
        }
      } catch (err) {
        console.error("Erro ao localizar empresa:", err);
      } finally {
        setIsLoadingCompany(false);
      }
    }
    
    findCompany();
  }, [db, rawSlug]);

  const handleGoogleRedirect = (url: string) => {
    if (!url) return;
    
    // Rastreio em background
    if (db && targetUserId) {
      const userRef = doc(db, 'users', targetUserId);
      updateDoc(userRef, {
        googleRedirectCount: increment(1)
      }).catch(err => console.error("Erro ao rastrear clique:", err));
    }

    let finalUrl = url.trim();
    const utmParams = 'utm_source=proova&utm_medium=testimonial_success&utm_campaign=google_maps_boost';
    
    if (finalUrl.includes('?')) {
      finalUrl += `&${utmParams}`;
    } else {
      finalUrl += `?${utmParams}`;
    }

    const secureUrl = finalUrl.startsWith('http') ? finalUrl : `https://${finalUrl}`;
    
    try {
      window.open(secureUrl, '_blank');
    } catch (e) {
      console.warn("Redirecionamento bloqueado pelo navegador.");
    }
  };

  const handleResetForm = () => {
    setUserName('');
    setUserEmail('');
    setRating(0);
    setText('');
    setIsSubmitting(false);
    setSubmitted(false);
    setSelectionPending(false);
    setFinalDest(null);
  };

  const handleSubmitInitial = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (honeypot) return;

    if (Date.now() - loadTime < 3000) {
      toast({
        variant: "destructive",
        title: "Calma aí!",
        description: "Você está enviando rápido demais. Aguarde um segundo.",
      });
      return;
    }

    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Nota Obrigatória",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
      });
      return;
    }
    if (!userName.trim() || !text.trim()) return;
    setSelectionPending(true);
  };

  const handleFinalSubmit = async (destination: 'public' | 'private') => {
    if (!targetUserId) return;
    setIsSubmitting(true);
    setFinalDest(destination);

    if (destination === 'public') {
      if (googleMapsUrl) {
        handleGoogleRedirect(googleMapsUrl);
      }

      try {
        await navigator.clipboard.writeText(text.trim());
        toast({
          title: "Elogio Copiado!",
          description: "Pronto para colar no Google.",
        });
      } catch (err) {
        console.warn("Clipboard failed", err);
      }
    }

    // Chama a Server Action com Rate Limit
    const result = await submitTestimonialAction({
      targetUserId,
      destination,
      userName,
      userEmail,
      rating,
      text
    });

    if (result.success) {
      setSubmitted(true);
      setIsSubmitting(false);
      setSelectionPending(false);
      
      toast({
        title: destination === 'public' ? "Publicado com Sucesso!" : "Feedback Enviado Privado",
        description: destination === 'public' ? "Seu elogio agora brilha no nosso site." : "A gerência recebeu seu feedback sigiloso.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Falha no Envio",
        description: result.error || "Ocorreu um erro ao processar seu depoimento.",
      });
      setIsSubmitting(false);
    }
  };

  if (isLoadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-body">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
          <p className="text-muted-foreground">Localizando empresa...</p>
        </div>
      </div>
    );
  }

  if (!targetUserId && !isLoadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-body">
        <Card className="w-full max-w-md text-center shadow-xl border-none bg-card text-card-foreground">
          <CardContent className="pt-10 pb-10 space-y-6">
            <Search className="w-12 h-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-headline">Empresa Não Encontrada</h2>
              <p className="text-muted-foreground">O link acessado é inválido ou a empresa não está cadastrada.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Voltar ao Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-body text-foreground">
        <div className="fixed top-8 right-8">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md text-center shadow-2xl border-none bg-card text-card-foreground">
          <CardContent className="pt-10 pb-10 space-y-8">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline">Obrigado!</h2>
              <p className="text-muted-foreground">Sua avaliação foi enviada com sucesso para {companyNameDisplay}.</p>
            </div>

            {googleMapsUrl && finalDest === 'public' && (
              <div className="pt-6 border-t space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Ficamos muito felizes com seu feedback!</p>
                  <p className="text-xs text-muted-foreground">Se a janela do Google não abriu automaticamente, use o botão abaixo:</p>
                </div>
                <Button 
                  onClick={() => handleGoogleRedirect(googleMapsUrl)}
                  className="w-full h-14 rounded-xl gap-3 text-sm font-bold shadow-xl hover:scale-105 active:scale-95 transition-all bg-[#4285F4] hover:bg-[#357ae8]"
                >
                  <MapPin className="w-5 h-5" /> Abrir Google Maps (Colar)
                </Button>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Sua nota nos ajuda a crescer localmente</p>
              </div>
            )}
            
            <div className="pt-4">
              <Button variant="ghost" onClick={handleResetForm} className="text-xs text-muted-foreground">
                Enviar outro depoimento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 font-body text-foreground">
      <div className="fixed top-8 right-8">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">{companyNameDisplay}</h1>
          <p className="text-muted-foreground">Gostaríamos de ouvir sua opinião sobre nossos serviços.</p>
        </div>

        <Card className="shadow-2xl border-none overflow-hidden bg-card text-card-foreground">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" /> Deixe seu Depoimento
            </CardTitle>
            <CardDescription>Sua experiência é fundamental para nós.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-10">
            {selectionPending ? (
              <div className="space-y-8 animate-in fade-in zoom-in duration-500 py-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black font-headline">Como deseja prosseguir?</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed px-4">
                    Para garantir a legitimidade da nossa marca, escolha como quer compartilhar sua experiência.
                  </p>
                </div>
                
                <div className="grid gap-4">
                  <Button 
                    disabled={isSubmitting}
                    onClick={() => handleFinalSubmit('public')}
                    className="h-auto min-h-24 py-5 rounded-2xl flex flex-col items-center justify-center gap-1 bg-[#4285F4] hover:bg-[#357ae8] shadow-xl transition-all hover:scale-[1.02] active:scale-95 border-none px-6"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      <span className="font-bold text-base sm:text-lg">Público no Google & Site</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] opacity-70 uppercase font-black tracking-widest text-center leading-tight">Copiaremos seu texto para você colar no perfil da empresa</span>
                  </Button>
                  
                  <Button 
                    disabled={isSubmitting}
                    variant="outline"
                    onClick={() => handleFinalSubmit('private')}
                    className="h-auto min-h-24 py-5 rounded-2xl flex flex-col items-center justify-center gap-1 border-primary/20 text-primary hover:bg-primary/5 shadow-md transition-all hover:scale-[1.02] active:scale-95 px-6"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      <span className="font-bold text-base sm:text-lg">Privado para a Empresa</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] opacity-70 uppercase font-black tracking-widest text-center leading-tight">Sugestão sigilosa direta para a gerência</span>
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-4">
                  {isSubmitting && <Loader2 className="animate-spin text-primary h-6 w-6" />}
                  <Button variant="ghost" onClick={() => setSelectionPending(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground gap-2">
                    <ArrowLeft className="w-3 h-3" /> Voltar e Editar Mensagem
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitInitial} className="space-y-6">
                <div className="hidden" aria-hidden="true">
                  <input 
                    type="text" 
                    name="website_url" 
                    tabIndex={-1} 
                    value={honeypot} 
                    onChange={(e) => setHoneypot(e.target.value)} 
                  />
                </div>

                <div className="space-y-3 text-center">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sua Nota</label>
                  <div className="flex justify-center gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = star <= (hoverRating || rating);
                      const isSelected = star <= rating;
                      
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={cn(
                            "relative transition-all duration-300 focus:outline-none p-1",
                            isActive ? "scale-110" : "scale-100 opacity-40",
                            isSelected ? "scale-110 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" : "hover:scale-125",
                            "active:scale-150 transition-transform"
                          )}
                        >
                          <Star 
                            className={cn(
                              "w-10 h-10 transition-colors duration-300",
                              isActive ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'
                            )} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seu Nome</label>
                    <Input 
                      placeholder="Ex: João Silva" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                      className="h-11 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail (opcional)</label>
                    <Input 
                      type="email"
                      placeholder="Ex: joao@email.com" 
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="h-11 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sua Mensagem</label>
                  <Textarea 
                    placeholder="Conte-nos o que achou da nossa empresa..."
                    className="min-h-[120px] resize-none bg-background"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                  />
                </div>

                <div className="p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 text-center space-y-2 cursor-pointer hover:bg-primary/10 transition-colors group">
                  <Video className="w-6 h-6 text-primary mx-auto group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-primary">Gravar Depoimento em Vídeo</p>
                  <p className="text-[10px] text-muted-foreground">(Funcionalidade VIP - Em breve)</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold shadow-xl transition-all hover:translate-y-[-2px] active:translate-y-0"
                >
                  <><Send className="mr-2 w-5 h-5" /> Revisar e Enviar</>
                </Button>

                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-40">
                  🔒 Conexão Segura Proova Antispam
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
