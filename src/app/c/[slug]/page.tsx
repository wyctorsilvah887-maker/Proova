
import { Metadata } from 'next';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import CollectionClient from './CollectionClient';

/**
 * Server Component para gerar metadados dinâmicos (Open Graph) para WhatsApp/Redes Sociais.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const { firestore } = initializeFirebase();
  
  const slug = decodeURIComponent(rawSlug).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('companySlug', '==', slug), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) {
    return {
      title: "Avalie uma Empresa - Proova",
      description: "Sua opinião é fundamental para o crescimento da marca.",
    };
  }

  const data = snap.docs[0].data();
  const companyName = data.companyName || 'Empresa Parceira';
  const logoUrl = data.logoUrl || 'https://useproova.online/Logotipo%20PROOVA%20white%20mode%201.png';

  return {
    title: `Avalie ${companyName} no Proova`,
    description: `Gostaríamos de ouvir sua opinião sobre os serviços de ${companyName}.`,
    openGraph: {
      title: `Avalie ${companyName} no Proova`,
      description: `Gostaríamos de ouvir sua opinião sobre os serviços de ${companyName}. Sua nota ajuda nossa empresa a crescer.`,
      images: [{ url: logoUrl, width: 800, height: 800, alt: companyName }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Avalie ${companyName} no Proova`,
      description: `Gostaríamos de ouvir sua opinião sobre os serviços de ${companyName}.`,
      images: [logoUrl],
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CollectionClient slug={slug} />;
}
