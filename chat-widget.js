/* ============================================================
   UNFILTERED MINDSETS — Floating Chat Widget
   Drop this file in your site folder, then add to your HTML:
   <script src="chat-widget.js"></script>  (before </body>)
   ============================================================ */

(function () {
  const SYSTEM_PROMPT = `You are the AI assistant for Unfiltered Mindsets, a global AI & digital consulting firm founded by Santiago García Solimei. Your personality is bold, direct, provocative, and refreshingly honest — matching the brand's radical truth philosophy. No corporate fluff. No buzzwords without substance. No PowerPoint.

You help with:
1. CLIENT ENQUIRIES — Answer questions about services: AI Strategy & Implementation, Process Automation, Digital Transformation, and The Ghost Ship Audit.
2. NEWSLETTER SIGN-UP — Guide users to subscribe to the Unfiltered newsletter. When they want to subscribe, collect their name and email, then tell them a form will appear.
3. KEYNOTE SESSIONS — Santiago speaks on AI, digital transformation, radical truth in business. Collect interest and contact details.
4. BOOKING — Direct users to book a 15-min Reality Check via the enquiry form.

SERVICES:
- AI Strategy & Implementation: LLM integrations, automation pipelines, measurable ROI.
- Process Automation: Map broken workflows, rebuild automation-first. KISS. YAGNI.
- Digital Transformation: End-to-end vision — infrastructure, workflows, culture.
- Ghost Ship Audit: Unfiltered diagnostic when dashboards are green but company is drifting.

ABOUT SANTIAGO: Nearly two decades in corporate trenches. 20+ years in multinationals, 3 continents. Chief Clarity Officer. He knows the rules — which is why he knows how to break them.

TONE: Sharp, confident, occasionally provocative. Short punchy sentences. Never say "Great question!" When capturing leads, ask for name, email, and key challenge. Keep responses under 180 words unless detailing a service. Use **bold** for emphasis.`;

  let history = [];
  let isOpen = false;

  // ── STYLES ──────────────────────────────────────────────
  const css = `
    #um-widget-btn {
      position: fixed; bottom: 28px; right: 28px; z-index: 99999;
      width: 56px; height: 56px; border-radius: 50%;
      background: #e8ff00; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(232,255,0,0.35);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #um-widget-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(232,255,0,0.5); }
    #um-widget-btn svg { width: 24px; height: 24px; }

    #um-widget-panel {
      position: fixed; bottom: 96px; right: 28px; z-index: 99998;
      width: 380px; height: 560px; max-height: 80vh;
      background: #0a0a0a; border: 1px solid #2a2a2a;
      border-radius: 16px; display: flex; flex-direction: column;
      overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.7);
      transform: scale(0.92) translateY(12px); opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.2s;
      font-family: 'Inter', sans-serif;
    }
    #um-widget-panel.open {
      transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
    }

    #um-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 16px; border-bottom: 1px solid #1e1e1e;
      background: #0d0d0d; flex-shrink: 0;
    }
    .um-logo { font-family: 'Space Grotesk', 'Inter', sans-serif; font-weight: 700;
      font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #f0f0f0; }
    .um-logo span { color: #e8ff00; }
    .um-status { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #555; }
    .um-dot { width: 7px; height: 7px; border-radius: 50%; background: #e8ff00;
      animation: um-pulse 2s infinite; }
    @keyframes um-pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
    #um-close-btn { background: none; border: none; cursor: pointer; color: #555;
      font-size: 18px; line-height: 1; padding: 0 2px; transition: color 0.2s; }
    #um-close-btn:hover { color: #f0f0f0; }

    .um-quick-bar {
      display: flex; gap: 6px; padding: 8px 12px;
      border-bottom: 1px solid #1a1a1a; overflow-x: auto;
      flex-shrink: 0; scrollbar-width: none;
    }
    .um-quick-bar::-webkit-scrollbar { display: none; }
    .um-chip {
      flex-shrink: 0; padding: 5px 11px; border: 1px solid #2a2a2a;
      border-radius: 20px; font-size: 11px; color: #666; cursor: pointer;
      background: transparent; white-space: nowrap; transition: all 0.2s;
    }
    .um-chip:hover { border-color: #e8ff00; color: #e8ff00; background: rgba(232,255,0,0.05); }

    #um-chat {
      flex: 1; overflow-y: auto; padding: 16px 12px;
      display: flex; flex-direction: column; gap: 12px;
      scrollbar-width: thin; scrollbar-color: #2a2a2a transparent;
      scroll-behavior: smooth;
    }
    .um-msg { display: flex; gap: 8px; animation: um-fadeup 0.25s ease; }
    @keyframes um-fadeup { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .um-msg.um-user { align-self: flex-end; flex-direction: row-reverse; }
    .um-msg.um-bot { align-self: flex-start; }
    .um-avatar {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; margin-top: 2px;
    }
    .um-bot .um-avatar { background: #e8ff00; color: #000; }
    .um-user .um-avatar { background: #1a1a1a; color: #666; border: 1px solid #2a2a2a; }
    .um-bubble {
      padding: 10px 13px; border-radius: 10px;
      font-size: 13px; line-height: 1.6; max-width: 290px; color: #f0f0f0;
    }
    .um-bot .um-bubble { background: #111; border: 1px solid #222; border-top-left-radius: 3px; }
    .um-user .um-bubble { background: #1a1a1a; border: 1px solid #2a2a2a; border-top-right-radius: 3px; }
    .um-bubble strong { color: #e8ff00; }

    .um-typing { display: flex; gap: 4px; align-items: center; padding: 2px 0; }
    .um-typing span { width: 6px; height: 6px; border-radius: 50%; background: #444;
      animation: um-bounce 1.2s infinite; }
    .um-typing span:nth-child(2){animation-delay:.2s}
    .um-typing span:nth-child(3){animation-delay:.4s}
    @keyframes um-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}

    .um-input-area {
      padding: 10px 12px; border-top: 1px solid #1a1a1a;
      display: flex; gap: 8px; align-items: flex-end;
      background: #0a0a0a; flex-shrink: 0;
    }
    #um-input {
      flex: 1; background: #141414; border: 1px solid #2a2a2a;
      border-radius: 8px; padding: 9px 12px; color: #f0f0f0;
      font-family: inherit; font-size: 13px; resize: none;
      max-height: 90px; outline: none; line-height: 1.4;
      transition: border-color 0.2s;
    }
    #um-input:focus { border-color: #e8ff00; }
    #um-input::placeholder { color: #444; }
    #um-send {
      background: #e8ff00; border: none; border-radius: 8px;
      width: 36px; height: 36px; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.2s;
    }
    #um-send:hover { opacity: 0.85; }
    #um-send svg { width: 15px; height: 15px; }

    .um-form-card {
      background: #141414; border: 1px solid #2a2a2a;
      border-radius: 10px; padding: 12px;
      display: flex; flex-direction: column; gap: 8px;
      margin-top: 6px; max-width: 280px;
    }
    .um-form-card input, .um-form-card textarea {
      background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 6px;
      padding: 8px 11px; color: #f0f0f0; font-size: 12px;
      font-family: inherit; outline: none; transition: border-color 0.2s; width: 100%;
    }
    .um-form-card input:focus, .um-form-card textarea:focus { border-color: #e8ff00; }
    .um-form-card input::placeholder, .um-form-card textarea::placeholder { color: #444; }
    .um-form-card textarea { resize: none; min-height: 64px; }
    .um-form-btn {
      background: #e8ff00; color: #000; border: none; border-radius: 6px;
      padding: 8px; font-weight: 700; font-size: 11px; cursor: pointer;
      letter-spacing: 0.05em; transition: opacity 0.2s; width: 100%;
    }
    .um-form-btn:hover { opacity: 0.85; }

    #um-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ff3c3c; color: #fff; font-size: 10px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #0a0a0a;
      animation: um-badge-pop 0.3s cubic-bezier(.34,1.56,.64,1);
      pointer-events: none;
    }
    @keyframes um-badge-pop { from{transform:scale(0)} to{transform:scale(1)} }

    #um-tooltip {
      position: fixed; bottom: 96px; right: 90px; z-index: 99997;
      background: #e8ff00; color: #000; font-family: 'Inter', sans-serif;
      font-size: 13px; font-weight: 600; padding: 10px 16px;
      border-radius: 12px 12px 4px 12px;
      box-shadow: 0 4px 20px rgba(232,255,0,0.3);
      white-space: nowrap; cursor: pointer;
      animation: um-tooltip-in 0.4s cubic-bezier(.34,1.56,.64,1);
      max-width: 220px; white-space: normal; line-height: 1.4;
    }
    #um-tooltip::after {
      content: '';
      position: absolute; bottom: -8px; right: 16px;
      border: 8px solid transparent;
      border-top-color: #e8ff00; border-bottom: none;
    }
    @keyframes um-tooltip-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

    @media (max-width: 440px) {
      #um-widget-panel { width: calc(100vw - 32px); right: 16px; bottom: 84px; }
      #um-widget-btn { right: 16px; bottom: 16px; }
      #um-tooltip { right: 76px; bottom: 80px; }
    }
  `;

  // ── INJECT STYLES ────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── BUILD HTML ───────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <button id="um-widget-btn" aria-label="Open chat">
      <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div id="um-widget-panel" role="dialog" aria-label="Unfiltered Mindsets Chat">
      <div id="um-panel-header">
        <div class="um-logo">UNFILTERED <span>MINDSETS</span></div>
        <div class="um-status"><div class="um-dot"></div> AI · Online</div>
        <button id="um-close-btn" aria-label="Close chat">✕</button>
      </div>
      <div class="um-quick-bar">
        <button class="um-chip" data-q="Tell me about your services">⚡ Services</button>
        <button class="um-chip" data-q="I want to book a Reality Check">📅 Book</button>
        <button class="um-chip" data-q="I want to join the newsletter">📬 Newsletter</button>
        <button class="um-chip" data-q="Tell me about keynote sessions">🎤 Keynotes</button>
        <button class="um-chip" data-q="I have a client enquiry">💬 Enquiry</button>
      </div>
      <div id="um-chat"></div>
      <div class="um-input-area">
        <textarea id="um-input" rows="1" placeholder="Ask me anything. No filter."></textarea>
        <button id="um-send">
          <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `);

  // ── BADGE + TOOLTIP ──────────────────────────────────────
  let tooltipEl = null;

  function showBadge() {
    if (document.getElementById('um-badge')) return;
    const b = document.createElement('div');
    b.id = 'um-badge'; b.textContent = '1';
    btn.style.position = 'relative';
    btn.appendChild(b);
  }

  function hideBadge() {
    const b = document.getElementById('um-badge');
    if (b) b.remove();
  }

  function showTooltip() {
    if (tooltipEl || isOpen) return;
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'um-tooltip';
    tooltipEl.textContent = 'Ready for the unfiltered truth? 👊';
    tooltipEl.addEventListener('click', () => { hideTooltip(); toggleChat(); });
    document.body.appendChild(tooltipEl);
    // auto-hide after 6s
    setTimeout(hideTooltip, 6000);
  }

  function hideTooltip() {
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
  }

  // Show tooltip after 3s, badge after 5s
  setTimeout(() => { if (!isOpen) showTooltip(); }, 3000);
  setTimeout(() => { if (!isOpen) showBadge(); }, 5000);

  // ── TOGGLE ───────────────────────────────────────────────
  const panel = document.getElementById('um-widget-panel');
  const btn   = document.getElementById('um-widget-btn');
  const closeBtn = document.getElementById('um-close-btn');

  function toggleChat() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (isOpen) { hideBadge(); hideTooltip(); }
    btn.innerHTML = isOpen
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    if (isOpen && history.length === 0) initChat();
  }

  btn.addEventListener('click', () => { hideTooltip(); toggleChat(); });
  closeBtn.addEventListener('click', toggleChat);

  // ── CHIPS ────────────────────────────────────────────────
  document.querySelectorAll('.um-chip').forEach(c => {
    c.addEventListener('click', () => sendMsg(c.dataset.q));
  });

  // ── INPUT ────────────────────────────────────────────────
  const input = document.getElementById('um-input');
  document.getElementById('um-send').addEventListener('click', () => sendMsg());
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 90) + 'px';
  });

  // ── CHAT HELPERS ─────────────────────────────────────────
  function fmt(t) {
    return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }

  function appendMsg(role, html, form) {
    const chat = document.getElementById('um-chat');
    const wrap = document.createElement('div');
    wrap.className = `um-msg um-${role}`;

    const av = document.createElement('div');
    av.className = 'um-avatar';
    av.textContent = role === 'bot' ? 'U' : 'ME';

    const bub = document.createElement('div');
    bub.className = 'um-bubble';
    bub.innerHTML = html;

    if (form === 'newsletter') bub.appendChild(buildNewsletterForm());
    else if (form === 'enquiry') bub.appendChild(buildEnquiryForm());
    else if (form === 'keynote') bub.appendChild(buildKeynoteForm());

    wrap.appendChild(av);
    wrap.appendChild(bub);
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  }

  function showTyping() {
    const chat = document.getElementById('um-chat');
    const d = document.createElement('div');
    d.className = 'um-msg um-bot'; d.id = 'um-typing';
    d.innerHTML = `<div class="um-avatar" style="background:#e8ff00;color:#000;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;margin-top:2px;">U</div><div class="um-bubble um-bot" style="background:#111;border:1px solid #222;border-top-left-radius:3px;padding:10px 13px;"><div class="um-typing"><span></span><span></span><span></span></div></div>`;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('um-typing');
    if (el) el.remove();
  }

  function detectForm(text) {
    if (/(newsletter|subscribe|join.*news)/i.test(text)) return 'newsletter';
    if (/(keynote|speaking|speak)/i.test(text)) return 'keynote';
    if (/(enquiry|enquire|book|reality check|contact|hire|get in touch)/i.test(text)) return 'enquiry';
    return null;
  }

  function initChat() {
    appendMsg('bot', 'No PowerPoint. No committees. Just the truth your business needs.<br><br>I\'m the AI assistant for <strong>Unfiltered Mindsets</strong>. What problem are you actually dealing with?');
  }

  async function sendMsg(override) {
    const text = override !== undefined ? override : input.value.trim();
    if (!text) return;
    input.value = ''; input.style.height = 'auto';

    appendMsg('user', fmt(text));
    history.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history
        })
      });
      const data = await res.json();
      removeTyping();
      const reply = data.content?.map(b => b.text || '').join('') || 'Something went wrong.';
      history.push({ role: 'assistant', content: reply });
      appendMsg('bot', fmt(reply), detectForm(text));
    } catch {
      removeTyping();
      appendMsg('bot', 'Connection issue. Try again in a moment.');
    }
  }

  // ── FORMS ────────────────────────────────────────────────
  function buildNewsletterForm() {
    const w = document.createElement('div'); w.className = 'um-form-card';
    w.innerHTML = `
      <input class="um-nl-name" placeholder="Your name" type="text"/>
      <input class="um-nl-email" placeholder="Your email" type="email"/>
      <button class="um-form-btn">JOIN THE NEWSLETTER →</button>`;
    w.querySelector('.um-form-btn').onclick = () => {
      const name  = w.querySelector('.um-nl-name').value.trim();
      const email = w.querySelector('.um-nl-email').value.trim();
      if (!name || !email) { alert('Please fill in both fields.'); return; }
      window.open(`mailto:santi@unfiltered-mindsets.com?subject=Newsletter Sign-Up: ${encodeURIComponent(name)}&body=Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}`);
      window.open('https://unfiltered-news.beehiiv.com', '_blank');
      appendMsg('bot', `<strong>${name}</strong>, you're in. Weekly unfiltered truth — no spam, no slides.`);
    };
    return w;
  }

  function buildEnquiryForm() {
    const w = document.createElement('div'); w.className = 'um-form-card';
    w.innerHTML = `
      <input class="um-eq-name" placeholder="Your name" type="text"/>
      <input class="um-eq-email" placeholder="Your email" type="email"/>
      <input class="um-eq-co" placeholder="Company (optional)" type="text"/>
      <textarea class="um-eq-msg" placeholder="What's the real problem?"></textarea>
      <button class="um-form-btn">SEND THE REALITY CHECK REQUEST →</button>`;
    w.querySelector('.um-form-btn').onclick = () => {
      const name  = w.querySelector('.um-eq-name').value.trim();
      const email = w.querySelector('.um-eq-email').value.trim();
      const co    = w.querySelector('.um-eq-co').value.trim();
      const msg   = w.querySelector('.um-eq-msg').value.trim();
      if (!name || !email || !msg) { alert('Name, email and message are required.'); return; }
      const body = `New enquiry:%0A%0AName: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0ACompany: ${encodeURIComponent(co||'N/A')}%0A%0AMessage:%0A${encodeURIComponent(msg)}`;
      window.open(`mailto:santi@unfiltered-mindsets.com?subject=Client Enquiry: ${encodeURIComponent(name)}&body=${body}`);
      appendMsg('bot', `Message sent. <strong>Brace yourself for the unfiltered truth.</strong>`);
    };
    return w;
  }

  function buildKeynoteForm() {
    const w = document.createElement('div'); w.className = 'um-form-card';
    w.innerHTML = `
      <input class="um-kn-name" placeholder="Your name" type="text"/>
      <input class="um-kn-email" placeholder="Your email" type="email"/>
      <input class="um-kn-org" placeholder="Organization / Event" type="text"/>
      <textarea class="um-kn-topic" placeholder="Topic or event details"></textarea>
      <button class="um-form-btn">REQUEST KEYNOTE →</button>`;
    w.querySelector('.um-form-btn').onclick = () => {
      const name  = w.querySelector('.um-kn-name').value.trim();
      const email = w.querySelector('.um-kn-email').value.trim();
      const org   = w.querySelector('.um-kn-org').value.trim();
      const topic = w.querySelector('.um-kn-topic').value.trim();
      if (!name || !email) { alert('Name and email are required.'); return; }
      const body = `Keynote Request:%0A%0AName: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0AOrg: ${encodeURIComponent(org||'N/A')}%0ATopic: ${encodeURIComponent(topic||'N/A')}`;
      window.open(`mailto:santi@unfiltered-mindsets.com?subject=Keynote Request: ${encodeURIComponent(name)}&body=${body}`);
      appendMsg('bot', `Request sent. <strong>Your audience won't forget it.</strong>`);
    };
    return w;
  }

})();
