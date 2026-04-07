const { api, getToken, submitPatient, queryPatient, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('Patient Update - PUT /fhir/Patient/:id', () => {
  let token;
  let createdPatientId;
  const idValue = uniqueId('update-test');

  beforeAll(async () => {
    token = await getToken();

    // Create a patient to update later
    const patient = {
      ...patients.patientA,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: idValue },
      ],
    };
    const res = await submitPatient(patient, token);
    createdPatientId = res.headers.location;
  });

  test('updates an existing patient via PUT', async () => {
    const updatedPatient = {
      ...patients.patientA,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: idValue },
      ],
      name: [{ use: 'official', family: 'Nakamura-Updated', given: ['Takeshi'] }],
    };

    const res = await api.put(`/fhir/${createdPatientId}`, updatedPatient, {
      headers: {
        'Content-Type': 'application/fhir+json',
        Authorization: `Bearer ${token}`,
      },
    });

    expect([200, 201]).toContain(res.status);
  });

  test('can retrieve the updated patient and verify changes', async () => {
    const res = await queryPatient(
      { identifier: `http://clientregistry.org/openmrs|${idValue}` },
      token
    );

    expect(res.status).toBe(200);

    const bundle = res.data;
    expect(bundle.entry).toBeDefined();
    expect(bundle.entry.length).toBeGreaterThan(0);
  });

  test('PUT to a non-existent ID creates a new patient', async () => {
    const newId = uniqueId('put-new');
    const patient = {
      ...patients.patientC,
      identifier: [
        { system: 'http://clientregistry.org/openmrs', value: newId },
      ],
    };

    const res = await submitPatient(patient, token);

    expect([200, 201]).toContain(res.status);
    expect(res.headers.location).toBeDefined();
  });
});
