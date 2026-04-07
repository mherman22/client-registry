const { api, getToken, submitPatient, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('Audit Events', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  test('GET /ocrux/fhir/AuditEvent returns audit events', async () => {
    try {
      const res = await api.get('/ocrux/fhir/AuditEvent', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      expect(res.data).toBeDefined();
    } catch (err) {
      // AuditEvent endpoint may not be enabled in all configurations
      if (err.response && err.response.status === 404) {
        console.warn('Skipping: AuditEvent endpoint not available');
      } else {
        throw err;
      }
    }
  });

  test('patient creation triggers an audit event', async () => {
    const patient = {
      ...patients.patientA,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: uniqueId('audit-test') },
      ],
    };

    await submitPatient(patient, token);

    try {
      const res = await api.get('/ocrux/fhir/AuditEvent', {
        params: { 'type': '110110' },
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);

      // If the response is a FHIR Bundle, verify it has entries
      if (res.data.resourceType === 'Bundle') {
        expect(res.data.entry).toBeDefined();
        expect(res.data.entry.length).toBeGreaterThan(0);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.warn('Skipping: AuditEvent query not available');
      } else {
        throw err;
      }
    }
  });
});
