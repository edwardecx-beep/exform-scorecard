import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const LEVELS = ["Associate Coach","FORM Coach","LEAD Coach","Mentor Coach","Master Coach","ECX Coach"];
const CORE_VALUES = [
  { id: "honesty", en: "Honesty", zh: "诚实" },
  { id: "integrity", en: "Integrity", zh: "正直" },
  { id: "transparency", en: "Transparency", zh: "透明" },
  { id: "precision", en: "Precision", zh: "精准" },
  { id: "progress", en: "Progress", zh: "进步" },
  { id: "ownership", en: "Ownership", zh: "主动承担" },
  { id: "leadership", en: "Leadership", zh: "领导力" },
  { id: "loyalty", en: "Loyalty", zh: "忠诚" },
];
const WHEEL_DIMS = [
  { id: "coachingPhilosophy",    en: "Coaching Philosophy",    zh: "执教哲学",   minLevel: 0, q: "Do I have a clear belief system that guides every coaching decision?" },
  { id: "professionalDiscipline",en: "Professional Discipline", zh: "职业纪律",   minLevel: 0, q: "Am I consistently showing up as a professional in time, image and commitment?" },
  { id: "programDesign",         en: "Program Design",          zh: "训练设计",   minLevel: 1, q: "Can I design individualised, progressive, sustainable programmes?" },
  { id: "coachingExecution",     en: "Coaching Execution",      zh: "执教执行",   minLevel: 1, q: "Is my in-session delivery clear, engaging and adaptive?" },
  { id: "clientCommunication",   en: "Client Communication",    zh: "客户沟通",   minLevel: 1, q: "Do I build genuine trust through listening and honest dialogue?" },
  { id: "valueCommunication",    en: "Value Communication",     zh: "价值传达",   minLevel: 2, q: "Can I help clients see why transformation is worth investing in?" },
  { id: "personalBrand",         en: "Personal Brand",          zh: "个人品牌",   minLevel: 2, q: "Is my online and offline identity clear, consistent and attracting clients?" },
  { id: "clientManagement",      en: "Client Management",       zh: "客户管理",   minLevel: 2, q: "Am I proactively managing the full client lifecycle to reduce churn?" },
  { id: "professionalDevelopment",en:"Professional Development", zh: "专业发展",  minLevel: 0, q: "Am I continuously learning and applying new knowledge to my coaching?" },
  { id: "businessAwareness",     en: "Business Awareness",      zh: "业务认知",   minLevel: 2, q: "Do I understand how my coaching decisions impact the business?" },
];
// minLevel: 0 = All Levels, 1 = FORM Coach+, 2 = Lead Coach+
// LEVELS index: 0=Associate, 1=FORM, 2=LEAD, 3=Mentor, 4=Master, 5=ECX
const WHEEL_SCORE_GUIDE = [
  { range: "1–3", label: "Foundational Gap", zh: "基础缺口", desc: "Needs immediate focus and support · 需要立即关注" },
  { range: "4–5", label: "Developing",       zh: "发展中",   desc: "Inconsistent, needs intentional practice · 不稳定，需要刻意练习" },
  { range: "6–7", label: "Competent",        zh: "胜任",     desc: "Solid but room for deeper mastery · 稳定但仍有提升空间" },
  { range: "8–9", label: "Strong",           zh: "强项",     desc: "Consistent, recognised by clients/team · 稳定且获得客户/团队认可" },
  { range: "10",  label: "Mastery",          zh: "精通",     desc: "Can teach and systemise for others · 可以教导他人并系统化" },
];
const LIFE_WHEEL = [
  { id: "godPurpose", en: "God & Purpose", zh: "信仰与目标" },
  { id: "healthFitness", en: "Health & Fitness", zh: "健康与体能" },
  { id: "loveRomance", en: "Love & Romance", zh: "爱情与伴侣" },
  { id: "homeFamily", en: "Home & Family", zh: "家庭关系" },
  { id: "knowledgeWisdom", en: "Knowledge & Wisdom", zh: "知识与智慧" },
  { id: "moneyFinance", en: "Money & Finance", zh: "财务与金钱" },
  { id: "friendsSocial", en: "Friends & Social", zh: "朋友与社交" },
  { id: "businessCareer", en: "Business & Career", zh: "事业与工作" },
  { id: "playRelaxation", en: "Play & Relaxation", zh: "娱乐与放松" },
  { id: "communityContribution", en: "Community & Contribution", zh: "社区与贡献" },
];
const EMPTY_LIFE_WHEEL = { godPurpose:"", healthFitness:"", loveRomance:"", homeFamily:"", knowledgeWisdom:"", moneyFinance:"", friendsSocial:"", businessCareer:"", playRelaxation:"", communityContribution:"" };
const EMPTY_WHEEL = { coachingPhilosophy:"", professionalDiscipline:"", programDesign:"", coachingExecution:"", clientCommunication:"", valueCommunication:"", personalBrand:"", clientManagement:"", professionalDevelopment:"", businessAwareness:"" };

const MASTER_PIN = "EXFORM2025"; // Mentor master PIN
const COACHES_KEY = "exform_coaches_registry";   // { coachId: { name, pin, level, mentor } }
const RECORDS_KEY = "exform_scorecard_records";   // [ { ...record, coachId } ]

const EMPTY_FORM = {
  month: "", year: new Date().getFullYear().toString(), level: "", mentor: "",
  sessions: "", trials: "", conversionRate: "", retentionRate: "",
  newClients: "", referrals: "", revenueTarget: "",
  attendance: "", satisfaction: "", planExecution: "",
  lifeWheelScores: { godPurpose:"", healthFitness:"", loveRomance:"", homeFamily:"", knowledgeWisdom:"", moneyFinance:"", friendsSocial:"", businessCareer:"", playRelaxation:"", communityContribution:"" },
  wheelScores: { coachingPhilosophy:"", professionalDiscipline:"", programDesign:"", coachingExecution:"", clientCommunication:"", valueCommunication:"", personalBrand:"", clientManagement:"", professionalDevelopment:"", businessAwareness:"" }, actionRate: "", curriculumModule: "",
  coreValues: { professionalism:"", honesty:"", ownership:"", precision:"", sustainableImpact:"", continuousGrowth:"" },
  lifeWheelNote: "", coreValuesNote: "", biggestAchievement: "", focusNextMonth: "", mentorMessage: "",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function monthIndex(m) { return MONTHS.indexOf(m); }
function sortRecords(recs) {
  return [...recs].sort((a,b) => {
    const y = parseInt(a.year) - parseInt(b.year);
    if (y !== 0) return y;
    return monthIndex(a.month) - monthIndex(b.month);
  });
}
function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
function Label({ en, zh }) {
  return (
    <div style={{marginBottom:4}}>
      <span style={{fontWeight:700,fontSize:13,color:"#E8E0D4"}}>{en}</span>
      {zh && <span style={{marginLeft:6,fontSize:11,color:"#7A7060"}}>{zh}</span>}
    </div>
  );
}
function Input({ value, onChange, placeholder, type="text", style={}, onKeyDown }) {
  return (
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} onKeyDown={onKeyDown}
      style={{width:"100%",boxSizing:"border-box",background:"#1C1814",border:"1px solid #3A342C",
        borderRadius:6,padding:"10px 12px",color:"#E8E0D4",fontSize:13,outline:"none",...style}}
      onFocus={e=>e.target.style.borderColor="#C9A84C"}
      onBlur={e=>e.target.style.borderColor="#3A342C"} />
  );
}
function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",boxSizing:"border-box",background:"#1C1814",border:"1px solid #3A342C",
        borderRadius:6,padding:"10px 12px",color:value?"#E8E0D4":"#5A5248",fontSize:13,outline:"none",cursor:"pointer"}}>
      <option value="" disabled>{placeholder}</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Textarea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{width:"100%",boxSizing:"border-box",background:"#1C1814",border:"1px solid #3A342C",
        borderRadius:6,padding:"10px 12px",color:"#E8E0D4",fontSize:13,outline:"none",
        resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}
      onFocus={e=>e.target.style.borderColor="#C9A84C"}
      onBlur={e=>e.target.style.borderColor="#3A342C"} />
  );
}
function RadioGroup({ value, onChange, options }) {
  return (
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
      {options.map(opt=>(
        <label key={opt} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:"#C8BFA8"}}
          onClick={()=>onChange(opt)}>
          <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,transition:"all 0.15s",
            border:value===opt?"2px solid #C9A84C":"2px solid #3A342C",
            background:value===opt?"#C9A84C":"transparent"}} />
          {opt}
        </label>
      ))}
    </div>
  );
}
function StarRow({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>onChange(n.toString())}
          style={{width:32,height:32,borderRadius:4,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,transition:"all 0.1s",
            background:parseInt(value)>=n?"#C9A84C":"#2A2420",
            color:parseInt(value)>=n?"#1A1612":"#5A5248"}}>{n}</button>
      ))}
    </div>
  );
}
function SectionHeader({ letter, en, zh }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:12,borderBottom:"1px solid #2A2420"}}>
      <div style={{width:32,height:32,borderRadius:6,background:"#C9A84C",color:"#1A1612",
        display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,flexShrink:0}}>{letter}</div>
      <div>
        <div style={{fontWeight:800,fontSize:15,color:"#E8E0D4"}}>{en}</div>
        <div style={{fontSize:11,color:"#7A7060"}}>{zh}</div>
      </div>
    </div>
  );
}
function MetricCard({ label, value, unit="" }) {
  return (
    <div style={{background:"#1C1814",borderRadius:8,padding:"12px 14px",border:"1px solid #2A2420"}}>
      <div style={{fontSize:10,color:"#7A7060",marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:800,color:"#C9A84C"}}>{value}<span style={{fontSize:11,color:"#5A5248",marginLeft:2}}>{unit}</span></div>
    </div>
  );
}
function TrendChart({ data, dataKey, label, target, yDomain, unit="" }) {
  if (!data || data.length < 2) return (
    <div style={{height:110,display:"flex",alignItems:"center",justifyContent:"center",color:"#5A5248",fontSize:11}}>
      需要至少 2 个月数据
    </div>
  );
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:"#C8BFA8",marginBottom:6}}>{label}</div>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{top:4,right:4,bottom:0,left:-24}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2420" />
          <XAxis dataKey="label" tick={{fill:"#7A7060",fontSize:9}} axisLine={false} tickLine={false} />
          <YAxis domain={yDomain} tick={{fill:"#7A7060",fontSize:9}} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{background:"#1C1814",border:"1px solid #3A342C",borderRadius:6,fontSize:11}}
            labelStyle={{color:"#C8BFA8"}} itemStyle={{color:"#C9A84C"}}
            formatter={v=>[`${v}${unit}`,label]} />
          {target && <ReferenceLine y={target} stroke="#3A342C" strokeDasharray="4 2" />}
          <Line type="monotone" dataKey={dataKey} stroke="#C9A84C" strokeWidth={2}
            dot={{fill:"#C9A84C",r:3}} activeDot={{r:5}} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app: {minHeight:"100vh",background:"#130F0C",color:"#E8E0D4",fontFamily:"'Inter',system-ui,sans-serif"},
  nav: {background:"#1A1612",borderBottom:"1px solid #2A2420",padding:"0 16px",
    display:"flex",alignItems:"center",justifyContent:"space-between",height:50,
    position:"sticky",top:0,zIndex:10},
  logo: {fontWeight:900,fontSize:13,letterSpacing:2,color:"#C9A84C"},
  page: {maxWidth:660,margin:"0 auto",padding:"20px 14px 60px"},
  card: {background:"#1A1612",borderRadius:12,padding:20,marginBottom:14,border:"1px solid #2A2420"},
  fg: {marginBottom:16},
  r2: {display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},
  r3: {display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10},
  goldBtn: (sm)=>({
    background:"linear-gradient(135deg,#C9A84C,#A87E2C)",color:"#1A1612",border:"none",
    borderRadius:8,padding:sm?"7px 14px":"12px 24px",fontWeight:700,
    fontSize:sm?11:13,cursor:"pointer",letterSpacing:0.3}),
  ghostBtn: {background:"transparent",color:"#7A7060",border:"1px solid #2A2420",
    borderRadius:8,padding:"10px 20px",fontWeight:600,fontSize:13,cursor:"pointer"},
  navBtn: (a)=>({background:a?"#2A2420":"transparent",border:"none",
    color:a?"#C9A84C":"#7A7060",padding:"5px 10px",borderRadius:6,
    fontSize:11,fontWeight:a?700:400,cursor:"pointer"}),
  pill: (a)=>({padding:"4px 12px",borderRadius:20,border:"1px solid #3A342C",
    background:a?"#C9A84C":"transparent",color:a?"#1A1612":"#7A7060",
    fontSize:11,fontWeight:700,cursor:"pointer"}),
  err: {color:"#E05C5C",fontSize:12,marginTop:6},
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  // ── AUTH STATE ──
  const [session, setSession] = useState(null); // null | { role:"coach"|"mentor", coachId?, coachName? }
  const [coaches, setCoaches] = useState({});   // { coachId: {name,pin,level,mentor} }
  const [records, setRecords] = useState([]);

  // ── UI STATE ──
  const [view, setView] = useState("login");    // login | register | home | form | dashboard | history | mentor
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [mentorFilter, setMentorFilter] = useState("");

  // Load data
  useEffect(()=>{
    try {
      const c = localStorage.getItem(COACHES_KEY);
      if (c) setCoaches(JSON.parse(c));
    } catch {}
    try {
      const r = localStorage.getItem(RECORDS_KEY);
      if (r) setRecords(JSON.parse(r));
    } catch {}
  },[]);

  const saveCoaches = (data) => {
    setCoaches(data);
    try { localStorage.setItem(COACHES_KEY, JSON.stringify(data)); } catch {}
  };
  const saveRecords = (data) => {
    setRecords(data);
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(data)); } catch {}
  };

  const logout = () => { setSession(null); setView("login"); setForm(EMPTY_FORM); setSubmitted(false); };

  // ── CHART DATA ──
  const getChartData = (coachId) => {
    const recs = sortRecords(records.filter(r=>r.coachId===coachId));
    return recs.map(r=>({
      label:`${r.month.slice(0,3)}'${r.year.slice(2)}`,
      sessions: parseFloat(r.sessions)||null,
      trials: parseFloat(r.trials)||null,
      conversion: parseFloat(r.conversionRate)||null,
      retention: parseFloat(r.retentionRate)||null,
      newClients: parseFloat(r.newClients)||null,
      attendance: parseFloat(r.attendance)||null,
      satisfaction: parseFloat(r.satisfaction)||null,
      planExecution: parseFloat(r.planExecution)||null,
      lifeWheelTotal: r.lifeWheelScores ? Object.values(r.lifeWheelScores).reduce((s,v)=>s+(parseInt(v)||0),0) || null : null,
      wheelTotal: r.wheelScores ? Object.values(r.wheelScores).reduce((s,v)=>s+(parseInt(v)||0),0) || null : (parseFloat(r.wheelTotal)||null),
    }));
  };

  const setField = (k,v) => setForm(f=>({...f,[k]:v}));
  const setCVField = (k,v) => setForm(f=>({...f,coreValues:{...f.coreValues,[k]:v}}));

  // ══════════════════════════════════════════════════════════════
  // LOGIN VIEW
  // ══════════════════════════════════════════════════════════════
  const LoginView = () => {
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [err, setErr] = useState("");

    const handleLogin = () => {
      setErr("");
      if (!name.trim() || !pin.trim()) { setErr("请填写姓名和 PIN / Please enter your name and PIN"); return; }
      // Mentor master login
      if (pin.trim() === MASTER_PIN) {
        setSession({role:"mentor"});
        setView("mentor");
        return;
      }
      // Coach login
      const coach = Object.entries(coaches).find(([,c])=>
        c.name.toLowerCase()===name.trim().toLowerCase() && c.pin===pin.trim()
      );
      if (!coach) { setErr("姓名或 PIN 不正确 / Incorrect name or PIN. Please try again."); return; }
      const [coachId, coachData] = coach;
      setSession({role:"coach", coachId, coachName:coachData.name});
      setForm(f=>({...f, level:coachData.level, mentor:coachData.mentor}));
      setView("home");
    };

    return (
      <div style={{minHeight:"100vh",background:"#130F0C",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{width:"100%",maxWidth:360}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:10,letterSpacing:4,color:"#C9A84C",fontWeight:700,marginBottom:8}}>EXFORM FITNESS</div>
            <div style={{fontSize:24,fontWeight:900,color:"#E8E0D4"}}>Coach Scorecard 教练记分卡</div>
            <div style={{fontSize:12,color:"#7A7060",marginTop:4}}>Monthly Performance System · 月度绩效系统</div>
          </div>
          <div style={S.card}>
            <div style={{...S.fg}}>
              <Label en="姓名 Name" zh="Your full name" />
              <Input value={name} onChange={setName} placeholder="输入你的姓名 / Enter your name"
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
            </div>
            <div style={{...S.fg}}>
              <Label en="PIN 码 PIN" zh="Your PIN code" />
              <Input value={pin} onChange={setPin} placeholder="输入 PIN 码 / Enter PIN" type="password"
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
            </div>
            {err && <div style={S.err}>{err}</div>}
            <button onClick={handleLogin} style={{...S.goldBtn(false),width:"100%",padding:"12px",marginTop:4}}>
              登入 Login →
            </button>
            <button onClick={()=>setView("register")} style={{...S.ghostBtn,width:"100%",marginTop:10,fontSize:12}}>
              第一次用？注册账号 / First time? Register
            </button>
          </div>
          <div style={{textAlign:"center",fontSize:10,color:"#3A342C",marginTop:12}}>
            Mentor 使用 Master PIN 登入 / Use Master PIN
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // REGISTER VIEW
  // ══════════════════════════════════════════════════════════════
  const RegisterView = () => {
    const [rName, setRName] = useState("");
    const [rPin, setRPin] = useState("");
    const [rPin2, setRPin2] = useState("");
    const [rLevel, setRLevel] = useState("");
    const [rMentor, setRMentor] = useState("");
    const [err, setErr] = useState("");

    const handleRegister = async () => {
      setErr("");
      if (!rName.trim()) { setErr("请填写姓名"); return; }
      if (rPin.length < 4) { setErr("PIN 至少 4 位 / PIN must be at least 4 digits"); return; }
      if (rPin !== rPin2) { setErr("两次 PIN 不符 / PINs do not match"); return; }
      if (rPin === MASTER_PIN) { setErr("此 PIN 不可用 / This PIN is not allowed"); return; }
      // Check name not taken
      const taken = Object.values(coaches).find(c=>c.name.toLowerCase()===rName.trim().toLowerCase());
      if (taken) { setErr("此姓名已被注册 / Name already registered. Contact your Mentor."); return; }
      const coachId = makeId();
      const newCoaches = {...coaches, [coachId]:{name:rName.trim(),pin:rPin,level:rLevel||"Associate Coach",mentor:rMentor.trim()}};
      saveCoaches(newCoaches);
      setSession({role:"coach",coachId,coachName:rName.trim()});
      setForm(f=>({...f,level:rLevel||"Associate Coach",mentor:rMentor.trim()}));
      setView("home");
    };

    return (
      <div style={{minHeight:"100vh",background:"#130F0C",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{width:"100%",maxWidth:380}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:10,letterSpacing:4,color:"#C9A84C",fontWeight:700,marginBottom:6}}>EXFORM FITNESS</div>
            <div style={{fontSize:20,fontWeight:900,color:"#E8E0D4"}}>创建账号 Create Account</div>
            <div style={{fontSize:11,color:"#7A7060",marginTop:4}}>Register — 只需注册一次 / One-time setup</div>
          </div>
          <div style={S.card}>
            <div style={S.fg}>
              <Label en="教练姓名 Full Name" zh="Your full name" />
              <Input value={rName} onChange={setRName} placeholder="你的全名 / Full name" />
            </div>
            <div style={S.r2}>
              <div style={S.fg}>
                <Label en="PIN 码 PIN" zh="Minimum 4 digits · 至少4位" />
                <Input value={rPin} onChange={setRPin} placeholder="设定 PIN / Set PIN" type="password" />
              </div>
              <div style={S.fg}>
                <Label en="确认 PIN Confirm" zh="Re-enter PIN · 再输一次" />
                <Input value={rPin2} onChange={setRPin2} placeholder="再输一次 / Confirm PIN" type="password" />
              </div>
            </div>
            <div style={S.fg}>
              <Label en="当前级别 Level" zh="Your current coach level" />
              <Select value={rLevel} onChange={setRLevel} options={LEVELS} placeholder="选择级别" />
            </div>
            <div style={S.fg}>
              <Label en="Mentor 姓名 Name" zh="Your mentor's name" />
              <Input value={rMentor} onChange={setRMentor} placeholder="Mentor 的名字 / Mentor's name" />
            </div>
            {err && <div style={S.err}>{err}</div>}
            <button onClick={handleRegister} style={{...S.goldBtn(false),width:"100%",padding:"12px"}}>
              注册并登入 Register & Login →
            </button>
            <button onClick={()=>setView("login")} style={{...S.ghostBtn,width:"100%",marginTop:10,fontSize:12}}>
              ← 返回 Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // COACH: HOME
  // ══════════════════════════════════════════════════════════════
  const HomeView = () => {
    const myRecords = sortRecords(records.filter(r=>r.coachId===session?.coachId)).reverse();
    const latest = myRecords[0];
    return (
      <div style={S.page}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:10,color:"#7A7060",letterSpacing:1}}>WELCOME BACK · 欢迎回来</div>
          <div style={{fontSize:22,fontWeight:900,color:"#E8E0D4"}}>{session?.coachName}</div>
          <div style={{fontSize:11,color:"#C9A84C"}}>{coaches[session?.coachId]?.level}</div>
        </div>

        {latest && (
          <div style={{...S.card,background:"linear-gradient(135deg,#1F1A14,#221C0F)",border:"1px solid #3A2E10",marginBottom:14}}>
            <div style={{fontSize:10,color:"#C9A84C",fontWeight:700,letterSpacing:1,marginBottom:10}}>Last Entry · 上次记录 — {latest.month} {latest.year}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              <MetricCard label="课时数 Sessions" value={latest.sessions||"—"} />
              <MetricCard label="Wheel 总分" value={latest.wheelScores ? Object.values(latest.wheelScores).reduce((s,v)=>s+(parseInt(v)||0),0) : (latest.wheelTotal||"—")} unit="/100" />
              <MetricCard label="留存率 Retention" value={latest.retentionRate?latest.retentionRate+"%":"—"} />
              <MetricCard label="满意度 Sat." value={latest.satisfaction||"—"} unit="/5" />
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          {[
            {icon:"",en:"填写本月 Scorecard New Entry",zh:"Submit this month's record · 提交本月记录",action:()=>{setSubmitted(false);setForm({...EMPTY_FORM,level:coaches[session?.coachId]?.level||"",mentor:coaches[session?.coachId]?.mentor||""});setView("form");}},
            {icon:"",en:"查看成长趋势 My Trends",zh:"View my performance charts · 查看我的绩效图表",action:()=>setView("dashboard")},
          ].map(b=>(
            <button key={b.en} onClick={b.action} style={{...S.card,cursor:"pointer",textAlign:"center",border:"1px solid #2A2420",transition:"border 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#C9A84C"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#2A2420"}>
              <div style={{fontSize:26,marginBottom:8}}>{b.icon}</div>
              <div style={{fontWeight:800,fontSize:13,color:"#E8E0D4"}}>{b.en}</div>
              <div style={{fontSize:10,color:"#7A7060",marginTop:3}}>{b.zh}</div>
            </button>
          ))}
        </div>

        {myRecords.length > 0 && (
          <div style={S.card}>
            <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:12}}>我的记录 My History</div>
            {myRecords.slice(0,5).map(r=>(
              <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #1E1A16"}}>
                <span style={{fontSize:13,color:"#C8BFA8",fontWeight:600}}>{r.month} {r.year}</span>
                <div style={{display:"flex",gap:16}}>
                  {r.sessions && <span style={{fontSize:11,color:"#7A7060"}}>{r.sessions} sessions</span>}
                  {r.wheelTotal && <span style={{fontSize:11,color:"#C9A84C"}}>Wheel {r.wheelTotal}</span>}
                </div>
              </div>
            ))}
            {myRecords.length > 5 && (
              <button onClick={()=>setView("history")} style={{...S.ghostBtn,width:"100%",marginTop:10,fontSize:11,padding:"7px"}}>
                查看全部 View all {myRecords.length}  entries记录 →
              </button>
            )}
          </div>
        )}

        {myRecords.length === 0 && (
          <div style={{...S.card,textAlign:"center",padding:28,color:"#5A5248",fontSize:13}}>
            还没有记录。填写你的第一份 Scorecard 开始吧。
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // COACH: FORM
  // ══════════════════════════════════════════════════════════════
  const FormView = () => {
    if (submitted) return (
      <div style={S.page}>
        <div style={{...S.card,textAlign:"center",padding:36}}>
          
          <div style={{fontWeight:900,fontSize:18,color:"#C9A84C",marginBottom:6}}>提交成功 Submitted</div>
          <div style={{color:"#7A7060",fontSize:12,marginBottom:24}}>
            {form.month} {form.year} Scorecard 已保存。Record saved successfully.
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>setView("dashboard")} style={S.goldBtn(false)}>查看趋势图 View My Trends →</button>
            <button onClick={()=>{setForm({...EMPTY_FORM,level:coaches[session?.coachId]?.level||"",mentor:coaches[session?.coachId]?.mentor||""});setSubmitted(false);}} style={S.ghostBtn}>再填一份 New Entry</button>
          </div>
        </div>
      </div>
    );

    const handleSubmit = async () => {
      if (!form.month || !form.year) { alert("请填写月份和年份 / Please select month and year"); return; }
      setSaving(true);
      const record = {
        ...form,
        id: makeId(),
        coachId: session.coachId,
        coachName: session.coachName,
        submittedAt: new Date().toISOString(),
      };
      saveRecords([...records, record]);
      setSaving(false);
      setSubmitted(true);
    };

    return (
      <div style={S.page}>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:"#7A7060",letterSpacing:1}}>{session?.coachName}</div>
          <div style={{fontWeight:900,fontSize:18,color:"#E8E0D4"}}>月度 Scorecard</div>
          <div style={{fontSize:11,color:"#7A7060"}}>Monthly Performance & Growth Record</div>
        </div>

        {/* 基本信息 */}
        <div style={S.card}>
          <SectionHeader letter="i" en="本月信息 Entry Info" zh="Monthly record details" />
          <div style={S.r3}>
            <div style={S.fg}>
              <Label en="月份 Month" zh="" />
              <Select value={form.month} onChange={v=>setField("month",v)} options={MONTHS} placeholder="选择" />
            </div>
            <div style={S.fg}>
              <Label en="年份 Year" zh="" />
              <Input value={form.year} onChange={v=>setField("year",v)} placeholder="2025" />
            </div>
            <div style={S.fg}>
              <Label en="级别 Level" zh="" />
              <Select value={form.level} onChange={v=>setField("level",v)} options={LEVELS} placeholder="选择" />
            </div>
          </div>
        </div>

        {/* Section A */}
        <div style={S.card}>
          <SectionHeader letter="A" en="业务指标 Business Metrics" zh="Monthly business performance" />
          <div style={S.r2}>
            {[["sessions","课时数 Sessions","Total completed · 当月完成总数","28"],["trials","Trial 次数 Trials","Trial sessions this month · 当月Trial课总数","4"],
              ["conversionRate","Trial 转化率 % Conversion","Trials → paying clients · 转化为正式客户","75"],["retentionRate","客户留存率 % Retention","Renewals ÷ expiring · 续约数/到期数","80"],
              ["newClients","新客户数 New Clients","New paying clients · 新增正式客户","2"],["referrals","转介绍数 Referrals","From client referrals · 客户推荐新咨询","1"]
            ].map(([k,en,zh,ph])=>(
              <div key={k} style={S.fg}>
                <Label en={en} zh={zh} />
                <Input value={form[k]} onChange={v=>setField(k,v)} placeholder={`例：${ph}`} type="number" />
              </div>
            ))}
          </div>
          <div style={S.fg}>
            <Label en="收入达标 Revenue Target" zh="Did you hit your monthly revenue goal?" />
            <RadioGroup value={form.revenueTarget} onChange={v=>setField("revenueTarget",v)}
              options={["达标 Met","未达标 Not Met"]} />
          </div>
        </div>

        {/* Section B */}
        <div style={S.card}>
          <SectionHeader letter="B" en="执教质量 Coaching Quality" zh="Client experience indicators" />
          <div style={S.r2}>
            <div style={S.fg}>
              <Label en="客户出席率 % Attendance" zh="Actual sessions ÷ scheduled sessions" />
              <Input value={form.attendance} onChange={v=>setField("attendance",v)} placeholder="例：90" type="number" />
            </div>
            <div style={S.fg}>
              <Label en="计划执行率 % Plan Execution" zh="Sessions delivered as planned" />
              <Input value={form.planExecution} onChange={v=>setField("planExecution",v)} placeholder="例：95" type="number" />
            </div>
          </div>
          <div style={S.fg}>
            <Label en="客户满意度 Satisfaction" zh="Average monthly client rating 1–5" />
            <StarRow value={form.satisfaction} onChange={v=>setField("satisfaction",v)} />
          </div>
        </div>

        {/* Section C */}
        <div style={S.card}>
          <SectionHeader letter="C" en="成长指标 Growth — Coach Mastery Wheel" zh="Rate each dimension 1–10 · 每项1–10分，自动算总分" />
          {(() => {
            const coachLvlIdx = LEVELS.indexOf(coaches[session?.coachId]?.level || form.level || "");
            const eligibleDims = WHEEL_DIMS.filter(d=>coachLvlIdx>=d.minLevel);
            const total = eligibleDims.reduce((sum,d)=>sum+(parseInt(form.wheelScores?.[d.id])||0),0);
            const maxTotal = eligibleDims.length * 10;
            const pct = Math.round((total/maxTotal)*100);
            return (
              <div style={{background:"linear-gradient(135deg,#1F1A14,#221C0F)",border:"1px solid #3A2E10",borderRadius:8,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:10,color:"#7A7060",marginBottom:2}}>WHEEL 总分 Total Score</div>
                  <div style={{fontSize:26,fontWeight:900,color:"#C9A84C"}}>{total}<span style={{fontSize:12,color:"#5A5248",marginLeft:2}}>/ {maxTotal}</span></div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"#7A7060",marginBottom:4}}>完成度 Completion</div>
                  <div style={{width:80,height:6,background:"#2A2420",borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:pct+"%",height:"100%",background:"#C9A84C",borderRadius:3,transition:"width 0.3s"}} />
                  </div>
                  <div style={{fontSize:11,color:"#C9A84C",fontWeight:700,marginTop:3}}>{pct}%</div>
                </div>
              </div>
            );
          })()}
          {(() => {
            const coachLevel = coaches[session?.coachId]?.level || form.level || "";
            const levelIdx = LEVELS.indexOf(coachLevel);
            // Group by eligibility
            const allLvl = WHEEL_DIMS.filter(d=>d.minLevel===0);
            const formLvl = WHEEL_DIMS.filter(d=>d.minLevel===1);
            const leadLvl = WHEEL_DIMS.filter(d=>d.minLevel===2);

            const isEligible = (d) => levelIdx >= d.minLevel;

            const renderDim = (d) => {
              const eligible = isEligible(d);
              const val = eligible ? (parseInt(form.wheelScores?.[d.id])||0) : null;
              return (
                <div key={d.id} style={{marginBottom:14, opacity: eligible ? 1 : 0.35}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div style={{flex:1,minWidth:0,marginRight:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontWeight:700,fontSize:12,color:"#E8E0D4"}}>{d.en}</span>
                        <span style={{fontSize:10,color:"#7A7060"}}>{d.zh}</span>
                        {!eligible && <span style={{fontSize:9,color:"#5A4A2A",background:"#2A1E10",borderRadius:3,padding:"1px 5px",fontWeight:700}}>Locked · 暂不适用</span>}
                      </div>
                      <div style={{fontSize:10,color:"#5A5248",lineHeight:1.4,fontStyle:"italic"}}>{d.q}</div>
                    </div>
                    <span style={{fontSize:13,fontWeight:800,flexShrink:0,
                      color: !eligible?"#3A342C":val>=8?"#C9A84C":val>=5?"#A8956A":"#5A5248",
                      minWidth:20,textAlign:"right"}}>{eligible?(val||"—"):"—"}</span>
                  </div>
                  {eligible ? (
                    <div style={{display:"flex",gap:3}}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                        <button key={n} onClick={()=>setForm(f=>({...f,wheelScores:{...f.wheelScores,[d.id]:n.toString()}}))}
                          style={{flex:1,height:22,borderRadius:3,border:"none",cursor:"pointer",fontSize:9,fontWeight:700,transition:"all 0.1s",
                            background:val>=n?(n>=8?"#C9A84C":n>=5?"#8A7240":"#5A4A2A"):"#2A2420",
                            color:val>=n?"#1A1612":"#3A342C"}}>{n}</button>
                      ))}
                    </div>
                  ) : (
                    <div style={{height:22,background:"#1A1612",borderRadius:3,display:"flex",alignItems:"center",paddingLeft:10}}>
                      <span style={{fontSize:9,color:"#3A342C"}}>Available from {d.minLevel===1?"FORM Coach+":"Lead Coach+"} · {d.minLevel===1?"FORM教练及以上":"Lead教练及以上"}</span>
                    </div>
                  )}
                </div>
              );
            };

            return (<>
              {/* All Levels group */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:9,fontWeight:800,color:"#C9A84C",letterSpacing:1.5,marginBottom:10,paddingBottom:4,borderBottom:"1px solid #2A2420"}}>
                  ALL LEVELS · 所有级别
                </div>
                {allLvl.map(renderDim)}
              </div>
              {/* FORM Coach+ group */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:9,fontWeight:800,color: levelIdx>=1?"#C9A84C":"#3A342C",letterSpacing:1.5,marginBottom:10,paddingBottom:4,borderBottom:"1px solid #2A2420"}}>
                  FORM COACH+ · {levelIdx>=1?"已解锁 Unlocked":"需达到 FORM Coach 级别 Requires FORM Coach+"}
                </div>
                {formLvl.map(renderDim)}
              </div>
              {/* Lead Coach+ group */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:9,fontWeight:800,color: levelIdx>=2?"#C9A84C":"#3A342C",letterSpacing:1.5,marginBottom:10,paddingBottom:4,borderBottom:"1px solid #2A2420"}}>
                  LEAD COACH+ · {levelIdx>=2?"已解锁 Unlocked":"需达到 Lead Coach 级别 Requires Lead Coach+"}
                </div>
                {leadLvl.map(renderDim)}
              </div>
            </>);
          })()}

          {/* Score guide */}
          <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid #2A2420",marginBottom:4}}>
            <div style={{fontSize:9,fontWeight:800,color:"#7A7060",letterSpacing:1.5,marginBottom:8}}>SCORE GUIDE · 评分解读</div>
            <div style={{display:"grid",gridTemplateColumns:"40px 1fr",gap:"4px 10px",alignItems:"start"}}>
              {WHEEL_SCORE_GUIDE.map(g=>(
                <>
                  <div key={g.range+"r"} style={{fontSize:10,fontWeight:800,color:"#C9A84C",paddingTop:1}}>{g.range}</div>
                  <div key={g.range+"d"} style={{fontSize:10,color:"#7A7060",lineHeight:1.4,marginBottom:4}}>
                    <span style={{color:"#C8BFA8",fontWeight:600}}>{g.label} {g.zh}</span> — {g.desc}
                  </div>
                </>
              ))}
            </div>
          </div>

          <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid #2A2420"}}>
            <div style={S.fg}>
              <Label en="Mentoring 行动完成率 Action Rate" zh="Last month's committed actions completed" />
              <Input value={form.actionRate} onChange={v=>setField("actionRate",v)} placeholder="例：3/4" />
            </div>
            <div style={S.fg}>
              <Label en="完成 Curriculum 模块 Module" zh="Optional · 选填" />
              <Input value={form.curriculumModule} onChange={v=>setField("curriculumModule",v)} placeholder="例：Module 2A" />
            </div>
          </div>
        </div>

        {/* Section D */}
        <div style={S.card}>
          <SectionHeader letter="D" en="Core Values 自评 Self-Check" zh="Rate how you demonstrated each value this month" />
          {CORE_VALUES.map(cv=>(
            <div key={cv.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <span style={{fontWeight:700,fontSize:12,color:"#E8E0D4"}}>{cv.en}</span>
                <span style={{marginLeft:6,fontSize:10,color:"#7A7060"}}>{cv.zh}</span>
              </div>
              <StarRow value={form.coreValues[cv.id]} onChange={v=>setCVField(cv.id,v)} />
            </div>
          ))}
          <div style={{marginTop:12,...S.fg}}>
            <Label en="本月体现说明 How I demonstrated these" zh="Write 1–3 specific actions · 写1–3 entries具体行动" />
            <Textarea value={form.coreValuesNote} onChange={v=>setField("coreValuesNote",v)}
              placeholder="写 1–3  entries具体行动..." rows={3} />
          </div>
        </div>

        {/* Section E */}
        <div style={S.card}>
          <SectionHeader letter="E" en="月度反思 Monthly Reflection" zh="Honest reflection drives growth" />
          <div style={S.fg}>
            <Label en="本月最大成就 Biggest Achievement" zh="What are you most proud of this month?" />
            <Textarea value={form.biggestAchievement} onChange={v=>setField("biggestAchievement",v)}
              placeholder="这个月你最自豪的一件事..." />
          </div>
          <div style={S.fg}>
            <Label en="下月 #1 Focus Next Month" zh="The one thing I want to improve most" />
            <Textarea value={form.focusNextMonth} onChange={v=>setField("focusNextMonth",v)}
              placeholder="下个月最想提升的一件事..." />
          </div>
          <div style={S.fg}>
            <Label en="给 Mentor 的话 Message to Mentor" zh="Optional · What should Mentor focus on in our 1-on-1?" />
            <Textarea value={form.mentorMessage} onChange={v=>setField("mentorMessage",v)}
              placeholder="想让 Mentor 在 1-on-1 特别关注的..." rows={2} />
          </div>
        </div>


        {/* Section F */}
        <div style={S.card}>
          <SectionHeader letter="F" en="L.I.F.E. Wheel 生命轮" zh="John 1010 — Rate 1–10 · 每项1–10分" />
          {(() => {
            const total = LIFE_WHEEL.reduce((sum,d)=>sum+(parseInt(form.lifeWheelScores?.[d.id])||0),0);
            const maxTotal = LIFE_WHEEL.length * 10;
            const pct = Math.round((total/maxTotal)*100);
            return (
              <div style={{background:"linear-gradient(135deg,#1A1814,#1E1C14)",border:"1px solid #2E2A1A",borderRadius:8,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:10,color:"#7A7060",marginBottom:2}}>LIFE WHEEL 总分 Total Score</div>
                  <div style={{fontSize:26,fontWeight:900,color:"#C9A84C"}}>{total}<span style={{fontSize:12,color:"#5A5248",marginLeft:2}}>/ {maxTotal}</span></div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"#7A7060",marginBottom:4}}>完成度 Completion</div>
                  <div style={{width:80,height:6,background:"#2A2420",borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:pct+"%",height:"100%",background:"#A8956A",borderRadius:3,transition:"width 0.3s"}} />
                  </div>
                  <div style={{fontSize:11,color:"#A8956A",fontWeight:700,marginTop:3}}>{pct}%</div>
                </div>
              </div>
            );
          })()}
          {LIFE_WHEEL.map(d=>{
            const val = parseInt(form.lifeWheelScores?.[d.id])||0;
            return (
              <div key={d.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:12,color:"#E8E0D4"}}>{d.en}</span>
                    <span style={{marginLeft:6,fontSize:10,color:"#7A7060"}}>{d.zh}</span>
                  </div>
                  <span style={{fontSize:13,fontWeight:800,color:val>=8?"#C9A84C":val>=5?"#A8956A":"#5A5248",minWidth:20,textAlign:"right"}}>{val||"—"}</span>
                </div>
                <div style={{display:"flex",gap:3}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} onClick={()=>setForm(f=>({...f,lifeWheelScores:{...f.lifeWheelScores,[d.id]:n.toString()}}))}
                      style={{flex:1,height:22,borderRadius:3,border:"none",cursor:"pointer",fontSize:9,fontWeight:700,transition:"all 0.1s",
                        background:val>=n?(n>=8?"#C9A84C":n>=5?"#8A7240":"#5A4A2A"):"#2A2420",
                        color:val>=n?"#1A1612":"#3A342C"}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #2A2420"}}>
            <Label en="Life Wheel 反思 Reflection" zh="Optional · Which area needs most attention this month?" />
            <Textarea value={form.lifeWheelNote||""} onChange={v=>setField("lifeWheelNote",v)}
              placeholder="写下你的 Life Wheel 观察或行动计划..." rows={2} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={saving} style={{
          width:"100%",padding:"14px",borderRadius:8,border:"none",
          background:saving?"#3A342C":"linear-gradient(135deg,#C9A84C,#A87E2C)",
          color:"#1A1612",fontWeight:800,fontSize:14,cursor:saving?"default":"pointer"}}>
          {saving?"Saving · 保存中...":"Submit Scorecard · 提交 →"}
        </button>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // COACH: DASHBOARD
  // ══════════════════════════════════════════════════════════════
  const DashboardView = () => {
    const coachId = session?.coachId;
    const chartData = getChartData(coachId);
    const myRecs = sortRecords(records.filter(r=>r.coachId===coachId));
    const latest = myRecs[myRecs.length-1];

    if (myRecs.length===0) return (
      <div style={S.page}>
        <div style={{...S.card,textAlign:"center",padding:36}}>
          <div style={{color:"#5A5248",fontSize:13,marginBottom:16}}>暂无数据 No data yet. Submit your first Scorecard to begin.</div>
          <button onClick={()=>{setSubmitted(false);setView("form");}} style={S.goldBtn(false)}>填写 Scorecard →</button>
        </div>
      </div>
    );

    return (
      <div style={S.page}>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:"#7A7060",letterSpacing:1}}>{session?.coachName}</div>
          <div style={{fontWeight:900,fontSize:18,color:"#E8E0D4"}}>成长趋势图 Growth Trends</div>
          <div style={{fontSize:11,color:"#7A7060"}}>{myRecs.length} 个月数据 months of data</div>
        </div>

        {latest && (
          <div style={{...S.card,background:"linear-gradient(135deg,#1F1A14,#221C0F)",border:"1px solid #3A2E10"}}>
            <div style={{fontSize:10,color:"#C9A84C",fontWeight:700,letterSpacing:1,marginBottom:10}}>
              最新 — {latest.month} {latest.year}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              <MetricCard label="课时数 Sessions" value={latest.sessions||"—"} />
              <MetricCard label="Wheel 总分" value={latest.wheelScores ? Object.values(latest.wheelScores).reduce((s,v)=>s+(parseInt(v)||0),0) : (latest.wheelTotal||"—")} unit="/100" />
              <MetricCard label="留存率 Retention" value={latest.retentionRate?latest.retentionRate+"%":"—"} />
              <MetricCard label="满意度 Sat." value={latest.satisfaction||"—"} unit="/5" />
            </div>
          </div>
        )}

        <div style={S.card}>
          <TrendChart data={chartData} dataKey="sessions" label="课时数 Sessions" target={20} />
          <TrendChart data={chartData} dataKey="retention" label="留存率 Retention %" target={70} unit="%" />
        </div>
        <div style={S.card}>
          <TrendChart data={chartData} dataKey="wheelTotal" label="Wheel 总分 /100" target={70} />
          <TrendChart data={chartData} dataKey="satisfaction" label="满意度 /5" target={4} yDomain={[1,5]} unit="/5" />
        </div>
        <div style={S.card}>
          <TrendChart data={chartData} dataKey="conversion" label="Trial 转化率 %" target={60} unit="%" />
          <TrendChart data={chartData} dataKey="attendance" label="出席率 Attendance %" target={80} unit="%" />
        </div>

        <div style={S.card}>
          <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:4}}>L.I.F.E. WHEEL 趋势</div>
          <TrendChart data={chartData} dataKey="lifeWheelTotal" label="Life Wheel 总分 /100" target={70} />
        </div>

        {myRecs.length > 0 && (
          <div style={S.card}>
            <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:12}}>CORE VALUES 平均分 Average Ratings</div>
            {CORE_VALUES.map(cv=>{
              const scores = myRecs.map(r=>parseInt(r.coreValues?.[cv.id])).filter(n=>!isNaN(n)&&n>0);
              const avg = scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length):0;
              return (
                <div key={cv.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                  <div style={{width:120,fontSize:11,color:"#C8BFA8",flexShrink:0}}>{cv.en}</div>
                  <div style={{flex:1,height:5,background:"#2A2420",borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${(avg/5)*100}%`,height:"100%",background:"#C9A84C",borderRadius:3}} />
                  </div>
                  <div style={{width:24,fontSize:11,color:"#C9A84C",fontWeight:700,textAlign:"right"}}>{avg?avg.toFixed(1):"—"}</div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={()=>{setSubmitted(false);setForm({...EMPTY_FORM,level:coaches[session?.coachId]?.level||"",mentor:coaches[session?.coachId]?.mentor||""});setView("form");}} style={{...S.goldBtn(false),width:"100%"}}>
          + 填写本月 Scorecard / New Entry
        </button>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // COACH: HISTORY
  // ══════════════════════════════════════════════════════════════
  const HistoryView = () => {
    const myRecs = sortRecords(records.filter(r=>r.coachId===session?.coachId)).reverse();
    return (
      <div style={S.page}>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:"#7A7060",letterSpacing:1}}>{session?.coachName}</div>
          <div style={{fontWeight:900,fontSize:18,color:"#E8E0D4"}}>我的记录</div>
          <div style={{fontSize:11,color:"#7A7060"}}>共 {myRecs.length}  entries</div>
        </div>
        {myRecs.length===0 && <div style={{...S.card,textAlign:"center",padding:28,color:"#5A5248",fontSize:13}}>没有找到记录 No records found</div>}
        {myRecs.map(r=>(
          <div key={r.id} style={{...S.card,cursor:"pointer"}}
            onClick={()=>setExpandedRecord(expandedRecord===r.id?null:r.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <span style={{fontWeight:700,fontSize:14,color:"#E8E0D4"}}>{r.month} {r.year}</span>
                <span style={{marginLeft:8,fontSize:11,color:"#7A7060"}}>{r.level}</span>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                {r.sessions && <span style={{fontSize:11,color:"#C9A84C"}}>{r.sessions} sessions</span>}
                <span style={{color:"#3A342C",fontSize:14}}>{expandedRecord===r.id?"▲":"▼"}</span>
              </div>
            </div>
            {expandedRecord===r.id && (
              <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #2A2420"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                  {[["课时数",r.sessions],["Trial",r.trials],["转化率",r.conversionRate?r.conversionRate+"%":""],
                    ["留存率",r.retentionRate?r.retentionRate+"%":""],["新客户",r.newClients],["转介绍",r.referrals],
                    ["出席率",r.attendance?r.attendance+"%":""],["满意度",r.satisfaction?r.satisfaction+"/5":""],["Wheel", r.wheelScores ? Object.values(r.wheelScores).reduce((s,v)=>s+(parseInt(v)||0),0)+"/100" : (r.wheelTotal?r.wheelTotal+"/100":"")]
                  ].map(([l,v])=>(
                    <div key={l} style={{background:"#130F0C",borderRadius:6,padding:"8px 10px"}}>
                      <div style={{fontSize:10,color:"#5A5248"}}>{l}</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#E8E0D4"}}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
                {r.biggestAchievement && <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#7A7060",marginBottom:3}}>本月最大成就 Biggest Achievement</div><div style={{fontSize:12,color:"#C8BFA8",lineHeight:1.5}}>{r.biggestAchievement}</div></div>}
                {r.focusNextMonth && <div><div style={{fontSize:10,color:"#7A7060",marginBottom:3}}>下月 Focus Next Month</div><div style={{fontSize:12,color:"#C8BFA8",lineHeight:1.5}}>{r.focusNextMonth}</div></div>}
                {r.mentorMessage && <div style={{marginTop:8}}><div style={{fontSize:10,color:"#7A7060",marginBottom:3}}>给 Mentor 的话 Message to Mentor</div><div style={{fontSize:12,color:"#C8BFA8",lineHeight:1.5}}>{r.mentorMessage}</div></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // MENTOR: MASTER DASHBOARD
  // ══════════════════════════════════════════════════════════════
  const MentorView = () => {
    const [selCoach, setSelCoach] = useState("");
    const [subView, setSubView] = useState("overview"); // overview | coach

    const allCoachIds = Object.keys(coaches);
    const filteredIds = mentorFilter
      ? allCoachIds.filter(id=>coaches[id]?.name.toLowerCase().includes(mentorFilter.toLowerCase()))
      : allCoachIds;

    const activeCoach = selCoach || filteredIds[0] || "";
    const chartData = activeCoach ? getChartData(activeCoach) : [];
    const coachRecs = sortRecords(records.filter(r=>r.coachId===activeCoach));
    const latest = coachRecs[coachRecs.length-1];

    return (
      <div style={S.page}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:"#C9A84C",letterSpacing:2,fontWeight:700}}>MENTOR VIEW</div>
          <div style={{fontWeight:900,fontSize:18,color:"#E8E0D4"}}>全教练总览 All Coaches Overview</div>
          <div style={{fontSize:11,color:"#7A7060"}}>{allCoachIds.length} 位教练 · {records.length}  entries记录</div>
        </div>

        {/* Overview cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
          <MetricCard label="教练数 Coaches" value={allCoachIds.length} />
          <MetricCard label="总记录 Records" value={records.length} />
          <MetricCard label="本月 This Month" value={records.filter(r=>{const d=new Date();return r.month===MONTHS[d.getMonth()]&&r.year===d.getFullYear().toString();}).length} />
        </div>

        {/* Coach list */}
        <div style={S.card}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1}}>教练列表 Coach List</div>
            <input value={mentorFilter} onChange={e=>setMentorFilter(e.target.value)}
              placeholder="搜索 / Search coach..."
              style={{background:"#130F0C",border:"1px solid #2A2420",borderRadius:6,
                padding:"5px 10px",color:"#E8E0D4",fontSize:11,outline:"none",width:120}} />
          </div>
          {filteredIds.length===0 && <div style={{color:"#5A5248",fontSize:12,textAlign:"center",padding:12}}>没有找到教练</div>}
          {filteredIds.map(id=>{
            const c = coaches[id];
            const recs = records.filter(r=>r.coachId===id);
            const last = sortRecords(recs).reverse()[0];
            return (
              <div key={id} onClick={()=>{setSelCoach(id);setSubView("coach");}}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"11px 10px",borderRadius:8,cursor:"pointer",marginBottom:4,
                  background:activeCoach===id&&subView==="coach"?"#221C0F":"transparent",
                  border:activeCoach===id&&subView==="coach"?"1px solid #3A2E10":"1px solid transparent",
                  transition:"all 0.15s"}}>
                <div>
                  <span style={{fontWeight:700,fontSize:13,color:"#E8E0D4"}}>{c?.name}</span>
                  <span style={{marginLeft:8,fontSize:10,color:"#7A7060"}}>{c?.level}</span>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  {last && <span style={{fontSize:10,color:"#7A7060"}}>最近：{last.month} {last.year}</span>}
                  <span style={{fontSize:10,color:"#C9A84C"}}>{recs.length}  entries</span>
                  <span style={{color:"#3A342C",fontSize:12}}>→</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Individual coach dashboard */}
        {subView==="coach" && activeCoach && coaches[activeCoach] && (
          <>
            <div style={{...S.card,background:"linear-gradient(135deg,#1F1A14,#221C0F)",border:"1px solid #3A2E10"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:900,fontSize:16,color:"#E8E0D4"}}>{coaches[activeCoach].name}</div>
                  <div style={{fontSize:11,color:"#C9A84C"}}>{coaches[activeCoach].level}</div>
                  <div style={{fontSize:10,color:"#7A7060"}}>Mentor: {coaches[activeCoach].mentor||"—"}</div>
                </div>
                {latest && <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"#7A7060"}}>最新记录</div>
                  <div style={{fontSize:12,color:"#C9A84C",fontWeight:700}}>{latest.month} {latest.year}</div>
                </div>}
              </div>
              {latest && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                  <MetricCard label="课时数 Sessions" value={latest.sessions||"—"} />
                  <MetricCard label="Wheel 总分" value={latest.wheelScores ? Object.values(latest.wheelScores).reduce((s,v)=>s+(parseInt(v)||0),0) : (latest.wheelTotal||"—")} unit="/100" />
                  <MetricCard label="留存率 Retention" value={latest.retentionRate?latest.retentionRate+"%":"—"} />
                  <MetricCard label="满意度 Sat." value={latest.satisfaction||"—"} unit="/5" />
                </div>
              )}
            </div>

            <div style={S.card}>
              <TrendChart data={chartData} dataKey="sessions" label="课时数 Sessions" target={20} />
              <TrendChart data={chartData} dataKey="retention" label="留存率 Retention %" target={70} unit="%" />
            </div>
            <div style={S.card}>
              <TrendChart data={chartData} dataKey="wheelTotal" label="Wheel 总分 /100" target={70} />
              <TrendChart data={chartData} dataKey="satisfaction" label="满意度 /5" target={4} yDomain={[1,5]} unit="/5" />
            </div>

            <div style={S.card}>
              <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:4}}>L.I.F.E. WHEEL 趋势</div>
              <TrendChart data={chartData} dataKey="lifeWheelTotal" label="Life Wheel 总分 /100" target={70} />
            </div>

            {/* Latest reflection */}
            {latest && (latest.biggestAchievement || latest.focusNextMonth || latest.mentorMessage) && (
              <div style={S.card}>
                <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:12}}>
                  最新反思 Latest Reflection — {latest.month} {latest.year}
                </div>
                {latest.biggestAchievement && <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#C9A84C",marginBottom:4}}>本月最大成就 Biggest Achievement</div>
                  <div style={{fontSize:12,color:"#C8BFA8",lineHeight:1.6}}>{latest.biggestAchievement}</div>
                </div>}
                {latest.focusNextMonth && <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#C9A84C",marginBottom:4}}>下月 Focus Next Month</div>
                  <div style={{fontSize:12,color:"#C8BFA8",lineHeight:1.6}}>{latest.focusNextMonth}</div>
                </div>}
                {latest.mentorMessage && <div style={{background:"#221C0F",borderRadius:8,padding:"10px 14px",border:"1px solid #3A2E10"}}>
                  <div style={{fontSize:10,color:"#C9A84C",marginBottom:4}}>给 Mentor 的话 Message to Mentor</div>
                  <div style={{fontSize:12,color:"#E8E0D4",lineHeight:1.6}}>{latest.mentorMessage}</div>
                </div>}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // NAV
  // ══════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════
  // MENTOR: GROWTH LEADER
  // ══════════════════════════════════════════════════════════════
  const GrowthLeaderView = () => {
    const currentDate = new Date();
    const defaultMonth = MONTHS[currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1];
    const defaultYear = currentDate.getMonth() === 0 ? (currentDate.getFullYear()-1).toString() : currentDate.getFullYear().toString();
    const [glMonth, setGlMonth] = useState(defaultMonth);
    const [glYear, setGlYear] = useState(defaultYear);

    const monthRecs = records.filter(r => r.month === glMonth && r.year === glYear);

    const getLastMonthRec = (coachId) => {
      const mIdx = MONTHS.indexOf(glMonth);
      const prevMonth = mIdx === 0 ? MONTHS[11] : MONTHS[mIdx-1];
      const prevYear = mIdx === 0 ? (parseInt(glYear)-1).toString() : glYear;
      return records.find(r => r.coachId === coachId && r.month === prevMonth && r.year === prevYear);
    };

    const getWheelTotal = (rec) => {
      if (!rec) return 0;
      if (rec.wheelScores) return Object.values(rec.wheelScores).reduce((s,v)=>s+(parseInt(v)||0),0);
      return parseFloat(rec.wheelTotal)||0;
    };

    const parseActionRate = (ar) => {
      if (!ar) return 0;
      if (ar.includes("/")) { const [a,b]=ar.split("/"); return parseInt(b)>0?(parseInt(a)/parseInt(b))*100:0; }
      return parseFloat(ar)||0;
    };

    const calcTopPerformer = () => {
      const trialCounts = [...monthRecs].sort((a,b)=>(parseInt(b.trials)||0)-(parseInt(a.trials)||0));
      return monthRecs.map(rec => {
        const sessions = parseInt(rec.sessions)||0;
        const trials = parseInt(rec.trials)||0;
        const conversion = parseFloat(rec.conversionRate)||0;
        const retention = parseFloat(rec.retentionRate)||0;
        const lastRec = getLastMonthRec(rec.coachId);
        const wheelNow = getWheelTotal(rec);
        const wheelGrowth = wheelNow - getWheelTotal(lastRec);
        const actionRate = parseActionRate(rec.actionRate);
        const sessionTarget = 20;
        const sessionPct = Math.min((sessions/sessionTarget)*100, 100);
        const sessScore = Math.max(0, 20 - Math.floor((100-sessionPct)/10)*2);
        const trialRank = trialCounts.findIndex(t=>t.coachId===rec.coachId)+1;
        const trialRankScore = trialRank===1?20:trialRank===2?16:trialRank===3?12:trialRank===4?8:4;
        const convScore = trials<2?10:conversion>=60?20:conversion>=40?14:conversion>=20?8:2;
        const hasExp = rec.retentionRate !== "";
        const retScore = !hasExp?10:retention>=80?20:retention>=60?14:retention>=40?8:2;
        const wheelScore = !lastRec?5:wheelGrowth>=5?10:wheelGrowth>=1?7:wheelGrowth===0?4:0;
        const actionScore = actionRate===100?10:actionRate>=50?6:actionRate>=1?3:0;
        const total = sessScore+trialRankScore+convScore+retScore+wheelScore+actionScore;
        return { coachId:rec.coachId, name:coaches[rec.coachId]?.name||rec.coachName, sessScore, trialRankScore, convScore, retScore, wheelScore, actionScore, total, trials, conversion };
      }).sort((a,b)=>b.total!==a.total?b.total-a.total:b.conversion!==a.conversion?b.conversion-a.conversion:b.trials-a.trials);
    };

    const calcMostTrials = () =>
      monthRecs.map(r=>({ name:coaches[r.coachId]?.name||r.coachName, trials:parseInt(r.trials)||0, conversion:parseFloat(r.conversionRate)||0 }))
        .sort((a,b)=>b.trials!==a.trials?b.trials-a.trials:b.conversion-a.conversion);

    const calcHighestConversion = () =>
      monthRecs.filter(r=>(parseInt(r.trials)||0)>=3)
        .map(r=>({ name:coaches[r.coachId]?.name||r.coachName, trials:parseInt(r.trials)||0, conversion:parseFloat(r.conversionRate)||0 }))
        .sort((a,b)=>b.conversion!==a.conversion?b.conversion-a.conversion:b.trials-a.trials);

    const calcFastestGrowth = () =>
      monthRecs.map(r=>{
        const last=getLastMonthRec(r.coachId);
        const now=getWheelTotal(r); const prev=getWheelTotal(last); const growth=now-prev;
        return { name:coaches[r.coachId]?.name||r.coachName, prev, now, growth, actionRate:parseActionRate(r.actionRate), eligible:!!last&&growth>0 };
      }).filter(r=>r.eligible).sort((a,b)=>b.growth!==a.growth?b.growth-a.growth:b.actionRate-a.actionRate);

    const topPerformer = calcTopPerformer();
    const mostTrials = calcMostTrials();
    const highestConversion = calcHighestConversion();
    const fastestGrowth = calcFastestGrowth();

    const AwardBanner = ({icon,title,zh,winner,subtitle,noWinnerMsg}) => (
      <div style={{...S.card,border:winner?"1px solid #3A2E10":"1px solid #2A2420",background:winner?"linear-gradient(135deg,#1F1A14,#221C0F)":S.card.background}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          
          <div><div style={{fontWeight:900,fontSize:14,color:"#E8E0D4"}}>{title}</div><div style={{fontSize:10,color:"#7A7060"}}>{zh}</div></div>
        </div>
        {winner
          ? <div><div style={{fontSize:10,color:"#C9A84C",fontWeight:700,letterSpacing:1,marginBottom:3}}>WINNER</div>
              <div style={{fontSize:20,fontWeight:900,color:"#C9A84C"}}>{winner}</div>
              {subtitle&&<div style={{fontSize:11,color:"#7A7060",marginTop:2}}>{subtitle}</div>}</div>
          : <div style={{color:"#5A5248",fontSize:12,fontStyle:"italic"}}>{noWinnerMsg||"本月无符合 entries件的教练"}</div>}
      </div>
    );

    return (
      <div style={S.page}>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:"#C9A84C",letterSpacing:2,fontWeight:700}}>MENTOR — AUTO CALCULATE</div>
          <div style={{fontWeight:900,fontSize:18,color:"#E8E0D4"}}>Growth Leader</div>
          <div style={{fontSize:11,color:"#7A7060"}}>成长之星月度荣誉 Monthly Honours · Auto-calculated</div>
        </div>

        <div style={{...S.card,marginBottom:14}}>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><Label en="月份 Month" zh="" /><Select value={glMonth} onChange={setGlMonth} options={MONTHS} placeholder="选择月份" /></div>
            <div style={{flex:1}}><Label en="年份 Year" zh="" /><Input value={glYear} onChange={setGlYear} placeholder="2025" /></div>
          </div>
          <div style={{marginTop:10,fontSize:11,color:"#7A7060"}}>{monthRecs.length}  coaches submitted {glMonth} {glYear} Scorecard</div>
        </div>

        {monthRecs.length === 0 ? (
          <div style={{...S.card,textAlign:"center",padding:32,color:"#5A5248",fontSize:13}}>该月份暂无提交 No Scorecard submissions found for this period</div>
        ) : (<>
          <AwardBanner icon="" title="Top Performer" zh="最佳整体表现" winner={topPerformer[0]?.name} subtitle={`综合得分 ${topPerformer[0]?.total}/100`} noWinnerMsg="暂无数据" />
          <AwardBanner icon="" title="Most Trials" zh="最多试课" winner={mostTrials[0]?.trials>0?mostTrials[0]?.name:null} subtitle={mostTrials[0]?.trials>0?`${mostTrials[0]?.trials} Trials · 转化率 ${mostTrials[0]?.conversion}%`:null} noWinnerMsg="本月所有教练 Trial 均为 0，奖项不颁发" />
          <AwardBanner icon="⚡" title="Highest Conversion" zh="最高转化率" winner={highestConversion[0]?.name} subtitle={highestConversion[0]?`${highestConversion[0].conversion}% · ${highestConversion[0].trials} Trials`:null} noWinnerMsg="无教练达到 3 次 Trial 最低门槛" />
          <AwardBanner icon="" title="Fastest Growth" zh="成长最快" winner={fastestGrowth[0]?.name} subtitle={fastestGrowth[0]?`Wheel +${fastestGrowth[0].growth} 分 (${fastestGrowth[0].prev}→${fastestGrowth[0].now})`:null} noWinnerMsg="本月无教练 Wheel 有实质提升" />

          <div style={S.card}>
            <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:12}}>TOP PERFORMER — 积分明细</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                <thead><tr style={{borderBottom:"1px solid #2A2420"}}>
                  {["教练","课时","Trial排名","转化","留存","Wheel","行动","总分"].map(h=>(
                    <th key={h} style={{padding:"5px 6px",color:"#7A7060",fontWeight:700,textAlign:"center",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{topPerformer.map((c,i)=>(
                  <tr key={c.coachId} style={{borderBottom:"1px solid #1E1A16",background:i===0?"#221C0F":"transparent"}}>
                    <td style={{padding:"6px",color:i===0?"#C9A84C":"#E8E0D4",fontWeight:i===0?800:400,whiteSpace:"nowrap"}}>{i===0?"":""}{c.name}</td>
                    {[c.sessScore,c.trialRankScore,c.convScore,c.retScore,c.wheelScore,c.actionScore].map((v,j)=>(
                      <td key={j} style={{padding:"6px",textAlign:"center",color:"#C8BFA8"}}>{v}</td>
                    ))}
                    <td style={{padding:"6px",textAlign:"center",fontWeight:800,color:i===0?"#C9A84C":"#E8E0D4"}}>{c.total}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          <div style={S.card}>
            <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:10}}>MOST TRIALS</div>
            {mostTrials.filter(c=>c.trials>0).map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1E1A16"}}>
                <span style={{fontSize:12,color:i===0?"#C9A84C":"#C8BFA8",fontWeight:i===0?800:400}}>{i===0?"":""}{c.name}</span>
                <span style={{fontSize:11,color:"#7A7060"}}>{c.trials} trials · {c.conversion}% conv</span>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:10}}>HIGHEST CONVERSION（≥3 Trials）</div>
            {highestConversion.length===0&&<div style={{color:"#5A5248",fontSize:12}}>无符合门槛的教练</div>}
            {highestConversion.map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1E1A16"}}>
                <span style={{fontSize:12,color:i===0?"#C9A84C":"#C8BFA8",fontWeight:i===0?800:400}}>{i===0?"":""}{c.name}</span>
                <span style={{fontSize:11,color:"#7A7060"}}>{c.conversion}% · {c.trials} trials</span>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{fontSize:10,color:"#7A7060",fontWeight:700,letterSpacing:1,marginBottom:10}}>FASTEST GROWTH — Wheel Score Improvement · 提升排名</div>
            {fastestGrowth.length===0&&<div style={{color:"#5A5248",fontSize:12}}>本月无教练 Wheel 有实质提升</div>}
            {fastestGrowth.map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1E1A16"}}>
                <span style={{fontSize:12,color:i===0?"#C9A84C":"#C8BFA8",fontWeight:i===0?800:400}}>{i===0?"":""}{c.name}</span>
                <span style={{fontSize:11,color:"#7A7060"}}>+{c.growth} ({c.prev}→{c.now})</span>
              </div>
            ))}
          </div>
        </>)}
      </div>
    );
  };

  const isMentor = session?.role==="mentor";
  const coachNavItems = [["home","Home 主页"],["form","Record 填写"],["dashboard","Trends 趋势"],["history","History 记录"]];
  const mentorNavItems = [["mentor","Overview 总览"],["awards","Growth Leader 荣誉"]];

  if (!session) {
    if (view==="register") return <RegisterView />;
    return <LoginView />;
  }

  return (
    <div style={S.app}>
      <nav style={S.nav}>
        <div style={S.logo}>EXFORM FITNESS</div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {(isMentor ? mentorNavItems : coachNavItems).map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={S.navBtn(view===v)}>{l}</button>
          ))}
          <button onClick={logout} style={{...S.navBtn(false),marginLeft:8,color:"#5A5248",fontSize:10}}>退出 Logout</button>
        </div>
      </nav>

      {view==="home" && !isMentor && <HomeView />}
      {view==="form" && !isMentor && <FormView />}
      {view==="dashboard" && !isMentor && <DashboardView />}
      {view==="history" && !isMentor && <HistoryView />}
      {view==="mentor" && isMentor && <MentorView />}
      {view==="awards" && isMentor && <GrowthLeaderView />}
    </div>
  );
}
