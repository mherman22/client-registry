const { api, getToken, submitPatient, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('Match Queries - GET /ocrux/match/*', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    'x-openhim-clientid': 'test',
  });

  test('GET /ocrux/match/count-match-issues returns a number', async () => {
    const res = await api.get('/ocrux/match/count-match-issues', {
      headers: headers(),
    });

    expect(res.status).toBe(200);
    expect(typeof res.data).toBe('number');
  });

  test('GET /ocrux/match/count-new-auto-matches returns a number', async () => {
    const res = await api.get('/ocrux/match/count-new-auto-matches', {
      headers: headers(),
    });

    expect(res.status).toBe(200);
    expect(typeof res.data).toBe('number');
  });

  test('GET /ocrux/match/get-match-issues returns an array', async () => {
    const res = await api.get('/ocrux/match/get-match-issues', {
      headers: headers(),
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('GET /ocrux/match/get-new-auto-matches returns an array', async () => {
    const res = await api.get('/ocrux/match/get-new-auto-matches', {
      headers: headers(),
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('GET /ocrux/match/potential-matches/:id returns matches for a patient', async () => {
    // First create a patient to have a valid ID
    const patient = {
      ...patients.patientA,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: uniqueId('match-pot') },
      ],
    };
    const created = await submitPatient(patient, token);
    const location = created.headers.location; // e.g. "Patient/abc123"
    const patientId = location ? location.replace('Patient/', '') : 'unknown';

    const res = await api.get(`/ocrux/match/potential-matches/${patientId}`, {
      headers: headers(),
      validateStatus: () => true,
    });

    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.data).toBeDefined();
    }
  });
});
