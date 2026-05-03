import { useState, useRef, useEffect, useCallback } from "react";

const FONTS = [
  { label:"Cormorant Garamond — Luxury Serif", value:"Cormorant Garamond", url:"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" },
  { label:"Playfair Display — Editorial Serif", value:"Playfair Display", url:"https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap" },
  { label:"Libre Baskerville — Classic Serif", value:"Libre Baskerville", url:"https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&display=swap" },
  { label:"Raleway — Elegant Sans", value:"Raleway", url:"https://fonts.googleapis.com/css2?family=Raleway:wght@200;300;400;500&display=swap" },
  { label:"Montserrat — Modern Sans", value:"Montserrat", url:"https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500&display=swap" },
];
const ACCENT_PRESETS = ["#b8935a","#1a3a5c","#6b8f71","#b87878","#5a6a7a","#3a3a3a"];
const SLOT_BG = ["#2a2520","#252220","#22201e","#1f1d1b"];
const PROJECT_TYPES = ["Full Home Redesign","Living & Dining","Master Suite","Kitchen & Entertaining","Commercial Office","Luxury Apartment","Villa / Estate"];
const BUDGETS = ["$15,000–$30,000","$30,000–$60,000","$60,000–$100,000","$100,000–$200,000","$200,000+"];
const STYLES = ["Luxury & Opulent","Modern Minimal","Warm Contemporary","Classic & Timeless","Organic & Natural","Art Deco","Japandi","Bold & Eclectic"];
const TIMELINES = ["4–6 weeks","6–10 weeks","3–4 months","4–6 months","6–12 months"];
const DEFAULT_PROFILE = { studioName:"", designerName:"", email:"", phone:"", website:"", logo:null, font:"Cormorant Garamond", accent:"#b8935a" };
const DEFAULT_PROJ = { clientName:"", projectType:"", rooms:"", budget:"", style:"", timeline:"", notes:"", moodImages:[null,null,null,null] };

function loadFont(url) {
  if (!document.querySelector(`link[href="${url}"]`)) {
    const l = document.createElement("link"); l.rel="stylesheet"; l.href=url;
    document.head.appendChild(l);
  }
}
function encode(str) { return btoa(unescape(encodeURIComponent(str))); }
function decode(str) { try { return decodeURIComponent(escape(atob(str))); } catch { return ""; } }
function lsGet(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  * { box-sizing: border-box; }
  input[type=file] { display: none; }
  body { margin: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0c0c0c; }
  ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
  @media print {
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { margin: 0; size: A4; }
    body { margin: 0 !important; }
    #proposal-doc { border-radius: 0 !important; }
  }
`;

const T = {
  app: { minHeight:"100vh", fontFamily:"'Jost',sans-serif", background:"#0c0c0c", color:"#e8e0d4" },
  nav: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.2rem 2rem", borderBottom:"0.5px solid #1e1e1e", position:"sticky", top:0, background:"#0c0c0c", zIndex:10 },
  main: { padding:"2.5rem 2rem", maxWidth:680, margin:"0 auto" },
  h1: (font) => ({ fontFamily:`'${font}',serif`, fontSize:"2rem", fontWeight:300, color:"#e8e0d4", marginBottom:"0.3rem", lineHeight:1.2 }),
  sub: { fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"#555", marginBottom:"2rem" },
  inp: { background:"#111", border:"0.5px solid #222", color:"#e8e0d4", fontFamily:"'Jost',sans-serif", fontSize:13, padding:"11px 14px", borderRadius:3, outline:"none", width:"100%", transition:"border-color 0.2s" },
  lbl: { fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"#555" },
  grp: { display:"flex", flexDirection:"column", gap:7 },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.2rem" },
  btnP: (a) => ({ background:a, color:"#0c0c0c", border:"none", padding:"12px 32px", fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:500, letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer", borderRadius:2 }),
  btnG: { background:"transparent", color:"#555", border:"0.5px solid #222", padding:"11px 24px", fontFamily:"'Jost',sans-serif", fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", borderRadius:2 },
  row: { display:"flex", gap:12, alignItems:"center" },
  err: { color:"#e24b4a", fontSize:12, padding:"10px 14px", background:"rgba(226,75,74,0.06)", border:"0.5px solid rgba(226,75,74,0.25)", borderRadius:3, marginBottom:"1rem" },
  dots: { display:"flex", gap:7, marginBottom:"2rem" },
};

function Dropdown({ label, value, onChange, options, placeholder="Select…", full }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div style={full ? { ...T.grp, gridColumn:"1/-1" } : T.grp} ref={ref}>
      {label && <label style={T.lbl}>{label}</label>}
      <div style={{ position:"relative" }}>
        <div onClick={() => setOpen(o => !o)} style={{ ...T.inp, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", userSelect:"none", color:value?"#e8e0d4":"#444" }}>
          <span>{value || placeholder}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform:open?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }}>
            <path d="M1 1L5 5L9 1" stroke="#555" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        {open && (
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#111", border:"0.5px solid #2a2a2a", borderRadius:3, zIndex:100, overflow:"hidden", animation:"fadeIn 0.15s ease", maxHeight:220, overflowY:"auto" }}>
            {options.map(o => (
              <div key={o} onClick={() => { onChange(o); setOpen(false); }}
                style={{ padding:"11px 14px", fontSize:13, cursor:"pointer", color:value===o?"#e8e0d4":"#888", background:value===o?"#1a1a1a":"transparent", borderBottom:"0.5px solid #1a1a1a", transition:"background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background="#1a1a1a"}
                onMouseLeave={e => e.currentTarget.style.background = value===o?"#1a1a1a":"transparent"}>
                {o}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr(""); setLoading(true);
    if (!form.email || !form.password) { setErr("Please fill in all fields."); setLoading(false); return; }
    const key = `user:${form.email.toLowerCase()}`;
    if (mode === "register") {
      if (!form.name) { setErr("Please enter your name."); setLoading(false); return; }
      if (lsGet(key)) { setErr("An account with this email already exists."); setLoading(false); return; }
      const user = { name:form.name, email:form.email.toLowerCase(), password:encode(form.password) };
      lsSet(key, user);
      onLogin(user);
    } else {
      const user = lsGet(key);
      if (!user || decode(user.password) !== form.password) { setErr("Incorrect email or password."); setLoading(false); return; }
      onLogin(user);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", background:"#0c0c0c" }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:500, letterSpacing:"0.15em", color:"#b8935a", textTransform:"uppercase", marginBottom:"3rem" }}>Proposa</div>
      <div style={{ width:"100%", maxWidth:380, animation:"fadeUp 0.4s ease" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.8rem", fontWeight:300, color:"#e8e0d4", marginBottom:"0.3rem" }}>{mode==="login"?"Welcome back":"Create account"}</div>
        <div style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"#555", marginBottom:"2rem" }}>{mode==="login"?"Sign in to your studio":"Set up your account"}</div>
        {err && <div style={T.err}>{err}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem", marginBottom:"1.5rem" }}>
          {mode==="register" && (
            <div style={T.grp}>
              <label style={T.lbl}>Full Name</label>
              <input style={T.inp} value={form.name} onChange={e=>sf("name",e.target.value)} placeholder="Your name" onKeyDown={e=>e.key==="Enter"&&submit()}/>
            </div>
          )}
          <div style={T.grp}>
            <label style={T.lbl}>Email</label>
            <input style={T.inp} type="email" value={form.email} onChange={e=>sf("email",e.target.value)} placeholder="you@studio.com" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <div style={T.grp}>
            <label style={T.lbl}>Password</label>
            <input style={T.inp} type="password" value={form.password} onChange={e=>sf("password",e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
        </div>
        <button style={{ ...T.btnP("#b8935a"), width:"100%", padding:"13px", fontSize:11 }} onClick={submit} disabled={loading}>
          {loading?"…":mode==="login"?"Sign In":"Create Account"}
        </button>
        <div style={{ textAlign:"center", marginTop:"1.5rem", fontSize:12, color:"#555" }}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <span style={{ color:"#b8935a", cursor:"pointer" }} onClick={()=>{ setMode(m=>m==="login"?"register":"login"); setErr(""); }}>
            {mode==="login"?"Register":"Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Dots({ step, accent }) {
  const steps = ["onboard","form","preview"];
  const idx = steps.indexOf(step);
  return (
    <div style={T.dots}>
      {steps.map((s,i) => (
        <div key={s} style={{ width:6, height:6, borderRadius:"50%", background:i<idx?"#555":i===idx?(accent||"#b8935a"):"#222", transition:"background 0.3s" }}/>
      ))}
    </div>
  );
}

function useImg(onLoad) {
  const ref = useRef();
  const trigger = () => ref.current?.click();
  const handler = e => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader(); r.onload=ev=>onLoad(ev.target.result); r.readAsDataURL(f);
    e.target.value="";
  };
  return { ref, trigger, handler };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("onboard");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [proj, setProj] = useState(DEFAULT_PROJ);
  const [proposal, setProposal] = useState(null);
  const [err, setErr] = useState("");

  const sp = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const sj = (k, v) => setProj(p => ({ ...p, [k]: v }));
  const setMoodImg = (i, val) => setProj(p => { const imgs=[...p.moodImages]; imgs[i]=val; return {...p,moodImages:imgs}; });

  const logoUp = useImg(v => sp("logo", v));
  const mood0 = useImg(v => setMoodImg(0, v));
  const mood1 = useImg(v => setMoodImg(1, v));
  const mood2 = useImg(v => setMoodImg(2, v));
  const mood3 = useImg(v => setMoodImg(3, v));
  const moodUps = [mood0, mood1, mood2, mood3];

  const accent = profile.accent;
  const font = profile.font;

  const handleLogin = useCallback((u) => {
    setUser(u);
    const saved = lsGet(`profile:${u.email}`);
    if (saved) {
      setProfile(saved);
      const fo = FONTS.find(f=>f.value===saved.font); if(fo) loadFont(fo.url);
    }
  }, []);

  const saveProfile = (p) => {
    if (!user) return;
    lsSet(`profile:${user.email}`, p || profile);
  };

  const generate = async () => {
    setStep("gen"); setErr("");
    saveProfile();
    try {
      const res = await fetch("/api/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          system:`You write interior design proposals. Sound like a real confident designer not a brochure. Be direct warm and specific. No buzzwords. Return ONLY valid JSON no markdown no backticks. Schema: {"projectOverview":"2-3 sentences mention the client by name and rooms sound real","designConcept":"3-4 sentences describe textures light materials how it will feel specific not generic","scopeOfWork":["task","task","task","task","task","task"],"timeline":[{"phase":"Discovery and Concept","duration":"X weeks","description":"what happens"},{"phase":"Design Development","duration":"X weeks","description":"what happens"},{"phase":"Procurement and Installation","duration":"X weeks","description":"what happens"}],"investment":{"designFee":"$X,XXX","implementation":"$XX,XXX to $XX,XXX","total":"$XX,XXX to $XX,XXX"},"terms":"2 sentences clear payment structure no fluff"}`,
          messages:[{role:"user",content:`Studio: ${profile.studioName} Designer: ${profile.designerName} Client: ${proj.clientName} Project: ${proj.projectType} Rooms: ${proj.rooms} Budget: ${proj.budget} Style: ${proj.style} Timeline: ${proj.timeline} Notes: ${proj.notes||"None"}`}]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const txt = data.text.replace(/```json|```/g,"").trim();
      setProposal(JSON.parse(txt)); setStep("preview");
    } catch(e) { setErr("Generation failed. Please try again."); setStep("form"); }
  };

  if (!user) return <div style={T.app}><style>{CSS}</style><AuthScreen onLogin={handleLogin}/></div>;

  const stepLabel = { onboard:"Studio Setup", form:"Project Brief", gen:"Generating…", preview:"Proposal Ready" }[step];

  return (
    <div style={T.app}>
      <style>{CSS}</style>
      <nav style={T.nav} className="no-print">
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", fontWeight:500, letterSpacing:"0.15em", color:accent, textTransform:"uppercase" }}>Proposa</div>
        <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
          <span style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"#444" }}>{stepLabel}</span>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"#1a1a1a", border:"0.5px solid #2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#888" }}>{user.name?.[0]?.toUpperCase()}</div>
            <button style={{ ...T.btnG, padding:"6px 14px", fontSize:10 }} onClick={()=>setUser(null)}>Sign out</button>
          </div>
        </div>
      </nav>

      {step==="onboard" && (
        <div style={T.main}>
          <Dots step="onboard" accent={accent}/>
          <div style={T.h1(font)}>Studio Setup</div>
          <div style={T.sub}>Saved to your account automatically</div>
          <div style={{ ...T.grid2, marginBottom:"1.5rem" }}>
            <div style={{ ...T.grp, gridColumn:"1/-1" }}>
              <label style={T.lbl}>Studio Name</label>
              <input style={T.inp} value={profile.studioName} onChange={e=>sp("studioName",e.target.value)} placeholder="e.g. Maison Élite Interiors"/>
            </div>
            <div style={T.grp}>
              <label style={T.lbl}>Designer Name</label>
              <input style={T.inp} value={profile.designerName} onChange={e=>sp("designerName",e.target.value)} placeholder="Your full name"/>
            </div>
            <div style={T.grp}>
              <label style={T.lbl}>Email</label>
              <input style={T.inp} value={profile.email} onChange={e=>sp("email",e.target.value)} placeholder="studio@email.com"/>
            </div>
            <div style={T.grp}>
              <label style={T.lbl}>Phone</label>
              <input style={T.inp} value={profile.phone} onChange={e=>sp("phone",e.target.value)} placeholder="+1 000 000 0000"/>
            </div>
            <div style={T.grp}>
              <label style={T.lbl}>Website (optional)</label>
              <input style={T.inp} value={profile.website} onChange={e=>sp("website",e.target.value)} placeholder="www.yourstudio.com"/>
            </div>
          </div>
          <div style={{ ...T.grp, marginBottom:"1.5rem" }}>
            <label style={T.lbl}>Studio Logo</label>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              {profile.logo
                ? <img src={profile.logo} alt="logo" style={{ height:44, maxWidth:160, objectFit:"contain", background:"#111", borderRadius:3, padding:8 }}/>
                : <div style={{ height:44, width:100, background:"#111", border:"0.5px dashed #2a2a2a", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#444", letterSpacing:"0.08em", textTransform:"uppercase" }}>No logo</div>
              }
              <button style={{ ...T.btnG, padding:"8px 16px", fontSize:10 }} onClick={logoUp.trigger}>{profile.logo?"Change":"Upload Logo"}</button>
              <input ref={logoUp.ref} type="file" accept="image/*" onChange={logoUp.handler}/>
            </div>
          </div>
          <div style={{ ...T.grp, marginBottom:"1.5rem" }}>
            <label style={T.lbl}>Heading Font</label>
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:2 }}>
              {FONTS.map(f => (
                <label key={f.value} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 14px", background:profile.font===f.value?"#111":"transparent", border:`0.5px solid ${profile.font===f.value?accent:"#1e1e1e"}`, borderRadius:3, transition:"all 0.15s" }}>
                  <input type="radio" name="font" value={f.value} checked={profile.font===f.value} onChange={()=>{ sp("font",f.value); const fo=FONTS.find(x=>x.value===f.value); if(fo) loadFont(fo.url); }} style={{accentColor:accent}}/>
                  <span style={{ fontSize:12, color:profile.font===f.value?"#e8e0d4":"#555" }}>{f.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ ...T.grp, marginBottom:"2.5rem" }}>
            <label style={T.lbl}>Accent Color</label>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginTop:4 }}>
              {ACCENT_PRESETS.map(c => (
                <button key={c} onClick={()=>sp("accent",c)} style={{ width:30, height:30, borderRadius:"50%", background:c, border:profile.accent===c?"2px solid #fff":"2px solid transparent", cursor:"pointer", outline:"none" }}/>
              ))}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input type="color" value={profile.accent} onChange={e=>sp("accent",e.target.value)} style={{ width:30, height:30, border:"none", borderRadius:"50%", cursor:"pointer", padding:0, background:"none" }}/>
                <span style={{ fontSize:10, color:"#444", letterSpacing:"0.08em", textTransform:"uppercase" }}>Custom</span>
              </div>
            </div>
          </div>
          <div style={T.row}>
            <button style={T.btnP(accent)} onClick={()=>{
              if(!profile.studioName||!profile.designerName) return alert("Please enter studio and designer name.");
              saveProfile(); setStep("form");
            }}>Save & Continue</button>
            <span style={{ fontSize:11, color:"#333" }}>Saved to your account</span>
          </div>
        </div>
      )}

      {step==="form" && (
        <div style={T.main}>
          <Dots step="form" accent={accent}/>
          <div style={T.h1(font)}>Project Brief</div>
          <div style={T.sub}>Fill in the brief — AI handles the rest</div>
          {err && <div style={T.err}>{err}</div>}
          <div style={{ ...T.grid2, marginBottom:"1.5rem" }}>
            <div style={T.grp}>
              <label style={T.lbl}>Client Name</label>
              <input style={T.inp} value={proj.clientName} onChange={e=>sj("clientName",e.target.value)} placeholder="e.g. The Whitmore Family"/>
            </div>
            <Dropdown label="Project Type" value={proj.projectType} onChange={v=>sj("projectType",v)} options={PROJECT_TYPES}/>
            <div style={T.grp}>
              <label style={T.lbl}>Rooms / Spaces</label>
              <input style={T.inp} value={proj.rooms} onChange={e=>sj("rooms",e.target.value)} placeholder="Living room, master bedroom…"/>
            </div>
            <Dropdown label="Budget Range" value={proj.budget} onChange={v=>sj("budget",v)} options={BUDGETS}/>
            <Dropdown label="Design Style" value={proj.style} onChange={v=>sj("style",v)} options={STYLES}/>
            <Dropdown label="Timeline" value={proj.timeline} onChange={v=>sj("timeline",v)} options={TIMELINES}/>
            <div style={{ ...T.grp, gridColumn:"1/-1" }}>
              <label style={T.lbl}>Additional Notes (optional)</label>
              <textarea style={{ ...T.inp, resize:"vertical", minHeight:80, lineHeight:1.7 }} value={proj.notes} onChange={e=>sj("notes",e.target.value)} placeholder="Client preferences, references, special requirements…"/>
            </div>
          </div>
          <div style={{ ...T.grp, marginBottom:"2.5rem" }}>
            <label style={T.lbl}>Moodboard Images <span style={{ color:"#333", textTransform:"none", letterSpacing:0, fontSize:11 }}>— upload your own references (up to 4)</span></label>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gridTemplateRows:"150px 150px", gap:5, marginTop:4 }}>
              {moodUps.map((up, i) => (
                <div key={i} onClick={up.trigger} style={{ gridRow:i===0?"1/3":undefined, gridColumn:i===3?"2/4":undefined, background:proj.moodImages[i]?"transparent":SLOT_BG[i], borderRadius:3, border:proj.moodImages[i]?"none":"0.5px dashed #2a2a2a", overflow:"hidden", cursor:"pointer", position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {proj.moodImages[i]
                    ? <img src={proj.moodImages[i]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                    : <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:18, color:"#333", marginBottom:3 }}>+</div>
                        <div style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", color:"#333" }}>Image {i+1}</div>
                      </div>
                  }
                  {proj.moodImages[i] && (
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s" }}
                      onMouseEnter={e=>e.currentTarget.style.opacity=1}
                      onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                      <span style={{ color:"#fff", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase" }}>Replace</span>
                    </div>
                  )}
                  <input ref={up.ref} type="file" accept="image/*" onChange={up.handler}/>
                </div>
              ))}
            </div>
          </div>
          <div style={T.row}>
            <button style={T.btnG} onClick={()=>setStep("onboard")}>Back</button>
            <button style={T.btnP(accent)} onClick={()=>{
              const req=["clientName","projectType","rooms","budget","style","timeline"];
              for(const f of req) if(!proj[f]) return alert("Please fill all required fields.");
              generate();
            }}>Generate Proposal</button>
          </div>
        </div>
      )}

      {step==="gen" && (
        <div style={{ minHeight:"70vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1.5rem" }}>
          <div style={{ width:40, height:40, border:`1.5px solid ${accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.9s linear infinite" }}/>
          <div style={{ fontFamily:`'${font}',serif`, fontSize:"1.4rem", fontWeight:300 }}>Building your proposal</div>
          <div style={{ fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase", color:"#444" }}>Writing for {proj.clientName}…</div>
        </div>
      )}

      {step==="preview" && proposal && (
        <ProposalView profile={profile} proj={proj} p={proposal} accent={accent} font={font}
          onNew={()=>{ setProj(DEFAULT_PROJ); setStep("form"); }}
          onEdit={()=>setStep("form")}/>
      )}
    </div>
  );
}

function PS({ num, label, accent, children, last }) {
  return (
    <div style={{ marginBottom:last?0:"2.5rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"1rem", paddingBottom:"0.5rem", borderBottom:"0.5px solid #ece8e2" }}>
        <span style={{ fontSize:"8px", letterSpacing:"0.22em", textTransform:"uppercase", color:accent }}>{num}</span>
        <span style={{ fontSize:"8px", color:"#ccc" }}>—</span>
        <span style={{ fontSize:"8px", letterSpacing:"0.22em", textTransform:"uppercase", color:"#bbb" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function ProposalView({ profile, proj, p, accent, font, onNew, onEdit }) {
  const today = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  const inv = p.investment||{};
  const imgs = proj.moodImages;
  const pFont = `'${font}',serif`;

  return (
    <div style={{ padding:"1.5rem" }}>
      <div className="no-print" style={{ display:"flex", gap:10, marginBottom:"1.5rem", alignItems:"center" }}>
        <span style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:accent, background:`${accent}15`, border:`0.5px solid ${accent}35`, padding:"4px 10px", borderRadius:2 }}>Preview</span>
        <button style={T.btnG} onClick={onNew}>New Proposal</button>
        <button style={T.btnG} onClick={onEdit}>Edit</button>
        <button style={T.btnP(accent)} onClick={()=>window.print()}>Print / Save PDF</button>
      </div>

      <div id="proposal-doc" style={{ background:"#fff", color:"#1a1a1a", borderRadius:3, overflow:"hidden", fontFamily:"'Jost',sans-serif" }}>
        <div style={{ background:"#0c0c0c", color:"#e8e0d4", padding:"3rem", borderBottom:`2px solid ${accent}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2.5rem" }}>
            {profile.logo
              ? <img src={profile.logo} alt="logo" style={{ height:44, maxWidth:160, objectFit:"contain" }}/>
              : <div style={{ fontFamily:pFont, fontSize:"0.95rem", letterSpacing:"0.14em", color:accent, textTransform:"uppercase" }}>{profile.studioName}</div>
            }
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"8px", letterSpacing:"0.2em", textTransform:"uppercase", color:accent }}>Design Proposal</div>
              <div style={{ fontSize:"11px", color:"#444", marginTop:4 }}>{today}</div>
            </div>
          </div>
          <div style={{ fontFamily:pFont, fontSize:"2.8rem", fontWeight:300, lineHeight:1.15, marginBottom:"0.5rem" }}>{proj.projectType}</div>
          <div style={{ fontSize:"12px", color:"#555", letterSpacing:"0.05em", marginBottom:"2.5rem" }}>Prepared exclusively for {proj.clientName}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1.5rem", paddingTop:"1.5rem", borderTop:"0.5px solid #1e1e1e" }}>
            {[["Rooms",proj.rooms],["Style",proj.style],["Timeline",proj.timeline],["Budget",proj.budget]].map(([l,v])=>(
              <div key={l}>
                <div style={{ fontSize:"8px", letterSpacing:"0.18em", textTransform:"uppercase", color:accent, marginBottom:5 }}>{l}</div>
                <div style={{ fontSize:"11px", color:"#aaa", lineHeight:1.4 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ padding:"1.8rem 3rem 1.2rem", background:"#faf8f5", borderBottom:"0.5px solid #ece8e2" }}>
            <div style={{ fontSize:"8px", letterSpacing:"0.22em", textTransform:"uppercase", color:accent, marginBottom:8 }}>Visual Direction</div>
            <div style={{ fontFamily:pFont, fontSize:"1.5rem", fontWeight:400, color:"#1a1a1a", marginBottom:4 }}>Moodboard & Aesthetic Reference</div>
            <div style={{ fontSize:"11px", color:"#aaa" }}>Curated references for the {proj.style} direction</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gridTemplateRows:"190px 190px", gap:3, background:"#f0ebe3" }}>
            {imgs.map((img,i)=>(
              <div key={i} style={{ gridRow:i===0?"1/3":undefined, gridColumn:i===3?"2/4":undefined, background:["#e8e3dc","#ddd8d0","#d4cfc7","#cbc6bd"][i], overflow:"hidden" }}>
                {img
                  ? <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", color:"#bbb" }}>No image</span>
                    </div>
                }
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"2.5rem 3rem" }}>
          <PS num="01" label="The Project" accent={accent}>
            <p style={{ fontFamily:pFont, fontSize:"1.05rem", fontWeight:300, lineHeight:2, color:"#3a3632", fontStyle:"italic" }}>{p.projectOverview}</p>
          </PS>
          <PS num="02" label="Design Concept" accent={accent}>
            <p style={{ fontSize:"13px", lineHeight:1.95, color:"#3a3632" }}>{p.designConcept}</p>
          </PS>
          <PS num="03" label="Scope of Work" accent={accent}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 3rem" }}>
              {(p.scopeOfWork||[]).map((item,i)=>(
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:"12px", color:"#3a3632", lineHeight:1.7 }}>
                  <span style={{ width:3, height:3, borderRadius:"50%", background:accent, marginTop:9, flexShrink:0, display:"block" }}/>
                  {item}
                </div>
              ))}
            </div>
          </PS>
          <PS num="04" label="Timeline" accent={accent}>
            <div style={{ position:"relative", paddingLeft:24 }}>
              <div style={{ position:"absolute", left:5, top:8, bottom:8, width:1, background:`${accent}25` }}/>
              {(p.timeline||[]).map((t,i)=>(
                <div key={i} style={{ position:"relative", marginBottom:20, paddingLeft:16 }}>
                  <div style={{ position:"absolute", left:-19, top:5, width:7, height:7, borderRadius:"50%", background:accent }}/>
                  <div style={{ fontSize:11, fontWeight:500, color:"#1a1a1a" }}>{t.phase} <span style={{ fontSize:10, color:accent, fontWeight:400 }}>— {t.duration}</span></div>
                  <div style={{ fontSize:11, color:"#7a7068", lineHeight:1.7, marginTop:2 }}>{t.description}</div>
                </div>
              ))}
            </div>
          </PS>
          <PS num="05" label="Investment" accent={accent}>
            <div style={{ background:"#faf8f5", border:"0.5px solid #ece8e2", borderRadius:3, overflow:"hidden" }}>
              {[["Design Fee",inv.designFee],["Procurement & Implementation",inv.implementation]].map(([l,v],i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 1.5rem", borderBottom:"0.5px solid #ece8e2" }}>
                  <span style={{ fontSize:11, color:"#7a7068" }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:500, color:"#1a1a1a" }}>{v}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"15px 1.5rem", background:"#f0ebe3" }}>
                <span style={{ fontSize:12, fontWeight:500, color:"#1a1a1a" }}>Total Estimated Investment</span>
                <span style={{ fontFamily:pFont, fontSize:"1.25rem", color:accent }}>{inv.total}</span>
              </div>
            </div>
          </PS>
          <PS num="06" label="Next Steps" accent={accent} last>
            <p style={{ fontSize:"13px", lineHeight:1.9, color:"#3a3632" }}>{p.terms}</p>
          </PS>
        </div>

        <div style={{ background:"#0c0c0c", padding:"1.5rem 3rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {profile.logo
            ? <img src={profile.logo} alt="logo" style={{ height:28, maxWidth:110, objectFit:"contain" }}/>
            : <div style={{ fontFamily:pFont, fontSize:"0.85rem", letterSpacing:"0.12em", color:accent, textTransform:"uppercase" }}>{profile.studioName}</div>
          }
          <div style={{ textAlign:"right", fontSize:10, color:"#444", lineHeight:2 }}>
            {profile.email&&<div>{profile.email}</div>}
            {profile.phone&&<div>{profile.phone}</div>}
            {profile.website&&<div>{profile.website}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
