import { useState, useEffect, useMemo } from 'react';
import { Server, Users, Filter, Zap, RefreshCcw } from 'lucide-react';

type AnimState = 'IDLE' | 'SURGE' | 'FUNNEL' | 'UPSTREAM' | 'FANOUT' | 'DONE';

export default function SingleFlightVisualizer() {
  const [animState, setAnimState] = useState<AnimState>('IDLE');
  const [isSpike, setIsSpike] = useState(false);

  // 50개의 점 위치 난수(스캐터) 오프셋 미리 계산
  const dots = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      offsetX: Math.random() * 60 - 30,
      offsetY: Math.random() * 100 - 50,
      isLeader: i === 0,
    }));
  }, []);

  // 애니메이션 시퀀스 오케스트레이션
  const triggerAnimation = (spike: boolean) => {
    setIsSpike(spike);
    setAnimState('SURGE');
    setTimeout(() => setAnimState('FUNNEL'), 800);
    setTimeout(() => setAnimState('UPSTREAM'), 1600);
    setTimeout(() => setAnimState('FANOUT'), 3200);
    setTimeout(() => setAnimState('DONE'), 4200);
  };

  // 점 위치 및 색상 연산 (CSS Transition 전용)
  const getDotStyle = (dot: typeof dots[0]) => {
    const isVisible = animState !== 'IDLE' && (isSpike || dot.isLeader);
    let left = '15%';
    let top = `calc(50% + ${dot.offsetY}px)`;
    let bgColor = 'bg-rose-500';
    let opacity = isVisible ? '1' : '0';
    let scale = 'scale-100';

    if (animState === 'SURGE') {
      left = `calc(35% + ${dot.offsetX}px)`;
    } else if (animState === 'FUNNEL') {
      left = `calc(50% + ${dot.offsetX * 0.3}px)`; 
      top = `calc(50% + ${dot.offsetY * 0.3}px)`; // 큐 압축
      bgColor = 'bg-amber-500';
    } else if (animState === 'UPSTREAM') {
      if (dot.isLeader) {
        left = '85%';
        top = '50%';
        bgColor = 'bg-indigo-600';
        scale = 'scale-150 z-20';
      } else {
        left = `calc(50% + ${dot.offsetX * 0.3}px)`;
        top = `calc(50% + ${dot.offsetY * 0.3}px)`;
        bgColor = 'bg-slate-300'; // 대기 상태 회색조
      }
    } else if (animState === 'FANOUT') {
      left = `calc(50% + ${dot.offsetX * 0.3}px)`;
      top = `calc(50% + ${dot.offsetY * 0.3}px)`;
      bgColor = 'bg-emerald-500'; // 전원 200 OK 복제 완료
      scale = dot.isLeader ? 'scale-100' : 'scale-110';
    } else if (animState === 'DONE') {
      left = '15%';
      bgColor = 'bg-emerald-500';
      opacity = '0';
    }

    return {
      left,
      top,
      opacity,
      transform: `translate(-50%, -50%) ${scale === 'scale-100' ? 'scale(1)' : scale === 'scale-150 z-20' ? 'scale(1.5)' : 'scale(1.1)'}`,
      className: `absolute w-3 h-3 rounded-full transition-all duration-700 ease-in-out ${bgColor} ${dot.isLeader && animState === 'UPSTREAM' ? 'z-20' : 'z-10'} shadow-sm`
    };
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      
      {/* 최고 영향력 헤더 (Impact Banner) */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Cache Stampede Mitigation (Single-Flight)
        </h1>
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-semibold shadow-sm text-sm">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          500 Concurrent Ingress Requests ➔ Exactly 1 Upstream Evaluation ➔ 99.8% Downstream I/O Saved
        </div>
      </header>

      {/* 메인 관제 캔버스 (물리적 흐름 시각화) */}
      <main className="relative w-full max-w-6xl mx-auto h-[450px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex">
        
        {/* 구역 1: Ingress Clients */}
        <div className="flex-1 border-r border-slate-100 p-6 flex flex-col items-center justify-between relative bg-slate-50/50">
          <div className="text-center">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h2 className="font-bold text-slate-700">Clients (Ingress)</h2>
          </div>
          {animState === 'SURGE' && isSpike && (
            <div className="absolute top-1/3 w-full text-center animate-pulse text-rose-500 font-bold bg-rose-50 py-1 border-y border-rose-100">
              500 Incoming Concurrent Requests
            </div>
          )}
        </div>

        {/* 구역 2: Aegis-Mesh Gateway (Funnel) */}
        <div className="flex-[1.5] border-r border-slate-100 p-6 flex flex-col items-center justify-between relative">
          <div className="text-center">
            <Filter className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <h2 className="font-bold text-indigo-700">Aegis-Mesh (Single-Flight Engine)</h2>
          </div>
          {(animState === 'FUNNEL' || animState === 'UPSTREAM') && isSpike && (
            <div className="absolute top-[35%] w-[90%] text-center text-xs font-semibold bg-amber-50 text-amber-700 py-2 px-3 rounded-lg border border-amber-200 shadow-sm">
              1 Leader Executing | 499 In-Flight Coalesced<br/>(Zero Upstream Duplication)
            </div>
          )}
          {animState === 'FANOUT' && isSpike && (
            <div className="absolute top-[35%] w-[90%] text-center text-xs font-semibold bg-emerald-50 text-emerald-700 py-2 px-3 rounded-lg border border-emerald-200 shadow-sm">
              Single Response Cloned ➔ 500 Threads Resumed (200 OK)
            </div>
          )}
          {/* 퍼널 가이드 UI */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-dashed border-slate-200 rounded-full opacity-50 pointer-events-none"></div>
        </div>

        {/* 구역 3: Downstream Upstream */}
        <div className="flex-1 p-6 flex flex-col items-center justify-between relative bg-slate-50/50">
          <div className="text-center">
            <Server className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h2 className="font-bold text-slate-700">Upstream Backend</h2>
          </div>
          <div className="absolute bottom-1/4 w-full text-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors duration-500 ${animState === 'UPSTREAM' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
              Load: {animState === 'UPSTREAM' ? (isSpike ? '0.2%' : '0.2%') : '0.0%'} (Protected)
            </span>
          </div>
        </div>

        {/* 물리적 파티클(요청) 렌더링 */}
        {dots.map((dot) => {
          const { left, top, opacity, transform, className } = getDotStyle(dot);
          return (
            <div
              key={dot.id}
              className={className}
              style={{ left, top, opacity, transform }}
            />
          );
        })}
      </main>

      {/* 하단 제어 패널 */}
      <footer className="mt-8 max-w-2xl mx-auto w-full flex gap-4 justify-center">
        <button 
          onClick={() => triggerAnimation(false)}
          disabled={animState !== 'IDLE' && animState !== 'DONE'}
          className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold shadow-sm transition disabled:opacity-50"
        >
          Single Normal Request
        </button>
        <button 
          onClick={() => triggerAnimation(true)}
          disabled={animState !== 'IDLE' && animState !== 'DONE'}
          className="px-6 py-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          <Zap className="w-5 h-5 fill-rose-600" /> Simulate 500 Burst Spike
        </button>
        <button 
          onClick={() => setAnimState('IDLE')}
          className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold shadow-sm transition text-slate-500 flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Reset Animation
        </button>
      </footer>

    </div>
  );
}
