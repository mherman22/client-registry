const { api, getToken, submitPatient, uniqueId } = require('../setup');
const patients = require('../fixtures/patients.json');

describe('Patient Create - POST /fhir/Patient', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  test('creates a patient with valid data and returns 200/201', async () => {
    const patient = {
      ...patients.patientA,
      identifier: [
        {
          system: 'http://clientregistry.org/openmrs',
          value: uniqueId('create-valid'),
        },
        {
          system: 'http://health.go.ug/cr/nationalid',
          value: uniqueId('nat-create'),
        },
      ],
    };

    const res = await submitPatient(patient, token);

    expect([200, 201]).toContain(res.status);
    expect(res.headers.location).toBeDefined();
  });

  test('rejects a patient with missing identifier with 400', async () => {
    const patientId = uniqueId('no-id');
    const patient = {
      resourceType: 'Patient',
      id: patientId,
      active: true,
      name: [{ use: 'official', family: 'NoId', given: ['Test'] }],
      gender: 'male',
      birthDate: '1990-01-01',
      meta: {
        tag: [
          {
            system: 'http://openclientregistry.org/fhir/clientid',
            code: 'openmrs',
            display: 'OpenMRS',
          },
        ],
      },
    };
    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [{ resource: patient, request: { method: 'PUT', url: `Patient/${patientId}` } }],
    };

    const res = await api.post('/fhir/', bundle, {
      headers: {
        'Content-Type': 'application/fhir+json',
        Authorization: `Bearer ${token}`,
        'x-openhim-clientid': 'test',
      },
      validateStatus: () => true,
    });

    // Server requires a registered internal identifier system; rejects patients without one
    expect([400, 422]).toContain(res.status);
  });

  test('returns a location header pointing to the created patient', async () => {
    const patient = {
      ...patients.patientC,
      identifier: [
        {
          system: 'http://clientregistry.org/openmrs',
          value: uniqueId('create-loc'),
        },
      ],
    };

    const res = await submitPatient(patient, token);

    expect(res.headers.location).toMatch(/^Patient\//);
  });

  test('creates a patient with multipleBirthInteger', async () => {
    const patient = {
      ...patients.patientD,
      identifier: [
        {
          system: 'http://clientregistry.org/openmrs',
          value: uniqueId('create-multi'),
        },
      ],
    };

    const res = await submitPatient(patient, token);

    expect([200, 201]).toContain(res.status);
  });

  test('creates a patient without name.use field (fallback handling)', async () => {
    const patient = {
      ...patients.patientE,
      identifier: [
        {
          system: 'http://clientregistry.org/openmrs',
          value: uniqueId('create-noname'),
        },
      ],
    };

    const res = await submitPatient(patient, token);

    expect([200, 201]).toContain(res.status);
  });
});
