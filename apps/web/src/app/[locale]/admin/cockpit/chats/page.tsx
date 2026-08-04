'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Send, Check, Sparkles, User } from '../../../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

type Message = {
  id: string;
  sender: 'agent' | 'user' | 'system';
  text: string;
  timestamp: string;
};

type ChatSession = {
  id: string;
  clientName: string;
  phone: string;
  lastMessage: string;
  agentRole: string;
  autopilot: boolean;
  messages: Message[];
};

const INITIAL_CHATS: ChatSession[] = [
  {
    id: 'chat-1',
    clientName: 'Roberto Silva (Investidor)',
    phone: '+55 85 98112-9900',
    lastMessage: 'Quais são as taxas de permuta aceitas na região?',
    agentRole: 'Agente de Qualificação (Valquiria)',
    autopilot: true,
    messages: [
      { id: 'm1', sender: 'system', text: 'Sessão de qualificação iniciada pelo Lead Trigger.', timestamp: '14:20' },
      { id: 'm2', sender: 'agent', text: 'Olá Roberto, vi seu interesse no terreno da Aldeota. Sou a Valquiria do LandMap.', timestamp: '14:21' },
      { id: 'm3', sender: 'user', text: 'Olá, sim, gostaria de entender a viabilidade construtiva e se aceita permuta.', timestamp: '14:22' },
      { id: 'm4', sender: 'agent', text: 'Excelente! O terreno tem C.A. de 3.0. Aceitamos até 15% de permuta física no local. Faria sentido uma simulação de VGV?', timestamp: '14:23' },
      { id: 'm5', sender: 'user', text: 'Quais são as taxas de permuta aceitas na região?', timestamp: '14:24' },
    ],
  },
  {
    id: 'chat-2',
    clientName: 'Juliana Montenegro (Incorporadora)',
    phone: '+55 11 99881-2233',
    lastMessage: 'Gostei do lote do Eusébio, me mande a matrícula.',
    agentRole: 'Agente Follow-up (Felipe)',
    autopilot: false,
    messages: [
      { id: 'm6', sender: 'system', text: 'Fluxo de follow-up pós-visita ativado.', timestamp: '10:00' },
      { id: 'm7', sender: 'agent', text: 'Juliana, tudo bem? O que achou da metragem útil do lote que visitamos ontem?', timestamp: '10:02' },
      { id: 'm8', sender: 'user', text: 'Gostei do lote do Eusébio, me mande a matrícula.', timestamp: '10:05' },
    ],
  },
];

export default function CockpitChatsPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';
  const [chats, setChats] = useState<ChatSession[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState('chat-1');
  const [inputText, setInputText] = useState('');

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  function toggleAutopilot(id: string) {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, autopilot: !c.autopilot } : c))
    );
  }

  function handleSendMessage() {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: `m-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'agent', // Operator takes over
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        return {
          ...c,
          messages: [...c.messages, newMsg],
          lastMessage: newMsg.text,
        };
      })
    );
    setInputText('');

    // Simulate user reply if autopilot is off
    if (!activeChat.autopilot) {
      setTimeout(() => {
        const reply: Message = {
          id: `m-${Math.random().toString(36).slice(2, 6)}`,
          sender: 'user',
          text: 'Entendido, vou avaliar essa proposta e retorno em breve.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== activeChatId) return c;
            return {
              ...c,
              messages: [...c.messages, reply],
              lastMessage: reply.text,
            };
          })
        );
      }, 2000);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">CRM & Sales Cockpit</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Console de Chats Autopilot</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Monitore e intervenha em conversas do time de agentes com leads em tempo real</p>
            </div>
          </div>
          <Link
            href={`/${locale}/admin/cockpit`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Cockpit Admin
          </Link>
        </div>
      </header>

      {/* Grid Chats */}
      <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Sidebar chats list */}
        <Card className="p-4 space-y-3 h-[500px] overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Conversas Ativas</h3>
          <div className="space-y-2">
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChatId(c.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border border-[var(--border)] transition hover:bg-[var(--primary)]/5',
                  c.id === activeChatId && 'border-[var(--primary)] bg-[var(--primary)]/5'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs text-[var(--foreground)] truncate">{c.clientName}</span>
                  {c.autopilot && <Badge className="scale-75 origin-right">AI</Badge>}
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] truncate mt-1">{c.lastMessage}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Active Chat Log */}
        <Card className="p-5 flex flex-col justify-between h-[500px] border border-[var(--border)]">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h4 className="font-bold text-sm">{activeChat.clientName}</h4>
              <p className="text-[11px] text-[var(--muted-foreground)]">{activeChat.phone} · {activeChat.agentRole}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted-foreground)]">Modo Autopilot:</span>
              <button 
                onClick={() => toggleAutopilot(activeChat.id)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  activeChat.autopilot ? "bg-success" : "bg-[var(--border)]"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
                    activeChat.autopilot ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-2 scrollbar-thin">
            {activeChat.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col max-w-[80%] rounded-2xl p-3 text-xs',
                  m.sender === 'agent' && 'bg-[var(--primary)] text-[var(--primary-foreground)] ml-auto',
                  m.sender === 'user' && 'bg-[var(--muted)] text-[var(--foreground)] mr-auto border border-[var(--border)]',
                  m.sender === 'system' && 'bg-[var(--background)] border border-dashed border-[var(--border)] text-[var(--muted-foreground)] mx-auto max-w-full text-center'
                )}
              >
                {m.sender === 'system' ? (
                  <p>{m.text}</p>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {m.sender === 'agent' ? <Sparkles className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      <span>{m.sender === 'agent' ? 'Agente IA' : 'Cliente'}</span>
                    </div>
                    <p>{m.text}</p>
                    <div className="text-[9px] text-right mt-1 opacity-70 flex items-center justify-end gap-1">
                      {m.timestamp}
                      {m.sender === 'agent' && <Check className="h-3 w-3" />}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Input control */}
          <div className="flex gap-2 border-t border-[var(--border)] pt-3">
            <input
              type="text"
              placeholder={activeChat.autopilot ? 'Desative Autopilot para digitar...' : 'Digite a mensagem de intervenção manual...'}
              disabled={activeChat.autopilot}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs outline-none focus:border-[var(--primary)] disabled:opacity-50"
            />
            <Button onClick={handleSendMessage} disabled={activeChat.autopilot} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
