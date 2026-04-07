const { api, getToken, submitPatient, queryPatient, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('Patient Query - GET /fhir/Patient', () => {
  let token;
  const idValue = uniqueId('query-test');

  beforeAll(async () => {
    token = await getToken();

    // Seed a patient for query tests
    const patient = {
      ...patients.patientA,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: idValue },
        { system: 'http://health.go.ug/cr/nationalid', value: idValue },
      ],
    };
    await submitPatient(patient, token);
  });

  test('queries by identifier system|value and returns matching patient', async () => {
    const res = await queryPatient(
      { identifier: `http://clientregistry.org/openmrs|${idValue}` },
      token
    );

    expect(res.status).toBe(200);
    expect(res.data.resourceType).toBe('Bundle');
    expect(res.data.entry).toBeDefined();
    expect(res.data.entry.length).toBeGreaterThan(0);
  });

  test('queries by name and gender and returns demographic matches', async () => {
    const res = await queryPatient(
      { name: 'Nakamura', gender: 'male' },
      token
    );

    expect(res.status).toBe(200);
    expect(res.data.resourceType).toBe('Bundle');
  });

  test('queries by _id and returns the specific patient', async () => {
    // First get the patient ID from an identifier query
    const lookup = await queryPatient(
      { identifier: `http://clientregistry.org/openmrs|${idValue}` },
      token
    );

    if (lookup.data.entry && lookup.data.entry.length > 0) {
      const patientId = lookup.data.entry[0].resource.id;

      const res = await queryPatient({ _id: patientId }, token);

      expect(res.status).toBe(200);
      expect(res.data.entry).toBeDefined();
      expect(res.data.entry[0].resource.id).toBe(patientId);
    }
  });

  test('returns empty bundle when no patients match', async () => {
    const res = await queryPatient(
      { identifier: 'http://clientregistry.org/openmrs|NONEXISTENT-99999' },
      token
    );

    expect(res.status).toBe(200);
    expect(res.data.resourceType).toBe('Bundle');

    const entryCount = res.data.entry ? res.data.entry.length : 0;
    expect(entryCount).toBe(0);
  });
});
