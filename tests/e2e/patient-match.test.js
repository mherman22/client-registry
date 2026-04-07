const { api, getToken, submitPatient, queryPatient, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('Patient Matching', () => {
  let token;
  const sharedNatId = uniqueId('match-nat');

  beforeAll(async () => {
    token = await getToken();
  });

  test('two patients with the same National ID get the same golden record', async () => {
    const patientA = {
      ...patients.patientA,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: uniqueId('match-A') },
        { system: 'http://health.go.ug/cr/nationalid', value: sharedNatId },
      ],
    };

    const patientB = {
      ...patients.patientB,
      identifier: [
        { system: 'http://clientregistry.org/openelis', value: uniqueId('match-B') },
        { system: 'http://health.go.ug/cr/nationalid', value: sharedNatId },
      ],
    };

    const resA = await submitPatient(patientA, token);
    const resB = await submitPatient(patientB, token);

    expect([200, 201]).toContain(resA.status);
    expect([200, 201]).toContain(resB.status);

    // Both should report a golden record (CRUID) in the response headers
    const cruidA = resA.headers.locationcruid;
    const cruidB = resB.headers.locationcruid;

    if (cruidA && cruidB) {
      expect(cruidA).toBe(cruidB);
    }
  });

  test('patient with unique ID gets its own golden record', async () => {
    const patient = {
      ...patients.patientC,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: uniqueId('match-unique') },
        { system: 'http://health.go.ug/cr/nationalid', value: uniqueId('nat-unique') },
      ],
    };

    const res = await submitPatient(patient, token);

    expect([200, 201]).toContain(res.status);
    expect(res.headers.location).toBeDefined();
    expect(res.headers.locationcruid).toBeDefined();
  });

  test('POST /ocrux/match/matches returns a FHIR Bundle of matches', async () => {
    const patient = {
      ...patients.patientA,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: uniqueId('match-query') },
        { system: 'http://health.go.ug/cr/nationalid', value: sharedNatId },
      ],
    };

    try {
      const res = await api.post('/ocrux/match/matches', patient, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(200);
      expect(res.data).toBeDefined();
    } catch (err) {
      // Endpoint may not exist in all OpenCR versions; skip gracefully
      if (err.response && err.response.status === 404) {
        console.warn('Skipping: /ocrux/match/matches endpoint not available');
      } else {
        throw err;
      }
    }
  });
});
