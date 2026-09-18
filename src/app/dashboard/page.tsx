// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart3, Scale, Box, CheckSquare, XSquare, Loader2 } from 'lucide-react';
import { FishDetection, DashboardStats } from '@/types/database.types';

// Tipe Props untuk Komponen Card
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
    avgVolume: '0'
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
      // Cast data ke array FishDetection
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

    detections.forEach(d => {
      if (d.status === 'segar') fresh++;
      if (d.status === 'busuk') rotten++;
      totalW += Number(d.estimated_weight);
      totalV += Number(d.estimated_volume);
    });

    setStats({
      totalFresh: fresh,
      totalRotten: rotten,
      avgWeight: (totalW / detections.length).toFixed(1),
      avgVolume: (totalV / detections.length).toFixed(1)
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-orange-500">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="text-lg font-medium">Memuat Data Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 font-serif">Dashboard Statistik</h1>
          <p className="text-gray-600">Ringkasan hasil deteksi sistem AquaGrade AI.</p>
        </div>
        <button onClick={fetchData} className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md font-medium transition-colors">
          Refresh Data
        </button>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          icon={<CheckSquare className="text-green-500" size={32} />}
          title="Ikan Segar"
          value={stats.totalFresh}
          color="border-green-500"
        />
        <StatCard 
          icon={<XSquare className="text-red-500" size={32} />}
          title="Ikan Busuk"
          value={stats.totalRotten}
          color="border-red-500"
        />
        <StatCard 
          icon={<Scale className="text-orange-500" size={32} />}
          title="Rata-rata Berat"
          value={`${stats.avgWeight} g`}
          color="border-orange-500"
        />
        <StatCard 
          icon={<Box className="text-blue-500" size={32} />}
          title="Rata-rata Volume"
          value={`${stats.avgVolume} cm³`}
          color="border-blue-500"
        />
      </div>

      {/* Tabel Data */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="bg-black text-white p-4 flex items-center">
          <BarChart3 className="mr-2 text-orange-500" />
          <h2 className="font-bold text-lg">Histori Deteksi</h2>
        </div>
        
        {data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada data deteksi.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((item) => (
              <div key={item.id} className="w-full">
                <button 
                  onClick={() => setSelectedId(selectedId === item.id ? null : (item.id || null))}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-orange-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-4">
                    <span className={`w-3 h-3 rounded-full ${item.status === 'segar' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-mono text-sm text-gray-500">
                      {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span className="font-medium capitalize">{item.status}</span>
                    <span className="text-gray-400 text-sm">{selectedId === item.id ? '▼' : '▶'}</span>
                  </div>
                </button>

                {selectedId === item.id && (
                  <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">ID Deteksi</p>
                        <p className="font-mono text-xs truncate" title={item.id}>{item.id ? item.id.split('-')[0] + '...' : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Estimasi Berat</p>
                        <p className="font-semibold">{item.estimated_weight} g</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Estimasi Volume</p>
                        <p className="font-semibold">{item.estimated_volume} cm³</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Confidence Model</p>
                        <p className="font-semibold">{(item.confidence_score * 100).toFixed(1)}%</p>
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

// Komponen Card yang menggunakan Props TypeScript
function StatCard({ icon, title, value, color }: StatCardProps) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-b-4 ${color} flex items-center justify-between`}>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg">
        {icon}
      </div>
    </div>
  );
}