'use client';

import { useId } from 'react';
import { cn } from '@landmap/ui';

/**
 * LogoMark — EXTRAÇÃO 1:1 do chunk oficial da Lovable LIVE.
 *
 * Fonte autoritativa: `landmap-insight.lovable.app/assets/splash-B3GsUpSR.js`
 * (componente `c`). Reproduzimos aqui, sem alterações semânticas:
 *
 *  - assinatura `{ className, size = 120, color = '#003594' }` (+ `riverColor`,
 *    aceito pela assinatura original mas não consumido no SVG);
 *  - `viewBox="304 92 800 1038"`, `role="img"`, `aria-label="LandMap"`;
 *  - classe `logo-mark` somada ao `className` recebido (o CSS dessa classe vive
 *    em `app/globals.css` — é ele que traz `overflow:visible`,
 *    `transform-origin:50%` e o keyframe `logo-mark-settle`);
 *  - máscara com `<animate>` de `y: 1130 → 92`, `dur 1.1s`, `begin 0.15s`,
 *    `fill=freeze`, `calcMode=spline`, `keySplines="0.22 1 0.36 1"`.
 */
const LOGO_PATHS = [
  'M3547 11679 c-164 -16 -222 -44 -244 -119 -26 -87 -35 -469 -30 -1295 6 -1067 12 -1114 164 -1353 211 -332 478 -519 913 -642 375 -106 640 -239 810 -410 377 -376 464 -953 217 -1445 -109 -218 -211 -332 -577 -644 -203 -174 -369 -337 -442 -435 -408 -547 -207 -1328 409 -1595 198 -86 249 -88 864 -35 504 43 639 43 782 0 188 -56 374 -173 542 -341 180 -180 225 -264 431 -815 233 -623 366 -789 661 -822 156 -18 2435 -18 2546 -1 144 23 194 69 224 204 32 140 21 1393 -12 1481 -15 39 -43 32 -450 -102 -421 -138 -585 -173 -820 -174 -162 0 -262 14 -395 56 -414 132 -662 385 -968 993 -145 287 -209 385 -337 510 -193 189 -378 267 -748 315 -87 11 -177 20 -200 20 -23 0 -47 4 -53 8 -11 8 -35 1979 -34 2910 l0 492 -76 156 c-181 370 -291 475 -804 764 -504 284 -763 512 -970 856 -235 388 -325 709 -364 1294 l-11 175 -470 1 c-259 1 -510 -2 -558 -7z',
  'M5000 11664 c-59 -154 -5 -635 105 -939 145 -403 358 -663 751 -918 221 -143 593 -344 707 -381 136 -45 186 4 217 213 60 408 22 1773 -54 1956 -34 80 -83 85 -1003 92 l-713 5 -10 -28z',
  'M3254 8143 c-15 -577 -11 -5719 4 -5986 23 -422 20 -418 431 -438 250 -12 3267 -4 3486 9 137 9 136 5 61 179 -30 70 -97 252 -149 403 -198 572 -293 742 -506 899 -246 182 -472 215 -938 137 -370 -61 -472 -66 -688 -30 -567 93 -1025 524 -1140 1071 -77 373 -7 786 186 1083 99 154 293 353 564 580 412 344 557 566 583 887 38 473 -200 772 -758 949 -360 114 -427 137 -503 171 -162 73 -201 100 -548 376 -33 26 -64 47 -68 47 -5 0 -12 -152 -17 -337z',
  'M8550 4960 c-165 -15 -187 -34 -176 -158 22 -263 216 -730 401 -968 295 -377 718 -445 1360 -219 254 89 424 143 567 179 l133 34 3 404 c4 636 -4 660 -251 715 -81 18 -1845 29 -2037 13z',
];

export interface LogoMarkProps {
  className?: string;
  /** Lado do quadrado em px (Lovable usa 120 por padrão, 148 no splash). */
  size?: number;
  /** Cor de preenchimento do símbolo. Lovable: `#003594` por padrão. */
  color?: string;
  /** Presente na assinatura original da Lovable; não consumido no SVG. */
  riverColor?: string;
}

export function LogoMark({
  className,
  size = 120,
  color = '#003594',
}: LogoMarkProps) {
  const rawId = useId();
  const maskId = `lm-mask-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="304 92 800 1038"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('logo-mark', className)}
      role="img"
      aria-label="LandMap"
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="304"
          y="92"
          width="800"
          height="1038"
        >
          <rect x="304" y="1130" width="800" height="1038" fill="#fff">
            <animate
              attributeName="y"
              from="1130"
              to="92"
              dur="1.1s"
              begin="0.15s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.22 1 0.36 1"
            />
          </rect>
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <g transform="translate(0,1281) scale(0.1,-0.1)" fill={color}>
          {LOGO_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}

export default LogoMark;
