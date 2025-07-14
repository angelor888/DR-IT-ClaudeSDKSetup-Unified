// Analytics type definitions
export interface TimeSeriesData {
  date: Date;
  value: number;
  label?: string;
}

export interface Prediction {
  date: Date;
  value: number;
  confidence: number;
  upperBound?: number;
  lowerBound?: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // Percentage change
  seasonality?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    strength: number; // 0-1
  };
}

export interface RevenueForecast {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  predictions: Prediction[];
  trend: TrendAnalysis;
  factors: {
    name: string;
    impact: number; // -1 to 1
    description: string;
  }[];
  accuracy?: number;
}

export interface JobCompletionPrediction {
  jobId: string;
  estimatedCompletion: Date;
  confidence: number;
  riskFactors: {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    mitigation?: string;
  }[];
  onTimeProbability: number;
}

export interface ResourceOptimization {
  resource: string;
  currentUtilization: number;
  optimalUtilization: number;
  recommendations: {
    action: string;
    impact: string;
    priority: 'low' | 'medium' | 'high';
    estimatedSavings?: number;
  }[];
}

export interface CustomerChurnRisk {
  customerId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    factor: string;
    weight: number;
    value: any;
  }[];
  retentionStrategies: {
    strategy: string;
    effectiveness: number;
    cost: number;
  }[];
}

export interface SeasonalPattern {
  period: string;
  peakMonths: number[];
  lowMonths: number[];
  averageVariation: number;
  confidence: number;
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  category: 'revenue' | 'operations' | 'customers' | 'resources';
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  forecast?: Prediction[];
  insights?: string[];
}

export interface AnalyticsDashboard {
  metrics: AnalyticsMetric[];
  forecasts: {
    revenue: RevenueForecast;
    jobCompletions: JobCompletionPrediction[];
    resourceOptimization: ResourceOptimization[];
    customerChurn: CustomerChurnRisk[];
  };
  insights: {
    id: string;
    type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    suggestedActions?: string[];
    confidence: number;
    createdAt: Date;
  }[];
  lastUpdated: Date;
}

export interface ModelPerformance {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  dataPoints: number;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'timeseries' | 'classification' | 'regression' | 'clustering';
  target: string;
  features: string[];
  performance: ModelPerformance;
  status: 'training' | 'ready' | 'updating' | 'error';
}