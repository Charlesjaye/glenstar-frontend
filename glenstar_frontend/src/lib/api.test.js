import { request, getJSON, postJSON, ApiError, onUnauthorized, setAdminToken } from './api';

function mockFetch(status, body, statusText = '') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: () => Promise.resolve(body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

afterEach(() => { delete global.fetch; });

test('returns parsed JSON on success', async () => {
  mockFetch(200, { ok: 1 });
  await expect(getJSON('/api/stats', { base: 'http://x' })).resolves.toEqual({ ok: 1 });
  expect(global.fetch).toHaveBeenCalledWith('http://x/api/stats', expect.objectContaining({ method: 'GET' }));
});

test('returns arrays unchanged', async () => {
  mockFetch(200, [1, 2]);
  await expect(getJSON('/api/reports')).resolves.toEqual([1, 2]);
});

test('throws ApiError on HTTP error status, using the server message', async () => {
  mockFetch(500, { error: 'Database down' }, 'Internal Server Error');
  const err = await request('/api/monitor/scan').catch(e => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err.status).toBe(500);
  expect(err.message).toBe('Database down');
});

test('throws on HTTP error with non-JSON body', async () => {
  mockFetch(502, '<html>Bad gateway</html>', 'Bad Gateway');
  await expect(getJSON('/api/stats')).rejects.toThrow('Bad Gateway (HTTP 502)');
});

test('throws when a 200 response carries an error field', async () => {
  mockFetch(200, { error: 'ANTHROPIC_API_KEY not set' });
  await expect(postJSON('/api/chat', { message: 'hi' })).rejects.toThrow('ANTHROPIC_API_KEY not set');
});

test('postJSON sends a JSON body', async () => {
  mockFetch(200, { reply: 'hello' });
  await postJSON('/api/chat', { message: 'hi' });
  const [, opts] = global.fetch.mock.calls[0];
  expect(opts.method).toBe('POST');
  expect(opts.headers['Content-Type']).toBe('application/json');
  expect(JSON.parse(opts.body)).toEqual({ message: 'hi' });
});

test('network failures become a readable error', async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(getJSON('/api/stats')).rejects.toThrow('Could not reach the server');
});

test('a 401 asks for the passcode once, then retries with it', async () => {
  const responses = [
    { ok: false, status: 401, statusText: '', text: () => Promise.resolve('{"error":"Enter the admin passcode to make changes."}') },
    { ok: true, status: 200, statusText: '', text: () => Promise.resolve('{"ok":true}') },
  ];
  global.fetch = jest.fn(() => Promise.resolve(responses.shift()));
  onUnauthorized(async () => { setAdminToken('s3cret'); return true; });
  await expect(postJSON('/api/scan')).resolves.toEqual({ ok: true });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch.mock.calls[1][1].headers['X-Admin-Token']).toBe('s3cret');
  onUnauthorized(null);
  setAdminToken('');
});

test('a declined passcode prompt surfaces the server message', async () => {
  mockFetch(401, { error: 'Enter the admin passcode to make changes.' });
  onUnauthorized(async () => false);
  await expect(postJSON('/api/scan')).rejects.toThrow('Enter the admin passcode');
  onUnauthorized(null);
});
