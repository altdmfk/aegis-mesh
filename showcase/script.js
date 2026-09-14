document.addEventListener('DOMContentLoaded', () => {
  // --- Language Toggle Logic ---
  const translations = {
    en: {
      subtitle: 'High-Throughput Zero-Trust Architecture',
      tab1: 'Zero-Trust Ticketing Demo',
      tab2: 'FIDO2 PoP Pipeline',
      tab3: 'Architecture & Single-Flight',
      bp_tag_1: 'Production Demo',
      bp_title_1: 'Zero-Trust Ticketing',
      bp_sub_1: 'End-to-end operational flow',
      bp_conn_1: '→',
      bp_tag_2: 'Ingress Security',
      bp_title_2: 'FIDO2 Hardware PoP',
      bp_sub_2: 'Fast-fail edge authorization',
      bp_tag_3: 'Concurrency Engine',
      bp_title_3: 'Aegis-Mesh Reactive Core',
      bp_sub_3: 'Single-flight & in-process cache',
      bp_caption: 'A unified zero-trust edge gateway integrating hardware-bound identity verification with non-blocking concurrency control for microservice architectures.',
      card_a: 'Without Single-Flight (Baseline)',
      card_b: 'With Aegis-Mesh (Active)',
      btn_single: 'Single Request',
      btn_burst: 'Simulate 500 Burst Spike',
      btn_reset: 'Reset',
      btn_paper: 'Read Paper',
      t3_caption: 'This system trace demonstrates Aegis-Mesh handling 500 simultaneous requests. Only 1 request reaches the backend DB, while the remaining 499 requests coalesce in-flight into the existing reactive stream to receive the cached response immediately with Zero DB I/O.',
      trace_idle: 'Waiting for incoming requests...',
      ctx_tab2: 'Deep dive into the Ingress Layer — rejects macro replays and session hijacking at the network edge before hitting downstream services.',
      ctx_tab3: 'Deep dive into the Gateway Core — non-blocking Single-Flight pattern that coalesces 500 concurrent requests into 1 upstream evaluation.',
      t1_caption: 'Demonstrating how edge authentication and reactive gateway concurrency combine to handle high-traffic reservation bursts without upstream bottlenecks.',
      t1_legit_header: 'Legitimate Client',
      t1_sys_title: 'System: Dual-Engine Zero-Trust Gateway',
      t1_sys_badge1: 'Ingress Security: FIDO2 Fast-Fail PoP',
      t1_sys_badge2: 'Concurrency Core: Aegis-Mesh (Reactive Single-Flight & L1 Cache)',
      t1_res_title: 'Ticket Reservation',
      t1_res_desc: 'Select an available seat.',
      t1_btn_reserve: 'Reserve Ticket',
      t1_callout: 'This ticketing interface acts as a live client testing the integrated pipeline: The ingress layer validates client hardware identity to block stolen-token macros at the edge, while Aegis-Mesh coalesces high-concurrency seat reservation bursts to protect upstream databases from cache stampedes.',
      t1_attack_header: 'Attacker Simulation & Logs',
      t1_macro_title: 'Macro Replay Attack',
      t1_macro_desc: 'Attacker intercepts a valid JWT and replays it rapidly to snatch tickets.',
      t1_btn_macro: 'Run Macro',
      t1_tamper_title: 'Payload Tampering',
      t1_tamper_desc: 'Attacker intercepts JWT and alters the seat ID without a valid FIDO2 signature.',
      t1_btn_tamper: 'Inject Payload',
      t2_title: 'FIDO2 Hardware-Bound Proof-of-Possession',
      t2_badge: '100 VU benchmark ➔ 780 RPS (+437%), latency reduced by 94%',
      t2_desc: 'Fast-Fail Verification: O(1) sliding window, streaming SHA-256 for rapid rejection.',
      t3_title: 'Cache Stampede Mitigation (Single-Flight)',
      t3_badge: '500 concurrent ingress requests coalesced into 1 upstream query (99.8% downstream I/O reduction)',
      t3_desc: 'Mitigates cache stampedes under high concurrency by acquiring a non-blocking mutex on the first incoming key. Subsequent identical requests subscribe to the shared reactive publisher (Mono.share()), receiving the broadcasted response upon completion without querying upstream resources.',
      t3_db: 'Upstream DB I/O',
      t3_pool: 'Connection Pool Usage',
      t3_lat: 'P99 Tail Latency',
      t3_legend1: 'Leader Executing (~35ms)',
      t3_legend2: 'In-Flight Coalescing',
      t3_legend3: 'Resolved & Broadcasted',
      t1_stage: 'STAGE',
      t1_leg_vip: 'VIP',
      t1_leg_reg: 'Regular',
      t1_leg_taken: 'Taken',
      t1_leg_sel: 'Selected',
      t1_badge_macro: '🚫 Macro Replay Blocked: FIDO2 PoP Nonce Mismatch',
      t1_badge_tamper: '⚠️ Signature Mismatch: ECDSA Verification Failed'
    },
    ko: {
      subtitle: '대규모 분산 제로트러스트 게이트웨이 아키텍처',
      tab1: '제로트러스트 티켓팅 데모',
      tab2: 'FIDO2 PoP 보안 파이프라인',
      tab3: '아키텍처 & 단일 비행(Single-Flight)',
      bp_tag_1: '통합 데모',
      bp_title_1: '제로트러스트 티켓팅',
      bp_sub_1: '실시간 통합 예매 시나리오',
      bp_conn_1: '→',
      bp_tag_2: '인그레스 보안',
      bp_title_2: 'FIDO2 하드웨어 PoP',
      bp_sub_2: '엣지 고속 인가 및 위변조 방어',
      bp_tag_3: '동시성 엔진',
      bp_title_3: 'Aegis-Mesh 리액티브 코어',
      bp_sub_3: '단일 비행 및 인메모리 캐싱',
      bp_caption: '하드웨어 기반 신원 검증과 논블로킹 동시성 제어를 통합하여 마이크로서비스 백엔드를 보호하는 제로트러스트 엣지 게이트웨이 아키텍처입니다.',
      card_a: '일반 게이트웨이 (미적용)',
      card_b: 'Aegis-Mesh 적용 (동시성 제어)',
      btn_single: '단일 요청',
      btn_burst: '500건 동시 버스트 시뮬레이션',
      btn_reset: '초기화',
      btn_paper: '논문 보기',
      t3_caption: '이 시스템 트레이스는 Aegis-Mesh가 500개의 동시 요청을 처리하는 과정을 보여줍니다. 단 1개의 요청만 백엔드 DB로 전달되며, 나머지 499개 요청은 In-Flight 상태에서 기존 스트림에 병합되어 대기하다 DB 부하 없이(Zero I/O) 캐시된 응답을 즉시 반환받습니다.',
      trace_idle: '인그레스 요청 대기 중...',
      ctx_tab2: '인그레스 레이어 심층 분석 — 백엔드 도달 전 네트워크 엣지에서 매크로 리플레이 및 세션 하이재킹을 차단합니다.',
      ctx_tab3: '게이트웨이 코어 심층 분석 — 500개의 동시 요청을 1개의 업스트림 요청으로 병합하는 논블로킹 Single-Flight 패턴입니다.',
      t1_caption: '엣지 하드웨어 바인딩 인증과 게이트웨이 동시성 제어가 결합하여, 백엔드 병목 없이 대규모 예매 트래픽을 처리하는 아키텍처를 시연합니다.',
      t1_legit_header: '정상 클라이언트',
      t1_sys_title: '시스템: 듀얼 엔진 제로트러스트 게이트웨이',
      t1_sys_badge1: '인그레스 보안: FIDO2 고속 차단 PoP',
      t1_sys_badge2: '동시성 코어: Aegis-Mesh (리액티브 단일 비행 및 L1 캐시)',
      t1_res_title: '티켓 예매',
      t1_res_desc: '좌석을 선택해 주세요.',
      t1_btn_reserve: '티켓 예매',
      t1_callout: '티켓팅 인터페이스는 통합 파이프라인을 테스트하는 라이브 클라이언트 역할을 합니다. 인그레스 엣지에서 탈취된 토큰의 매크로 공격을 차단하고, 게이트웨이 코어에서 대규모 동시성 요청을 병합하여 캐시 스탬피드를 방어합니다.',
      t1_attack_header: '공격자 시뮬레이션 & 로그',
      t1_macro_title: '매크로 리플레이 공격',
      t1_macro_desc: '공격자가 유효한 JWT를 탈취하여 티켓을 선점하기 위해 초고속으로 반복 전송합니다.',
      t1_btn_macro: '매크로 실행',
      t1_tamper_title: '페이로드 위변조',
      t1_tamper_desc: '공격자가 JWT를 탈취한 후 유효한 FIDO2 서명 없이 좌석 ID를 조작합니다.',
      t1_btn_tamper: '페이로드 주입',
      t2_title: 'FIDO2 하드웨어 바인딩 Proof-of-Possession',
      t2_badge: '100 VU 벤치마크 ➔ 780 RPS (+437%), 지연시간 94% 감소',
      t2_desc: '고속 검증 (Fast-Fail): O(1) 슬라이딩 윈도우 및 고속 차단을 위한 스트리밍 SHA-256 구조를 사용합니다.',
      t3_title: '캐시 스탬피드 방어 (Single-Flight)',
      t3_badge: '500개의 동시 인그레스 요청을 1개의 업스트림 쿼리로 병합 (다운스트림 I/O 99.8% 절감)',
      t3_desc: '첫 번째 유입 키에 대해 논블로킹 Mutex를 획득하여 대규모 동시성 환경에서 캐시 스탬피드를 방어합니다. 후속 동일 요청들은 공유된 리액티브 퍼블리셔(Mono.share())를 구독하고, 완료 시 업스트림 쿼리 없이 결과를 브로드캐스트 받습니다.',
      t3_db: '업스트림 DB I/O',
      t3_pool: '커넥션 풀 사용률',
      t3_lat: 'P99 꼬리 지연시간',
      t3_legend1: '리더 실행 중 (~35ms)',
      t3_legend2: '비행 중 병합 대기 (In-Flight)',
      t3_legend3: '완료 및 브로드캐스트',
      t1_stage: 'STAGE',
      t1_leg_vip: 'VIP석',
      t1_leg_reg: '일반석',
      t1_leg_taken: '예매 완료',
      t1_leg_sel: '선택됨',
      t1_badge_macro: '🚫 매크로 공격 엣지 차단: FIDO2 Nonce 불일치',
      t1_badge_tamper: '⚠️ 위변조 차단: ECDSA 서명 검증 실패'
    }
  };

  let currentLang = 'en';
  const btnKo = document.getElementById('lang-ko');
  const btnEn = document.getElementById('lang-en');

  function updateLanguage(lang) {
    currentLang = lang;
    if (btnKo) btnKo.classList.toggle('active', lang === 'ko');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    const terminals = document.querySelectorAll('.sf-log-line.idle');
    terminals.forEach(term => {
      term.textContent = translations[lang].trace_idle;
    });
  }

  if (btnKo) btnKo.addEventListener('click', () => updateLanguage('ko'));
  if (btnEn) btnEn.addEventListener('click', () => updateLanguage('en'));
  
  // Initialize default language
  updateLanguage('en');

  // --- Tab Switching Logic ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      document.getElementById(targetId).classList.add('active');
    });
  });

  // --- Seat Selection Logic ---
  const seatGrid = document.querySelector('.seat-grid');
  const checkoutBtn = document.getElementById('checkout-btn');
  let selectedSeatNode = null;
  let selectedSeatLabel = null;

  const rows = ['A', 'B', 'C', 'D', 'E'];
  const cols = 8;
  const seatElements = [];

  rows.forEach((rowName, rIdx) => {
    const label = document.createElement('div');
    label.className = 'seat-row-label';
    label.textContent = rowName;
    seatGrid.appendChild(label);

    const type = (rIdx < 2) ? 'vip' : 'reg';

    for(let c = 1; c <= cols; c++) {
      const seat = document.createElement('div');
      const seatLabel = `${rowName}-${c}`;
      seat.className = `seat ${type}`;
      seat.title = `Seat ${seatLabel} ${type === 'vip' ? '(VIP)' : ''}`;
      
      if (Math.random() < 0.2) {
        seat.classList.add('taken');
      } else {
        seat.addEventListener('click', () => {
          if(seat.classList.contains('taken') || seat.classList.contains('confirmed')) return;
          seatElements.forEach(s => s.classList.remove('selected'));
          seat.classList.add('selected');
          selectedSeatNode = seat;
          selectedSeatLabel = seatLabel;
          checkoutBtn.disabled = false;
        });
        seatElements.push(seat);
      }
      seatGrid.appendChild(seat);
    }
  });

  // --- Terminal Logging Logic ---
  const terminalLog = document.getElementById('terminal-log');

  const pad = (num, len = 2) => num.toString().padStart(len, '0');
  const getTimestamp = () => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
  };

  function logToTerminal(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="time">[${getTimestamp()}]</span> ${message}`;
    terminalLog.appendChild(entry);
    terminalLog.scrollTop = terminalLog.scrollHeight;
  }

  // --- Simulation Control Logic ---
  let checkoutTimeout = null;

  // 1. Normal Booking (FIDO2 Bound)
  checkoutBtn.addEventListener('click', () => {
    if (!selectedSeatLabel) return;
    
    logToTerminal(`[Client] Initiating checkout for seat ${selectedSeatLabel}...`, 'info');
    checkoutBtn.disabled = true;
    
    if (checkoutTimeout) clearTimeout(checkoutTimeout);
    
    checkoutTimeout = setTimeout(() => {
      logToTerminal('[Paper 10 / FIDO2] ECDSA Signature and Nonce freshness verified.', 'info');
      logToTerminal(`[Aegis-Mesh / Mesh] 200 OK - Seat ${selectedSeatLabel} successfully reserved.`, 'success');
      
      if (selectedSeatNode) {
        selectedSeatNode.classList.remove('selected');
        selectedSeatNode.classList.add('confirmed');
        selectedSeatNode.style.pointerEvents = 'none';
      }
      selectedSeatLabel = null;
      selectedSeatNode = null;
    }, 600);
  });

  // 2. Macro Replay Attack Simulation
  document.getElementById('btn-simulate-macro').addEventListener('click', () => {
    logToTerminal('[Attacker] Executing replay script: firing 50 requests with stolen JWT...', 'warning');
    
    const overlay = document.getElementById('attack-overlay-macro');
    overlay.className = 'attack-overlay';
    overlay.innerHTML = `<span data-i18n="t1_badge_macro">${translations[currentLang].t1_badge_macro || '🚫 Macro Replay Blocked: FIDO2 PoP Nonce Mismatch'}</span>`;
    
    const targets = [...seatElements].sort(() => 0.5 - Math.random()).slice(0, 10);
    targets.forEach(s => s.classList.add('attack-flash'));
    
    setTimeout(() => {
      overlay.className = 'attack-overlay hidden';
      targets.forEach(s => s.classList.remove('attack-flash'));
      logToTerminal('[Paper 10 / FIDO2] Macro blocked at edge ingress. Reused nonce detected (0.38ms). Zero seats leaked.', 'success');
    }, 600);
  });

  // 3. Payload Tampering Simulation
  document.getElementById('btn-simulate-tamper').addEventListener('click', () => {
    logToTerminal('[Attacker] Injecting tampered JWT (Seat changed without re-signing)...', 'warning');
    
    const overlay = document.getElementById('attack-overlay-macro');
    overlay.className = 'attack-overlay tamper';
    overlay.innerHTML = `<span data-i18n="t1_badge_tamper">${translations[currentLang].t1_badge_tamper || '⚠️ Signature Mismatch: ECDSA Verification Failed'}</span>`;
    
    const vipSeats = seatElements.filter(s => s.classList.contains('vip') && !s.classList.contains('taken'));
    const target = vipSeats.length > 0 ? vipSeats[Math.floor(Math.random() * vipSeats.length)] : seatElements[0];
    if (target) target.classList.add('tamper-flash');
    
    setTimeout(() => {
      if (target) target.classList.remove('tamper-flash');
      overlay.className = 'attack-overlay hidden';
      logToTerminal('[Paper 10 / FIDO2] Request dropped: Hardware signature verification failed (ECDSA P-256).', 'error');
    }, 600);
  });

  // --- Single-Flight Dashboard Logic (Metrics & Waterfall) ---
  const btnSingle = document.getElementById('sf-btn-single');
  const btnBurst = document.getElementById('sf-btn-burst');
  const btnReset = document.getElementById('sf-btn-reset');
  
  const mDbOff = document.getElementById('metric-db-off');
  const mPoolOff = document.getElementById('metric-pool-off');
  const mLatOff = document.getElementById('metric-lat-off');
  const barPoolOff = document.getElementById('bar-pool-off');
  
  const mDbOn = document.getElementById('metric-db-on');
  const mPoolOn = document.getElementById('metric-pool-on');
  const mLatOn = document.getElementById('metric-lat-on');
  const barPoolOn = document.getElementById('bar-pool-on');

  const wfDynamicRows = document.getElementById('wf-dynamic-rows');
  const fanoutBadge = document.getElementById('fanout-badge');

  let sfTimeouts = [];
  
  function clearSfTimeouts() {
    sfTimeouts.forEach(clearTimeout);
    sfTimeouts = [];
  }

  const wfData = [];
  for (let i = 1; i <= 3; i++) {
    wfData.push({
      id: i,
      label: i === 1 ? 'Req #1 [Leader]' : `Req #${i}`,
      type: i === 1 ? 'leader' : 'coalesced'
    });
  }
  wfData.push({
    id: 'ellipsis',
    label: '...',
    type: 'coalesced',
    isEllipsis: true
  });
  wfData.push({
    id: 500,
    label: 'Req #500',
    type: 'coalesced'
  });

  function renderWaterfall(isBurst) {
    wfDynamicRows.innerHTML = '';
    const rowsToRender = isBurst ? wfData : [wfData[0]];
    
    rowsToRender.forEach(d => {
      const row = document.createElement('div');
      row.className = 'wf-row';
      row.id = `wf-row-${d.id}`;
      if (d.isEllipsis) {
        row.innerHTML = `
          <div class="wf-label" style="text-align: center; color: #64748b; font-weight: bold;">...</div>
          <div class="wf-bar-container"></div>
        `;
      } else {
        row.innerHTML = `
          <div class="wf-label">${d.label}</div>
          <div class="wf-bar-container">
            <div class="wf-bar" id="wf-bar-${d.id}"></div>
            <span class="wf-bar-text" id="wf-text-${d.id}"></span>
          </div>
        `;
      }
      wfDynamicRows.appendChild(row);
    });
  }

  const termBody = document.getElementById('sf-term-body');

  function clearTerminal() {
    if(termBody) {
      termBody.innerHTML = `<div class="sf-log-line idle">${translations[currentLang].trace_idle}</div>`;
    }
  }

  function appendLog(level, message, delay = 0) {
    if (!termBody) return;
    if (delay === 0) {
      const line = document.createElement('div');
      line.className = `sf-log-line ${level.toLowerCase()}`;
      line.innerHTML = `<span class="time">[${getTimestamp()}]</span> <span class="prefix">[${level.toUpperCase()}]</span> ${message}`;
      termBody.appendChild(line);
      termBody.scrollTop = termBody.scrollHeight;
    } else {
      sfTimeouts.push(setTimeout(() => appendLog(level, message, 0), delay));
    }
  }

  function resetDashboard() {
    clearSfTimeouts();
    mDbOff.textContent = '0';
    mPoolOff.textContent = '0%';
    mLatOff.textContent = '0';
    barPoolOff.style.width = '0%';
    
    mDbOn.textContent = '0';
    mPoolOn.textContent = '0.0%';
    mLatOn.textContent = '0';
    barPoolOn.style.width = '0%';
    
    mDbOff.classList.remove('text-danger');
    mPoolOff.classList.remove('text-danger');
    mLatOff.classList.remove('text-danger');
    barPoolOff.classList.remove('danger');
    barPoolOff.classList.add('danger');
    
    wfDynamicRows.innerHTML = '';
    
    const scrubber = document.getElementById('wf-scrubber');
    if(scrubber) {
      scrubber.style.transition = 'none';
      scrubber.style.opacity = '0';
      scrubber.style.transform = 'translateX(0%)';
    }
    
    if(fanoutBadge) fanoutBadge.style.opacity = '0';
    const savedBadge = document.getElementById('saved-badge');
    if (savedBadge) savedBadge.style.opacity = '0';
    
    btnSingle.disabled = false;
    btnBurst.disabled = false;
    
    clearTerminal();
  }

  function animateCount(elem, endVal, duration, suffix = '') {
    const steps = 20;
    const stepTime = duration / steps;
    const inc = endVal / steps;
    let curr = 0;
    
    elem.textContent = '0' + suffix;
    const timer = setInterval(() => {
      curr += inc;
      if (curr >= endVal) {
        curr = endVal;
        clearInterval(timer);
      }
      elem.textContent = (Number.isInteger(endVal) ? Math.floor(curr) : curr.toFixed(1)) + suffix;
    }, stepTime);
    sfTimeouts.push(timer);
  }

  function runSimulation(isBurst) {
    clearSfTimeouts();
    btnSingle.disabled = true;
    btnBurst.disabled = true;
    
    renderWaterfall(isBurst); 
    
    if (termBody) {
      const idleLine = termBody.querySelector('.idle');
      if (idleLine) idleLine.remove();
    }
    
    if (fanoutBadge) fanoutBadge.style.opacity = '0';
    const savedBadge = document.getElementById('saved-badge');
    if (savedBadge) savedBadge.style.opacity = '0';
    
    mDbOff.classList.remove('text-danger');
    mPoolOff.classList.remove('text-danger');
    mLatOff.classList.remove('text-danger');

    const scrubber = document.getElementById('wf-scrubber');
    scrubber.style.transition = 'none';
    scrubber.style.opacity = '0';
    scrubber.style.transform = 'translateX(0%)';

    const duration = 600; // Snappy 0.6s total

    // Phase 1: Instant Ingress
    if (isBurst) {
      animateCount(mDbOff, 500, duration);
      animateCount(mLatOff, 1240, duration);
      
      sfTimeouts.push(setTimeout(() => {
        mDbOff.classList.add('text-danger');
        mPoolOff.classList.add('text-danger');
        mLatOff.classList.add('text-danger');
      }, duration));
      
      barPoolOff.style.transition = `width ${duration}ms ease-out`;
      barPoolOff.style.width = '100%';
      animateCount(mPoolOff, 100, duration, '%');

      // Instant cascade (all at exactly 0ms baseline simultaneously)
      wfData.forEach((d) => {
        const row = document.getElementById(`wf-row-${d.id}`);
        if (row) row.classList.add('show');
        
        if (d.type === 'coalesced') {
          const bar = document.getElementById(`wf-bar-${d.id}`);
          const text = document.getElementById(`wf-text-${d.id}`);
          if (bar && text) {
            bar.className = 'wf-bar wait active';
            bar.style.width = '15px'; // frozen short
            text.textContent = 'Waiting on Leader Mutex...';
          }
        }
      });
      
      appendLog('trace', '[Ingress] Concurrent burst detected on URI: /api/v1/ticket');
      for (let i = 1; i <= 6; i++) {
        appendLog('trace', `[Ingress] Routing Request #${i} to authentication filter...`, i * 5);
      }
      appendLog('trace', '[Ingress] ... and 494 more requests arrived simultaneously.', 35);
      appendLog('trace', '[Single-Flight] Cache Miss! Request #1 acquired the mutex and is promoted as Leader.', 45);
      appendLog('trace', '[Reactive Mesh] Requests #2 to #500 blocked from backend. Coalesced into shared Mono.share() pipeline.', 55);

    } else {
      mDbOff.textContent = '1';
      mLatOff.textContent = '35';
      barPoolOff.style.transition = `width 0.2s linear`;
      barPoolOff.style.width = '1%';
      mPoolOff.textContent = '1%';
      
      const row = document.getElementById('wf-row-1');
      if (row) row.classList.add('show');
      
      appendLog('trace', '[Ingress] Single reservation request received. No active in-flight queue, dispatching directly to backend DB.');
    }

    mDbOn.textContent = '1';
    barPoolOn.style.width = '0.2%';
    mPoolOn.textContent = '0.2%';

    // Phase 2: Leader active
    sfTimeouts.push(setTimeout(() => {
      scrubber.style.transition = `transform ${duration}ms ease-in-out`;
      scrubber.style.opacity = '1';
      scrubber.style.transform = 'translateX(90%)';

      const leaderBar = document.getElementById('wf-bar-1');
      const leaderText = document.getElementById('wf-text-1');
      if (leaderBar && leaderText) {
        leaderBar.className = 'wf-bar leader active';
        leaderBar.style.transition = `width ${duration}ms ease-out`;
        leaderBar.style.width = '80%';
        leaderText.textContent = 'Upstream DB fetching...';
      }
    }, 20));

    // Phase 3: Resolution Snap
    sfTimeouts.push(setTimeout(() => {
      mLatOn.textContent = isBurst ? '4.1' : '35.0';
      scrubber.style.opacity = '0';
      
      const leaderBar = document.getElementById('wf-bar-1');
      const leaderText = document.getElementById('wf-text-1');
      if (leaderBar && leaderText) {
        leaderBar.className = 'wf-bar resolved active';
        leaderBar.style.transition = 'width 0.1s ease-out';
        leaderBar.style.width = '100%';
        leaderText.textContent = '200 OK - DB Response Received';
      }
      
      if (isBurst) {
        wfData.forEach(d => {
          if (d.type === 'coalesced') {
            const bar = document.getElementById(`wf-bar-${d.id}`);
            const text = document.getElementById(`wf-text-${d.id}`);
            if (bar && text) {
              bar.className = 'wf-bar resolved active';
              bar.style.transition = 'width 0.1s ease-out';
              bar.style.width = '100%'; 
              text.textContent = 'Resolved via shared Mono.share()';
            }
          }
        });
        if (fanoutBadge) {
          fanoutBadge.textContent = '⚡ 499 In-Flight Requests Resolved in 0.08ms with 0 Additional DB Queries';
          fanoutBadge.style.opacity = '1';
        }
        if (savedBadge) savedBadge.style.opacity = '1';
        
        appendLog('trace', '[00:00.035] Upstream: Leader received 200 OK from Auth-Service (35ms roundtrip).');
        appendLog('success', '[00:00.035] Fan-Out: Emitted cached payload to 499 awaiting subscribers in 0.04ms. Downstream I/O saved: 99.8%.');
      } else {
        appendLog('success', '[Upstream DB] Successfully fetched data from the backend DB (35ms roundtrip).');
      }
      
      btnSingle.disabled = false;
      btnBurst.disabled = false;
    }, duration + 50));
  }

  btnSingle.addEventListener('click', () => runSimulation(false));
  btnBurst.addEventListener('click', () => runSimulation(true));
  btnReset.addEventListener('click', resetDashboard);

  resetDashboard();
});

// Paper Modal Logic
document.addEventListener('DOMContentLoaded', () => {
  const btnReadPaper = document.getElementById('btn-read-paper');
  const modalOverlay = document.getElementById('paper-modal');
  const modalClose = document.getElementById('close-modal');
  const paperContent = document.getElementById('paper-content');

  if (btnReadPaper && modalOverlay && modalClose && paperContent) {
    let paperLoaded = false;

    btnReadPaper.addEventListener('click', (e) => {
      e.preventDefault();
      modalOverlay.classList.add('show');
      
      if (!paperLoaded) {
        fetch('paper.md')
          .then(res => {
            if(!res.ok) throw new Error('Network response was not ok');
            return res.text();
          })
          .then(text => {
            if (typeof marked !== 'undefined') {
              paperContent.innerHTML = marked.parse(text);
              if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(paperContent, {
                  delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                  ],
                  throwOnError: false
                });
              }
            } else {
              paperContent.innerHTML = '<pre style="white-space: pre-wrap; font-family: inherit;">' + text + '</pre>';
            }
            paperLoaded = true;
          })
          .catch(err => {
            paperContent.innerHTML = '<span class="text-danger">Failed to load paper.md. Please ensure the server is running correctly.</span>';
            console.error(err);
          });
      }
    });

    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('show');
    });

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('show');
      }
    });
  }
});

