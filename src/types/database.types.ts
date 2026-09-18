// src/types/database.types.ts

export interface FishDetection {
  id?: string;
  created_at?: string;
  status: 'segar' | 'busuk';
  estimated_weight: number;
  estimated_volume: number;
  confidence_score: number;
  image_url?: string;
}

export interface DashboardStats {
  totalFresh: number;
  totalRotten: number;
  avgWeight: string;
  avgVolume: string;
}