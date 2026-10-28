'use client';

import { useState, use, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Star, CheckCircle2, MessageSquare, Loader2, Send, Video, Search, MapPin, Shield, ArrowLeft, Globe, Copy, X, Camera, Square, RefreshCcw, SwitchCamera, FlipHorizontal, Gem } from 'lucide-react';
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
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} parado.`);
      });
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  };

  const startCamera = async (mode?: 'user' | 'environment') => {
    const currentMode = mode || facingMode;
    stopCamera();
    
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      const constraints = {
        video: {
          facingMode: currentMode,
          width: { ideal: 3840, min: 1280 }, 
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Falha ao iniciar câmera com 4K, tentando modo básico:", err.name);
      
      try {
        const simpleConstraints = { 
          video: { facingMode: currentMode }, 
          audio: true 
        };
        const stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
        streamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (secondErr) {
        console.error("Erro crítico ao acessar câmera:", secondErr);
        toast({ 
          variant: "destructive", 
          title: "Câmera Não Detectada", 
          description: "Certifique-se de dar permissão ao navegador ou tente outro dispositivo." 
        });
      }
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
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setRecordedVideoUrl(url);
      console.log("Gravação finalizada e blob gerado.");
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingSeconds(0);
    
    timerRef.current = setInterval(() => {
      setRecordingSeconds(s => {
        if (s >= 29) { 
          handleStopRecording();
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      stopCamera();
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
    
    if (!userName.trim()) {
      toast({ variant: "destructive", title: "Identificação", description: "Por favor, informe seu nome para continuar." });
      return;
    }

    if (!videoBlob && !text.trim()) {
      toast({ variant: "destructive", title: "Mensagem Necessária", description: "Por favor, escreva seu depoimento ou grave um vídeo." });
      return;
    }

    if (videoBlob) {
      // Vídeo é sempre enviado como público (curadoria) automaticamente para reduzir fricção
      handleFinalSubmit('public');
    } else {
      setSelectionPending(true);
    }
  };

  const handleFinalSubmit = async (destination: 'public' | 'private') => {
    if (!targetUserId) return;
    setIsSubmitting(true);
    setFinalDest(destination);

    let finalVideoUrl = '';

    if (videoBlob) {
      try {
        const videoRef = ref(storage, `users/${targetUserId}/testimonials_videos/video_${Date.now()}.webm`);
        await uploadBytes(videoRef, videoBlob);
        finalVideoUrl = await getDownloadURL(videoRef);
      } catch (err) {
        console.error("Falha no upload do vídeo:", err);
      }
    }

    // Se for texto público, tentamos copiar agora. Para vídeo, o convite do Maps aparece na tela de sucesso.
    if (destination === 'public' && !videoBlob) {
      if (googleMapsUrl) handleGoogleRedirect(googleMapsUrl);
      try {
        const textToCopy = text.trim();
        if (textToCopy) {
          await navigator.clipboard.writeText(textToCopy);
          toast({ title: "Feedback Copiado!", description: "Pronto para colar no Google." });
        }
      } catch (err) {}
    }

    const result = await submitTestimonialAction({
      targetUserId,
      destination,
      userName,
      userEmail,
      rating,
      text: text.trim() || "(Depoimento em Vídeo)",
      videoUrl: finalVideoUrl
    });

    if (result.success) {
      setSubmitted(true);
      setIsSubmitting(false);
      setSelectionPending(false);
      toast({
        title: destination === 'public' ? "Enviado com Sucesso!" : "Feedback Enviado Privado",
        description: destination === 'public' ? "Sua avaliação aguarda aprovação interna." : "A gerência recebeu seu feedback sigiloso.",
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
              {videoBlob && <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-3">Depoimento em Vídeo Recebido</p>}
            </div>

            {/* Convite para o Google Maps caso a nota seja alta e a empresa tenha o link configurado */}
            {googleMapsUrl && finalDest === 'public' && rating >= 4 && (
              <div className="pt-6 border-t space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-xs font-bold text-muted-foreground">Que tal nos ajudar ainda mais?</p>
                <Button onClick={() => handleGoogleRedirect(googleMapsUrl)} className="w-full h-14 rounded-xl gap-3 text-sm font-bold bg-[#4285F4] hover:bg-[#357ae8]">
                  <MapPin className="w-5 h-5" /> Avaliar também no Google
                </Button>
                <p className="text-[9px] opacity-60">Sua nota ajuda nossa empresa a brilhar nas buscas!</p>
              </div>
            )}

            <Button variant="ghost" onClick={handleResetForm} className="text-xs">Enviar outro depoimento</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnterprise = membershipStatus === 'enterprise';

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

                <Textarea 
                  placeholder={videoBlob ? "Escreva algo (opcional)" : "Conte-nos o que achou da nossa empresa..."}
                  className="min-h-[120px] resize-none" 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                />

                {isEnterprise && (
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
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Recurso Exclusivo Enterprise</p>
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg font-bold shadow-xl">
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Enviando...</>
                  ) : (
                    <><Send className="mr-2 w-5 h-5" /> Revisar e Enviar</>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Recording Dialog - FULL SCREEN */}
      <Dialog open={isVideoDialogOpen} onOpenChange={(open) => { if (!open) { stopCamera(); setIsVideoDialogOpen(false); } }}>
        <DialogContent className="fixed inset-0 m-0 h-screen w-screen max-w-none rounded-none bg-black border-none p-0 flex flex-col z-[101] translate-x-0 translate-y-0 left-0 top-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Gravação de Depoimento em Vídeo</DialogTitle>
            <DialogDescription>Grave seu depoimento em vídeo de até 30 segundos com qualidade Ultra HD.</DialogDescription>
          </DialogHeader>
          
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {recordedVideoUrl ? (
              <video src={recordedVideoUrl} controls className="w-full h-full object-contain md:object-cover" />
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
            
            {/* OVERLAY CONTROLS */}
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between pointer-events-auto">
                {isRecording ? (
                  <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full animate-pulse text-xs font-black shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-white" /> {new Date(recordingSeconds * 1000).toISOString().substr(14, 5)} / 00:30
                  </div>
                ) : (
                  <div className="bg-black/40 backdrop-blur-md text-white/80 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                    Qualidade 4K UHD
                  </div>
                )}

                <div className="flex gap-2 pointer-events-auto">
                  {!recordedVideoUrl && !isRecording && (
                    <Button variant="ghost" size="icon" className="text-white bg-black/40 hover:bg-black/60 rounded-full h-12 w-12 backdrop-blur-md" onClick={toggleCamera}>
                      <SwitchCamera className="w-6 h-6" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-white bg-black/40 hover:bg-black/60 rounded-full h-12 w-12 backdrop-blur-md" onClick={() => { stopCamera(); setIsVideoDialogOpen(false); }}>
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              {/* BOTTOM ACTION AREA */}
              <div className="flex flex-col items-center gap-8 pointer-events-auto pb-8">
                {!recordedVideoUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    {!isRecording ? (
                      <>
                        <div className="text-center space-y-1 drop-shadow-lg mb-2">
                           <h3 className="text-white font-black uppercase tracking-widest text-sm">Pronto para Gravar</h3>
                           <p className="text-white/60 text-[10px] font-bold">Posicione a câmera e comece seu depoimento.</p>
                        </div>
                        <Button size="lg" className="h-20 w-20 rounded-full bg-white hover:bg-white/90 shadow-2xl p-1 transition-all active:scale-95" onClick={handleStartRecording}>
                          <div className="h-full w-full rounded-full border-4 border-black/10 flex items-center justify-center">
                            <div className="h-6 w-6 bg-red-600 rounded-full" />
                          </div>
                        </Button>
                      </>
                    ) : (
                      <Button size="lg" className="h-20 w-20 rounded-full bg-white hover:bg-white/90 shadow-2xl p-1 transition-all" onClick={handleStopRecording}>
                         <div className="h-full w-full rounded-full border-4 border-black/10 flex items-center justify-center">
                            <Square className="h-6 w-6 fill-red-600 text-red-600" />
                         </div>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-sm space-y-4">
                    <div className="text-center space-y-1 drop-shadow-lg mb-4">
                       <h3 className="text-white font-black uppercase tracking-widest text-sm">Vídeo Capturado!</h3>
                       <p className="text-white/60 text-[10px] font-bold">Revise acima ou grave novamente se preferir.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white/10 text-white border-white/20 backdrop-blur-xl hover:bg-white/20" onClick={handleResetRecording}>
                        <RefreshCcw className="w-4 h-4 mr-2" /> Refazer
                      </Button>
                      <Button className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white text-black hover:bg-white/90 shadow-xl" onClick={() => setIsVideoDialogOpen(false)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Usar Vídeo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
