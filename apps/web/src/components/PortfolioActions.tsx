'use client';

import { useState } from 'react';
import { Share2, FileText, Copy } from './lovable/icons';
import { Button } from '@landmap/ui';

export function PortfolioActions() {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateShareLink = () => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/portfolio/share/${Math.random().toString(36).substr(2, 9)}`;
    setShareLink(link);
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const exportCSV = () => {
    const data = [
      ['Região', 'Cidade', 'Score', 'Preço/m²', 'Cap Rate', 'Tendência'],
      ['Jardim Paulista', 'São Paulo', '92', 'R$ 12.500', '7.2%', '↑ +3.2%'],
      ['Vila Mariana', 'São Paulo', '88', 'R$ 11.800', '6.8%', '↑ +2.8%'],
    ];

    const csv = data.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={generateShareLink}
        className="gap-2"
      >
        <Share2 className="h-3.5 w-3.5" />
        Compartilhar portfólio
      </Button>

      {shareLink && (
        <div className="flex gap-2 items-center bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="bg-transparent text-xs max-w-xs outline-none"
          />
          <button
            onClick={copyToClipboard}
            className="text-primary hover:bg-primary/10 rounded p-1 transition"
          >
            <Copy className="h-3 w-3" />
          </button>
          {copied && <span className="text-[10px] font-medium text-green-500">Copiado!</span>}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={exportCSV}
        className="gap-2"
      >
        <FileText className="h-3.5 w-3.5" />
        Exportar CSV
      </Button>
    </div>
  );
}
