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
  MapPin, X, ArrowRight
} from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { submitTestimonialAction } from '@/app/actions/testimonial-actions';
import { LoadingScreen } from '@/components/loading-screen';
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
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<CollectionMode>(null);
  
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
    
    if (!userName.trim()) { toast({ variant: "destructive", title: "Nome Obrigatório" }); return; }
    if (!text.trim()) { toast({ variant: "destructive", title: "Relato Obrigatório" }); return; }
    
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
      userName, 
      userEmail: userEmail.trim(), 
      rating, 
      text: text.trim(), 
      videoUrl: finalVideoUrl,
      photoUrl: finalPhotoUrl
    });

    if (result.success) {
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
            {googleMapsUrl && rating >= 4 && (
              <div className="pt-8 border-t space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Sua voz vale muito!</p>
                <Button onClick={() => window.open(googleMapsUrl, '_blank')} className="w-full h-14 rounded-2xl gap-3 text-sm font-bold bg-[#4285F4] hover:bg-[#357ae8] shadow-lg transition-all active:scale-95">
                  <MapPin className="w-5 h-5" /> Avaliar também no Google
                </Button>
              </div>
            )}
            <Button variant="ghost" onClick={() => { setSubmitted(false); setRecordedVideoUrl(null); setRecordedPhotoUrl(null); setActiveMode(null); setRating(0); setUserName(''); setText(''); setUserEmail(''); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">Enviar outro depoimento</Button>
          </CardContent>
        </Card>
        
        <footer className="mt-12 text-center space-y-4">
           <div className="opacity-40">
              <div className="relative w-[180px] h-[60px] mx-auto mb-2">
                 <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain dark:hidden" priority unoptimized />
                 <Image src="/logo-proova-dark-mode.gif" alt="Logo Footer" fill className="object-contain hidden dark:block" priority unoptimized />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">© 2026 Proova Technology</p>
           </div>
           <Link href="/dash" className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-primary hover:underline transition-all">
              Usar o Proova no meu negócio <ArrowRight className="w-2.5 h-2.5" />
           </Link>
        </footer>
      </div>
    );
  }

  const isEnterprise = membershipStatus === 'enterprise' || membershipStatus === 'trial';
  const hasMedia = !!recordedPhotoUrl || !!recordedVideoUrl;
  const shouldShowForm = activeMode === 'text' || hasMedia;
  
  const isFormValid = userName.trim() !== '' && text.trim() !== '';

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center p-4 font-body text-foreground overflow-x-hidden">
      <div className="fixed top-4 right-4 z-[50]">
        <ThemeToggle className="border-none bg-transparent shadow-none hover:bg-transparent focus:bg-transparent" />
      </div>
      
      <input type="file" ref={cameraPhotoInputRef} accept="image/*" capture="environment" className="sr-only" onChange={handlePhotoSelect} />
      <input type="file" ref={galleryPhotoInputRef} accept="image/*" className="sr-only" onChange={handlePhotoSelect} />
      <input type="file" ref={videoInputRef} accept="video/*" capture="environment" className="sr-only" onChange={handleVideoSelect} />

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
                onClick={() => setRating(star)} 
                onMouseEnter={() => setHoverRating(star)} 
                onMouseLeave={() => setHoverRating(0)} 
                className="p-1 transition-all active:scale-150 transform hover:scale-110"
              >
                <Star className={cn("w-10 h-10 md:w-12 md:h-12 transition-colors", (star <= (hoverRating || rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'text', label: 'Texto', icon: Type, onClick: () => setActiveMode('text') },
              { id: 'photo', label: 'Foto', icon: Camera, premium: false, onClick: () => setIsPhotoChoiceOpen(true) },
              { id: 'video', label: 'Vídeo', icon: Video, premium: true, onClick: () => videoInputRef.current?.click() },
            ].map((opt) => {
              const isLocked = opt.premium && !isEnterprise;
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
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">Seu nome</Label>
                    <Input placeholder="Seu nome aqui" value={userName} onChange={(e) => setUserName(e.target.value)} required className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">E-mail (Opcional)</Label>
                    <Input type="email" placeholder="Receba promos e ofertas especiais por email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">Sua Experiência</Label>
                  <Textarea placeholder="O que você mais gostou no atendimento de hoje?" className="min-h-[120px] rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm leading-relaxed p-4" value={text} onChange={(e) => setText(e.target.value)} />
                </div>

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
                <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain dark:hidden" priority unoptimized />
                <Image src="/logo-proova-dark-mode.gif" alt="Logo Footer" fill className="object-contain hidden dark:block" priority unoptimized />
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
                  <span>Segurança de Dados</span>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  <span>Proova Technology</span>
                </div>
                <Link href="/dash" className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-primary hover:underline transition-all">
                   Criar minha máquina de depoimentos <ArrowRight className="w-2.5 h-2.5" />
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
