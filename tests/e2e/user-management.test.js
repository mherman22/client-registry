const { api, getToken, uniqueId } = require('../setup');

describe('User Management - /ocrux/user/*', () => {
  let token;

  beforeAll(async () => {
    token = await getToken();
  });

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    'x-openhim-clientid': 'test',
  });

  test('POST /ocrux/user/authenticate with valid creds returns token', async () => {
    const res = await api.post('/ocrux/user/authenticate', null, {
      params: { username: 'root@intrahealth.org', password: 'intrahealth' },
    });

    expect(res.status).toBe(200);
    expect(res.data.token).toBeDefined();
    expect(typeof res.data.token).toBe('string');
  });

  test('POST /ocrux/user/authenticate with invalid creds returns no token', async () => {
    const res = await api.post('/ocrux/user/authenticate', null, {
      params: { username: 'nobody@example.com', password: 'wrongpassword' },
      validateStatus: () => true,
    });

    // Server returns 200 with null token for unknown/invalid credentials
    expect([200, 400, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.data.token).toBeNull();
    }
  });

  test('GET /ocrux/user/getUsers returns user list', async () => {
    const res = await api.get('/ocrux/user/getUsers', {
      headers: headers(),
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('POST /ocrux/user/addUser creates a user', async () => {
    const username = `testuser-${uniqueId('usr')}@test.org`;
    const res = await api.post(
      '/ocrux/user/addUser',
      {
        userName: username,
        password: 'TestPass123!',
        role: 'Admin',
      },
      { headers: headers() },
    );

    expect([200, 201]).toContain(res.status);
  });

  test('POST /ocrux/user/changepassword changes password', async () => {
    // Create a user first, then change their password
    const username = `chgpw-${uniqueId('pw')}@test.org`;
    await api.post(
      '/ocrux/user/addUser',
      { userName: username, password: 'OldPass123!', role: 'Admin' },
      { headers: headers() },
    );

    const res = await api.post(
      '/ocrux/user/changepassword',
      { userName: username, password: 'NewPass456!' },
      { headers: headers(), validateStatus: () => true },
    );

    expect([200, 201, 204]).toContain(res.status);
  });
});
