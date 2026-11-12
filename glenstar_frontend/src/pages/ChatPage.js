import React, { useEffect, useRef, useState } from 'react';
import { postJSON } from '../lib/api';
import { Banner, Icon, Link, Spinner, useApp } from '../components/ui';

const SUGGESTED = [
  'Which markets have the tightest vacancy right now?',
  'Where is the construction pipeline largest relative to absorption?',
  'Compare the two strongest markets for new development.',
  'Which markets should we be cautious about, and why?',
  'What data are we missing for this quarter?',
];

export default function ChatPage() {
  const { stats } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottom = useRef(null);

  useEffect(() => { if (bottom.current && bottom.current.scrollIntoView) bottom.current.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async text => {
    const message = (text || input).trim();
    if (!message || loading) return;
    setInput('');
    const history = messages.filter(m => !m.error).map(m => ({ role: m.role, content: m.content }));
    setMessages(list => [...list, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const data = await postJSON('/api/chat', { message, history });
      setMessages(list => [...list, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(list => [...list, { role: 'assistant', content: err.message, error: true }]);
    }
    setLoading(false);
  };

  const ready = stats && stats.api_key_configured;
  const empty = stats && stats.market_count === 0;

  return (
    <div className="chat">
      {stats && !ready && (
        <div style={{ marginBottom: 14 }}>
          <Banner tone="bad" title="Ask Claude is not set up">
            Add <span className="mono">ANTHROPIC_API_KEY</span> to the backend service (Render → your service → Environment) and redeploy.
          </Banner>
        </div>
      )}
      {empty && (
        <div style={{ marginBottom: 14 }}>
          <Banner tone="info" title="No report data yet" action={<Link to="/data" className="btn sm primary">Add reports</Link>}>
            Claude answers only from the broker reports on file, so it has nothing to draw on until some are added.
          </Banner>
        </div>
      )}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div className="chat-log">
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 560 }}>
              <div className="empty-icon"><Icon name="chat" /></div>
              <div className="empty-title">Ask about the report data</div>
              <div className="empty-text">
                Claude answers from the {stats ? stats.market_count : ''} market{stats && stats.market_count === 1 ? '' : 's'} of
                broker data on file and cites the brokerage and quarter for each figure. If something is not in the
                reports, it says so instead of guessing.
              </div>
              <div className="suggest" style={{ justifyContent: 'center' }}>
                {SUGGESTED.map(s => <button key={s} className="btn sm" onClick={() => send(s)} disabled={!ready}>{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'user' : ''} ${m.error ? 'err' : ''}`}>
              <div className="msg-who">{m.role === 'user' ? 'You' : 'Claude'}</div>
              <div className="bubble">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="msg"><div className="msg-who">Claude</div>
              <div className="bubble row"><Spinner /><span className="muted">Reading the report data…</span></div></div>
          )}
          <div ref={bottom} />
        </div>
        <form className="chat-input" onSubmit={e => { e.preventDefault(); send(); }}>
          <input className="input" value={input} onChange={e => setInput(e.target.value)} disabled={!ready}
                 placeholder="Ask about any market, metric or comparison…" aria-label="Your question" />
          <button className="btn primary" disabled={loading || !input.trim() || !ready}>Send</button>
        </form>
      </div>
    </div>
  );
}
