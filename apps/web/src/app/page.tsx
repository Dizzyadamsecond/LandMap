import { redirect } from 'next/navigation';

export default function RootRedirect() {
  // Redirecionar exatamente como Lovable: / → /dashboard (com locale padrão)
  redirect('/pt-BR/dashboard');
}
