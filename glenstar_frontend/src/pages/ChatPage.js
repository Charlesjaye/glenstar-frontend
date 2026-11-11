import React, { useState, useEffect, useRef } from 'react';
import { postJSON } from '../lib/api';
import { BROKERAGES } from '../lib/constants';

const SUGGESTED = [
  'Why is Dallas ranked #1?',
  'What size product should we build in Indianapolis?',
  'Compare Nashville vs Savannah',
  'Where are construction costs cheapest for small-bay?',
  'What markets should we avoid and why?',
  'Where is lender appetite strongest in 2026?',
  'Which markets have the best big-box fundamentals?',
  'What is the current quarter and what data is available?',
];

export default function ChatPage({ apiReady, marketCount }) {
  const marketText = marketCount ? `${marketCount} US markets` : 'tracked US markets';
  const [messages, setMessages] = useState([{
    role:'assistant',
    content:`I have access to verified industrial market data from ${BROKERAGES.slice(0,-1).join(', ')}, and ${BROKERAGES[BROKERAGES.length-1]} across ${marketText}. Ask me anything — vacancy rates, rents by building size, construction costs, absorption trends, or where Glenstar should develop next. I'll give you specific numbers from the actual broker reports.`
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const newHistory = [...messages, { role:'user', content:msg }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const data = await postJSON('/api/chat', {
        message: msg,
        history: messages.map(m => ({ role:m.role, content:m.content })),
      });
      setMessages(prev => [...prev, { role:'assistant', content:data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role:'assistant',
        content:`Sorry — the request failed: ${err.message}. If this keeps happening, check that the backend service on Render is running.`
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{maxWidth:860}}>
      {apiReady === false && (
        <div style={{background:'rgba(252,165,165,0.08)',border:'1px solid rgba(252,165,165,0.25)',borderRadius:8,padding:'12px 16px',marginBottom:14,fontSize:11,color:'var(--danger)',lineHeight:1.7}}>
          <strong>Anthropic API key not configured.</strong> To enable AI chat:<br/>
          1. Go to <strong>render.com</strong> → your backend service → <strong>Environment</strong> tab<br/>
          2. Add variable: <code style={{background:'rgba(255,255,255,0.08)',padding:'1px 5px',borderRadius:3}}>ANTHROPIC_API_KEY</code> = your key from console.anthropic.com<br/>
          3. Click Save → wait 2-3 minutes for redeploy<br/>
          Your key starts with <code style={{background:'rgba(255,255,255,0.08)',padding:'1px 5px',borderRadius:3}}>sk-ant-api03-</code>
        </div>
      )}

      {messages.length <= 1 && (
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'var(--dim)',marginBottom:9}}>Suggested questions — click to ask</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {SUGGESTED.map(s => <button key={s} className="btn bg bsm" onClick={()=>send(s)}>{s}</button>)}
          </div>
        </div>
      )}

      <div className="panel" style={{display:'flex',flexDirection:'column'}}>
        <div className="ph">
          <span className="pt">Ask Claude — Industrial Market Intelligence</span>
          <span className="badge bl">● {apiReady ? 'AI active' : 'API key needed'}{marketCount ? ` · ${marketCount} verified markets` : ''}</span>
        </div>
        <div className="cmsg">
          {messages.map((m,i) => (
            <div key={i} style={{display:'flex',flexDirection:'column',gap:4}}>
              <div className={`mrol ${m.role==='assistant'?'ai':''}`}>{m.role==='assistant'?'Claude':'You'}</div>
              <div className={`mb ${m.role==='user'?'u':''}`} style={{whiteSpace:'pre-wrap'}}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <div className="mrol ai">Claude</div>
              <div className="thn"><span/><span/><span/></div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        <div className="cir">
          <input
            className="ci" value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
            placeholder="Ask about any market, size segment, construction cost, or strategy..."
          />
          <button className="btn bp" onClick={()=>send()} disabled={loading}>
            {loading?'...':'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
