/**
 * Voice Automation para LandMap Sales
 * Integra AgentPhone com sales squad (follow-up automático por voz)
 */

import { agentPhoneClient, waitForCallCompletion } from './agentphone';
import type { VoiceAgent } from './agentphone';

export interface VoiceFollowupTask {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCity: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyArea: number;
  draftMessage: string;
  voiceMode: 'greeting' | 'full_conversation';
}

/**
 * Faz follow-up de vendas via chamada de voz
 * Usa agente pré-configurado ou cria um novo
 */
export async function voiceFollowupLead(
  task: VoiceFollowupTask,
  agentId?: string
): Promise<{
  callId: string;
  status: 'completed' | 'in-progress' | 'failed';
  durationSeconds: number;
  transcript: string;
}> {
  // Se não tiver agente, usar default ou criar
  let agent: VoiceAgent;
  if (agentId) {
    agent = await agentPhoneClient.getAgent(agentId);
  } else {
    // Criar agente padrão de follow-up
    agent = await agentPhoneClient.createAgent({
      name: `Follow-up ${task.leadCity}`,
      voiceMode: 'hosted',
      systemPrompt: `Você é um agente de follow-up da LandMap.
Seu objetivo é acompanhar o interesse do lead em uma propriedade.
Nome do lead: ${task.leadName}
Propriedade: ${task.propertyTitle} em ${task.leadCity}, ${task.propertyArea}m², R$ ${task.propertyPrice.toLocaleString()}

Seja educado, profissional e genuíno. Qualifique o interesse e tente agendar uma visita.
Se o lead não está interessado, registre o motivo.`,
      beginMessage: task.draftMessage || `Olá ${task.leadName}, estou ligando para acompanhar seu interesse na propriedade que você consultou.`,
      voice: '11labs-Sophia',
    });
  }

  // Fazer a chamada
  const call = await agentPhoneClient.makeCall(agent.id, task.leadPhone, {
    initialGreeting: task.draftMessage || `Olá ${task.leadName}, estou ligando da LandMap.`,
  });

  // Esperar conclusão (timeout 10 minutos)
  try {
    const completed = await waitForCallCompletion(call.id, 600000);
    return {
      callId: completed.id,
      status: completed.status,
      durationSeconds: completed.durationSeconds,
      transcript: completed.transcript,
    };
  } catch {
    return {
      callId: call.id,
      status: 'in-progress',
      durationSeconds: 0,
      transcript: 'Chamada ainda em progresso...',
    };
  }
}

/**
 * Campanha de voz para múltiplos leads
 * Executa follow-ups sequenciais com delay
 */
export async function voiceFollowupCampaign(
  tasks: VoiceFollowupTask[],
  options?: {
    agentId?: string;
    delayBetweenCallsMs?: number;
    onCallComplete?: (task: VoiceFollowupTask, result: Awaited<ReturnType<typeof voiceFollowupLead>>) => Promise<void>;
  }
): Promise<Array<{ task: VoiceFollowupTask; result: any; error?: string }>> {
  const results: Array<{ task: VoiceFollowupTask; result: any; error?: string }> = [];
  const delayMs = options?.delayBetweenCallsMs || 15000; // 15s entre chamadas

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    try {
      const result = await voiceFollowupLead(task, options?.agentId);
      results.push({ task, result });

      if (options?.onCallComplete) {
        await options.onCallComplete(task, result);
      }

      // Delay antes da próxima (exceto na última)
      if (i < tasks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      results.push({
        task,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Automação de follow-up pós-venda
 * Liga para cliente após propriedade ser visitada
 */
export async function postSaleVoiceFollowup(
  propertyId: string,
  customerName: string,
  customerPhone: string,
  propertyDetails: { title: string; city: string; price: number }
): Promise<any> {
  const followupMessage = `Olá ${customerName}! Sou do time da LandMap. Você visitou nosso imóvel "${propertyDetails.title}" em ${propertyDetails.city}. Gostaria de saber sua impressão!`;

  return voiceFollowupLead({
    leadId: propertyId,
    leadName: customerName,
    leadPhone: customerPhone,
    leadCity: propertyDetails.city,
    propertyTitle: propertyDetails.title,
    propertyPrice: propertyDetails.price,
    propertyArea: 0,
    draftMessage: followupMessage,
    voiceMode: 'full_conversation',
  });
}

/**
 * Integração com sales.ts
 * Adiciona suporte a voice channel na squad de follow-up
 */
export interface SalesFollowupTaskWithVoice {
  id: string;
  kind: 'follow_up';
  channel: 'email' | 'sms' | 'waba' | 'voice'; // ← novo
  status: 'pending' | 'approved' | 'rejected';
  leadId: string;
  leadName: string;
  leadPhone?: string;
  draft: string;
  voiceAgentId?: string; // agente de voz a usar
  dueAt: string;
  createdAt: string;
}

/**
 * Processa fila de follow-ups de voz
 * Chamada pelo admin/agents auto-loop
 */
export async function processVoiceFollowupQueue(
  voiceFollowupTasks: SalesFollowupTaskWithVoice[]
): Promise<{
  processed: number;
  successful: number;
  failed: number;
  inProgress: number;
}> {
  let processed = 0;
  let successful = 0;
  let failed = 0;
  let inProgress = 0;

  for (const task of voiceFollowupTasks) {
    if (task.channel !== 'voice' || !task.leadPhone) continue;

    processed++;

    try {
      const result = await voiceFollowupLead(
        {
          leadId: task.leadId,
          leadName: task.leadName,
          leadPhone: task.leadPhone,
          leadCity: '', // será extraído do draft
          propertyTitle: '', // será extraído do draft
          propertyPrice: 0,
          propertyArea: 0,
          draftMessage: task.draft,
          voiceMode: 'greeting',
        },
        task.voiceAgentId
      );

      if (result.status === 'completed') {
        successful++;
      } else if (result.status === 'in-progress') {
        inProgress++;
      } else {
        failed++;
      }

      // Registrar resultado na BD
      // await recordVoiceFollowupResult(task.id, result);
    } catch (error) {
      failed++;
      console.error(`Voice followup failed for task ${task.id}:`, error);
    }
  }

  return { processed, successful, failed, inProgress };
}

/**
 * Simulador de chamada (para testes)
 * Não faz chamada real, só gera transcrição fake
 */
export async function simulateVoiceFollowup(task: VoiceFollowupTask): Promise<{
  callId: string;
  status: 'completed';
  durationSeconds: number;
  transcript: string;
}> {
  // Fake call ID
  const callId = `call_sim_${Date.now()}`;

  // Simular duração (30-300s)
  const durationSeconds = Math.floor(Math.random() * 270) + 30;

  // Simular transcrição
  const transcripts = [
    `Agent: Olá ${task.leadName}, estou ligando da LandMap sobre ${task.propertyTitle}.\nLead: Oi, tudo bem?\nAgent: Você ainda tem interesse na propriedade?\nLead: Tenho sim, mas preciso levar para a família avaliar.\nAgent: Perfeito! Agende uma visita em nossa plataforma.\nLead: Certo, vou fazer isso hoje.\nAgent: Obrigado! Um abraço.`,

    `Agent: Olá, LandMap chamando.\nLead: Não tenho interesse mais.\nAgent: Tudo bem, obrigado!`,

    `Agent: Seu imóvel em ${task.leadCity}...\nLead: Quanto tá saindo agora?\nAgent: R$ ${task.propertyPrice.toLocaleString()}. Quer visita?\nLead: Quando posso?\nAgent: Qualquer dia. Marca aí no app.\nLead: Marca pra quinta de manhã?\nAgent: Confirmado! Até lá.`,
  ];

  const transcript = transcripts[Math.floor(Math.random() * transcripts.length)];

  return {
    callId,
    status: 'completed',
    durationSeconds,
    transcript,
  };
}
