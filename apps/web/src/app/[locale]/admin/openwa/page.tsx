'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { RequireAuth } from '../../../../components/RequireAuth';
import {
  ArrowLeft,
  BellRing,
  Check,
  Copy,
  Layers,
  Code2,
  ShieldCheck,
} from '../../../../components/lovable/icons';
import { Card, Badge, Stat, buttonVariants, cn } from '@landmap/ui';
import { INTELLIGENCE_REGIONS, topByScore, topByValorization } from '../../../../lib/mapIntelligence';

type OpenWaSession = {
  name: string;
  phone: string;
  status: 'draft' | 'qr_ready' | 'ready';
  sessionId: string;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
};

type LeadRule = {
  id: string;
  label: string;
  enabled: boolean;
  channel: 'whatsapp' | 'email' | 'both';
  note: string;
};

type PlatformSettings = {
  apiBaseUrl?: string;
  automationApiUrl?: string;
  reportEmail?: string;
  reportSms?: string;
  playsmsUrl?: string;
  smsWebhookUrl?: string;
};

type Opportunity = {
  id: string;
  name?: string;
  city?: string;
  state?: string;
  score?: number;
  grade?: string;
  channelFit?: number;
  followUpsSent?: number;
  daysSinceActivity?: number;
  consent?: {
    whatsapp?: 'none' | 'opt_in' | 'opt_out';
    sms?: 'none' | 'opt_in' | 'opt_out';
    call?: 'none' | 'opt_in' | 'opt_out';
  };
};

type ScannerState = 'idle' | 'starting' | 'scanning' | 'unsupported' | 'error';
type BarcodeLike = { rawValue: string };
type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeLike[]>;
};
type BrowserWithBarcodeDetector = Window & {
  BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
};

const STORAGE_KEY = 'landmap_admin_openwa_session';
const SETTINGS_KEY = 'landmap_admin_settings';
const QUEUE_KEY = 'landmap_admin_openwa_queue';

const DEFAULT_RULES: LeadRule[] = [
  { id: 'hot-score', label: 'Score alto', enabled: true, channel: 'whatsapp', note: 'Lead quente vai para WhatsApp primeiro.' },
  { id: 'new-meireles', label: 'Novo em Meireles', enabled: true, channel: 'both', note: 'Entra no fluxo de WhatsApp + e-mail.' },
  { id: 'price-drop', label: 'Queda de preço', enabled: true, channel: 'whatsapp', note: 'Mensagem curta com CTA de retorno.' },
  { id: 'cold-recovery', label: 'Resgate frio', enabled: false, channel: 'email', note: 'Só aquece quando admin aprovar.' },
];

function loadSession(): OpenWaSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OpenWaSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: OpenWaSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!session) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function loadSettings(): PlatformSettings {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as PlatformSettings) : {};
  } catch {
    return {};
  }
}

function loadQueue(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function makeId() {
  return `ow_${Math.random().toString(36).slice(2, 10)}`;
}

function makeQrToken() {
  return `QR-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function AdminOpenWaPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [session, setSession] = useState<OpenWaSession | null>(null);
  const [name, setName] = useState('landmap-openwa');
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [rules, setRules] = useState<LeadRule[]>(DEFAULT_RULES);
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [scannedValue, setScannedValue] = useState('');
  const [scanMessage, setScanMessage] = useState('Aponte a câmera para o QR da sessão.');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string>('');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [oppLoading, setOppLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);

  useEffect(() => {
    setSession(loadSession());
    setSettings(loadSettings());
    setQueue(loadQueue());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadOpps() {
      setOppLoading(true);
      try {
        const base = settings.apiBaseUrl?.trim();
        const url =
          base && /^https?:\/\//i.test(base)
            ? `${base.replace(/\/$/, '')}/api/opportunities?limit=10`
            : '/api/opportunities?limit=10';
        const res = await fetch(url, { cache: 'no-store' });
        const data = (await res.json().catch(() => ({}))) as { opportunities?: Opportunity[] };
        if (!cancelled) setOpportunities(data.opportunities ?? []);
      } catch {
        if (!cancelled) setOpportunities([]);
      } finally {
        if (!cancelled) setOppLoading(false);
      }
    }
    void loadOpps();
    return () => {
      cancelled = true;
    };
  }, [settings.apiBaseUrl]);

  const scoreTop = topByScore(3);
  const valorTop = topByValorization(3);
  const statusLabel =
    session?.status === 'ready' ? 'Conectada' : session?.status === 'qr_ready' ? 'QR disponível' : 'Rascunho';

  const stats = useMemo(
    () => [
      { label: 'Regiões', value: INTELLIGENCE_REGIONS.length },
      { label: 'Top score', value: scoreTop[0]?.name ?? '—' },
      { label: 'Top valor.', value: valorTop[0]?.name ?? '—' },
    ],
    [scoreTop, valorTop],
  );

  useEffect(() => {
    let cancelled = false;
    if (!session) {
      setQrDataUrl('');
      return;
    }

    void QRCode.toDataURL(session.qrToken, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#111111',
        light: '#ffffff',
      },
    })
      .then((url: string) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  function createDraft() {
    const next: OpenWaSession = {
      name: name.trim() || 'landmap-openwa',
      phone: phone.trim(),
      status: 'qr_ready',
      sessionId: makeId(),
      qrToken: makeQrToken(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSession(next);
    saveSession(next);
  }

  function rotateQr() {
    if (!session) return;
    const next = { ...session, qrToken: makeQrToken(), updatedAt: new Date().toISOString(), status: 'qr_ready' as const };
    setSession(next);
    saveSession(next);
  }

  const markReady = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, status: 'ready' as const, updatedAt: new Date().toISOString() };
      saveSession(next);
      setScannerState('idle');
      setScanMessage('Sessão pareada com sucesso.');
      return next;
    });
  }, []);

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  async function copySessionId() {
    if (!session) return;
    await navigator.clipboard.writeText(session.sessionId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function sendTestDispatch(channel: 'email' | 'sms') {
    if (!session) return;
    const api = settings.automationApiUrl || '/api/automation/send';
    const to =
      channel === 'email'
        ? settings.reportEmail
        : settings.reportSms;
    if (!to) {
      setDispatchResult('Defina o destinatário nas configurações antes de enviar.');
      setDispatching(false);
      return;
    }
    const payload =
      channel === 'email'
        ? {
            channel,
            to,
            subject: 'LandMap · Teste de automação OpenWA',
            message: `Teste automático da sessão ${session.sessionId}. QR atual: ${session.qrToken}`,
          }
        : {
            channel,
            to,
            message: `Teste automático da sessão ${session.sessionId}. QR atual: ${session.qrToken}`,
          };

    setDispatching(true);
    setDispatchResult('');
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      setDispatchResult(res.ok ? `${channel.toUpperCase()} enviado via ${api}` : data.error || 'Falha ao enviar');
    } catch (error) {
      setDispatchResult(error instanceof Error ? error.message : 'Falha ao enviar');
    } finally {
      setDispatching(false);
    }
  }

  function toggleOpportunity(id: string) {
    setQueue((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveQueue(next);
      return next;
    });
  }

  async function dispatchOpportunity(id: string, channel: 'email' | 'sms') {
    const opp = opportunities.find((item) => item.id === id);
    if (!opp) return;
    const endpoint =
      settings.automationApiUrl?.replace(/\/send\/?$/, '/dispatch') ||
      '/api/automation/dispatch';
    const name = opp.name || opp.id;
    const message = `Oportunidade ${name}${opp.city ? ` em ${opp.city}/${opp.state ?? ''}` : ''} pronta para contato. Score ${opp.score ?? '—'}.`;
    const consent = {
      whatsapp: opp.consent?.whatsapp ?? 'opt_in',
      sms: opp.consent?.sms ?? 'opt_in',
      call: opp.consent?.call ?? 'none',
    };

    setDispatching(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: opp.id,
          name,
          city: opp.city,
          state: opp.state,
          score: opp.score ?? 60,
          stage: 'qualified',
          engagement: 1,
          intent: Math.min(1, Math.max(0, (opp.channelFit ?? 0.6))),
          followUpsSent: opp.followUpsSent ?? 0,
          daysSinceActivity: opp.daysSinceActivity ?? 1,
          toleranceDays: 7,
          channelFit: opp.channelFit ?? 0.6,
          consent,
          timezone: 'America/Sao_Paulo',
          draft: {
            whatsapp: message,
            sms: message,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { reason?: string; channel?: string; sent?: boolean };
      setDispatchResult(
        res.ok
          ? `Oportunidade ${name} enviada via dispatcher (${data.channel ?? 'whatsapp'})`
          : data.reason || 'Falha ao enviar oportunidade',
      );
    } catch (error) {
      setDispatchResult(error instanceof Error ? error.message : 'Falha ao enviar oportunidade');
    } finally {
      setDispatching(false);
    }
  }

  async function dispatchQueuedOpportunities() {
    const ids = queue.slice(0, 5);
    if (ids.length === 0) {
      setDispatchResult('Fila vazia.');
      return;
    }
    setDispatching(true);
    setDispatchResult('');
    try {
      for (const id of ids) {
        // encaminha cada item pela rota de dispatcher, respeitando consentimento
        // e cadência do motor já existente.
        // eslint-disable-next-line no-await-in-loop
        await dispatchOpportunity(id, 'email');
      }
      setDispatchResult(`Fila processada: ${ids.length} oportunidade(s).`);
    } finally {
      setDispatching(false);
    }
  }

  async function stopScanner() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScannerState('idle');
  }

  async function startScanner() {
    if (!session) return;
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setScannerState('unsupported');
      setScanMessage('Leitura por câmera não suportada neste navegador.');
      return;
    }

    const browser = window as BrowserWithBarcodeDetector;
    if (!browser.BarcodeDetector) {
      setScannerState('unsupported');
      setScanMessage('Este navegador não expõe BarcodeDetector. Use o campo manual abaixo.');
      return;
    }

    setScannerState('starting');
    setScanMessage('Inicializando câmera...');

    try {
      detectorRef.current = new browser.BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScannerState('scanning');
      setScanMessage('Câmera ativa. Aguardando leitura do QR...');
    } catch {
      setScannerState('error');
      setScanMessage('Falha ao iniciar a câmera.');
    }
  }

  useEffect(() => {
    if (scannerState !== 'scanning' || !videoRef.current || !session || !detectorRef.current) return;

    let cancelled = false;
    let raf = 0;

    const tick = async () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || cancelled || video.readyState < 2) {
        raf = window.requestAnimationFrame(tick);
        return;
      }

      try {
        const codes = await detector.detect(video);
        const match = codes.find((code: BarcodeLike) => code.rawValue === session.qrToken);
        if (match) {
          setScannedValue(match.rawValue);
          setScanMessage('QR lido. Pareando a sessão...');
          await stopScanner();
          markReady();
          return;
        }
      } catch {
        // keep scanning
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [scannerState, session, markReady]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Admin · OpenWA</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Cockpit OpenWA</h1>
                <p className="mt-1 text-[var(--muted-foreground)]">QR, sessão e regras de lead para um número dedicado</p>
              </div>
            </div>
            <div className="rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-success">
              {statusLabel}
            </div>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{s.value}</p>
            </div>
          ))}
        </div>

        <section className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-4 self-start">
            <Card className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Navegação</p>
              <div className="mt-3 space-y-2">
                <Link href={`/${locale}/admin`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex w-full justify-start gap-2 rounded-2xl')}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <Link href={`/${locale}/admin/webhooks`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex w-full justify-start gap-2 rounded-2xl')}>
                  <BellRing className="h-3.5 w-3.5" />
                  Webhooks
                </Link>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Nova sessão</p>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] text-[var(--muted-foreground)]">Nome da sessão</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] text-[var(--muted-foreground)]">Número dedicado</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+55 85 99999-9999"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </label>
                <button
                  onClick={createDraft}
                  className="w-full rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
                >
                  Criar / atualizar
                </button>
              </div>
            </Card>

              <Card className="p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">Regras de lead</p>
              <div className="mt-3 space-y-2">
                {rules.map((rule) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                      rule.enabled
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] bg-[var(--background)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">{rule.label}</span>
                      <Badge variant={rule.enabled ? 'success' : 'outline'}>{rule.channel}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{rule.note}</p>
                  </button>
                ))}
              </div>
              </Card>

              <Card className="p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">Automação</p>
                <div className="mt-3 space-y-2 text-xs text-[var(--muted-foreground)]">
                  <p>Endpoint: {settings.automationApiUrl || '/api/automation/send'}</p>
                  <p>E-mail: {settings.reportEmail || 'ltdapax9@gmail.com'}</p>
                  <p>SMS: {settings.reportSms || '+5500000000000'}</p>
                  <p>playSMS: {settings.playsmsUrl || 'não configurado'}</p>
                  <p>Webhook SMS: {settings.smsWebhookUrl || 'não configurado'}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => sendTestDispatch('email')}
                    disabled={!session || dispatching}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90 disabled:opacity-50"
                  >
                    Testar e-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => sendTestDispatch('sms')}
                    disabled={!session || dispatching}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)] disabled:opacity-50"
                  >
                    Testar SMS
                  </button>
                  <button
                    type="button"
                    onClick={dispatchQueuedOpportunities}
                    disabled={!session || dispatching || queue.length === 0}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)] disabled:opacity-50"
                  >
                    Processar fila
                  </button>
                </div>
                {dispatchResult && (
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">{dispatchResult}</p>
                )}
              </Card>

              <Card className="p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">Oportunidades</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {oppLoading ? 'Carregando oportunidades…' : `${opportunities.length} oportunidades encontradas`}
                </p>
                <div className="mt-3 space-y-2">
                  {opportunities.slice(0, 5).map((opp) => {
                    const selected = queue.includes(opp.id);
                    return (
                      <div key={opp.id} className="rounded-2xl border border-[var(--border)] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              {opp.name || opp.id}
                            </p>
                            <p className="text-[11px] text-[var(--muted-foreground)]">
                              {opp.city ? `${opp.city}/${opp.state ?? ''}` : 'sem local'}
                              {typeof opp.score === 'number' ? ` · score ${opp.score}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleOpportunity(opp.id)}
                            className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] transition hover:bg-[var(--muted)]"
                          >
                            {selected ? 'Na fila' : 'Filtrar'}
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!session || dispatching}
                            onClick={() => dispatchOpportunity(opp.id, 'email')}
                            className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-[11px] font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90 disabled:opacity-50"
                          >
                            E-mail
                          </button>
                          <button
                            type="button"
                            disabled={!session || dispatching}
                            onClick={() => dispatchOpportunity(opp.id, 'sms')}
                            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] transition hover:bg-[var(--muted)] disabled:opacity-50"
                          >
                            SMS
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {opportunities.length === 0 && !oppLoading && (
                    <p className="text-xs text-[var(--muted-foreground)]">Sem oportunidades carregadas.</p>
                  )}
                </div>
              </Card>
            </aside>

          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">QR</p>
                    <h2 className="mt-1 text-2xl font-bold text-[var(--foreground)]">Leitura de QR / pairing</h2>
                  </div>
                  <button onClick={rotateQr} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)]">Rotacionar QR</button>
                </div>
                <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-8">
                  {session ? (
                    <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
                      <div className="grid h-56 w-56 place-items-center rounded-2xl bg-white p-4 shadow-sm">
                        {qrDataUrl ? (
                          <Image
                            src={qrDataUrl}
                            alt="QR da sessão OpenWA"
                            width={224}
                            height={224}
                            unoptimized
                            className="h-full w-full rounded-xl object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <Code2 className="mx-auto h-10 w-10 text-[var(--primary)]" />
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Gerando QR</p>
                            <p className="mt-2 font-mono text-sm text-[var(--foreground)]">{session.qrToken}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Leitura</p>
                            <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)]">Scanner da câmera</h3>
                          </div>
                          <div className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] text-[var(--muted-foreground)]">
                            {scannerState}
                          </div>
                        </div>

                        <video
                          ref={videoRef}
                          playsInline
                          muted
                          className="aspect-video w-full rounded-2xl border border-[var(--border)] bg-black object-cover"
                        />

                        <p className="text-sm text-[var(--muted-foreground)]">{scanMessage}</p>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={scannerState === 'scanning' ? stopScanner : startScanner}
                            className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
                          >
                            {scannerState === 'scanning' ? 'Parar leitura' : 'Iniciar leitura'}
                          </button>
                          <button
                            type="button"
                            onClick={rotateQr}
                            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)]"
                          >
                            Rotacionar QR
                          </button>
                        </div>

                        <label className="block">
                          <span className="mb-1 block text-[11px] text-[var(--muted-foreground)]">Ou cole o valor lido manualmente</span>
                          <input
                            value={scannedValue}
                            onChange={(e) => setScannedValue(e.target.value)}
                            placeholder="Cole o QR lido aqui"
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            if (!session) return;
                            if (scannedValue.trim() === session.qrToken) {
                              markReady();
                            } else {
                              setScanMessage('O valor não bate com o QR atual da sessão.');
                            }
                          }}
                          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)]"
                        >
                          Confirmar leitura manual
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid h-56 w-full place-items-center rounded-2xl bg-white shadow-sm">
                      <p className="text-sm text-[var(--muted-foreground)]">Crie a sessão para gerar o QR.</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={markReady} disabled={!session} className="rounded-full bg-success px-4 py-2 text-sm font-medium text-success-foreground transition hover:bg-success/90 disabled:opacity-50">
                    Marcar como pronta
                  </button>
                  <button onClick={copySessionId} disabled={!session} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)] disabled:opacity-50">
                    <Copy className="mr-1 inline h-4 w-4" />
                    {copied ? 'Copiado' : 'Copiar sessionId'}
                  </button>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Resumo</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    <li>• Uma sessão por número de WhatsApp.</li>
                    <li>• Admin controla QR e status.</li>
                    <li>• Leads quentes entram nas regras acima.</li>
                    <li>• Pronto para plugar o serviço real depois.</li>
                  </ul>
                </Card>
                <Card className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Atenção</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Esta tela é o cockpit de operação. Para produção real, a sessão OpenWA precisa estar rodando na sua infraestrutura.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
