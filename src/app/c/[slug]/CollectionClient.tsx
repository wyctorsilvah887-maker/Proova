'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Star, CheckCircle2, Loader2, Send, Video, 
  Globe, Camera, ImageIcon, Trash2, Building2, Type, 
  MapPin, X, ArrowRight, MessageCircle
} from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { submitTestimonialAction } from '@/app/actions/testimonial-actions';
import { LoadingScreen } from '@/components/loading-screen';
import { whatsappLink } from '@/lib/whatsapp';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type CollectionMode = 'text' | 'photo' | 'video' | null;

export default function CollectionClient({ slug }: { slug: string }) {
  const db = useFirestore();
  const storage = useStorage();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0); 
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string | null>(null);
  const [companyNameDisplay, setCompanyNameDisplay] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; collection: string } | null>(null);
  const [followContact, setFollowContact] = useState('');
  const [followState, setFollowState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<CollectionMode>(null);
  const [mediaConsent, setMediaConsent] = useState(false);
  const [publishConsent, setPublishConsent] = useState(false);
  
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordedPhotoUrl, setRecordedPhotoUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  
  const [isPhotoChoiceOpen, setIsPhotoChoiceOpen] = useState(false);
  
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryPhotoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [honeypot, setHoneypot] = useState('');
  const [loadTime] = useState(Date.now());

  useEffect(() => {
    async function findCompany() {
      if (!db || !slug) return;
      try {
        setIsLoadingCompany(true);
        const decodedSlug = decodeURIComponent(slug).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const usersRef = collection(db, 'users');
        const q1 = query(usersRef, where('companySlug', '==', decodedSlug), limit(1));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          const data = snap1.docs[0].data();
          setTargetUserId(snap1.docs[0].id);
          setCompanyNameDisplay(data.companyName);
          setGoogleMapsUrl(data.googleMapsUrl || null);
          setContactWhatsapp(data.contactWhatsapp || null);
          setMembershipStatus(data.membershipStatus || 'lead');
        }
      } catch (err) {
        console.error("Erro ao localizar empresa:", err);
      } finally {
        setIsLoadingCompany(false);
      }
    }
    findCompany();
  }, [db, slug]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoBlob(file);
      setRecordedPhotoUrl(URL.createObjectURL(file));
      setRecordedVideoUrl(null);
      setVideoBlob(null);
      setIsPhotoChoiceOpen(false);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoBlob(file);
      setRecordedVideoUrl(URL.createObjectURL(file));
      setRecordedPhotoUrl(null);
      setPhotoBlob(null);
    }
  };

  const googleClickSent = useRef(false);
  const handleGoogleRedirect = () => {
    // Conta no máximo 1 encaminhamento por envio; falha de rede não impede a abertura do Google.
    if (!googleClickSent.current && targetUserId) {
      googleClickSent.current = true;
      try {
        fetch('/api/google-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }
    if (googleMapsUrl) window.open(googleMapsUrl, '_blank', 'noopener');
  };

  const handleSendContact = async () => {
    if (!created || !targetUserId || !followContact.trim() || followState !== 'idle') return;
    setFollowState('sending');
    try {
      const res = await fetch('/api/feedback-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, testimonialId: created.id, collection: created.collection, contact: followContact.trim() }),
      });
      if (res.ok) { setFollowState('sent'); return; }
      const data = await res.json().catch(() => ({}));
      toast({ variant: "destructive", title: data?.error === 'invalid_contact' ? "Contato inválido" : "Não foi possível enviar", description: data?.error === 'invalid_contact' ? "Informe um e-mail ou um WhatsApp com DDD." : "Tente novamente em instantes." });
    } catch {
      toast({ variant: "destructive", title: "Não foi possível enviar", description: "Verifique sua conexão." });
    }
    setFollowState('idle');
  };

  const handleFinalSubmit = async () => {
    if (honeypot || Date.now() - loadTime < 2000) return;
    
    if (rating === 0) { 
      toast({ 
        variant: "destructive", 
        title: "Nota Obrigatória", 
        description: "Por favor, selecione de 1 a 5 estrelas antes de enviar." 
      }); 
      return; 
    }
    
    if (!publishConsent) { toast({ variant: "destructive", title: "Autorização necessária", description: "Marque a autorização para a publicação do seu depoimento." }); return; }
    if ((videoBlob || photoBlob) && !mediaConsent) { toast({ variant: "destructive", title: "Autorização necessária", description: "Confirme a autorização de uso da foto/vídeo." }); return; }
    
    if (!targetUserId) return;
    setIsSubmitting(true);
    
    let finalVideoUrl = '';
    let finalPhotoUrl = '';

    try {
      if (videoBlob) {
        const videoRef = ref(storage, `users/${targetUserId}/testimonials_videos/video_${Date.now()}.webm`);
        await uploadBytes(videoRef, videoBlob, { contentType: videoBlob.type });
        finalVideoUrl = await getDownloadURL(videoRef);
      }

      if (photoBlob) {
        const photoRef = ref(storage, `users/${targetUserId}/testimonials_photos/photo_${Date.now()}.jpg`);
        await uploadBytes(photoRef, photoBlob, { contentType: photoBlob.type });
        finalPhotoUrl = await getDownloadURL(photoRef);
      }
    } catch (err: any) {
      console.error("Erro no upload de mídia:", err);
      toast({ variant: "destructive", title: "Erro na Mídia", description: "Verifique sua conexão ou tente novamente." });
      setIsSubmitting(false);
      return;
    }

    const result = await submitTestimonialAction({
      targetUserId, 
      destination: 'public',
      userName: userName.trim() || 'Cliente', 
      userEmail: userEmail.trim(), 
      rating, 
      text: text.trim(), 
      videoUrl: finalVideoUrl,
      photoUrl: finalPhotoUrl,
      publishConsent: true,
      mediaConsent: !!(videoBlob || photoBlob) && mediaConsent
    });

    if (result.success) {
      if ((result as any).id) setCreated({ id: (result as any).id, collection: (result as any).collection });
      setSubmitted(true);
      setIsSubmitting(false);
    } else {
      toast({ variant: "destructive", title: "Falha no Envio", description: result.error });
      setIsSubmitting(false);
    }
  };

  if (isLoadingCompany) return <LoadingScreen />;
  if (!targetUserId) return <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30"><Card className="max-w-md w-full p-10 text-center shadow-xl rounded-[2.5rem]"><Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h2 className="text-xl font-bold">Empresa não encontrada</h2></Card></div>;

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 px-4 font-body py-12">
        <div className="fixed top-4 right-4">
          <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent focus:bg-transparent" />
        </div>
        <Card className="w-full max-w-md text-center shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-card flex-1 sm:flex-initial">
          <div className="h-2 bg-primary w-full" />
          <CardContent className="pt-12 pb-12 px-8 space-y-8">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-5 rounded-full w-fit animate-in zoom-in duration-500">
              <CheckCircle2 className="w-14 h-14 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black font-headline tracking-tighter">Muito Obrigado!</h2>
              <p className="text-muted-foreground text-sm font-medium">Sua opinião sobre <b>{companyNameDisplay}</b> foi enviada com sucesso.</p>
            </div>
            {rating > 0 && rating <= 3 && (contactWhatsapp || created) && (
              <div className="pt-8 border-t space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Quer resolver isso direto com a clínica?</p>
                {contactWhatsapp && (
                  <Button
                    onClick={() => window.open(whatsappLink(contactWhatsapp, `Olá! Acabei de enviar uma avaliação sobre ${companyNameDisplay} e gostaria de conversar.`), '_blank', 'noopener')}
                    className="w-full h-14 rounded-2xl gap-3 text-sm font-bold bg-[#25D366] hover:bg-[#1fb857] text-white"
                  >
                    <MessageCircle className="w-5 h-5" /> Falar com a clínica no WhatsApp
                  </Button>
                )}
                {created && (followState === 'sent' ? (
                  <p className="text-center text-xs font-bold text-green-600">Contato enviado. A clínica vai retornar assim que possível.</p>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">
                      {contactWhatsapp ? 'Ou prefere que a clínica entre em contato? (opcional)' : 'Quer que a clínica entre em contato? (opcional)'}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Seu WhatsApp ou e-mail"
                        value={followContact}
                        onChange={(e) => setFollowContact(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendContact()}
                        className="h-12 rounded-xl bg-muted/20 border-transparent font-bold"
                      />
                      <Button onClick={handleSendContact} disabled={!followContact.trim() || followState === 'sending'} className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shrink-0">
                        {followState === 'sending' ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enviar'}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium ml-1 leading-snug">Usado apenas para a clínica retornar sobre este atendimento.</p>
                  </div>
                ))}
              </div>
            )}
            {googleMapsUrl && (
              <div className="pt-8 border-t space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Quer compartilhar sua experiência também no Google? (opcional)</p>
                <Button onClick={handleGoogleRedirect} className="w-full h-14 rounded-2xl gap-3 text-sm font-bold bg-[#4285F4] hover:bg-[#357ae8] shadow-lg transition-all active:scale-95">
                  <MapPin className="w-5 h-5" /> Avaliar também no Google
                </Button>
              </div>
            )}
            <Button variant="ghost" onClick={() => { setSubmitted(false); setRecordedVideoUrl(null); setRecordedPhotoUrl(null); setActiveMode(null); setRating(0); setUserName(''); setText(''); setUserEmail(''); setCreated(null); setFollowContact(''); setFollowState('idle'); setMediaConsent(false); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">Enviar outro depoimento</Button>
          </CardContent>
        </Card>
        
        <footer className="mt-12 text-center space-y-4">
           <div className="opacity-40">
              <div className="relative w-[180px] h-[60px] mx-auto mb-2">
                 <Image src="/logo-proovaai-whitemode.png" alt="Proova AI" fill sizes="180px" className="object-contain dark:hidden" />
                 <Image src="/logo-proovaai-darkmode.png" alt="Proova AI" fill sizes="180px" className="object-contain hidden dark:block" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">© 2026 Proova Technology</p>
           </div>
           <Link href="/" className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-primary hover:underline transition-all">
              Conheça o Proova AI <ArrowRight className="w-2.5 h-2.5" />
           </Link>
        </footer>
      </div>
    );
  }

  const isEnterprise = membershipStatus === 'enterprise' || membershipStatus === 'trial';
  const hasMedia = !!recordedPhotoUrl || !!recordedVideoUrl;
  const shouldShowForm = rating > 0 || activeMode === 'text' || hasMedia;
  
  const isFormValid = rating > 0 && publishConsent && (!hasMedia || mediaConsent);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center p-4 font-body text-foreground overflow-x-hidden">
      <div className="fixed top-4 right-4 z-[50]">
        <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent focus:bg-transparent" />
      </div>
      
      <input type="file" ref={cameraPhotoInputRef} accept="image/*" capture="environment" className="sr-only" onChange={handlePhotoSelect} />
      <input type="file" ref={galleryPhotoInputRef} accept="image/*" className="sr-only" onChange={handlePhotoSelect} />
      <input type="file" ref={videoInputRef} accept="video/*" capture="user" className="sr-only" onChange={handleVideoSelect} />

      <div className="w-full max-w-xl flex-1 flex flex-col justify-start py-10 md:py-20 space-y-8">
        <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="mx-auto w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
             <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tighter">{companyNameDisplay}</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium px-4">Como foi sua experiência com a gente?</p>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                type="button" 
                onClick={() => { setRating(star); if (!activeMode) setActiveMode('text'); }} 
                onMouseEnter={() => setHoverRating(star)} 
                onMouseLeave={() => setHoverRating(0)} 
                className="p-1 transition-all active:scale-150 transform hover:scale-110"
              >
                <Star className={cn("w-10 h-10 md:w-12 md:h-12 transition-colors", (star <= (hoverRating || rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
              </button>
            ))}
          </div>

          <div className={cn("grid gap-3", isEnterprise ? "grid-cols-3" : "grid-cols-2")}>
            {[
              { id: 'text', label: 'Texto', icon: Type, onClick: () => setActiveMode('text') },
              { id: 'photo', label: 'Foto', icon: Camera, premium: false, onClick: () => setIsPhotoChoiceOpen(true) },
              { id: 'video', label: 'Vídeo', icon: Video, premium: true, onClick: () => videoInputRef.current?.click() },
            ].filter((opt) => !(opt.premium && !isEnterprise)).map((opt) => {
              const isLocked = false;
              return (
                <button
                  key={opt.id}
                  disabled={isLocked}
                  onClick={opt.onClick}
                  className={cn(
                    "h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all active:scale-95 group",
                    activeMode === opt.id 
                      ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                      : "bg-background border-primary/10 hover:border-primary/30",
                    isLocked && "opacity-40 grayscale cursor-not-allowed border-dashed"
                  )}
                >
                  <opt.icon className={cn("w-6 h-6", activeMode === opt.id ? "text-white" : "text-primary")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {shouldShowForm && (
          <Card className="shadow-2xl border-none overflow-hidden bg-card rounded-[2.5rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-1.5 bg-primary w-full" />
            <CardContent className="px-6 md:px-10 py-10 space-y-8">
              <form className="space-y-6">
                <div className="hidden"><input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></div>

                {(recordedVideoUrl || recordedPhotoUrl) && (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 bg-muted/10 group animate-in zoom-in duration-300">
                    <div className="aspect-video">
                        {recordedVideoUrl ? (
                          <video src={recordedVideoUrl} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={recordedPhotoUrl!} className="w-full h-full object-cover" alt="Prévia" />
                        )}
                    </div>
                    <div className="absolute top-3 right-3">
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8 rounded-full shadow-lg"
                          onClick={() => { setRecordedVideoUrl(null); setVideoBlob(null); setRecordedPhotoUrl(null); setPhotoBlob(null); setActiveMode(null); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">Seu primeiro nome (opcional)</Label>
                    <Input placeholder="Como podemos te chamar?" autoComplete="given-name" value={userName} onChange={(e) => setUserName(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">E-mail (opcional)</Label>
                    <Input type="email" placeholder="seu@email.com" autoComplete="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold" />
                    <p className="text-[10px] text-muted-foreground font-medium ml-1 leading-snug">Se informar, a clínica poderá entrar em contato com você. Você pode pedir a remoção a qualquer momento.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">Sua Experiência (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['Atendimento', 'Gostei muito do atendimento. '],
                      ['Pontualidade', 'Fui atendido(a) no horário. '],
                      ['Resultado', 'Fiquei satisfeito(a) com o resultado. '],
                      ['Ambiente', 'O ambiente é muito agradável. '],
                    ].map(([label, phrase]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setText((t) => (t.includes(phrase.trim()) ? t : t + phrase))}
                        className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors"
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
                  <Textarea placeholder="O que você mais gostou no atendimento de hoje?" className="min-h-[120px] rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm leading-relaxed p-4" value={text} onChange={(e) => setText(e.target.value)} />
                </div>

                {hasMedia && (
                  <label className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 cursor-pointer">
                    <input type="checkbox" checked={mediaConsent} onChange={(e) => setMediaConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
                    <span className="text-[11px] font-medium leading-snug">Autorizo o uso da minha {recordedVideoUrl ? 'imagem e voz (vídeo)' : 'imagem (foto)'} na divulgação de {companyNameDisplay}.</span>
                  </label>
                )}

                <label className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 cursor-pointer">
                  <input type="checkbox" checked={publishConsent} onChange={(e) => setPublishConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
                  <span className="text-[11px] font-medium leading-snug">
                    Autorizo {companyNameDisplay} a publicar meu depoimento e meu nome em seu site, redes sociais e materiais de divulgação. Posso pedir a remoção a qualquer momento falando com {companyNameDisplay}. Veja a <Link href="/privacy" target="_blank" className="underline hover:text-primary">Política de Privacidade</Link>.
                  </span>
                </label>

                <Button 
                  type="button" 
                  onClick={handleFinalSubmit} 
                  disabled={!isFormValid || isSubmitting} 
                  className={cn(
                    "w-full h-16 text-base font-black uppercase tracking-widest shadow-2xl rounded-2xl transition-all active:scale-95 gap-3",
                    isFormValid 
                      ? "bg-primary hover:bg-primary/90 text-white animate-in fade-in zoom-in duration-300 shadow-primary/20" 
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                >
                    {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="w-5 h-5" />} Enviar Depoimento
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        
        <footer className="text-center space-y-6 pt-10 animate-in fade-in duration-1000 delay-500 pb-10">
           <div className="flex flex-col items-center gap-4">
              <div className="relative w-[180px] h-[60px] opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <Image src="/logo-proovaai-whitemode.png" alt="Proova AI" fill sizes="180px" className="object-contain dark:hidden" />
                <Image src="/logo-proovaai-darkmode.png" alt="Proova AI" fill sizes="180px" className="object-contain hidden dark:block" />
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
                  <span>Segurança de Dados</span>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  <span>Proova Technology</span>
                </div>
                <Link href="/" className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-primary hover:underline transition-all">
                   Conheça o Proova AI <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
           </div>
        </footer>
      </div>

      <Dialog open={isPhotoChoiceOpen} onOpenChange={setIsPhotoChoiceOpen}>
        <DialogContent className="rounded-[2.5rem] w-[90vw] max-w-sm border-none shadow-2xl p-8 bg-background z-[101]">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Captura de Foto</DialogTitle>
            <DialogDescription className="text-xs font-medium">Como você deseja adicionar sua foto?</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 pt-6">
            <Button 
              className="h-16 rounded-2xl gap-3 font-black uppercase tracking-widest shadow-xl text-[11px]"
              onClick={() => {
                cameraPhotoInputRef.current?.click();
              }}
            >
              <Camera className="w-5 h-5" /> Tirar Foto Agora
            </Button>
            <Button 
              variant="outline"
              className="h-16 rounded-2xl gap-3 font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 text-[11px]"
              onClick={() => {
                galleryPhotoInputRef.current?.click();
              }}
            >
              <ImageIcon className="w-5 h-5" /> Escolher da Galeria
            </Button>
            <Button 
              variant="ghost"
              className="mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
              onClick={() => { setIsPhotoChoiceOpen(false); }}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

