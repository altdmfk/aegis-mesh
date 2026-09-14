import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// 1. Custom Metrics
const reqDurationA = new Trend('req_duration_a');
const reqDurationB = new Trend('req_duration_b');
const reqDurationC = new Trend('req_duration_c');
const rate200 = new Rate('rate_200_ok');
const rate403 = new Rate('rate_403_forbidden');
const rateError = new Rate('rate_connection_error');

const BASE_URL = __ENV.BASE_URL || 'https://localhost:8443';
const SECRET = 'YourSuperSecretKeyForHmacGenerationMakeItLongAndSecure';

function generateJWT() {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: 'benchmark-user',
        jti: `bench-${Date.now()}`,
        roles: ['user'],
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiration
    };

    const encodeB64Url = (obj) => encoding.b64encode(JSON.stringify(obj), 'rawurl');

    const headerEnc = encodeB64Url(header);
    const payloadEnc = encodeB64Url(payload);
    
    // Create HMAC SHA256 signature
    const signature = crypto.hmac('sha256', SECRET, `${headerEnc}.${payloadEnc}`, 'base64rawurl');
    
    return `${headerEnc}.${payloadEnc}.${signature}`;
}

const JWT_TOKEN = __ENV.JWT_TOKEN || generateJWT();

let allScenarios = {
    scenario_a_l1_warm: {
        executor: 'constant-vus',
        vus: 20,
        duration: '30s',
        exec: 'warmPath',
    },
    scenario_b_l2_cold: {
        executor: 'constant-vus',
        vus: 20,
        duration: '30s',
        exec: 'coldPath',
        startTime: '35s', // Run sequentially after Scenario A
    },
    scenario_c_stress: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: '30s', target: 200 },
            { duration: '1m', target: 500 },  // Ramp to 500 VUs
            { duration: '30s', target: 0 },   // Cool down
        ],
        exec: 'stressPath',
        startTime: '70s', // Run sequentially after Scenario B
    },
};

if (__ENV.TARGET_SCENARIO) {
    const target = __ENV.TARGET_SCENARIO;
    const filtered = {};
    if (allScenarios[target]) {
        filtered[target] = allScenarios[target];
        delete filtered[target].startTime; // Run immediately
    }
    allScenarios = filtered;
}

export const options = {
    insecureSkipTLSVerify: true, // Bypass CA verification as we are using local self-signed Root CA
    tlsAuth: [
        {
            domains: ['localhost', '127.0.0.1'],
            cert: open(__ENV.CLIENT_CERT_PATH || './src/main/resources/certs/client.crt'),
            key: open(__ENV.CLIENT_KEY_PATH || './src/main/resources/certs/client.key'),
        },
    ],
    scenarios: allScenarios,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

const params = {
    headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json',
    },
};

function executeRequest(path, trend) {
    const res = http.get(`${BASE_URL}${path}`, params);
    
    trend.add(res.timings.duration);
    
    if (res.status === 200) {
        rate200.add(1);
        rate403.add(0);
        rateError.add(0);
    } else if (res.status === 403) {
        rate200.add(0);
        rate403.add(1);
        rateError.add(0);
    } else {
        rate200.add(0);
        rate403.add(0);
        rateError.add(1); 
    }
    
    check(res, {
        'status is not 0 (connection ok)': (r) => r.status !== 0,
    });
}

// Scenario A: Static path hits L1 Caffeine Cache
export function warmPath() {
    executeRequest('/api/resource/static-warm', reqDurationA);
    sleep(0.01);
}

// Scenario B: Dynamic paths force L1 Miss -> L2 Redis lookup
export function coldPath() {
    const randomId = Math.floor(Math.random() * 1000000);
    executeRequest(`/api/resource/dynamic-${randomId}`, reqDurationB);
    sleep(0.01);
}

// Scenario C: Mix of warm and cold paths under high concurrent load
export function stressPath() {
    const isCold = Math.random() < 0.8; // 80% chance of L1 miss (Redis L2 query), 20% warm L1 cache hit
    const path = isCold 
        ? `/api/resource/stress-${Math.floor(Math.random() * 1000000)}` 
        : `/api/resource/stress-warm`;
    executeRequest(path, reqDurationC);
    sleep(0.05);
}
