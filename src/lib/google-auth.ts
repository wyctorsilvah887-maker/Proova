import { GoogleAuthProvider, signInWithPopup, type Auth, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { getAttribution } from '@/lib/attribution';
import { trackEvent } from '@/lib/track';

/**
 * Navegadores embutidos (Instagram, TikTok, Facebook...) não deixam o Google abrir o login:
 * o popup falha com "disallowed_useragent". Nesse caso a pessoa precisa abrir o site no Chrome/Safari.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|BytedanceWebview|Bytedance|Snapchat|MicroMessenger|Line\//i.test(navigator.userAgent);
}

export type GoogleAuthResult = { user: User; isNew: boolean; userData: any };

/** Erros que significam "a pessoa desistiu": não mostram mensagem de falha. */
export function isGoogleCancel(e: any): boolean {
  return e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request';
}

/**
 * Um único caminho para entrar OU criar conta com o Google (landing, /login e /signup).
 * Conta nova nasce com membershipStatus 'base' (as regras do Firestore exigem) = sem plano:
 * o painel só abre depois da assinatura. Não pede permissões extras do Google (a conexão
 * com a ficha da empresa continua em Configurações), para o login ser de 1 toque.
 */
export async function continueWithGoogle(auth: Auth, db: Firestore): Promise<GoogleAuthResult> {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const ref = doc(db, 'users', result.user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { user: result.user, isNew: false, userData: snap.data() };

  const data = {
    name: result.user.displayName || 'Usuário Google',
    companyName: 'Minha Empresa',
    companySlug: `empresa-${Math.random().toString(36).substring(2, 7)}`,
    email: result.user.email,
    businessType: 'clinica_estetica',
    isAdmin: false,
    onboardingDone: false,
    membershipStatus: 'base',
    isSetupProcessDone: false,
    testimonialsCount: 0,
    googleRedirectCount: 0,
    createdAt: serverTimestamp(),
    termsAccepted: true,
    termsAcceptedAt: serverTimestamp(),
    attribution: getAttribution(),
    googleConnected: false,
  };
  await setDoc(ref, data);
  trackEvent('signup_done');
  return { user: result.user, isNew: true, userData: data };
}
