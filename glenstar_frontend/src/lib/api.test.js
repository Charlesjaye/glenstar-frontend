import { request, getJSON, postJSON, ApiError } from './api';

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
  expect(err.message).toBe('Database down (HTTP 500)');
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
  expect(opts.headers).toEqual({ 'Content-Type': 'application/json' });
  expect(JSON.parse(opts.body)).toEqual({ message: 'hi' });
});

test('network failures propagate', async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(getJSON('/api/stats')).rejects.toThrow('Failed to fetch');
});
