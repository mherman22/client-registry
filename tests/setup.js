const axios = require('axios');
const https = require('https');

const BASE_URL = process.env.OPENCR_URL || 'https://localhost:3000';
const AUTH = { username: 'root@intrahealth.org', password: 'intrahealth' };

const api = axios.create({
  baseURL: BASE_URL,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 15000,
});

/**
 * Authenticate against OpenCR and return a bearer token.
 */
async function getToken() {
  const res = await api.post('/ocrux/user/authenticate', null, {
    params: AUTH,
  });
  return res.data.token;
}

/**
 * Submit a FHIR Patient resource to OpenCR via a transaction bundle.
 * Uses POST /fhir/ (bundle endpoint) which correctly reads x-openhim-clientid.
 * The individual POST /fhir/Patient endpoint crashes without a TLS client cert.
 */
async function submitPatient(patient, token) {
  const patientId = patient.id || uniqueId('pat');
  const bundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: [{
      resource: { ...patient, id: patientId },
      request: { method: 'PUT', url: `Patient/${patientId}` }
    }]
  };
  return api.post('/fhir/', bundle, {
    headers: {
      'Content-Type': 'application/fhir+json',
      Authorization: `Bearer ${token}`,
      'x-openhim-clientid': 'test',
    },
  });
}

/**
 * Query patients by identifier.
 */
async function queryPatient(params, token) {
  return api.get('/fhir/Patient', {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      'x-openhim-clientid': 'test',
    },
  });
}

/**
 * Generate a unique identifier value using a timestamp and random suffix.
 */
function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { api, getToken, submitPatient, queryPatient, uniqueId, BASE_URL };
