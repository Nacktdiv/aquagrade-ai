// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart3, Scale, Box, CheckSquare, XSquare, Loader2, Fish, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { FishDetection } from '@/types/database.types';

export interface DashboardStats {
  totalFresh: number;
  totalRotten: number;
  avgWeight: string;
  avgVolume: string;
  totalBangus: number;
  totalTilapia: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<FishDetection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalFresh: 0,
    totalRotten: 0,
    avgWeight: '0',
    avgVolume: '0',
    totalBangus: 0,
    totalTilapia: 0,
  });
  
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: detections, error } = await supabase
      .from('fish_detections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching data:", error);
    } else if (detections) {
      const typedDetections = detections as FishDetection[];
      setData(typedDetections);
      calculateStats(typedDetections);
    }
    setLoading(false);
  };

  const calculateStats = (detections: FishDetection[]) => {
    if (detections.length === 0) return;

    let fresh = 0;
    let rotten = 0;
    let totalW = 0;
    let totalV = 0;
    let bangusCount = 0;
    let tilapiaCount = 0;

    detections.forEach(d => {
      if (d.status === 'segar') fresh++;
      if (d.status === 'busuk') rotten++;
      
      const fishType = (d.fish_type || '').toLowerCase();
      if (fishType.includes('bangus')) bangusCount++;
      if (fishType.includes('tilapia')) tilapiaCount++;

      totalW += Number(d.estimated_weight);
      totalV += Number(d.estimated_volume);
    });

    setStats({
      totalFresh: fresh,
      totalRotten: rotten,
      avgWeight: (totalW / detections.length).toFixed(1),
      avgVolume: (totalV / detections.length).toFixed(1),
      totalBangus: bangusCount,
      totalTilapia: tilapiaCount,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-orange-500">
        <Loader2 size={40} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">Memuat statistik dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">Dashboard Statistik</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Ringkasan hasil akumulasi deteksi sistem AquaGrade AI.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="inline-flex items-center justify-center space-x-2 text-xs sm:text-sm bg-black text-white hover:bg-gray-800 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Grid Kartu Statistik (6 Card Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <StatCard 
          icon={<CheckSquare className="text-emerald-500" size={28} />}
          title="Ikan Segar"
          value={stats.totalFresh}
          color="border-emerald-500"
        />
        <StatCard 
          icon={<XSquare className="text-rose-500" size={28} />}
          title="Ikan Busuk"
          value={stats.totalRotten}
          color="border-rose-500"
        />
        <StatCard 
          icon={<Fish className="text-purple-500" size={28} />}
          title="Jumlah Ikan Bangus"
          value={stats.totalBangus}
          color="border-purple-500"
        />
        <StatCard 
          icon={<Fish className="text-teal-500" size={28} />}
          title="Jumlah Ikan Tilapia"
          value={stats.totalTilapia}
          color="border-teal-500"
        />
        <StatCard 
          icon={<Scale className="text-orange-500" size={28} />}
          title="Rata-rata Berat"
          value={`${stats.avgWeight} g`}
          color="border-orange-500"
        />
        <StatCard 
          icon={<Box className="text-blue-500" size={28} />}
          title="Rata-rata Volume"
          value={`${stats.avgVolume} cm³`}
          color="border-blue-500"
        />
      </div>

      {/* Tabel / Histori Deteksi */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="text-orange-500" size={20} />
            <h2 className="font-bold text-base sm:text-lg">Histori Pemindaian</h2>
          </div>
          <span className="text-xs text-gray-400 font-mono">{data.length} Total Data</span>
        </div>
        
        {data.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Belum ada histori deteksi ikan.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((item) => (
              <div key={item.id} className="w-full">
                <button 
                  onClick={() => setSelectedId(selectedId === item.id ? null : (item.id || null))}
                  className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-orange-50/50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.status === 'segar' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {item.fish_type || 'Ikan Tidak Diketahui'}
                      </p>
                      <p className="font-mono text-xs text-gray-500">
                        {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0 ml-2">
                    <span className={`font-semibold capitalize px-2.5 py-1 rounded-full text-xs ${item.status === 'segar' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {item.status}
                    </span>
                    <span className="text-gray-400">
                      {selectedId === item.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                  </div>
                </button>

                {/* Dropdown Rincian Data */}
                {selectedId === item.id && (
                  <div className="px-4 sm:px-6 py-3 bg-gray-50/80 border-t border-gray-100 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs sm:text-sm">
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-gray-500 text-[11px] mb-0.5">ID Deteksi</p>
                        <p className="font-mono text-gray-700 text-xs truncate" title={item.id}>{item.id ? item.id.split('-')[0] + '...' : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[11px] mb-0.5">Jenis Ikan</p>
                        <p className="font-semibold text-orange-600">{item.fish_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[11px] mb-0.5">Estimasi Berat</p>
                        <p className="font-semibold text-gray-900">{item.estimated_weight} g</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[11px] mb-0.5">Estimasi Volume</p>
                        <p className="font-semibold text-gray-900">{item.estimated_volume} cm³</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[11px] mb-0.5">Confidence Level</p>
                        <p className="font-semibold text-gray-900">{(item.confidence_score * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-b-4 ${color} flex items-center justify-between`}>
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="bg-gray-50 p-3 rounded-xl">
        {icon}
      </div>
    </div>
  );
}