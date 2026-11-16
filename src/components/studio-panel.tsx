'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, MapPin, Loader2, Wand2, Info, ArrowUp, ArrowDown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { getPlaceAddress } from '@/app/actions/maps-actions';
import {
  type StudioData, type SocialKey, type BlockId, DAY_LABELS, SOCIAL_KEYS, BLOCK_LABELS, normalizeOrder,
} from '@/lib/studio';
import type { PPCaps } from '@/lib/pp-plans';

interface Props {
  studio: StudioData;
  setStudio: (s: StudioData) => void;
  googlePlaceId?: string;
  caps: PPCaps;
}

const SOCIAL_LABEL: Record<SocialKey, string> = {
  instagram: 'Instagram (@usuario)', facebook: 'Facebook', tiktok: 'TikTok (@usuario)', youtube: 'YouTube (@canal)', linkedin: 'LinkedIn',
};

function BlockHeader({ title, hint, checked, onChange, locked }: { title: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; locked?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl bg-muted/10 border ${locked ? 'opacity-70' : ''}`}>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
          {title}
          {locked && (
            <Link href="/pricing" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-primary hover:bg-primary/20">
              <Lock className="w-2.5 h-2.5" /> Premium
            </Link>
          )}
        </p>
        {hint && <p className="text-[10px] text-muted-foreground font-medium leading-snug">{hint}</p>}
      </div>
      <Switch checked={checked && !locked} disabled={locked} onCheckedChange={onChange} />
    </div>
  );
}

/** Aba "Blocos" do editor: Sobre, Horários, Perguntas frequentes, Redes sociais e Mapa. */
export function StudioPanel({ studio, setStudio, googlePlaceId, caps }: Props) {
  const [loadingAddr, setLoadingAddr] = useState(false);
  const set = <K extends keyof StudioData>(key: K, patch: Partial<StudioData[K]>) =>
    setStudio({ ...studio, [key]: { ...studio[key], ...patch } });

  const fillAddress = async () => {
    if (!googlePlaceId) return;
    setLoadingAddr(true);
    try {
      const addr = await getPlaceAddress(googlePlaceId);
      if (addr) { set('map', { address: addr }); toast({ title: 'Endereço preenchido', description: 'Confira e ajuste se precisar.' }); }
      else toast({ variant: 'destructive', title: 'Sem endereço no Google', description: 'Digite o endereço manualmente.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Não foi possível buscar', description: e?.message });
    } finally { setLoadingAddr(false); }
  };

  const order = normalizeOrder(studio.order);
  const move = (i: number, dir: -1 | 1) => {
    const next = [...order] as BlockId[];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setStudio({ ...studio, order: next });
  };

  const updateDay = (i: number, patch: Partial<StudioData['hours']['days'][number]>) =>
    set('hours', { days: studio.hours.days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) });

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/10 p-3">
        <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
          Evite promessas de resultado, fotos de antes e depois e preços promocionais: a publicidade de serviços de saúde tem regras dos conselhos profissionais.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Ordem da página</Label>
          {!caps.reorder && (
            <Link href="/pricing" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-primary"><Lock className="w-2.5 h-2.5" /> Premium</Link>
          )}
        </div>
        <div className="space-y-1.5">
          {order.map((id, i) => (
            <div key={id} className="flex items-center gap-2 rounded-xl border bg-muted/10 px-3 py-2">
              <span className="w-5 text-[10px] font-black opacity-40">{i + 1}</span>
              <span className="flex-1 text-xs font-black uppercase tracking-tight">{BLOCK_LABELS[id]}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!caps.reorder || i === 0} onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!caps.reorder || i === order.length - 1} onClick={() => move(i, 1)} aria-label="Descer"><ArrowDown className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Blocos desligados não aparecem na página, mesmo na ordem.</p>
      </section>

      <section className="space-y-3">
        <BlockHeader title="Sobre" hint="Apresente a clínica ou o profissional." checked={studio.about.enabled} onChange={(v) => set('about', { enabled: v })} />
        {studio.about.enabled && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <Input value={studio.about.title} maxLength={60} onChange={(e) => set('about', { title: e.target.value })} placeholder="Título (ex.: Sobre a clínica)" className="h-11 rounded-xl" />
            <Textarea value={studio.about.text} maxLength={1200} rows={5} onChange={(e) => set('about', { text: e.target.value })} placeholder="Conte sua história, especialidades e o que diferencia seu atendimento." className="rounded-xl text-sm" />
            <p className="text-[9px] text-right text-muted-foreground">{studio.about.text.length}/1200</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <BlockHeader title="Horários" hint="Dias e horas de atendimento." checked={studio.hours.enabled} onChange={(v) => set('hours', { enabled: v })} />
        {studio.hours.enabled && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            {studio.hours.days.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 text-[10px] font-black uppercase opacity-70 shrink-0">{DAY_LABELS[i].slice(0, 3)}</span>
                <Switch checked={!d.closed} onCheckedChange={(v) => updateDay(i, { closed: !v })} />
                {d.closed ? (
                  <span className="text-[10px] font-bold uppercase opacity-40">Fechado</span>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Input type="time" value={d.from} onChange={(e) => updateDay(i, { from: e.target.value })} className="h-9 rounded-lg text-xs px-2" />
                    <span className="text-[10px] opacity-50">às</span>
                    <Input type="time" value={d.to} onChange={(e) => updateDay(i, { to: e.target.value })} className="h-9 rounded-lg text-xs px-2" />
                  </div>
                )}
              </div>
            ))}
            <Input value={studio.hours.note} maxLength={160} onChange={(e) => set('hours', { note: e.target.value })} placeholder="Observação (ex.: atendimento com hora marcada)" className="h-10 rounded-xl text-xs" />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <BlockHeader locked={!caps.blocks.faq} title="Perguntas frequentes" hint={`Até ${caps.faqLimit || 5} perguntas.`} checked={studio.faq.enabled} onChange={(v) => set('faq', { enabled: v })} />
        {studio.faq.enabled && caps.blocks.faq && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {studio.faq.items.map((it, i) => (
              <div key={it.id} className="space-y-2 rounded-2xl border p-3">
                <div className="flex items-center gap-2">
                  <Input value={it.q} maxLength={140} onChange={(e) => set('faq', { items: studio.faq.items.map((x, idx) => idx === i ? { ...x, q: e.target.value } : x) })} placeholder="Pergunta" className="h-10 rounded-xl text-xs font-bold" />
                  <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => set('faq', { items: studio.faq.items.filter((_, idx) => idx !== i) })} aria-label="Remover pergunta"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Textarea value={it.a} maxLength={600} rows={3} onChange={(e) => set('faq', { items: studio.faq.items.map((x, idx) => idx === i ? { ...x, a: e.target.value } : x) })} placeholder="Resposta" className="rounded-xl text-xs" />
              </div>
            ))}
            {studio.faq.items.length < caps.faqLimit && (
              <Button variant="outline" className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 border-dashed"
                onClick={() => set('faq', { items: [...studio.faq.items, { id: `f${Date.now()}`, q: '', a: '' }] })}>
                <Plus className="w-4 h-4" /> Adicionar pergunta
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <BlockHeader locked={!caps.blocks.socials} title="Redes sociais" hint="Aceita @usuario ou o link completo." checked={studio.socials.enabled} onChange={(v) => set('socials', { enabled: v })} />
        {studio.socials.enabled && caps.blocks.socials && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            {SOCIAL_KEYS.map((k) => (
              <div key={k} className="space-y-1">
                <Label className="text-[9px] font-black uppercase ml-1 opacity-60">{SOCIAL_LABEL[k]}</Label>
                <Input value={studio.socials[k]} maxLength={200} onChange={(e) => set('socials', { [k]: e.target.value } as any)} className="h-10 rounded-xl text-xs" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <BlockHeader locked={!caps.blocks.map} title="Mapa" hint="Mostra a localização no fim da página, sem interação, com botão Como chegar." checked={studio.map.enabled} onChange={(v) => set('map', { enabled: v })} />
        {studio.map.enabled && caps.blocks.map && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase ml-1 opacity-60">Endereço completo</Label>
              <Input value={studio.map.address} maxLength={250} onChange={(e) => set('map', { address: e.target.value })} placeholder="Rua, número, bairro, cidade - UF" className="h-11 rounded-xl text-xs" />
            </div>
            {googlePlaceId && (
              <Button variant="outline" onClick={fillAddress} disabled={loadingAddr} className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 border-primary/20 text-primary">
                {loadingAddr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Usar endereço do Google
              </Button>
            )}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/10 border">
              <p className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Mostrar endereço em texto</p>
              <Switch checked={studio.map.showAddress} onCheckedChange={(v) => set('map', { showAddress: v })} />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">O mapa sempre mostra o ponto no Google. Se não quer expor o endereço, deixe o mapa desligado.</p>
          </div>
        )}
      </section>
    </div>
  );
}
