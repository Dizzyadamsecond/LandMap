/**
 * AgentPhone Client SDK
 * Gerencia agentes de voz, números telefônicos, chamadas e transcrições
 * com integração automática com a API LandMap
 */

export interface VoiceAgent {
  id: string;
  name: string;
  voiceMode: 'hosted' | 'webhook';
  systemPrompt: string;
  beginMessage: string;
  voice: string;
  phoneNumbers: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PhoneNumber {
  id: string;
  phoneNumber: string;
  country: string;
  status: 'active' | 'inactive';
  agentId: string;
  createdAt: string;
}

export interface CallRecord {
  id: string;
  agentId: string;
  phoneNumber: string;
  fromNumber: string;
  toNumber: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'in-progress' | 'failed';
  durationSeconds: number;
  transcript: string;
  recordingUrl?: string;
  startedAt: string;
  endedAt: string;
}

export interface VoiceOption {
  voiceId: string;
  name: string;
  provider: string;
  gender: 'male' | 'female' | 'neutral';
}

export interface UsageStats {
  plan: { name: string; numberLimit: number };
  numbers: { used: number; limit: number };
  stats: {
    callsLast30d: number;
    minutesLast30d: number;
    agentsActive: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

class AgentPhoneClient {
  private baseUrl: string;

  constructor(baseUrl = `${API_BASE}/agentphone`) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`AgentPhone API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Health check
  async health() {
    return this.request<{
      status: string;
      apiKeyConfigured: boolean;
      agentsCount: number;
      numbersCount: number;
      callsCount: number;
    }>('/health');
  }

  // Voices
  async listVoices(): Promise<{ data: VoiceOption[]; total: number }> {
    return this.request('/voices');
  }

  // Agents
  async listAgents(): Promise<{ data: VoiceAgent[]; total: number }> {
    return this.request('/agents');
  }

  async getAgent(id: string): Promise<VoiceAgent> {
    return this.request(`/agents/${id}`);
  }

  async createAgent(agent: Partial<VoiceAgent>): Promise<VoiceAgent> {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, updates: Partial<VoiceAgent>): Promise<VoiceAgent> {
    return this.request(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAgent(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/agents/${id}`, { method: 'DELETE' });
  }

  // Phone Numbers
  async listNumbers(): Promise<{ data: PhoneNumber[]; total: number }> {
    return this.request('/numbers');
  }

  async buyNumber(agentId: string, country?: string, areaCode?: string): Promise<PhoneNumber> {
    return this.request('/numbers', {
      method: 'POST',
      body: JSON.stringify({ agentId, country, areaCode }),
    });
  }

  async releaseNumber(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/numbers/${id}`, { method: 'DELETE' });
  }

  // Calls
  async listCalls(limit = 50, offset = 0): Promise<{ data: CallRecord[]; total: number }> {
    return this.request(`/calls?limit=${limit}&offset=${offset}`);
  }

  async getCall(id: string): Promise<CallRecord> {
    return this.request(`/calls/${id}`);
  }

  async makeCall(
    agentId: string,
    toNumber: string,
    options?: { initialGreeting?: string; voice?: string; systemPrompt?: string }
  ): Promise<CallRecord> {
    return this.request('/calls', {
      method: 'POST',
      body: JSON.stringify({ agentId, toNumber, ...options }),
    });
  }

  async completeCall(id: string, transcript?: string, durationSeconds?: number): Promise<CallRecord> {
    return this.request(`/calls/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ transcript, durationSeconds }),
    });
  }

  // Usage
  async getUsage(): Promise<UsageStats> {
    return this.request('/usage');
  }

  // Webhooks
  async setWebhook(url: string, contextLimit?: number) {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, contextLimit }),
    });
  }

  async testWebhook() {
    return this.request('/webhooks/test', { method: 'POST' });
  }
}

export const agentPhoneClient = new AgentPhoneClient();

/**
 * Hook para usar AgentPhone em componentes React
 */
export function useAgentPhone() {
  const [agents, setAgents] = React.useState<VoiceAgent[]>([]);
  const [numbers, setNumbers] = React.useState<PhoneNumber[]>([]);
  const [calls, setCalls] = React.useState<CallRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const [agentsRes, numbersRes, callsRes] = await Promise.all([
        agentPhoneClient.listAgents(),
        agentPhoneClient.listNumbers(),
        agentPhoneClient.listCalls(100),
      ]);

      setAgents(agentsRes.data);
      setNumbers(numbersRes.data);
      setCalls(callsRes.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    agents,
    numbers,
    calls,
    loading,
    error,
    refresh,
    client: agentPhoneClient,
  };
}

// Import React para o hook
import * as React from 'react';

/**
 * Automação de chamadas em batch
 * Faz múltiplas chamadas para uma lista de números
 */
export async function batchMakeCalls(
  agentId: string,
  numbers: string[],
  options?: { initialGreeting?: string; delayMs?: number }
) {
  const results: Array<{ number: string; callId: string; error?: string }> = [];
  const delayMs = options?.delayMs || 5000; // Espera 5s entre chamadas para evitar rate limit

  for (const number of numbers) {
    try {
      const call = await agentPhoneClient.makeCall(agentId, number, {
        initialGreeting: options?.initialGreeting,
      });
      results.push({ number, callId: call.id });

      // Delay antes da próxima chamada
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      results.push({
        number,
        callId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Monitora chamadas até que se completem
 */
export async function waitForCallCompletion(
  callId: string,
  maxWaitMs = 600000,
  pollIntervalMs = 2000
): Promise<CallRecord> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const call = await agentPhoneClient.getCall(callId);

    if (call.status === 'completed' || call.status === 'failed') {
      return call;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Call ${callId} did not complete within ${maxWaitMs}ms`);
}

/**
 * Cria um agente com configuração prévia de voz
 */
export async function createPreconfiguredAgent(name: string, template: 'sales' | 'support' | 'lead-gen') {
  const templates = {
    sales: {
      voiceMode: 'hosted' as const,
      systemPrompt:
        'Você é um agente de vendas profissional da LandMap. Seu objetivo é engajar o prospect sobre imóveis, entender necessidades e agendar uma visita ou apresentação. Seja amigável mas profissional. Use os dados que tiver disponível.',
      beginMessage: 'Olá! Tudo bem? Estou ligando da LandMap sobre uma oportunidade de imóvel que achei interessante para você.',
      voice: '11labs-Sophia',
    },
    support: {
      voiceMode: 'hosted' as const,
      systemPrompt:
        'Você é um agente de suporte da LandMap. Ajude o cliente com dúvidas sobre propriedades, contratos, agendamento de visitas ou qualquer dúvida sobre nossos serviços. Seja empático e resolva o problema.',
      beginMessage: 'Olá! Bem-vindo à LandMap. Como posso ajudá-lo hoje?',
      voice: '11labs-Brian',
    },
    'lead-gen': {
      voiceMode: 'hosted' as const,
      systemPrompt:
        'Você é um agente de prospecção. Seu objetivo é qualificar leads, entender seu interesse em imóveis, capturar informações de contato e agendar follow-ups. Seja conversador e genuino.',
      beginMessage: 'Oi! Estou aqui para te mostrar oportunidades de imóvel que estão quentes agora na LandMap.',
      voice: '11labs-Sophia',
    },
  };

  return agentPhoneClient.createAgent({
    name,
    ...templates[template],
  });
}
