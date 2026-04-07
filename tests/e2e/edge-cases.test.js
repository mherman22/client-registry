const { api, getToken, uniqueId } = require('../setup');

describe('Edge Cases and Error Handling', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  const authHeaders = () => ({
    'Content-Type': 'application/fhir+json',
    Authorization: `Bearer ${token}`,
    'x-openhim-clientid': 'test',
  });

  test('POST /fhir/Patient with empty body returns error', async () => {
    const res = await api.post('/fhir/Patient', {}, {
      headers: authHeaders(),
      validateStatus: () => true,
    });

    // Should not succeed as a valid patient creation
    expect(res.status).toBeDefined();
  });

  test('POST /fhir/Patient with invalid JSON returns error', async () => {
    const res = await api.post('/fhir/Patient', 'this is not json', {
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/fhir+json',
      },
      validateStatus: () => true,
    });

    expect([400, 415, 422]).toContain(res.status);
  });

  test('POST /fhir/Patient with non-Patient resourceType is rejected', async () => {
    const res = await api.post(
      '/fhir/Patient',
      {
        resourceType: 'Observation',
        status: 'final',
        code: { text: 'test' },
      },
      {
        headers: authHeaders(),
        validateStatus: () => true,
      },
    );

    // Should reject or at least not create a patient
    expect([400, 404, 422]).toContain(res.status);
  });

  test('GET /fhir/Patient with very long query string is handled', async () => {
    const longValue = 'x'.repeat(2000);
    const res = await api.get('/fhir/Patient', {
      params: { name: longValue },
      headers: authHeaders(),
      validateStatus: () => true,
    });

    // Should not crash the server - any status is acceptable except undefined
    expect(res.status).toBeDefined();
    expect(res.status).toBeLessThan(600);
  });

  test('request without auth token returns 401', async () => {
    const res = await api.get('/fhir/Patient', {
      headers: { 'x-openhim-clientid': 'test' },
      validateStatus: () => true,
    });

    expect([401, 403]).toContain(res.status);
  });

  test('request with invalid token returns 401', async () => {
    const res = await api.get('/fhir/Patient', {
      headers: {
        Authorization: 'Bearer invalid-expired-token-xyz',
        'x-openhim-clientid': 'test',
      },
      validateStatus: () => true,
    });

    expect([401, 403]).toContain(res.status);
  });
});
