'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, doc, query, where } from 'firebase/firestore';
import { ArrowLeft, Copy, Check, TrendingUp, Users, Crown, Link2, Megaphone, Shield } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingScreen } from '@/components/loading-screen';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SITE_URL } from '@/lib/site';
import { ppPlanOf } from '@/lib/pp-plans';
import { FUNNEL } from '@/lib/analytics-events';
import { disableTracking } from '@/lib/track';

const PRICE = { free: 0, premium: 59.9, pro: 119.99 } as const;
const PLAN_LABEL = { free: 'Sem plano', premium: 'Premium', pro: 'PRO' } as const;
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1).replace('.', ',')}%` : '—');

const toDate = (t: any): Date | null => {
  if (!t) return null;
  if (typeof t.toDate === 'function') return t.toDate();
  if (typeof t.seconds === 'number') return new Date(t.seconds * 1000);
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
};

const PERIODS = [
  { id: '7', label: '7 dias', days: 7 },
  { id: '30', label: '30 dias', days: 30 },
  { id: '90', label: '90 dias', days: 90 },
  { id: 'all', label: 'Tudo', days: 0 },
] as const;

const DESTINATIONS = [
  { id: 'home', label: 'Página inicial', path: '/' },
  { id: 'pricing', label: 'Todos os planos', path: '/pricing' },
  { id: 'premium', label: 'Plano Premium', path: '/pricing?plan=gold' },
  { id: 'pro', label: 'Plano PRO', path: '/pricing?plan=pro' },
  { id: 'signup', label: 'Cadastro', path: '/signup' },
];

const CHANNELS = [
  { label: 'Instagram · Bio', source: 'instagram', medium: 'bio' },
  { label: 'Instagram · Stories', source: 'instagram', medium: 'story' },
  { label: 'Instagram · Reels', source: 'instagram', medium: 'reels' },
  { label: 'TikTok · Bio', source: 'tiktok', medium: 'bio' },
  { label: 'YouTube · Descrição', source: 'youtube', medium: 'descricao' },
  { label: 'WhatsApp', source: 'whatsapp', medium: 'mensagem' },
  { label: 'E-mail', source: 'email', medium: 'newsletter' },
  { label: 'Parceiro / indicação', source: 'parceiro', medium: 'indicacao' },
];

const slugify = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9_.\-]/g, '-').replace(/-+/g, '-').slice(0, 40);

export default function AdminGrowthPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: userData, loading: userDataLoading } = useDoc(userDocRef);
  const isAdmin = userData?.isAdmin === true;

  const usersQuery = useMemo(() => (db && user && isAdmin ? query(collection(db, 'users'), where('isAdmin', '==', false)) : null), [db, user, isAdmin]);
  const { data: users, loading } = useCollection(usersQuery);

  const analyticsQuery = useMemo(() => (db && user && isAdmin ? collection(db, 'analytics_daily') : null), [db, user, isAdmin]);
  const { data: analyticsDocs } = useCollection(analyticsQuery);
  useEffect(() => { if (isAdmin) disableTracking(); }, [isAdmin]);

  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('30');
  const [groupBy, setGroupBy] = useState<'source' | 'campaign'>('source');

  // ---------- métricas ----------
  const stats = useMemo(() => {
    const all = (users || []) as any[];
    const days = PERIODS.find((p) => p.id === period)!.days;
    const since = days ? Date.now() - days * 86400000 : 0;

    const rows = all.map((u) => {
      const plan = ppPlanOf(u.membershipStatus) as 'free' | 'premium' | 'pro';
      const a = u.attribution;
      return {
        id: u.id, name: u.name || u.companyName || 'Sem nome', plan,
        created: toDate(u.createdAt), activated: toDate(u.planActivatedAt),
        source: a?.source || 'sem-origem', campaign: a?.campaign || null, medium: a?.medium || null,
      };
    });

    const paying = rows.filter((r) => r.plan !== 'free');
    const mrr = paying.reduce((s, r) => s + PRICE[r.plan], 0);
    const inPeriod = rows.filter((r) => !since || (r.created && r.created.getTime() >= since));
    const convPaid = inPeriod.filter((r) => r.plan !== 'free');

    const byPlan = (['free', 'premium', 'pro'] as const).map((p) => {
      const n = rows.filter((r) => r.plan === p).length;
      return { plan: p, count: n, mrr: n * PRICE[p] };
    });

    const key = (r: (typeof rows)[number]) => (groupBy === 'campaign' ? `${r.source}${r.campaign ? ` · ${r.campaign}` : ''}` : r.source);
    const map = new Map<string, { key: string; signups: number; paid: number; premium: number; pro: number; mrr: number }>();
    inPeriod.forEach((r) => {
      const k = key(r);
      const e = map.get(k) || { key: k, signups: 0, paid: 0, premium: 0, pro: 0, mrr: 0 };
      e.signups += 1;
      if (r.plan !== 'free') { e.paid += 1; e.mrr += PRICE[r.plan]; if (r.plan === 'premium') e.premium += 1; else e.pro += 1; }
      map.set(k, e);
    });
    const sources = [...map.values()].sort((a, b) => b.mrr - a.mrr || b.signups - a.signups);

    // cadastros por dia (últimos 30 dias no máximo)
    const span = days && days <= 30 ? days : 30;
    const daily: { label: string; n: number }[] = [];
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      daily.push({
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        n: rows.filter((r) => r.created && r.created >= d && r.created < next).length,
      });
    }

    const recentPaying = [...paying].sort((a, b) => (b.activated?.getTime() || 0) - (a.activated?.getTime() || 0)).slice(0, 10);
    const tracked = rows.filter((r) => r.source !== 'sem-origem').length;
    const cohort = users ? (users as any[]).filter((u) => { const d = toDate(u.createdAt); return !since || (d && d.getTime() >= since); }) : [];
    const activation = {
      signups: cohort.length,
      linkShared: cohort.filter((u) => !!u.firstLinkSharedAt).length,
      firstApproved: cohort.filter((u) => !!u.firstApprovedAt).length,
      baseline: cohort.filter((u) => !!u.baseline).length,
      firstFeedback: cohort.filter((u) => !!u.firstFeedbackAt || (u.testimonialsCount || 0) > 0).length,
    };
    return { activation, total: rows.length, mrr, paying: paying.length, inPeriod: inPeriod.length, convPaid: convPaid.length, byPlan, sources, daily, recentPaying, tracked };
  }, [users, period, groupBy]);

  // ---------- funil de visitas (analytics próprio) ----------
  const funnel = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)?.days || 0;
    const from = days ? new Date(Date.now() - days * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' }) : '';
    const docs = ((analyticsDocs as any[]) || []).filter((d) => !from || String(d.id) >= from);
    const uniq = (e: string) => docs.reduce((s, d) => s + (d.ev?.[e]?.uniq || 0), 0);
    const rows = FUNNEL.map((f) => ({ ...f, n: uniq(f.id) }));
    const bySource = new Map<string, Record<string, number>>();
    docs.forEach((d) => Object.entries(d.src || {}).forEach(([src, evs]: [string, any]) => {
      const e = bySource.get(src) || {};
      Object.entries(evs).forEach(([k, v]) => { e[k] = (e[k] || 0) + (v as number); });
      bySource.set(src, e);
    }));
    const sources = [...bySource.entries()].map(([src, e]) => ({ src, views: e.landing_view || 0, done: e.signup_done || 0 })).sort((a, b) => b.views - a.views);
    const ctaMap = new Map<string, number>();
    docs.forEach((d) => ['signup_click', 'checkout_click'].forEach((ev) => Object.entries(d.cta?.[ev] || {}).forEach(([k, v]) => {
      const key = `${ev === 'checkout_click' ? 'Checkout' : 'Cadastro'} · ${k}`;
      ctaMap.set(key, (ctaMap.get(key) || 0) + (v as number));
    })));
    const ctas = [...ctaMap.entries()].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
    return { rows, sources, ctas, checkout: uniq('checkout_click'), collectionViews: uniq('collection_view'), hasData: docs.length > 0 };
  }, [analyticsDocs, period]);

  // ---------- gerador de links ----------
  const [dest, setDest] = useState(DESTINATIONS[0].id);
  const [source, setSource] = useState('instagram');
  const [medium, setMedium] = useState('bio');
  const [campaign, setCampaign] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const buildLink = (d: string, s: string, m: string, c: string) => {
    const path = DESTINATIONS.find((x) => x.id === d)!.path;
    const u = new URL(path, SITE_URL);
    if (s) u.searchParams.set('utm_source', slugify(s));
    if (m) u.searchParams.set('utm_medium', slugify(m));
    if (c) u.searchParams.set('utm_campaign', slugify(c));
    return u.toString();
  };
  const link = buildLink(dest, source, medium, campaign);
  const copy = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1500); }
    catch { toast({ variant: 'destructive', title: 'Não foi possível copiar', description: text }); }
  };

  if (authLoading || (user && userDataLoading)) return <LoadingScreen />;
  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30 px-4 font-body">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardHeader><Shield className="w-12 h-12 text-destructive mx-auto mb-2" /><CardTitle>Acesso restrito</CardTitle><CardDescription>Esta página é só para administradores.</CardDescription></CardHeader>
          <CardContent><Link href="/dash"><Button className="w-full">Voltar</Button></Link></CardContent>
        </Card>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.n));
  const maxMrr = Math.max(1, ...stats.byPlan.map((p) => p.mrr));

  return (
    <div className="min-h-screen bg-muted/30 font-body text-foreground overflow-x-hidden">
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="space-y-3">
          <Link href="/admin"><Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground hover:text-primary font-bold uppercase tracking-widest text-[10px]"><ArrowLeft className="w-4 h-4" /> Painel admin</Button></Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-black font-headline tracking-tighter uppercase flex items-center gap-2.5"><TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-primary shrink-0" /> Growth & MRR</h1>
              <p className="text-xs text-muted-foreground font-medium">De onde vêm os cadastros e as assinaturas, e a receita recorrente por plano.</p>
            </div>
            <div className="grid grid-cols-4 md:flex gap-1 bg-background border rounded-xl p-1 w-full md:w-auto">
              {PERIODS.map((p) => (
                <button key={p.id} type="button" onClick={() => setPeriod(p.id)}
                  className={cn('px-2 md:px-3 py-2 md:py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-center', period === p.id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-primary')}>{p.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-6">
          {[
            { label: 'MRR atual', value: brl(stats.mrr), icon: Crown, hl: true, sub: `ARR ${brl(stats.mrr * 12)}` },
            { label: 'Assinantes', value: String(stats.paying), icon: Users, sub: `de ${stats.total} contas` },
            { label: 'Cadastros no período', value: String(stats.inPeriod), icon: Megaphone, sub: `${stats.tracked} com origem registrada` },
            { label: 'Cadastro → pago', value: pct(stats.convPaid, stats.inPeriod), icon: TrendingUp, sub: `${stats.convPaid} assinaram` },
          ].map((k) => (
            <Card key={k.label} className={cn('rounded-2xl border-none shadow-sm', k.hl && 'bg-primary/5')}>
              <CardHeader className="p-3 pb-1 md:p-6 md:pb-2"><CardTitle className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-start gap-1.5 leading-tight"><k.icon className="w-3.5 h-3.5 shrink-0" /><span className="min-w-0">{k.label}</span></CardTitle></CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0"><div className={cn('text-xl md:text-3xl font-black truncate', k.hl && 'text-primary')}>{loading ? '…' : k.value}</div><p className="text-[10px] md:text-[11px] text-muted-foreground font-medium mt-1 leading-tight">{k.sub}</p></CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Origem */}
          <Card className="rounded-3xl md:rounded-[2rem] border-none shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div><CardTitle className="text-sm font-black uppercase tracking-tight">De onde vêm os usuários</CardTitle><CardDescription className="text-xs">Cadastros do período e quantos já pagam.</CardDescription></div>
              <div className="flex gap-1 bg-muted rounded-lg p-0.5 shrink-0 self-start">
                {(['source', 'campaign'] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setGroupBy(g)} className={cn('px-2.5 py-1 rounded-md text-[10px] font-black uppercase', groupBy === g ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground')}>{g === 'source' ? 'Origem' : 'Campanha'}</button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {/* Celular: cartões empilhados */}
              <ul className="sm:hidden space-y-2.5">
                {stats.sources.length === 0 && <li className="py-6 text-center text-muted-foreground text-xs">Nenhum cadastro no período.</li>}
                {stats.sources.map((s) => (
                  <li key={s.key} className="rounded-2xl border bg-muted/20 p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black capitalize break-words min-w-0">{s.key === 'sem-origem' ? 'Sem origem (antes do rastreio)' : s.key}</p>
                      <p className="text-sm font-black text-primary tabular-nums shrink-0">{brl(s.mrr)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-background p-2"><p className="text-base font-black tabular-nums">{s.signups}</p><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Cadastros</p></div>
                      <div className="rounded-xl bg-background p-2"><p className="text-base font-black tabular-nums">{s.paid}</p><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Pagantes</p></div>
                      <div className="rounded-xl bg-background p-2"><p className="text-base font-black tabular-nums">{pct(s.paid, s.signups)}</p><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Conversão</p></div>
                    </div>
                    {s.paid > 0 && <p className="text-[10px] text-muted-foreground font-medium">{s.premium} Premium · {s.pro} PRO</p>}
                  </li>
                ))}
              </ul>
              {/* Tablet/desktop: tabela */}
              <table className="hidden sm:table w-full text-sm">
                <thead><tr className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                  <th className="py-2 pr-3">{groupBy === 'source' ? 'Origem' : 'Origem · campanha'}</th><th className="py-2 px-2 text-right">Cadastros</th><th className="py-2 px-2 text-right">Pagantes</th><th className="py-2 px-2 text-right">Conv.</th><th className="py-2 pl-2 text-right">MRR</th>
                </tr></thead>
                <tbody>
                  {stats.sources.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">Nenhum cadastro no período.</td></tr>}
                  {stats.sources.map((s) => (
                    <tr key={s.key} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 font-bold capitalize">{s.key === 'sem-origem' ? 'Sem origem (antes do rastreio)' : s.key}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{s.signups}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{s.paid}{s.paid > 0 && <span className="text-[10px] text-muted-foreground"> ({s.premium}P·{s.pro}PRO)</span>}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{pct(s.paid, s.signups)}</td>
                      <td className="py-2.5 pl-2 text-right font-black tabular-nums">{brl(s.mrr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Planos */}
          <Card className="rounded-3xl md:rounded-[2rem] border-none shadow-sm">
            <CardHeader><CardTitle className="text-sm font-black uppercase tracking-tight">MRR por plano</CardTitle><CardDescription className="text-xs">Snapshot de hoje.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {stats.byPlan.map((p) => (
                <div key={p.plan} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold"><span>{PLAN_LABEL[p.plan]} <span className="text-muted-foreground font-medium">· {p.count} conta(s)</span></span><span className="tabular-nums">{brl(p.mrr)}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(p.mrr / maxMrr) * 100}%` }} /></div>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground font-medium pt-2">Preços: Premium {brl(PRICE.premium)} · PRO {brl(PRICE.pro)}. Contas com plano ativo, sem descontar cupons.</p>
            </CardContent>
          </Card>
        </div>

        {/* Ativação dos cadastros */}
        <Card className="rounded-3xl md:rounded-[2rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-tight">Ativação: o cadastro virou uso?</CardTitle>
            <CardDescription className="text-xs">Por conta criada no período. "Enviou o 1º link" só existe para quem usou depois deste recurso; "recebeu a 1ª avaliação" vale para todas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Cadastros', n: stats.activation.signups },
              { label: 'Copiaram ou enviaram o link de coleta', n: stats.activation.linkShared },
              { label: 'Receberam a 1ª avaliação', n: stats.activation.firstFeedback },
              { label: 'Tiveram o 1º depoimento aprovado (só após o deploy)', n: stats.activation.firstApproved },
              { label: 'Informaram o ponto de partida no Google (antes/depois)', n: stats.activation.baseline },
            ].map((r, i) => (
              <div key={r.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold gap-3"><span>{r.label}</span><span className="tabular-nums shrink-0">{r.n}{i > 0 && <span className="text-muted-foreground font-medium"> · {pct(r.n, stats.activation.signups)} dos cadastros</span>}</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(r.n / Math.max(1, stats.activation.signups)) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Funil de visitas (analytics próprio) */}
        <Card className="rounded-3xl md:rounded-[2rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-tight">Funil: visita → cadastro → ativação</CardTitle>
            <CardDescription className="text-xs">Visitantes únicos por dia, somados no período (quem volta em outro dia conta de novo). Bots e o admin ficam de fora. Medição começa quando este recurso entra no ar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!funnel.hasData ? (
              <p className="text-xs text-muted-foreground font-medium">Ainda sem dados no período.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {funnel.rows.map((r, i) => {
                    const top = Math.max(1, funnel.rows[0].n);
                    const prev = i > 0 ? funnel.rows[i - 1].n : 0;
                    return (
                      <div key={r.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold gap-3">
                          <span>{r.label}</span>
                          <span className="tabular-nums shrink-0">{r.n}{i > 0 && <span className="text-muted-foreground font-medium"> · {pct(r.n, prev)} da etapa anterior</span>}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(r.n / top) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-muted-foreground font-medium">Visita → cadastro: <b>{pct(funnel.rows[3].n, funnel.rows[0].n)}</b> · Cadastro → recebeu 1ª avaliação: <b>{pct(funnel.rows[5].n, funnel.rows[3].n)}</b></p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliques por botão (total no período)</p>
                  {funnel.ctas.length === 0 ? <p className="text-xs text-muted-foreground font-medium">Sem cliques registrados ainda.</p> : (
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {funnel.ctas.map((c) => (
                        <div key={c.k} className="flex justify-between text-xs border-b border-dashed py-1.5"><span className="font-bold">{c.k}</span><span className="tabular-nums font-black">{c.n}</span></div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground font-medium">Aberturas de links de coleta de todos os clientes (por sessão): <b>{funnel.collectionViews}</b></p>
                  <p className="text-[11px] text-muted-foreground font-medium">Cliques em "Ir para o checkout" (planos pagos, únicos): <b>{funnel.checkout}</b></p>
                </div>
                {funnel.sources.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground"><th className="py-2 pr-2">Origem</th><th className="py-2 px-2 text-right">Visitas</th><th className="py-2 px-2 text-right">Cadastros</th><th className="py-2 pl-2 text-right">Conversão</th></tr></thead>
                      <tbody className="divide-y">
                        {funnel.sources.map((s) => (
                          <tr key={s.src}><td className="py-2.5 pr-2 font-bold">{s.src}</td><td className="py-2.5 px-2 text-right tabular-nums">{s.views}</td><td className="py-2.5 px-2 text-right tabular-nums">{s.done}</td><td className="py-2.5 pl-2 text-right font-black tabular-nums">{pct(s.done, s.views)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Cadastros por dia */}
        <Card className="rounded-3xl md:rounded-[2rem] border-none shadow-sm">
          <CardHeader><CardTitle className="text-sm font-black uppercase tracking-tight">Cadastros por dia</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {stats.daily.map((d, i) => (
                <div key={i} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group" title={`${d.label}: ${d.n}`}>
                  <div className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors" style={{ height: `${(d.n / maxDaily) * 100}%`, minHeight: d.n ? 3 : 1 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium mt-2"><span>{stats.daily[0]?.label}</span><span>{stats.daily[stats.daily.length - 1]?.label}</span></div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gerador de links */}
          <Card className="rounded-3xl md:rounded-[2rem] border-none shadow-sm">
            <CardHeader><CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> Links rastreáveis</CardTitle><CardDescription className="text-xs">Use cada link em um lugar. Quem se cadastrar por ele aparece na origem certa. Só administradores veem esta ferramenta.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Para onde levar</p>
                <div className="flex flex-wrap gap-1.5">
                  {DESTINATIONS.map((d) => (
                    <button key={d.id} type="button" onClick={() => setDest(d.id)} className={cn('px-3 py-2 rounded-full border text-xs font-bold', dest === d.id ? 'bg-primary text-white border-primary' : 'hover:bg-primary/5')}>{d.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Onde vai ficar</p>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNELS.map((c) => (
                    <button key={c.label} type="button" onClick={() => { setSource(c.source); setMedium(c.medium); }}
                      className={cn('px-3 py-2 rounded-full border text-xs font-bold', source === c.source && medium === c.medium ? 'bg-primary text-white border-primary' : 'hover:bg-primary/5')}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="origem" className="rounded-xl text-sm" aria-label="utm_source" />
                <Input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="meio" className="rounded-xl text-sm" aria-label="utm_medium" />
                <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="campanha (opcional)" className="rounded-xl text-sm" aria-label="utm_campaign" />
              </div>
              <div className="rounded-2xl bg-muted/50 border p-3 space-y-2">
                <p className="text-[11px] sm:text-xs font-mono break-all leading-relaxed">{link}</p>
                <Button type="button" size="sm" className="rounded-xl font-black gap-2 w-full sm:w-auto h-10" onClick={() => copy(link, 'main')}>{copied === 'main' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === 'main' ? 'Copiado!' : 'Copiar link'}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Assinantes recentes */}
          <Card className="rounded-3xl md:rounded-[2rem] border-none shadow-sm">
            <CardHeader><CardTitle className="text-sm font-black uppercase tracking-tight">Assinantes recentes</CardTitle><CardDescription className="text-xs">Quem assinou e por qual canal chegou.</CardDescription></CardHeader>
            <CardContent>
              {stats.recentPaying.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">Ainda não há assinantes.</p> : (
                <ul className="divide-y">
                  {stats.recentPaying.map((r) => (
                    <li key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0"><p className="text-sm font-bold truncate">{r.name}</p><p className="text-[11px] text-muted-foreground capitalize">{r.source === 'sem-origem' ? 'sem origem' : r.source}{r.activated ? ` · ${r.activated.toLocaleDateString('pt-BR')}` : ''}</p></div>
                      <span className="text-[10px] font-black uppercase tracking-widest rounded-full bg-primary/10 text-primary px-2.5 py-1 shrink-0">{PLAN_LABEL[r.plan]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
