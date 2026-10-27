'use client';

import { useState, use, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Star, CheckCircle2, MessageSquare, Loader2, Send, Video, Search, MapPin, Shield, ArrowLeft, Globe, Copy, X, Camera, Square, RefreshCcw, FlipHorizontal } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { submitTestimonialAction } from '@/app/actions/testimonial-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = use(params);
  const db = useFirestore();
  const storage = useStorage();

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
  
  // Video Recording State
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      } catch (err) {
        console.error("Erro ao localizar empresa:", err);
      } finally {
        setIsLoadingCompany(false);
      }
    }
    
    findCompany();
  }, [db, rawSlug]);

  // Video Logic
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode?: 'user' | 'environment') => {
    const currentMode = mode || facingMode;
    stopCamera();
    
    try {
      const constraints = {
        video: {
          facingMode: currentMode,
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30 }
        },
        audio: true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      toast({ variant: "destructive", title: "Câmera Não Detectada", description: "Certifique-se de dar permissão ao navegador." });
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (!recordedVideoUrl) {
      startCamera(newMode);
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current) return;
    
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }

    const mediaRecorder = new MediaRecorder(streamRef.current, options);
    mediaRecorderRef.current = mediaRecorder;
    
    const chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
      setRecordedVideoUrl(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingSeconds(0);
    
    timerRef.current = setInterval(() => {
      setRecordingSeconds(s => {
        if (s >= 29) { // Limite de 30 segundos
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            handleStopRecording();
          }
          return 30;
        }
        return s + 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleResetRecording = () => {
    setVideoBlob(null);
    setRecordedVideoUrl(null);
    setRecordingSeconds(0);
    startCamera();
  };

  const handleGoogleRedirect = (url: string) => {
    if (!url) return;
    if (db && targetUserId) {
      const userRef = doc(db, 'users', targetUserId);
      updateDoc(userRef, { googleRedirectCount: increment(1) }).catch(err => console.error(err));
    }
    let finalUrl = url.trim();
    const utmParams = 'utm_source=proova&utm_medium=testimonial_success&utm_campaign=google_maps_boost';
    finalUrl += finalUrl.includes('?') ? `&${utmParams}` : `?${utmParams}`;
    const secureUrl = finalUrl.startsWith('http') ? finalUrl : `https://${finalUrl}`;
    window.open(secureUrl, '_blank');
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
    setVideoBlob(null);
    setRecordedVideoUrl(null);
    setRecordingSeconds(0);
  };

  const handleSubmitInitial = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (Date.now() - loadTime < 3000) {
      toast({ variant: "destructive", title: "Calma aí!", description: "Você está enviando rápido demais." });
      return;
    }
    if (rating === 0) {
      toast({ variant: "destructive", title: "Nota Obrigatória", description: "Selecione uma nota de 1 a 5 estrelas." });
      return;
    }
    if (!userName.trim() || !text.trim()) return;
    setSelectionPending(true);
  };

  const handleFinalSubmit = async (destination: 'public' | 'private') => {
    if (!targetUserId) return;
    setIsSubmitting(true);
    setFinalDest(destination);

    let finalVideoUrl = '';

    // Upload do Vídeo se existir
    if (videoBlob) {
      try {
        const videoRef = ref(storage, `users/${targetUserId}/testimonials_videos/video_${Date.now()}.webm`);
        await uploadBytes(videoRef, videoBlob);
        finalVideoUrl = await getDownloadURL(videoRef);
      } catch (err) {
        console.error("Falha no upload do vídeo:", err);
      }
    }

    if (destination === 'public') {
      if (googleMapsUrl) handleGoogleRedirect(googleMapsUrl);
      try {
        await navigator.clipboard.writeText(text.trim());
        toast({ title: "Elogio Copiado!", description: "Pronto para colar no Google." });
      } catch (err) {}
    }

    const result = await submitTestimonialAction({
      targetUserId,
      destination,
      userName,
      userEmail,
      rating,
      text,
      videoUrl: finalVideoUrl
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
      toast({ variant: "destructive", title: "Falha no Envio", description: result.error || "Erro ao processar depoimento." });
      setIsSubmitting(false);
    }
  };

  if (isLoadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-body">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
      </div>
    );
  }

  if (!targetUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-body">
        <Card className="w-full max-w-md text-center shadow-xl border-none">
          <CardContent className="pt-10 pb-10 space-y-6">
            <Search className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Empresa Não Encontrada</h2>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Voltar ao Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-body text-foreground">
        <div className="fixed top-8 right-8"><ThemeToggle /></div>
        <Card className="w-full max-w-md text-center shadow-2xl border-none">
          <CardContent className="pt-10 pb-10 space-y-8">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline">Obrigado!</h2>
              <p className="text-muted-foreground">Sua avaliação foi enviada para {companyNameDisplay}.</p>
            </div>
            {googleMapsUrl && finalDest === 'public' && (
              <div className="pt-6 border-t space-y-4">
                <Button onClick={() => handleGoogleRedirect(googleMapsUrl)} className="w-full h-14 rounded-xl gap-3 text-sm font-bold bg-[#4285F4] hover:bg-[#357ae8]">
                  <MapPin className="w-5 h-5" /> Abrir Google Maps (Colar)
                </Button>
              </div>
            )}
            <Button variant="ghost" onClick={handleResetForm} className="text-xs">Enviar outro depoimento</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 font-body text-foreground">
      <div className="fixed top-8 right-8"><ThemeToggle /></div>
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">{companyNameDisplay}</h1>
          <p className="text-muted-foreground">Gostaríamos de ouvir sua opinião sobre nossos serviços.</p>
        </div>

        <Card className="shadow-2xl border-none overflow-hidden bg-card">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" /> Deixe seu Depoimento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-10">
            {selectionPending ? (
              <div className="space-y-8 animate-in fade-in zoom-in duration-500 py-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black font-headline">Como deseja prosseguir?</h3>
                  <p className="text-sm text-muted-foreground font-medium">Escolha como quer compartilhar sua experiênica.</p>
                </div>
                
                <div className="grid gap-4">
                  <Button disabled={isSubmitting} onClick={() => handleFinalSubmit('public')} className="h-auto min-h-24 py-5 rounded-2xl flex flex-col gap-1 bg-[#4285F4] hover:bg-[#357ae8]">
                    <div className="flex items-center gap-2"><Globe className="w-5 h-5" /><span className="font-bold text-lg">Público no Google & Site</span></div>
                    <span className="text-[9px] opacity-70 uppercase font-black tracking-widest text-center">Aumente nossa autoridade local</span>
                  </Button>
                  
                  <Button disabled={isSubmitting} variant="outline" onClick={() => handleFinalSubmit('private')} className="h-auto min-h-24 py-5 rounded-2xl flex flex-col gap-1 border-primary/20 text-primary">
                    <div className="flex items-center gap-2"><Shield className="w-5 h-5" /><span className="font-bold text-lg">Privado para a Empresa</span></div>
                    <span className="text-[9px] opacity-70 uppercase font-black tracking-widest text-center">Sugestão sigilosa direta para a gerência</span>
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-4">
                  {isSubmitting && <Loader2 className="animate-spin text-primary h-6 w-6" />}
                  <Button variant="ghost" onClick={() => setSelectionPending(false)} className="text-[10px] font-black uppercase tracking-widest gap-2">
                    <ArrowLeft className="w-3 h-3" /> Voltar e Editar
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitInitial} className="space-y-6">
                <div className="hidden"><input type="text" name="website_url" tabIndex={-1} value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></div>

                <div className="space-y-3 text-center">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sua Nota</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="focus:outline-none p-1 transition-transform active:scale-150">
                        <Star className={cn("w-10 h-10 transition-colors", (star <= (hoverRating || rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40')} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input placeholder="Seu Nome" value={userName} onChange={(e) => setUserName(e.target.value)} required className="h-11" />
                  <Input type="email" placeholder="E-mail (opcional)" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="h-11" />
                </div>

                <Textarea placeholder="Conte-nos o que achou da nossa empresa..." className="min-h-[120px] resize-none" value={text} onChange={(e) => setText(e.target.value)} required />

                <div 
                  onClick={() => { setIsVideoDialogOpen(true); startCamera(); }}
                  className={cn(
                    "p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 group",
                    videoBlob ? "border-green-500 bg-green-50" : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <Video className={cn("w-6 h-6 mx-auto", videoBlob ? "text-green-600" : "text-primary")} />
                  <p className={cn("text-xs font-semibold", videoBlob ? "text-green-700" : "text-primary")}>
                    {videoBlob ? "Vídeo Gravado com Sucesso!" : "Gravar Depoimento em Vídeo 4K"}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Máxima qualidade para nossa vitrine</p>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-bold shadow-xl">
                  <><Send className="mr-2 w-5 h-5" /> Revisar e Enviar</>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Recording Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={(open) => { if (!open) { stopCamera(); setIsVideoDialogOpen(false); } }}>
        <DialogContent className="sm:max-w-2xl bg-black border-none rounded-[2rem] overflow-hidden p-0">
          <div className="relative aspect-video bg-muted flex items-center justify-center">
            {recordedVideoUrl ? (
              <video src={recordedVideoUrl} controls className="w-full h-full object-cover" />
            ) : (
              <video 
                ref={videoPreviewRef} 
                autoPlay 
                muted 
                playsInline 
                className={cn(
                  "w-full h-full object-cover",
                  facingMode === 'user' && "scale-x-[-1]"
                )} 
              />
            )}
            
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full animate-pulse text-xs font-bold">
                <div className="w-2 h-2 rounded-full bg-white" /> GRAVANDO {new Date(recordingSeconds * 1000).toISOString().substr(14, 5)} / 00:30
              </div>
            )}

            {!recordedVideoUrl && (
              <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="ghost" size="icon" className="text-white bg-black/40 hover:bg-black/60 rounded-full" onClick={toggleCamera}>
                  <FlipHorizontal className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white bg-black/40 hover:bg-black/60 rounded-full" onClick={() => { stopCamera(); setIsVideoDialogOpen(false); }}>
                  <X className="w-6 h-6" />
                </Button>
              </div>
            )}

            {recordedVideoUrl && (
               <div className="absolute top-4 right-4">
                 <Button variant="ghost" size="icon" className="text-white bg-black/40 hover:bg-black/60 rounded-full" onClick={() => { stopCamera(); setIsVideoDialogOpen(false); }}>
                   <X className="w-6 h-6" />
                 </Button>
               </div>
            )}
          </div>

          <div className="p-6 bg-background flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
              <h3 className="font-bold">Depoimento em Ultra HD</h3>
              <p className="text-xs text-muted-foreground">Mostre seu rosto e conte como foi sua experiência (Máx. 30s).</p>
            </div>

            <div className="flex items-center gap-4">
              {!recordedVideoUrl ? (
                !isRecording ? (
                  <Button size="lg" className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-xl" onClick={handleStartRecording}>
                    <div className="h-6 w-6 bg-white rounded-full" />
                  </Button>
                ) : (
                  <Button size="lg" className="h-16 w-16 rounded-full bg-white hover:bg-muted text-black border-4 border-red-600" onClick={handleStopRecording}>
                    <Square className="h-6 w-6 fill-current" />
                  </Button>
                )
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 rounded-xl font-bold gap-2" onClick={handleResetRecording}>
                    <RefreshCcw className="w-4 h-4" /> Gravar Novamente
                  </Button>
                  <Button className="h-12 rounded-xl font-bold gap-2 px-8" onClick={() => setIsVideoDialogOpen(false)}>
                    <CheckCircle2 className="w-4 h-4" /> Usar Este Vídeo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
