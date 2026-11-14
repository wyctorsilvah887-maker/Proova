
import { Metadata } from 'next';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import PPClient from './PPClient';
import { SITE_URL } from '@/lib/site';

/**
 * Server Component para gerar metadados dinâmicos (Open Graph) para a Página Pública.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const { firestore } = initializeFirebase();
  
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim();
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('companySlug', '==', slug), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) {
    return {
      title: "Perfil Profissional - Proova",
      description: "Confira a reputação e depoimentos reais desta empresa.",
    };
  }

  const data = snap.docs[0].data();
  const companyName = data.companyName || 'Empresa Parceira';
  const logoUrl = data.logoUrl || `${SITE_URL}/logo-proovaai-whitemode.png`;

  return {
    title: `${companyName} - Experiências Reais`,
    description: `Confira o que os clientes estão dizendo sobre ${companyName}. Transparência e autoridade digital.`,
    openGraph: {
      title: `${companyName} - Experiências Reais`,
      description: `Veja os depoimentos aprovados e a nota média de ${companyName} no Proova.`,
      images: [{ url: logoUrl, width: 800, height: 800, alt: companyName }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${companyName} - Experiências Reais`,
      images: [logoUrl],
    },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PPClient slug={slug} />;
}
