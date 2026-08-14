import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface AgentPhoneConfig {
  apiKey: string;
  baseUrl: string;
}

interface VoiceAgent {
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

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  country: string;
  status: 'active' | 'inactive';
  agentId: string;
  createdAt: string;
}

interface CallRecord {
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

interface VoiceOption {
  voiceId: string;
  name: string;
  provider: string;
  gender: 'male' | 'female' | 'neutral';
}

const DEFAULT_VOICES: VoiceOption[] = [
  { voiceId: '11labs-Brian', name: 'Brian', provider: 'elevenlabs', gender: 'male' },
  { voiceId: '11labs-Sophia', name: 'Sophia', provider: 'elevenlabs', gender: 'female' },
  { voiceId: '11labs-Arthur', name: 'Arthur', provider: 'elevenlabs', gender: 'male' },
  { voiceId: 'alloy', name: 'Alloy', provider: 'openai', gender: 'neutral' },
  { voiceId: 'nova', name: 'Nova', provider: 'openai', gender: 'female' },
  { voiceId: 'onyx', name: 'Onyx', provider: 'openai', gender: 'male' },
  { voiceId: 'Polly.Amy', name: 'Amy', provider: 'aws', gender: 'female' },
  { voiceId: 'Polly.Brian', name: 'Brian (Polly)', provider: 'aws', gender: 'male' },
];

const g = globalThis as unknown as {
  __landmapAgentPhoneConfig?: AgentPhoneConfig;
  __landmapAgentPhoneAgents?: Map<string, VoiceAgent>;
  __landmapAgentPhoneNumbers?: Map<string, PhoneNumber>;
  __landmapAgentPhoneCalls?: CallRecord[];
};

function getConfig(): AgentPhoneConfig {
  if (!g.__landmapAgentPhoneConfig) {
    g.__landmapAgentPhoneConfig = {
      apiKey: process.env.AGENTPHONE_API_KEY || '',
      baseUrl: 'https://api.agentphone.to/v1',
    };
  }
  return g.__landmapAgentPhoneConfig;
}

function getAgents(): Map<string, VoiceAgent> {
  if (!g.__landmapAgentPhoneAgents) {
    g.__landmapAgentPhoneAgents = new Map();
  }
  return g.__landmapAgentPhoneAgents;
}

function getNumbers(): Map<string, PhoneNumber> {
  if (!g.__landmapAgentPhoneNumbers) {
    g.__landmapAgentPhoneNumbers = new Map();
  }
  return g.__landmapAgentPhoneNumbers;
}

function getCalls(): CallRecord[] {
  if (!g.__landmapAgentPhoneCalls) {
    g.__landmapAgentPhoneCalls = [];
  }
  return g.__landmapAgentPhoneCalls;
}

async function fetchAgentPhone(endpoint: string, options?: RequestInit) {
  const config = getConfig();
  if (!config.apiKey) {
    throw new Error('AGENTPHONE_API_KEY not configured');
  }

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`AgentPhone API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const agentphoneRouter = new Hono();

agentphoneRouter.use('*', cors());

// Health check
agentphoneRouter.get('/health', (c) => {
  const config = getConfig();
  return c.json({
    status: 'ok',
    apiKeyConfigured: !!config.apiKey,
    agentsCount: getAgents().size,
    numbersCount: getNumbers().size,
    callsCount: getCalls().length,
  });
});

// List available voices
agentphoneRouter.get('/voices', (c) => {
  return c.json({
    data: DEFAULT_VOICES,
    total: DEFAULT_VOICES.length,
  });
});

// Create agent
agentphoneRouter.post('/agents', async (c) => {
  try {
    const body = await c.req.json<Partial<VoiceAgent>>();

    const agent: VoiceAgent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: body.name || 'Unnamed Agent',
      voiceMode: body.voiceMode || 'hosted',
      systemPrompt: body.systemPrompt || '',
      beginMessage: body.beginMessage || '',
      voice: body.voice || '11labs-Brian',
      phoneNumbers: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    getAgents().set(agent.id, agent);

    // Sync with AgentPhone API if configured
    try {
      await fetchAgentPhone('/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: agent.name,
          description: `LandMap agent · ${agent.voiceMode} mode`,
          voiceMode: agent.voiceMode,
          systemPrompt: agent.systemPrompt,
          beginMessage: agent.beginMessage,
          voice: agent.voice,
        }),
      });
    } catch {
      // Gracefully degrade if API key not configured
    }

    return c.json(agent, 201);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to create agent' }, 400);
  }
});

// List agents
agentphoneRouter.get('/agents', (c) => {
  const agents = Array.from(getAgents().values());
  return c.json({
    data: agents,
    total: agents.length,
  });
});

// Get agent
agentphoneRouter.get('/agents/:id', (c) => {
  const id = c.req.param('id');
  const agent = getAgents().get(id);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  return c.json(agent);
});

// Update agent
agentphoneRouter.patch('/agents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const agent = getAgents().get(id);
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    const updates = await c.req.json<Partial<VoiceAgent>>();
    const updated: VoiceAgent = {
      ...agent,
      ...updates,
      id: agent.id,
      createdAt: agent.createdAt,
      updatedAt: new Date().toISOString(),
    };

    getAgents().set(id, updated);

    try {
      await fetchAgentPhone(`/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch {
      // Gracefully degrade
    }

    return c.json(updated);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update agent' }, 400);
  }
});

// Delete agent
agentphoneRouter.delete('/agents/:id', async (c) => {
  const id = c.req.param('id');
  const agent = getAgents().get(id);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  try {
    await fetchAgentPhone(`/agents/${id}`, { method: 'DELETE' });
  } catch {
    // Gracefully degrade
  }

  getAgents().delete(id);
  return c.json({ success: true, message: 'Agent deleted' });
});

// Buy phone number
agentphoneRouter.post('/numbers', async (c) => {
  try {
    const body = await c.req.json<{ country?: string; areaCode?: string; agentId: string }>();

    const phoneNumber: PhoneNumber = {
      id: `pn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      phoneNumber: `+1555${Math.random().toString().slice(2, 7).padStart(7, '0')}`,
      country: body.country || 'US',
      status: 'active',
      agentId: body.agentId,
      createdAt: new Date().toISOString(),
    };

    getNumbers().set(phoneNumber.id, phoneNumber);

    const agent = getAgents().get(body.agentId);
    if (agent) {
      agent.phoneNumbers.push(phoneNumber.phoneNumber);
      agent.updatedAt = new Date().toISOString();
    }

    try {
      await fetchAgentPhone('/numbers', {
        method: 'POST',
        body: JSON.stringify({
          country: body.country,
          areaCode: body.areaCode,
          agentId: body.agentId,
        }),
      });
    } catch {
      // Gracefully degrade
    }

    return c.json(phoneNumber, 201);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to buy number' }, 400);
  }
});

// List numbers
agentphoneRouter.get('/numbers', (c) => {
  const numbers = Array.from(getNumbers().values());
  return c.json({
    data: numbers,
    total: numbers.length,
  });
});

// Release number
agentphoneRouter.delete('/numbers/:id', async (c) => {
  const id = c.req.param('id');
  const number = getNumbers().get(id);
  if (!number) {
    return c.json({ error: 'Number not found' }, 404);
  }

  try {
    await fetchAgentPhone(`/numbers/${id}`, { method: 'DELETE' });
  } catch {
    // Gracefully degrade
  }

  const agent = getAgents().get(number.agentId);
  if (agent) {
    agent.phoneNumbers = agent.phoneNumbers.filter((pn) => pn !== number.phoneNumber);
    agent.updatedAt = new Date().toISOString();
  }

  getNumbers().delete(id);
  return c.json({ success: true, message: 'Number released' });
});

// Make outbound call
agentphoneRouter.post('/calls', async (c) => {
  try {
    const body = await c.req.json<{
      agentId: string;
      toNumber: string;
      initialGreeting?: string;
      voice?: string;
      systemPrompt?: string;
    }>();

    const agent = getAgents().get(body.agentId);
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    const call: CallRecord = {
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      agentId: body.agentId,
      phoneNumber: agent.phoneNumbers[0] || '+1555XXXX',
      fromNumber: agent.phoneNumbers[0] || '+1555XXXX',
      toNumber: body.toNumber,
      direction: 'outbound',
      status: 'in-progress',
      durationSeconds: 0,
      transcript: '',
      startedAt: new Date().toISOString(),
      endedAt: '',
    };

    getCalls().push(call);

    try {
      await fetchAgentPhone('/calls', {
        method: 'POST',
        body: JSON.stringify({
          agentId: body.agentId,
          toNumber: body.toNumber,
          initialGreeting: body.initialGreeting,
          voice: body.voice || agent.voice,
          systemPrompt: body.systemPrompt || agent.systemPrompt,
        }),
      });
    } catch {
      // Gracefully degrade
    }

    return c.json(call, 201);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to make call' }, 400);
  }
});

// List calls
agentphoneRouter.get('/calls', (c) => {
  const limit = Number(c.req.query('limit')) || 50;
  const offset = Number(c.req.query('offset')) || 0;
  const calls = getCalls().slice(offset, offset + limit);

  return c.json({
    data: calls,
    total: getCalls().length,
    limit,
    offset,
  });
});

// Get call with transcript
agentphoneRouter.get('/calls/:id', (c) => {
  const id = c.req.param('id');
  const call = getCalls().find((call) => call.id === id);
  if (!call) {
    return c.json({ error: 'Call not found' }, 404);
  }
  return c.json(call);
});

// Simulate call completion
agentphoneRouter.post('/calls/:id/complete', async (c) => {
  try {
    const id = c.req.param('id');
    const call = getCalls().find((call) => call.id === id);
    if (!call) {
      return c.json({ error: 'Call not found' }, 404);
    }

    const body = await c.req.json<{ transcript?: string; durationSeconds?: number }>();

    call.status = 'completed';
    call.transcript = body.transcript || 'Call completed without transcript';
    call.durationSeconds = body.durationSeconds || Math.floor(Math.random() * 600 + 30);
    call.endedAt = new Date().toISOString();

    return c.json(call);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to complete call' }, 400);
  }
});

// Get usage stats
agentphoneRouter.get('/usage', (c) => {
  const calls = getCalls();
  const last30dCalls = calls.filter(
    (call) => new Date(call.startedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
  );
  const totalMinutes = last30dCalls.reduce((sum, call) => sum + call.durationSeconds, 0) / 60;

  return c.json({
    plan: { name: 'pro', numberLimit: 10 },
    numbers: { used: getNumbers().size, limit: 10 },
    stats: {
      callsLast30d: last30dCalls.length,
      minutesLast30d: Math.round(totalMinutes),
      agentsActive: Array.from(getAgents().values()).filter((a) => a.status === 'active').length,
    },
  });
});

// Set webhook
agentphoneRouter.post('/webhooks', async (c) => {
  try {
    const body = await c.req.json<{ url: string; contextLimit?: number }>();

    const webhook = {
      id: `wh_${Date.now()}`,
      url: body.url,
      secret: `whsec_${Math.random().toString(36).slice(2)}`,
      status: 'active',
      contextLimit: body.contextLimit || 10,
    };

    try {
      await fetchAgentPhone('/webhooks', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch {
      // Gracefully degrade
    }

    return c.json(webhook, 201);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to set webhook' }, 400);
  }
});

// Test webhook
agentphoneRouter.post('/webhooks/test', async (c) => {
  try {
    await fetchAgentPhone('/webhooks/test', { method: 'POST' });
    return c.json({ success: true, message: 'Webhook test sent' });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to test webhook' }, 400);
  }
});

export default agentphoneRouter;
