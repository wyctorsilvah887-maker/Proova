'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Star, CheckCircle2, MessageSquare, Loader2, Send, Video, Search, MapPin, 
  Globe, X, Camera, Square, RefreshCcw, SwitchCamera, Play, Clock, ArrowLeft, 
  Shield, ImageIcon, Trash2, Image as ImageIconLucide, Building2
} from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { submitTestimonialAction } from '@/app/actions/testimonial-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingScreen } from '@/components/loading-screen';
import { Badge } from '@/components/ui/badge';

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
  const [selectionPending, setSelectionPending] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string | null>(null);
  const [companyNameDisplay, setCompanyNameDisplay] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [finalDest, setFinalDest] = useState<'public' | 'private' | null>(null);
  
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  
  const [recordedPhotoUrl, setRecordedPhotoUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  };

  const startCamera = async (mode: 'user' | 'environment' = 'user') => {
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 150));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
    } catch (err) {
      toast({ variant: "destructive", title: "Câmera Não Detectada" });
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current) return;
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    const chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
      setRecordedVideoUrl(URL.createObjectURL(blob));
    };
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds(s => s >= 29 ? (handleStopRecording(), 30) : s + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      stopCamera();
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoBlob(file);
      setRecordedPhotoUrl(URL.createObjectURL(file));
      setRecordedVideoUrl(null);
      setVideoBlob(null);
    }
  };

  const handleSubmitInitial = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot || Date.now() - loadTime < 3000) return;
    if (rating === 0) { toast({ variant: "destructive", title: "Nota Obrigatória" }); return; }
    if (!userName.trim()) { toast({ variant: "destructive", title: "Identificação" }); return; }
    if (!videoBlob && !photoBlob && !text.trim()) { toast({ variant: "destructive", title: "Mensagem Necessária" }); return; }
    setSelectionPending(true);
  };

  const handleFinalSubmit = async (destination: 'public' | 'private') => {
    if (!targetUserId) return;
    setIsSubmitting(true);
    setFinalDest(destination);
    
    let finalVideoUrl = '';
    let finalPhotoUrl = '';

    if (videoBlob) {
      try {
        const videoRef = ref(storage, `users/${targetUserId}/testimonials_videos/video_${Date.now()}.webm`);
        await uploadBytes(videoRef, videoBlob, { contentType: 'video/webm' });
        finalVideoUrl = await getDownloadURL(videoRef);
      } catch (err) {
        toast({ variant: "destructive", title: "Erro no Vídeo" });
        setIsSubmitting(false);
        return;
      }
    }

    if (photoBlob) {
      try {
        const photoRef = ref(storage, `users/${targetUserId}/testimonials_photos/photo_${Date.now()}.jpg`);
        await uploadBytes(photoRef, photoBlob, { contentType: 'image/jpeg' });
        finalPhotoUrl = await getDownloadURL(photoRef);
      } catch (err) {
        toast({ variant: "destructive", title: "Erro na Foto" });
        setIsSubmitting(false);
        return;
      }
    }

    const result = await submitTestimonialAction({
      targetUserId, 
      destination, 
      userName, 
      userEmail, 
      rating, 
      text: text.trim(), 
      videoUrl: finalVideoUrl,
      photoUrl: finalPhotoUrl
    });

    if (result.success) {
      setSubmitted(true);
      setIsSubmitting(false);
      setSelectionPending(false);
    } else {
      toast({ variant: "destructive", title: "Falha no Envio" });
      setIsSubmitting(false);
    }
  };

  if (isLoadingCompany) return <LoadingScreen />;
  if (!targetUserId) return <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30"><Card className="max-w-md w-full p-10 text-center shadow-xl rounded-[2.5rem]"><Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h2 className="text-xl font-bold">Empresa não encontrada</h2></Card></div>;

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 px-4 font-body py-12">
        <div className="fixed top-4 right-4"><ThemeToggle /></div>
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
            {googleMapsUrl && (finalDest === 'public' || videoBlob || photoBlob) && rating >= 4 && (
              <div className="pt-8 border-t space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Sua voz vale muito!</p>
                <Button onClick={() => window.open(googleMapsUrl, '_blank')} className="w-full h-14 rounded-2xl gap-3 text-sm font-bold bg-[#4285F4] hover:bg-[#357ae8] shadow-lg transition-all active:scale-95">
                  <MapPin className="w-5 h-5" /> Avaliar também no Google
                </Button>
              </div>
            )}
            <Button variant="ghost" onClick={() => { setSubmitted(false); setRecordedVideoUrl(null); setRecordedPhotoUrl(null); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">Enviar outro depoimento</Button>
          </CardContent>
        </Card>
        
        <footer className="mt-12 text-center opacity-40">
           <div className="relative w-[180px] h-[60px] mx-auto mb-4">
              <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain dark:hidden" priority unoptimized />
              <Image src="/logo-proova-dark-mode.gif" alt="Logo Footer" fill className="object-contain hidden dark:block" priority unoptimized />
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.3em]">© 2026 Proova Technology</p>
        </footer>
      </div>
    );
  }

  const isEnterprise = membershipStatus === 'enterprise';

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center p-4 font-body text-foreground overflow-x-hidden">
      <div className="fixed top-4 right-4 z-[50]"><ThemeToggle /></div>
      
      <div className="w-full max-w-xl flex-1 flex flex-col justify-center py-10 md:py-20 space-y-10">
        <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="mx-auto w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
             <Building2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">{companyNameDisplay}</h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium px-4">Sua opinião é fundamental para mantermos o nosso padrão de excelência.</p>
          </div>
        </header>

        <Card className="shadow-2xl border-none overflow-hidden bg-card rounded-[2.5rem] relative">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="text-center pt-10 pb-4">
            <CardTitle className="text-xl md:text-2xl font-black font-headline tracking-tight flex items-center justify-center gap-3">
              {selectionPending ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <MessageSquare className="w-6 h-6 text-primary" />} 
              {selectionPending ? "Revise seu Relato" : "Deixe sua Avaliação"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-12">
            {selectionPending ? (
              <div className="space-y-8 animate-in fade-in zoom-in duration-500 py-2">
                <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-center text-muted-foreground opacity-60">Prévia do Depoimento:</p>
                  <Card className="bg-muted/30 border-2 border-primary/10 rounded-[2rem] overflow-hidden shadow-inner">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg">{userName?.substring(0, 2).toUpperCase()}</div>
                          <div>
                            <p className="font-black text-xs uppercase tracking-tight">{userName}</p>
                            <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />)}</div>
                          </div>
                        </div>
                      </div>

                      {(recordedVideoUrl || recordedPhotoUrl) && (
                        <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-xl ring-1 ring-white/10">
                          {recordedVideoUrl ? (
                            <video src={recordedVideoUrl} className="w-full h-full object-cover" muted autoPlay loop />
                          ) : (
                            <img src={recordedPhotoUrl!} className="w-full h-full object-cover" alt="Depoimento" />
                          )}
                        </div>
                      )}

                      {text && <p className="text-sm italic leading-relaxed text-foreground font-medium">"{text}"</p>}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid gap-4">
                  <Button disabled={isSubmitting} onClick={() => handleFinalSubmit('public')} className="h-auto min-h-[5rem] py-6 rounded-2xl flex flex-col gap-1.5 bg-[#4285F4] hover:bg-[#357ae8] shadow-lg transition-all active:scale-95 group">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-black text-base uppercase tracking-tight">Publicar Depoimento</span>
                    </div>
                    <span className="text-[9px] opacity-70 uppercase font-black tracking-widest">Injetar autoridade imediata na marca</span>
                  </Button>
                  <Button disabled={isSubmitting} variant="outline" onClick={() => handleFinalSubmit('private')} className="h-auto min-h-[5rem] py-6 rounded-2xl flex flex-col gap-1.5 border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95 group">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-black text-base uppercase tracking-tight">Feedback Privado</span>
                    </div>
                    <span className="text-[9px] opacity-70 uppercase font-black tracking-widest">Sugestão ou crítica direta para a gerência</span>
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setSelectionPending(false)} className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"><ArrowLeft className="w-3 h-3 mr-2" /> Voltar e Editar</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInitial} className="space-y-8">
                <div className="hidden"><input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></div>
                
                <div className="space-y-4 text-center">
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="p-1 transition-all active:scale-150 transform hover:scale-110">
                        <Star className={cn("w-10 h-10 md:w-12 md:h-12 transition-colors", (star <= (hoverRating || rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Toque nas estrelas para avaliar</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">Seu Nome</Label>
                    <Input placeholder="Como você quer ser identificado" value={userName} onChange={(e) => setUserName(e.target.value)} required className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">E-mail (Opcional)</Label>
                    <Input type="email" placeholder="Para receber um agradecimento" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-transparent focus:ring-primary/20 font-bold" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60">Sua Experiência</Label>
                  <Textarea placeholder="O que você mais gostou no atendimento de hoje?" className="min-h-[140px] rounded-2xl bg-muted/20 border-transparent focus:ring-primary/20 font-medium text-sm leading-relaxed p-4" value={text} onChange={(e) => setText(e.target.value)} />
                </div>

                {isEnterprise && (
                  <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 opacity-60 flex items-center gap-2">Adicionar Mídia <Badge className="bg-primary/10 text-primary text-[7px] font-black uppercase border-none px-1 h-4">Enterprise</Badge></Label>
                    
                    {(recordedVideoUrl || recordedPhotoUrl) ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 bg-muted/10 group">
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
                              onClick={() => { setRecordedVideoUrl(null); setVideoBlob(null); setRecordedPhotoUrl(null); setPhotoBlob(null); }}
                            >
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          type="button"
                          variant="outline"
                          className="h-24 rounded-2xl flex flex-col gap-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all active:scale-95 group"
                          onClick={() => photoInputRef.current?.click()}
                        >
                          <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-sm transition-transform group-hover:scale-110">
                            <ImageIconLucide className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-tight">Foto Galeria</span>
                          <input type="file" ref={photoInputRef} accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          className="h-24 rounded-2xl flex flex-col gap-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all active:scale-95 group"
                          onClick={() => { setIsVideoDialogOpen(true); startCamera(); }}
                        >
                          <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-sm transition-transform group-hover:scale-110">
                            <Video className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-tight">Gravar Vídeo</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl rounded-2xl bg-primary hover:bg-primary/90 text-white transition-all active:scale-95 gap-3">
                   {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="w-5 h-5" />} Enviar Avaliação
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <footer className="text-center space-y-6 pt-4 animate-in fade-in duration-1000 delay-500">
           <div className="flex flex-col items-center gap-4">
              <div className="relative w-[180px] h-[60px] opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <Image src="/logo-proova-white-mode.gif" alt="Logo Footer" fill className="object-contain dark:hidden" priority unoptimized />
                <Image src="/logo-proova-dark-mode.gif" alt="Logo Footer" fill className="object-contain hidden dark:block" priority unoptimized />
              </div>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
                <span>Segurança de Dados</span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <span>Auditoria Real</span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <span>Proova Technology</span>
              </div>
           </div>
        </footer>
      </div>

      <Dialog open={isVideoDialogOpen} onOpenChange={(o) => !o && (stopCamera(), setIsVideoDialogOpen(false))}>
        <DialogContent className="fixed inset-0 m-0 h-screen w-screen max-w-none bg-black border-none p-0 flex flex-col z-[101] [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Gravação de Vídeo Depoimento</DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 flex items-center justify-center">
            {recordedVideoUrl ? (
              <video src={recordedVideoUrl} controls className="w-full h-full object-contain" />
            ) : (
              <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            )}
            
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-8">
              {!recordedVideoUrl ? (
                <div className="flex flex-col items-center gap-4">
                   {isRecording && (
                     <div className="bg-red-600/90 text-white px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest animate-pulse flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-white" /> 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30
                     </div>
                   )}
                   <Button size="lg" className={cn("h-24 w-24 rounded-full shadow-2xl transition-all active:scale-90 border-8 border-white/20", isRecording ? "bg-white" : "bg-red-600")} onClick={isRecording ? handleStopRecording : handleStartRecording}>
                     {isRecording ? <Square className="w-8 h-8 fill-red-600 text-red-600" /> : <div className="h-8 w-8 rounded-full bg-white" />}
                   </Button>
                   <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest">{isRecording ? "Toque para finalizar" : "Toque para gravar"}</p>
                </div>
              ) : (
                <div className="flex gap-4 p-6 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                   <Button variant="outline" className="h-14 px-10 rounded-2xl text-white border-white/20 hover:bg-white/10 font-black uppercase tracking-widest text-[10px]" onClick={() => { setRecordedVideoUrl(null); setVideoBlob(null); startCamera(); }}>Refazer</Button>
                   <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-zinc-100 font-black uppercase tracking-widest text-[10px]" onClick={() => setIsVideoDialogOpen(false)}>Usar este Vídeo</Button>
                </div>
              )}
            </div>

            <Button variant="ghost" className="absolute top-8 right-8 text-white h-12 w-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20" onClick={() => { stopCamera(); setIsVideoDialogOpen(false); }}>
               <X className="w-6 h-6" />
            </Button>

            {!recordedVideoUrl && !isRecording && (
               <div className="absolute top-8 left-8">
                  <Button variant="ghost" className="text-white gap-2 font-black uppercase tracking-widest text-[10px]" onClick={() => startCamera(streamRef.current?.getVideoTracks()[0].getSettings().facingMode === 'user' ? 'environment' : 'user')}>
                     <SwitchCamera className="w-5 h-5" /> Inverter
                  </Button>
               </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
