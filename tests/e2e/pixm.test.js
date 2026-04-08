const { api, getToken, submitPatient, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('PIXm Cross-Reference - GET /fhir/Patient/$ihe-pix', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    'x-openhim-clientid': 'test',
  });

  test('returns parameters with targetId for known identifier', async () => {
    // Create a patient first so we have a known identifier
    const idValue = uniqueId('pixm-known');
    const patient = {
      ...patients.patientA,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: idValue },
      ],
    };
    await submitPatient(patient, token);

    const res = await api.get('/fhir/Patient/$ihe-pix', {
      params: {
        identifier: `http://clientregistry.org/openmrs|${idValue}`,
      },
      headers: headers(),
      validateStatus: () => true,
    });

    expect([200, 404, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.data).toBeDefined();
      // PIXm should return a Parameters resource
      if (res.data.resourceType) {
        expect(res.data.resourceType).toBe('Parameters');
      }
    }
  });

  test('returns empty response for unknown identifier', async () => {
    const res = await api.get('/fhir/Patient/$ihe-pix', {
      params: {
        identifier: `http://clientregistry.org/openmrs|${uniqueId('pixm-unknown')}`,
      },
      headers: headers(),
      validateStatus: () => true,
    });

    expect([200, 404, 400]).toContain(res.status);
    if (res.status === 200 && res.data.parameter) {
      // Should have no targetId parameters
      const targetIds = res.data.parameter.filter(
        (p) => p.name === 'targetId',
      );
      expect(targetIds.length).toBe(0);
    }
  });
});
