'use client';

import { useParams } from 'next/navigation';
import { SplashScreen } from '../../../components/lovable/SplashScreen';

/**
 * `/splash` — rota isolada do splash, 1:1 com a Lovable LIVE.
 *
 * Toda a animação (SVG + máscara + keyframes `.logo-mark*`) vem do componente
 * compartilhado `SplashScreen`, extraído de `splash-B3GsUpSR.js`; aqui só
 * fixamos o destino literal do original: `/{locale}/landing`.
 */
export default function SplashClient() {
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';

  return <SplashScreen destination={`/${locale}/landing`} />;
}
