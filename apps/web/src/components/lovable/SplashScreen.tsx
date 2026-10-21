'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoMark } from './LogoMark';

/**
 * SplashScreen — EXTRAÇÃO 1:1 do chunk oficial da Lovable LIVE.
 *
 * Fonte autoritativa: `landmap-insight.lovable.app/assets/splash-B3GsUpSR.js`
 * (componente `l`). Reproduzido literalmente:
 *
 *  - fade-out aos **1900ms** (`opacity-0` + `transition-opacity duration-500`);
 *  - navegação `replace` aos **2300ms** (na Lovable, `to: '/landing'`);
 *  - wrapper `fixed inset-0 z-50 flex items-center justify-center` com
 *    `backgroundColor: #0d3183`;
 *  - filho único: `div.logo-mark-container` (é ele que roda o keyframe
 *    `logo-mark-settle` de 2.6s) envolvendo `<LogoMark size={148} color="#ffffff" />`.
 *
 * Nota sobre SSR:
 * No SSR e primeiro render estático, renderizamos a casca `#0d3183` com o logo
 * diretamente, para que o usuário NUNCA veja um flash em branco ou tela vazia
 * antes da hidratação do React.
 */
export function SplashScreen({ destination }: { destination: string }) {
  const router = useRouter();
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFaded(true), 1900);
    const navTimer = setTimeout(() => router.replace(destination), 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [router, destination]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
        faded ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#0d3183' }}
    >
      <div className="logo-mark-container">
        <LogoMark size={148} color="#ffffff" riverColor="#0d3183" />
      </div>
    </div>
  );
}

export default SplashScreen;
