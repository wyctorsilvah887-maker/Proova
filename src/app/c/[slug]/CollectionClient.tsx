'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Star, CheckCircle2, MessageSquare, Loader2, Send, Video, Search, MapPin, Globe, X, Camera, Square, RefreshCcw, SwitchCamera, Play, Clock, ArrowLeft, Shield } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { submitTestimonialAction } from '@/app/actions/testimonial-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
  
  const [isGoogleRedirectDialogOpen, setIsGoogleRedirectDialogOpen] = useState(false);
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

  const startCamera = async (mode?: 'user' | 'environment') => {
    const currentMode = mode || facingMode;
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 150));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
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

  const handleSubmitInitial = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot || Date.now() - loadTime < 3000) return;
    if (rating === 0) { toast({ variant: "destructive", title: "Nota Obrigatória" }); return; }
    if (!userName.trim()) { toast({ variant: "destructive", title: "Identificação" }); return; }
    if (!videoBlob && !text.trim()) { toast({ variant: "destructive", title: "Mensagem Necessária" }); return; }
    setSelectionPending(true);
  };

  const handleFinalSubmit = async (destination: 'public' | 'private') => {
    if (!targetUserId) return;
    setIsSubmitting(true);
    setFinalDest(destination);
    let finalVideoUrl = '';
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
    const result = await submitTestimonialAction({
      targetUserId, destination, userName, userEmail, rating, text: text.trim(), videoUrl: finalVideoUrl
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

  if (isLoadingCompany) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!targetUserId) return <div className="min-h-screen flex items-center justify-center p-4"><Card className="max-w-md w-full p-10 text-center"><Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h2 className="text-xl font-bold">Empresa não encontrada</h2></Card></div>;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-body">
        <div className="fixed top-4 right-4"><ThemeToggle /></div>
        <Card className="w-full max-w-md text-center shadow-2xl border-none">
          <CardContent className="pt-10 pb-10 space-y-8">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit"><CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" /></div>
            <div className="space-y-2"><h2 className="text-3xl font-bold">Obrigado!</h2><p className="text-muted-foreground">Sua avaliação foi enviada para {companyNameDisplay}.</p></div>
            {googleMapsUrl && (finalDest === 'public' || videoBlob) && rating >= 4 && (
              <div className="pt-6 border-t space-y-4">
                <Button onClick={() => setIsGoogleRedirectDialogOpen(true)} className="w-full h-14 rounded-xl gap-3 text-sm font-bold bg-[#4285F4] hover:bg-[#357ae8]"><MapPin className="w-5 h-5" /> Avaliar também no Google</Button>
              </div>
            )}
            <Button variant="ghost" onClick={() => setSubmitted(false)} className="text-xs">Enviar outro depoimento</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnterprise = membershipStatus === 'enterprise';

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 font-body text-foreground">
      <div className="fixed top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2"><h1 className="text-3xl font-bold font-headline">{companyNameDisplay}</h1><p className="text-muted-foreground">Gostaríamos de ouvir sua opinião sobre nossos serviços.</p></div>
        <Card className="shadow-2xl border-none overflow-hidden bg-card">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" /> {selectionPending ? "Revise seu Depoimento" : "Deixe seu Depoimento"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-10">
            {selectionPending ? (
              <div className="space-y-8 animate-in fade-in zoom-in duration-500 py-2">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-center text-muted-foreground">Como seu elogio será exibido:</p>
                  <Card className="bg-muted/30 border-2 border-primary/10 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{userName?.substring(0, 2).toUpperCase()}</div>
                          <p className="font-bold text-sm">{userName}</p>
                        </div>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3 h-3", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />)}</div>
                      </div>
                      {text && <p className="text-sm italic leading-relaxed">"{text}"</p>}
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-4">
                  <Button disabled={isSubmitting} onClick={() => handleFinalSubmit('public')} className="h-auto min-h-24 py-5 rounded-2xl flex flex-col gap-1 bg-[#4285F4] hover:bg-[#357ae8] shadow-lg">
                    <div className="flex items-center gap-2"><Globe className="w-5 h-5" /><span className="font-bold text-lg">Público</span></div>
                    <span className="text-[9px] opacity-70 uppercase font-black">Injetar autoridade imediata na marca</span>
                  </Button>
                  <Button disabled={isSubmitting} variant="outline" onClick={() => handleFinalSubmit('private')} className="h-auto min-h-24 py-5 rounded-2xl flex flex-col gap-1 border-primary/20 text-primary">
                    <div className="flex items-center gap-2"><Shield className="w-5 h-5" /><span className="font-bold text-lg">Privado</span></div>
                    <span className="text-[9px] opacity-70 uppercase font-black">Feedback sigiloso direto para a gerência</span>
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setSelectionPending(false)} className="w-full text-[10px] font-black uppercase"><ArrowLeft className="w-3 h-3 mr-2" /> Voltar e Editar</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInitial} className="space-y-6">
                <div className="hidden"><input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></div>
                <div className="space-y-3 text-center">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="p-1 transition-transform active:scale-150">
                        <Star className={cn("w-10 h-10", (star <= (hoverRating || rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40')} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input placeholder="Seu Nome" value={userName} onChange={(e) => setUserName(e.target.value)} required className="h-11 rounded-xl" />
                  <Input type="email" placeholder="E-mail (opcional)" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <Textarea placeholder="Conte-nos o que achou da nossa empresa..." className="min-h-[120px] rounded-xl" value={text} onChange={(e) => setText(e.target.value)} />
                {isEnterprise && (
                  <div onClick={() => { setIsVideoDialogOpen(true); startCamera(); }} className={cn("p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all", recordedVideoUrl ? "border-green-500 bg-green-50" : "border-primary/20 bg-primary/5 hover:bg-primary/10")}>
                    {recordedVideoUrl ? <p className="text-[10px] font-black uppercase text-green-700">Vídeo Gravado! Clique para refazer.</p> : <div className="space-y-1"><Video className="w-6 h-6 mx-auto text-primary" /><p className="text-xs font-bold text-primary">Gravar Depoimento em Vídeo 4K</p></div>}
                  </div>
                )}
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg font-bold shadow-xl rounded-2xl">{isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Send className="mr-2 w-5 h-5" />} Revisar e Enviar</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isVideoDialogOpen} onOpenChange={(o) => !o && (stopCamera(), setIsVideoDialogOpen(false))}>
        <DialogContent className="fixed inset-0 m-0 h-screen w-screen max-w-none bg-black border-none p-0 flex flex-col z-[101] [&>button]:hidden">
          <div className="relative flex-1 flex items-center justify-center">
            {recordedVideoUrl ? <video src={recordedVideoUrl} controls className="w-full h-full object-contain" /> : <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />}
            <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-6">
              {!recordedVideoUrl ? (
                <Button size="lg" className={cn("h-20 w-20 rounded-full", isRecording ? "bg-white" : "bg-red-600")} onClick={isRecording ? handleStopRecording : handleStartRecording}>
                  {isRecording ? <Square className="fill-red-600 text-red-600" /> : <div className="h-6 w-6 rounded-full bg-white" />}
                </Button>
              ) : (
                <div className="flex gap-4"><Button variant="outline" className="h-12 px-8 text-white border-white" onClick={() => { setRecordedVideoUrl(null); startCamera(); }}>Refazer</Button><Button className="h-12 px-8" onClick={() => setIsVideoDialogOpen(false)}>Usar Vídeo</Button></div>
              )}
            </div>
            <Button variant="ghost" className="absolute top-6 right-6 text-white" onClick={() => { stopCamera(); setIsVideoDialogOpen(false); }}><X className="w-6 h-6" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
