import { NextResponse } from 'next/server';
import { bumpEvent } from '@/lib/analytics-server';
import { CLIENT_EVENTS } from '@/lib/analytics-events';

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime|curl|wget|python|node-fetch|axios/i;

/** Recebe eventos do site de marketing. Sem login, sem dados pessoais: só evento, origem e se é a 1ª vez do dia. */
export async function POST(req: Request) {
  try {
    if (BOT.test(req.headers.get('user-agent') || '')) return NextResponse.json({ ok: true, skipped: 'bot' });
    const body = await req.json().catch(() => null);
    const e = typeof body?.e === 'string' ? body.e : '';
    if (!CLIENT_EVENTS.includes(e)) return NextResponse.json({ error: 'bad_event' }, { status: 400 });
    const s = typeof body?.s === 'string' ? body.s.slice(0, 40) : 'direto';
    const c = typeof body?.c === 'string' ? body.c.slice(0, 40) : undefined;
    await bumpEvent(e, s, body?.u === true, c);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[track]', (err as Error).message);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
