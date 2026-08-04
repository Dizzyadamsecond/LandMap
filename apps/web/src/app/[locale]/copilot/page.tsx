'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, ArrowLeft, Plus, FileText, Sparkles, Check, AlertTriangle } from '../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

export default function CopilotPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';

  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState<'idle' | 'scanning' | 'analyzing' | 'done'>('idle');
  const [photo, setPhoto] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);

  function simulateScan() {
    setStep('scanning');
    setScanning(true);
    setTimeout(() => {
      setStep('analyzing');
      setTimeout(() => {
        setOcrResult({
          docType: 'Matrícula de Registro Imobiliário',
          area: 1420.50,
          address: 'Av. Dom Luís, 1200 - Aldeota, Fortaleza - CE',
          owner: 'Desenvolvimento Imobiliário Ceará S/A',
          state: 'Livre de ônus judiciais ou alienações fiduciárias',
          structuralGrade: 'Excelente (Fachada Conservada)',
        });
        setStep('done');
        setScanning(false);
      }, 2000);
    }, 1500);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Field Agent App</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Investment Copilot Scan</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Capture fotos do imóvel ou documentos de cartório para análise instantânea por IA</p>
            </div>
          </div>
          <Link
            href={`/${locale}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Painel Geral
          </Link>
        </div>
      </header>

      {/* Camera Simulator */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 flex flex-col items-center justify-center border-dashed border-2 min-h-[300px] bg-[var(--card)] text-center relative overflow-hidden">
          {step === 'idle' && (
            <div className="space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] mx-auto text-[var(--primary)]">
                <Eye className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-sm">Simulador de Captura de Câmera</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Carregue um arquivo de matrícula imobiliária ou tire foto do terreno</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={simulateScan} size="sm">
                  Simular Captura Foto
                </Button>
                <Button variant="outline" size="sm" onClick={simulateScan}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Subir Documento
                </Button>
              </div>
            </div>
          )}

          {step === 'scanning' && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-t-[var(--primary)] border-[var(--border)] animate-spin mx-auto" />
              <p className="text-sm font-semibold">Buscando telemetria GPS e foco óptico...</p>
              <Badge variant="outline">OCR Matcher v2.1</Badge>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="space-y-3">
              <Sparkles className="h-10 w-10 text-[var(--primary)] animate-bounce mx-auto" />
              <p className="text-sm font-semibold">Analisando matrícula do cartório por IA...</p>
              <p className="text-xs text-[var(--muted-foreground)]">Calculando consistência de área e zoneamento municipal</p>
            </div>
          )}

          {step === 'done' && ocrResult && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-center gap-2 text-success font-bold text-lg">
                <Check className="h-6 w-6" />
                OCR Realizado!
              </div>
              <div className="text-left bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] space-y-2 text-xs">
                <p><strong>Tipo:</strong> {ocrResult.docType}</p>
                <p><strong>Área Cartorial:</strong> {ocrResult.area.toLocaleString()} m²</p>
                <p><strong>Endereço:</strong> {ocrResult.address}</p>
                <p><strong>Proprietário:</strong> {ocrResult.owner}</p>
                <p><strong>Situação Legal:</strong> {ocrResult.state}</p>
                <p><strong>Estado Fachada:</strong> {ocrResult.structuralGrade}</p>
              </div>
              <Button onClick={() => setStep('idle')} variant="outline" size="sm">
                Escanear Outro Ativo
              </Button>
            </div>
          )}
        </Card>

        {/* Info panel */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--primary)]" />
            Por que usar o Copilot Scan?
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Nossa IA móvel permite que o corretor ou engenheiro em campo tire fotos diretamente de documentos físicos de cartório, processando na nuvem a detecção de área útil, restrições construtivas e histórico do proprietário cadastrado.
          </p>

          <div className="border-t border-[var(--border)] pt-4 space-y-3">
            <div className="flex gap-3 items-start">
              <Check className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-xs font-semibold">OCR Integrado</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">Extrai textos da matrícula com precisão.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="text-xs font-semibold">Análise de Risco Geológico</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">Alerta se o terreno possui restrição de declive ou preservação.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
