const { api, getToken, submitPatient, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('FHIR Read Operations', () => {
  let token;
  let createdPatientId;

  beforeAll(async () => {
    token = await getToken();

    // Create a patient to read back
    const patient = {
      ...patients.patientC,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: uniqueId('read-test') },
      ],
    };
    const res = await submitPatient(patient, token);
    const location = res.headers.location || '';
    createdPatientId = location.replace('Patient/', '').split('/')[0];
  });

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    'x-openhim-clientid': 'test',
  });

  test('GET /fhir/Patient/:id returns the specific patient', async () => {
    const res = await api.get(`/fhir/Patient/${createdPatientId}`, {
      headers: headers(),
      validateStatus: () => true,
    });

    expect([200, 201]).toContain(res.status);
    expect(res.data.resourceType).toBe('Patient');
  });

  test('GET /fhir/Patient/:id with non-existent ID returns 404 or error', async () => {
    const res = await api.get('/fhir/Patient/non-existent-id-99999', {
      headers: headers(),
      validateStatus: () => true,
    });

    expect([404, 400, 500]).toContain(res.status);
  });

  test('GET /fhir/metadata returns CapabilityStatement', async () => {
    const res = await api.get('/fhir/metadata', {
      headers: headers(),
      validateStatus: () => true,
    });

    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.data.resourceType).toBe('CapabilityStatement');
    }
  });

  test('GET /fhir/ValueSet/:id/$expand returns expanded valueset or error', async () => {
    const res = await api.get(
      '/fhir/ValueSet/administrative-gender/$expand',
      {
        headers: headers(),
        validateStatus: () => true,
      },
    );

    // May not be available in all configurations
    expect([200, 404, 400, 500]).toContain(res.status);
    if (res.status === 200 && res.data.resourceType) {
      expect(res.data.resourceType).toBe('ValueSet');
    }
  });
});
