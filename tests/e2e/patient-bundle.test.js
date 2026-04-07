const { api, getToken, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('Patient Bundle - POST /fhir/', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  const headers = () => ({
    'Content-Type': 'application/fhir+json',
    Authorization: `Bearer ${token}`,
    'x-openhim-clientid': 'test',
  });

  function makePatientEntry(id) {
    return {
      resource: {
        ...patients.patientA,
        identifier: [
          { system: 'http://clientregistry.org/openmrs', value: uniqueId(id) },
        ],
      },
      request: { method: 'POST', url: 'Patient' },
    };
  }

  test('POST a transaction bundle with 2 patients creates both', async () => {
    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [makePatientEntry('bundle-p1'), makePatientEntry('bundle-p2')],
    };

    const res = await api.post('/fhir/', bundle, { headers: headers() });

    expect([200, 201]).toContain(res.status);
    expect(res.data).toBeDefined();
  });

  test('POST an empty bundle returns graceful response', async () => {
    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [],
    };

    const res = await api.post('/fhir/', bundle, {
      headers: headers(),
      validateStatus: () => true,
    });

    // Should not be a 500
    expect(res.status).toBeLessThan(500);
  });

  test('POST a bundle with Patient and non-Patient resources is handled', async () => {
    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        makePatientEntry('bundle-mix'),
        {
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { text: 'test' },
          },
          request: { method: 'POST', url: 'Observation' },
        },
      ],
    };

    const res = await api.post('/fhir/', bundle, {
      headers: headers(),
      validateStatus: () => true,
    });

    // Server should handle mixed resources without crashing
    expect(res.status).toBeDefined();
    expect(res.status).toBeLessThan(500);
  });
});
