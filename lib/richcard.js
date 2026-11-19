/**
 * Furina MD - Rich Response & Interactive HTML Cards Engine
 * Adapted from VanxOne kernel HTML live cards.
 */

const fs = require('fs');
const path = require('path');

const KAPABILITAS = [34, 58, 29, 1, 67, 60, 55, 8];
const DEFAULT_BOT_JID = "867051314767696@bot";

const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const randomResponseId = () => `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;

function buildRichPayload(html, title = "Card", quoted = null) {
  const q = quoted && quoted.key && quoted.message ? {
    stanzaId: quoted.key.id,
    participant: quoted.key.participant || quoted.sender,
    remoteJid: quoted.chat || quoted.key.remoteJid,
    quotedMessage: quoted.message
  } : {};

  return {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata: { capabilityMetadata: { capabilities: KAPABILITAS } }
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: title }],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify({
              response_id: randomResponseId(),
              sections: [{
                view_model: {
                  primitive: {
                    __typename: "GenAIaeacdsnwHtmlPrimitive",
                    payload: html,
                    trusted_sources: []
                  },
                  __typename: "GenAISingleLayoutViewModel"
                }
              }]
            })).toString("base64")
          },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid: DEFAULT_BOT_JID },
            forwardOrigin: 4,
            ...q
          }
        }
      }
    }
  };
}

async function sendRichCard(sock, chat, html, title = "Live Card", quoted = null) {
  try {
    const payload = buildRichPayload(html, title, quoted);
    await sock.relayMessage(chat, payload, {});
    return { status: true };
  } catch (err) {
    console.error(`[RICHCARD:${title}] Gagal relayMessage:`, err.message);
    return { status: false, error: err.message };
  }
}

// Template Loader from data/rich/*.html
function loadHtmlTemplate(filename) {
  const p = path.join(__dirname, 'rich', filename);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, 'utf8');
  }
  return null;
}

const BASE_CSS = `
:root{--bg:#070914;--card:#12162b;--card2:#1b2040;--ink:#fff;--soft:#98a2cc;--line:#2a3158;--acc:#8b5cf6;--acc2:#22d3ee;--warn:#f59e0b;--red:#ef4444;--blue:#38bdf8;--sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:transparent;color:var(--ink);font-family:var(--sys);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.stage{min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:14px 10px;}
.app{width:100%;max-width:380px;border-radius:16px;overflow:hidden;position:relative;background:linear-gradient(160deg,#1c1446 0%,#0d1124 45%,var(--bg) 100%);box-shadow:0 18px 40px rgba(0,0,0,.55);padding:14px 12px 16px;}
.top{display:flex;align-items:center;gap:9px;margin-bottom:12px;}
.logo{width:30px;height:30px;border-radius:9px;background:var(--acc);flex:none;display:flex;align-items:center;justify-content:center;font-size:16px;}
.meta{min-width:0;flex:1;}
.title{font-size:14px;font-weight:800;}
.sub{font-size:10.5px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.btn{border:0;border-radius:10px;padding:10px 12px;font-size:13px;font-weight:800;cursor:pointer;background:var(--acc);color:#ffffff;}
.btn.alt{background:var(--card2);color:var(--ink);border:1px solid var(--line);}
.inp{width:100%;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;color:var(--ink);font-size:14px;outline:none;}
`;

// Standalone Cards Generator
function getTetrisHtml(playerName = "User") {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
  ${BASE_CSS}
  .wrap{display:flex;gap:10px;align-items:flex-start}
  .cv{background:#0b0f1f;border:1px solid var(--line);border-radius:10px;touch-action:none}
  .side{flex:1;display:grid;gap:7px}
  .pill{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px 10px;font-size:11px;color:var(--soft)}
  .pill b{display:block;font-size:18px;color:var(--ink)}
  .ctl{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
  .ctl button{padding:14px 0;font-size:18px;font-weight:800;border-radius:12px;border:1px solid var(--line);background:var(--card2);color:var(--ink);touch-action:manipulation;user-select:none;}
  .ctl button:active{background:var(--acc);color:#fff}
  </style>
  </head><body>
  <div class="stage"><div class="app">
   <div class="top"><div class="logo">🧱</div><div class="meta"><div class="title">Tetris Live</div><div class="sub">Pemain: ${playerName}</div></div></div>
   <div class="wrap">
    <canvas id="cv" class="cv" width="180" height="360" style="width:54%"></canvas>
    <div class="side">
     <div class="pill">Skor<b id="sc">0</b></div>
     <div class="pill">Level<b id="lv">1</b></div>
     <div class="pill">Baris<b id="ln">0</b></div>
     <canvas id="nx" class="cv" width="72" height="54" style="width:100%"></canvas>
     <button class="btn alt" id="rs">⟳ Ulang</button>
    </div>
   </div>
   <div class="ctl"><button id="bl">◀</button><button id="br">▶</button><button id="bt">⟳</button><button id="bd">▼</button></div>
   <button class="btn" style="width:100%;margin-top:8px" id="hd">⤓ Jatuhkan</button>
  </div></div>
  <script>
  (function(){
    var cv=document.getElementById('cv'),ctx=cv.getContext('2d'),sc=document.getElementById('sc'),lv=document.getElementById('lv'),ln=document.getElementById('ln');
    var W=10,H=20,S=18,grid=[],score=0,level=1,lines=0;
    for(var y=0;y<H;y++){grid[y]=[];for(var x=0;x<W;x++)grid[y][x]=0;}
    var SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];
    var cur={x:3,y:0,s:SHAPES[0]};
    function draw(){
      ctx.fillStyle='#0b0f1f';ctx.fillRect(0,0,cv.width,cv.height);
      for(var y=0;y<H;y++)for(var x=0;x<W;x++)if(grid[y][x]){ctx.fillStyle='#8b5cf6';ctx.fillRect(x*S,y*S,S-1,S-1);}
      ctx.fillStyle='#22d3ee';
      for(var r=0;r<cur.s.length;r++)for(var c=0;c<cur.s[r].length;c++)if(cur.s[r][c])ctx.fillRect((cur.x+c)*S,(cur.y+r)*S,S-1,S-1);
    }
    function collide(nx,ny,ns){
      for(var r=0;r<ns.length;r++)for(var c=0;c<ns[r].length;c++)if(ns[r][c]){
        var x=nx+c,y=ny+r;
        if(x<0||x>=W||y>=H||(y>=0&&grid[y][x]))return true;
      }
      return false;
    }
    function lock(){
      for(var r=0;r<cur.s.length;r++)for(var c=0;c<cur.s[r].length;c++)if(cur.s[r][c]&&cur.y+r>=0)grid[cur.y+r][cur.x+c]=1;
      cur={x:3,y:0,s:SHAPES[Math.floor(Math.random()*SHAPES.length)]};
      score+=10;sc.textContent=score;draw();
    }
    function tick(){if(!collide(cur.x,cur.y+1,cur.s)){cur.y++;draw();}else{lock();}}
    setInterval(tick,800);
    document.getElementById('bl').onclick=function(){if(!collide(cur.x-1,cur.y,cur.s)){cur.x--;draw();}};
    document.getElementById('br').onclick=function(){if(!collide(cur.x+1,cur.y,cur.s)){cur.x++;draw();}};
    document.getElementById('bd').onclick=function(){if(!collide(cur.x,cur.y+1,cur.s)){cur.y++;draw();}};
    document.getElementById('hd').onclick=function(){while(!collide(cur.x,cur.y+1,cur.s))cur.y++;lock();};
    draw();
  })();
  </script></body></html>`;
}

function getCalcHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
  ${BASE_CSS}
  .display{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;text-align:right;font-size:24px;font-weight:800;color:var(--ink);min-height:58px;word-break:break-all;margin-bottom:12px}
  .kpad{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
  .kpad button{padding:14px 0;border-radius:12px;border:1px solid var(--line);background:var(--card2);color:var(--ink);font-size:16px;font-weight:700;cursor:pointer}
  .kpad button.op{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff}
  </style></head><body>
  <div class="stage"><div class="app">
   <div class="top"><div class="logo">🧮</div><div class="meta"><div class="title">Kalkulator Live</div><div class="sub">Interaktif WhatsApp Card</div></div></div>
   <div class="display" id="res">0</div>
   <div class="kpad">
    <button onclick="clr()">C</button><button onclick="press('(')">(</button><button onclick="press(')')">)</button><button class="op" onclick="press('/')">÷</button>
    <button onclick="press('7')">7</button><button onclick="press('8')">8</button><button onclick="press('9')">9</button><button class="op" onclick="press('*')">×</button>
    <button onclick="press('4')">4</button><button onclick="press('5')">5</button><button onclick="press('6')">6</button><button class="op" onclick="press('-')">−</button>
    <button onclick="press('1')">1</button><button onclick="press('2')">2</button><button onclick="press('3')">3</button><button class="op" onclick="press('+')">+</button>
    <button onclick="press('0')">0</button><button onclick="press('.')">.</button><button onclick="del()">⌫</button><button class="op" onclick="calc()">=</button>
   </div>
  </div></div>
  <script>
  var cur="";
  function press(v){cur+=v;document.getElementById('res').textContent=cur;}
  function clr(){cur="";document.getElementById('res').textContent="0";}
  function del(){cur=cur.slice(0,-1);document.getElementById('res').textContent=cur||"0";}
  function calc(){try{cur=String(eval(cur.replace(/×/g,'*').replace(/÷/g,'/')));document.getElementById('res').textContent=cur;}catch(e){document.getElementById('res').textContent="Error";cur="";}}
  </script></body></html>`;
}

function getPianoHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
  ${BASE_CSS}
  .keys{display:flex;justify-content:center;height:160px;position:relative;background:#111;padding:8px;border-radius:12px;border:1px solid var(--line)}
  .white{width:36px;height:100%;background:#fff;border:1px solid #ccc;border-radius:0 0 6px 6px;margin:0 1px;cursor:pointer}
  .white:active{background:#e0e0e0}
  .black{width:22px;height:60%;background:#111;border-radius:0 0 4px 4px;position:absolute;z-index:2;cursor:pointer}
  .black:active{background:#333}
  </style></head><body>
  <div class="stage"><div class="app">
   <div class="top"><div class="logo">🎹</div><div class="meta"><div class="title">Piano Mini Live</div><div class="sub">Sentuh tuts untuk bersuara</div></div></div>
   <div class="keys">
    <div class="white" onclick="play(261.6)"></div>
    <div class="white" onclick="play(293.7)"></div>
    <div class="white" onclick="play(329.6)"></div>
    <div class="white" onclick="play(349.2)"></div>
    <div class="white" onclick="play(392.0)"></div>
    <div class="white" onclick="play(440.0)"></div>
    <div class="white" onclick="play(493.9)"></div>
    <div class="white" onclick="play(523.3)"></div>
   </div>
   <div style="margin-top:10px;text-align:center;font-size:12px;color:var(--soft)">C4 - D4 - E4 - F4 - G4 - A4 - B4 - C5</div>
  </div></div>
  <script>
  var ctx=new (window.AudioContext||window.webkitAudioContext)();
  function play(f){
    if(ctx.state==='suspended')ctx.resume();
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0.3,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.8);
    o.connect(g);g.connect(ctx.destination);
    o.start();o.stop(ctx.currentTime+0.8);
  }
  </script></body></html>`;
}

module.exports = {
  buildRichPayload,
  sendRichCard,
  loadHtmlTemplate,
  getTetrisHtml,
  getCalcHtml,
  getPianoHtml
};
