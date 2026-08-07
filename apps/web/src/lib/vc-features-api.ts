// Client library for VC-Essential Features (Risk, Compliance, Analytics, Matching)
// Used by existing pages without creating new routes

export interface RiskAssessment {
  assessment_id: string;
  score: number;
  label: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  signals: Array<{ signal_type: string; severity: string; description: string }>;
  creditworthiness_score: number;
}

export interface KYCStatus {
  id?: string;
  status: 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired';
  face_verification_status?: string;
  document_verification_status?: string;
  aml_screening_status?: string;
  verified_at?: string;
}

export interface Document {
  id: string;
  document_type: string;
  ocr_status: 'pending' | 'processing' | 'complete' | 'failed';
  ocr_text?: string;
  extracted_data?: Record<string, any>;
  signature_status: 'unsigned' | 'signed' | 'pending_signature';
  created_at: string;
}

export interface PortfolioAnalytics {
  total_invested_cents: number;
  roi_pct: number;
  risk_exposure_pct: number;
  roi_1m?: number;
  roi_3m?: number;
  roi_6m?: number;
  roi_ytd?: number;
  property_count: number;
  updated_at?: string;
}

export interface MarketHeat {
  location: string;
  demand_index: number;
  price_trend: 'up' | 'stable' | 'down';
  price_change_pct?: number;
  inventory_level?: number;
  transaction_volume_24h?: number;
  avg_price_per_sqm_brl?: number;
  median_days_to_sell?: number;
  updated_at?: string;
}

export interface AIMatch {
  id: string;
  property_id: string;
  match_score: number;
  match_factors: Record<string, any>;
  predicted_offer_price_cents: number;
  probability_acceptance_pct: number;
  property?: {
    title: string;
    location: string;
    price_cents: number;
  };
}

export interface PricePrediction {
  id: string;
  predicted_price_cents: number;
  confidence_interval_lower_cents: number;
  confidence_interval_upper_cents: number;
  confidence_pct: number;
  factors?: Record<string, any>;
  created_at: string;
}

export interface FraudSignal {
  id: string;
  anomaly_score: number;
  signal_type: string;
  reason?: string;
  action_taken: 'flagged' | 'blocked' | 'reviewed' | 'cleared';
  created_at: string;
}

const API_BASE = '/api/vc';

async function fetchVC<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': typeof window !== 'undefined' ? (window as any)._userId || 'guest' : 'guest',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`VC API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Risk Assessment
export async function assessRisk(
  offerId: string,
  buyerId: string,
  propertyId: string,
  offerAmountCents: number,
  buyerProfile: Record<string, any>
): Promise<RiskAssessment> {
  return fetchVC<RiskAssessment>('/risk/assess', {
    method: 'POST',
    body: JSON.stringify({
      offerId,
      buyerId,
      propertyId,
      offerAmountCents,
      buyerProfile,
    }),
  });
}

export async function getRiskAssessment(assessmentId: string): Promise<RiskAssessment> {
  return fetchVC<RiskAssessment>(`/risk/${assessmentId}`);
}

// KYC/AML Verification
export async function startKYCVerification(provider?: string): Promise<{ id: string; status: string }> {
  return fetchVC<{ id: string; status: string }>('/kyc/verify', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  });
}

export async function getKYCStatus(): Promise<KYCStatus> {
  return fetchVC<KYCStatus>('/kyc/status');
}

// Document Management
export async function uploadDocument(
  propertyId: string,
  documentType: string,
  filePath: string,
  mimeType: string
): Promise<Document> {
  return fetchVC<Document>('/documents', {
    method: 'POST',
    body: JSON.stringify({
      propertyId,
      documentType,
      filePath,
      mimeType,
    }),
  });
}

export async function getDocument(documentId: string): Promise<Document> {
  return fetchVC<Document>(`/documents/${documentId}`);
}

// Portfolio Analytics
export async function getPortfolioAnalytics(): Promise<PortfolioAnalytics> {
  return fetchVC<PortfolioAnalytics>('/portfolio/analytics');
}

// Market Intelligence
export async function getMarketHeat(location: string): Promise<MarketHeat> {
  return fetchVC<MarketHeat>(`/market/heat/${encodeURIComponent(location)}`);
}

// AI Matching
export async function getMatches(limit?: number): Promise<{ matches: AIMatch[] }> {
  const params = limit ? `?limit=${limit}` : '';
  return fetchVC<{ matches: AIMatch[] }>(`/matching/recommendations${params}`);
}

// Price Predictions
export async function getPricePrediction(
  propertyId: string,
  timeframe: '7d' | '30d' | '90d' | '1y'
): Promise<PricePrediction> {
  return fetchVC<PricePrediction>(`/predictions/${propertyId}/${timeframe}`);
}

// Fraud Detection
export async function reportFraudSignal(
  transactionId: string,
  anomalyScore: number,
  signalType: string,
  reason?: string
): Promise<FraudSignal> {
  return fetchVC<FraudSignal>('/fraud/signal', {
    method: 'POST',
    body: JSON.stringify({
      transactionId,
      anomalyScore,
      signalType,
      reason,
    }),
  });
}
