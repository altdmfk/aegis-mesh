import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Zap, Server, RefreshCw } from 'lucide-react';

interface MetricData {
  time: string;
  incomingRps: number;
  upstreamRps: number;
  efficiency: number;
  coalescedCount: number;
}

export default function AegisDashboard() {
  const [data, setData] = useState<MetricData[]>([]);
  const [isLive, setIsLive] = useState(false);

  // SSE 구독 및 Mock 전환 로직
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let mockInterval: ReturnType<typeof setInterval> | null = null;

    if (isLive) {
      eventSource = new EventSource('/actuator/metrics-stream');
      eventSource.onmessage = (e) => {
        const newData = JSON.parse(e.data);
        setData((prev) => [...prev.slice(-29), newData]);
      };
    } else {
      mockInterval = setInterval(() => {
        setData((prev) => [...prev.slice(-29), generateMockData()]);
      }, 1000);
    }

    return () => {
      eventSource?.close();
      if (mockInterval) clearInterval(mockInterval);
    };
  }, [isLive]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      
      {/* 상단 Header */}
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-indigo-500 w-8 h-8" />
          <h1 className="text-2xl font-bold">Aegis-Mesh Gateway</h1>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold ml-4">
            Active (Netty 8443 / mTLS)
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <Stat name="Total Requests" value="253,741" color="text-indigo-600" />
          <Stat name="Availability" value="100.00%" color="text-emerald-600" />
          <Stat name="L1 Min Latency" value="1.01ms" color="text-slate-600" />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* 좌측 Control Panel */}
        <aside className="col-span-3 bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-amber-500" /> Traffic Control
          </h2>
          <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition">
            Normal Traffic (10 RPS)
          </button>
          <button className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-rose-200 rounded-lg transition shadow-sm">
            선착순 부하 발생 (500 RPS)
          </button>
          <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg mt-4 flex justify-center items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Cache Flush
          </button>
          <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">Live SSE 연동</span>
            <input 
              type="checkbox" 
              className="toggle-switch" 
              checked={isLive} 
              onChange={() => setIsLive(!isLive)} 
            />
          </div>
        </aside>

        {/* 중앙 Main Chart */}
        <main className="col-span-6 bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Single-Flight Traffic Protection</h2>
            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-semibold border border-indigo-100">
              방어율: {data[data.length - 1]?.efficiency.toFixed(1) || 100}%
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="stepAfter" dataKey="incomingRps" name="게이트웨이 유입 (RPS)" stroke="#F43F5E" strokeWidth={3} dot={false} />
                <Line type="stepAfter" dataKey="upstreamRps" name="백엔드 도달 (RPS)" stroke="#10B981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </main>

        {/* 우측 Metrics Panel */}
        <aside className="col-span-3 bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-500" /> System Metrics
          </h2>
          <div>
            <div className="flex justify-between text-sm mb-1"><span className="text-slate-500">L1 Cache Hit Rate</span><span className="font-bold">98.5%</span></div>
            <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '98.5%' }}></div></div>
          </div>
          <div>
            <span className="text-sm text-slate-500 block mb-1">P95 Latency</span>
            <span className="text-2xl font-bold text-slate-800">4.33 <span className="text-sm font-normal text-slate-500">ms</span></span>
          </div>
          <div className="mt-auto p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-xs font-bold text-emerald-600 block uppercase tracking-wider mb-1">Coalesced Requests</span>
            <span className="text-3xl font-extrabold text-emerald-700">
              {data[data.length - 1]?.coalescedCount.toLocaleString() || 0}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

// 상단 요약 컴포넌트
const Stat = ({ name, value, color }: { name: string; value: string; color: string }) => (
  <div className="flex flex-col text-right">
    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{name}</span>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
  </div>
);

// Mock 데이터 제너레이터 헬퍼
function generateMockData(): MetricData {
  return { time: new Date().toLocaleTimeString(), incomingRps: Math.floor(Math.random() * 5) + 10, upstreamRps: 1, efficiency: 99.8, coalescedCount: Math.floor(Math.random() * 100) };
}
