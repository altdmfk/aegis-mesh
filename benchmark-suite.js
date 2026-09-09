import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// 1. Custom Metrics
const reqDuration = new Trend('custom_req_duration', true);
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

export const options = {
    insecureSkipTLSVerify: true, // Bypass CA verification as we are using local self-signed Root CA
    tlsAuth: [
        {
            domains: ['localhost', '127.0.0.1'],
            cert: open(__ENV.CLIENT_CERT_PATH || './src/main/resources/certs/client.crt'),
            key: open(__ENV.CLIENT_KEY_PATH || './src/main/resources/certs/client.key'),
        },
    ],
    scenarios: {
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
    },
    thresholds: {
        'custom_req_duration': ['p(50)<5', 'p(90)<15', 'p(95)<30', 'p(99)<100'],
    },
};

const params = {
    headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json',
    },
};

function executeRequest(path) {
    const res = http.get(`${BASE_URL}${path}`, params);
    
    reqDuration.add(res.timings.duration);
    
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
    executeRequest('/api/resource/static-warm');
    sleep(0.01);
}

// Scenario B: Dynamic paths force L1 Miss -> L2 Redis lookup
export function coldPath() {
    const randomId = Math.floor(Math.random() * 1000000);
    executeRequest(`/api/resource/dynamic-${randomId}`);
    sleep(0.01);
}

// Scenario C: Mix of warm and cold paths under high concurrent load
export function stressPath() {
    const isCold = Math.random() > 0.8; // 20% chance of L1 miss
    const path = isCold 
        ? `/api/resource/stress-${Math.floor(Math.random() * 1000000)}` 
        : `/api/resource/stress-warm`;
    executeRequest(path);
    sleep(0.05);
}
