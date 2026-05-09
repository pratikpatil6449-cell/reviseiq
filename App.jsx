import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const SUPA_URL = "https://kkhfhuftetfrtxnqholn.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtraGZodWZ0ZXRmcnR4bnFob2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjc1MzUsImV4cCI6MjA5MzkwMzUzNX0.tDzSbDXQUS5sewlGl4ybyPmu3YCzZYZaDtZwbv2fGxk";
const supabase = createClient(SUPA_URL, SUPA_KEY);

// ─── AI CALL ─────────────────────────────────────────────────────────────────
const callAI = async (messages, maxTokens = 1200) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, messages })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b => b.text || "").join("\n");
};

const fileToBase64 = f => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = () => rej(new Error("Read failed"));
  r.readAsDataURL(f);
});

const tryJSON = str => {
  try { return JSON.parse(str.replace(/```json|```/g, "").trim()); } catch { return null; }
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:'Plus Jakarta Sans',sans-serif;background:#F0F4FF;color:#0F172A;min-height:100vh}
button,input,textarea,select{font-family:'Plus Jakarta Sans',sans-serif}

/* AUTH */
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;
  background:linear-gradient(135deg,#EEF2FF 0%,#F0F9FF 50%,#F0FDF4 100%)}
.auth-card{background:#fff;border-radius:24px;padding:36px 28px;width:100%;max-width:400px;
  box-shadow:0 20px 60px rgba(99,102,241,.12)}
.auth-logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:28px}
.auth-logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#4F46E5,#7C3AED);
  border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px}
.auth-logo-name{font-family:'Fraunces',serif;font-size:26px;font-weight:700;color:#0F172A}
.auth-title{font-size:20px;font-weight:700;color:#0F172A;margin-bottom:4px;text-align:center}
.auth-sub{font-size:14px;color:#64748B;text-align:center;margin-bottom:24px}
.auth-input{width:100%;padding:12px 16px;border:1.5px solid #E2E8F0;border-radius:12px;
  font-size:14px;color:#0F172A;outline:none;margin-bottom:12px;transition:border-color .2s}
.auth-input:focus{border-color:#4F46E5}
.auth-btn{width:100%;padding:13px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;
  border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;
  transition:opacity .15s}
.auth-btn:hover{opacity:.88}
.auth-switch{text-align:center;margin-top:16px;font-size:14px;color:#64748B}
.auth-switch span{color:#4F46E5;font-weight:600;cursor:pointer}
.auth-err{background:#FEF2F2;color:#DC2626;border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:12px}

/* NAV */
.nav{background:#fff;border-bottom:1.5px solid #E8EDFF;position:sticky;top:0;z-index:100;
  display:flex;align-items:center;padding:0 16px;height:56px;gap:0}
.nav-logo{display:flex;align-items:center;gap:8px;margin-right:16px;flex-shrink:0}
.nav-logo-icon{width:30px;height:30px;background:linear-gradient(135deg,#4F46E5,#7C3AED);
  border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px}
.nav-logo-name{font-family:'Fraunces',serif;font-size:17px;font-weight:700;color:#0F172A}
.nav-tabs{display:flex;gap:2px;flex:1;overflow-x:auto;-webkit-overflow-scrolling:touch}
.nav-tabs::-webkit-scrollbar{display:none}
.nav-tab{padding:5px 11px;border-radius:8px;font-size:12px;font-weight:600;color:#64748B;
  background:none;border:none;white-space:nowrap;transition:all .15s;flex-shrink:0}
.nav-tab.active{color:#4F46E5;background:#EEF2FF}
.nav-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#4F46E5,#7C3AED);
  display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;
  cursor:pointer;flex-shrink:0;margin-left:8px}

/* PAGE */
.page{max-width:860px;margin:0 auto;padding:22px 16px 80px}
.page-title{font-family:'Fraunces',serif;font-size:24px;font-weight:700;color:#0F172A;margin-bottom:4px}
.page-sub{font-size:13px;color:#64748B;margin-bottom:22px}

/* CARD */
.card{background:#fff;border:1.5px solid #E8EDFF;border-radius:18px;padding:20px;margin-bottom:16px}
.card-title{font-size:14px;font-weight:700;color:#0F172A;margin-bottom:14px;display:flex;align-items:center;gap:7px}

/* BTN */
.btn{padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;border:none;cursor:pointer;transition:all .15s}
.btn:hover:not(:disabled){opacity:.85;transform:translateY(-1px)}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-primary{background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff}
.btn-outline{background:#fff;color:#4F46E5;border:1.5px solid #C7D2FE}
.btn-green{background:#16A34A;color:#fff}
.btn-red{background:#DC2626;color:#fff}
.btn-sm{padding:6px 12px;font-size:12px}
.btn-full{width:100%;padding:13px;font-size:14px}

/* INPUT */
.input{width:100%;padding:11px 14px;border:1.5px solid #E2E8F0;border-radius:10px;
  font-size:14px;color:#0F172A;outline:none;transition:border-color .2s;background:#fff}
.input:focus{border-color:#4F46E5}
.input::placeholder{color:#94A3B8}
.label{font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;display:block}
select.input{cursor:pointer}

/* DROP */
.drop{border:2px dashed #C7D2FE;border-radius:14px;padding:28px 20px;text-align:center;
  cursor:pointer;transition:all .2s;background:#FAFBFF}
.drop:hover,.drop.drag{border-color:#4F46E5;background:#EEF2FF}
.drop-icon{font-size:30px;margin-bottom:8px}
.drop-title{font-size:14px;font-weight:700;color:#0F172A;margin-bottom:3px}
.drop-sub{font-size:12px;color:#94A3B8}

/* FILE CHIP */
.file-chip{display:flex;align-items:center;gap:10px;background:#EEF2FF;
  border:1px solid #C7D2FE;border-radius:10px;padding:10px 14px;margin-bottom:8px}
.file-chip-info{flex:1;min-width:0}
.file-chip-name{font-size:13px;font-weight:700;color:#4F46E5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.file-chip-size{font-size:11px;color:#94A3B8;margin-top:1px}
.file-chip-actions{display:flex;gap:6px;flex-shrink:0}

/* TAG */
.tag{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;
  text-transform:uppercase;letter-spacing:.07em;padding:3px 10px;border-radius:20px;margin-bottom:8px}
.tag-indigo{color:#4F46E5;background:#EEF2FF}
.tag-green{color:#16A34A;background:#F0FDF4}
.tag-orange{color:#EA580C;background:#FFF7ED}
.tag-red{color:#DC2626;background:#FEF2F2}
.tag-purple{color:#7C3AED;background:#F5F3FF}

/* PROGRESS BAR */
.prog-wrap{height:7px;background:#E8EDFF;border-radius:99px;overflow:hidden;margin:6px 0}
.prog-bar{height:100%;border-radius:99px;background:linear-gradient(90deg,#4F46E5,#7C3AED);transition:width .7s ease}
.prog-bar.green{background:linear-gradient(90deg,#16A34A,#15803D)}
.prog-bar.orange{background:linear-gradient(90deg,#EA580C,#C2410C)}

/* STAT GRID */
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px}
.stat-box{background:#fff;border:1.5px solid #E8EDFF;border-radius:14px;padding:14px}
.stat-num{font-family:'Fraunces',serif;font-size:26px;font-weight:700;color:#4F46E5}
.stat-label{font-size:11px;color:#64748B;font-weight:600;margin-top:2px}

/* BANNER */
.banner{background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:18px;
  padding:22px;color:#fff;margin-bottom:18px;position:relative;overflow:hidden}
.banner::before{content:'';position:absolute;right:-20px;top:-20px;width:120px;height:120px;
  background:rgba(255,255,255,.08);border-radius:50%}
.banner::after{content:'';position:absolute;right:30px;bottom:-30px;width:80px;height:80px;
  background:rgba(255,255,255,.06);border-radius:50%}
.banner-greeting{font-size:12px;font-weight:600;opacity:.75;margin-bottom:3px}
.banner-title{font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin-bottom:14px;line-height:1.3}
.banner-stats{display:flex;gap:20px;position:relative;z-index:1}
.banner-stat-num{font-size:20px;font-weight:800}
.banner-stat-label{font-size:10px;opacity:.7;font-weight:600}

/* QUIZ */
.quiz-q{font-size:15px;font-weight:700;color:#0F172A;margin-bottom:14px;line-height:1.5}
.quiz-opt{display:block;width:100%;text-align:left;padding:11px 15px;border:1.5px solid #E2E8F0;
  border-radius:10px;font-size:13px;background:#fff;color:#334155;margin-bottom:7px;
  transition:all .15s;font-weight:500;cursor:pointer}
.quiz-opt:hover:not(:disabled){border-color:#4F46E5;background:#EEF2FF;color:#4F46E5}
.quiz-opt.selected{border-color:#4F46E5;background:#EEF2FF;color:#4F46E5}
.quiz-opt.correct{border-color:#16A34A;background:#F0FDF4;color:#16A34A;font-weight:700}
.quiz-opt.wrong{border-color:#DC2626;background:#FEF2F2;color:#DC2626;font-weight:700}
.quiz-opt.reveal{border-color:#16A34A;background:#F0FDF4;color:#16A34A}
.quiz-explain{padding:11px 14px;border-radius:10px;font-size:13px;font-weight:500;
  margin-top:8px;line-height:1.6}
.explain-correct{background:#F0FDF4;color:#16A34A}
.explain-wrong{background:#FEF2F2;color:#DC2626}

/* FLASHCARD */
.fc-wrap{perspective:1000px;cursor:pointer;margin:16px 0;height:190px}
.fc{width:100%;height:190px;position:relative;transform-style:preserve-3d;transition:transform .5s ease}
.fc.flipped{transform:rotateY(180deg)}
.fc-face{position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px;
  display:flex;align-items:center;justify-content:center;padding:22px;text-align:center;flex-direction:column;gap:6px}
.fc-front{background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff}
.fc-back{background:#fff;border:2px solid #C7D2FE;color:#0F172A;transform:rotateY(180deg)}
.fc-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6}
.fc-text{font-size:15px;font-weight:600;line-height:1.5}

/* DIFFICULTY PILLS */
.diff-wrap{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.diff-pill{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:all .15s}
.diff-basic{background:#F0FDF4;color:#16A34A}
.diff-basic.active{background:#16A34A;color:#fff}
.diff-medium{background:#EEF2FF;color:#4F46E5}
.diff-medium.active{background:#4F46E5;color:#fff}
.diff-hard{background:#FFF7ED;color:#EA580C}
.diff-hard.active{background:#EA580C;color:#fff}
.diff-extreme{background:#FEF2F2;color:#DC2626}
.diff-extreme.active{background:#DC2626;color:#fff}

/* INTERVIEW */
.chat-wrap{display:flex;flex-direction:column;gap:12px;margin:16px 0;max-height:400px;overflow-y:auto}
.chat-msg{padding:12px 16px;border-radius:14px;font-size:14px;line-height:1.6;max-width:88%}
.chat-ai{background:#EEF2FF;color:#0F172A;border-radius:14px 14px 14px 4px;align-self:flex-start}
.chat-user{background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;border-radius:14px 14px 4px 14px;align-self:flex-end}
.chat-input-wrap{display:flex;gap:8px;margin-top:8px}

/* TOPIC ROW */
.topic-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F1F5F9}
.topic-row:last-child{border-bottom:none}
.topic-name{font-size:13px;font-weight:600;color:#0F172A;flex:1}
.topic-badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px}
.badge-done{color:#16A34A;background:#F0FDF4}
.badge-weak{color:#EA580C;background:#FFF7ED}
.badge-pending{color:#64748B;background:#F1F5F9}

/* SPINNER */
.spin-wrap{text-align:center;padding:36px}
.spinner{width:32px;height:32px;border:3px solid #C7D2FE;border-top-color:#4F46E5;
  border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
.spin-text{font-size:13px;color:#64748B}

/* ERROR */
.err{background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:12px 16px;color:#DC2626;font-size:13px;margin-top:12px}

/* CHIPS */
.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
.chip{padding:5px 12px;border:1.5px solid #E2E8F0;border-radius:20px;font-size:12px;
  color:#475569;background:#fff;font-weight:600;cursor:pointer;transition:all .15s}
.chip:hover{border-color:#4F46E5;color:#4F46E5;background:#EEF2FF}

/* SETTINGS */
.setting-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #F1F5F9}
.setting-row:last-child{border-bottom:none}
.setting-label{font-size:14px;font-weight:600;color:#0F172A}
.setting-sub{font-size:12px;color:#64748B;margin-top:2px}
.toggle{width:42px;height:24px;background:#E2E8F0;border-radius:99px;position:relative;cursor:pointer;transition:background .2s;border:none}
.toggle.on{background:#4F46E5}
.toggle::after{content:'';width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;
  top:3px;left:3px;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.toggle.on::after{transform:translateX(18px)}

/* SECTION DIVIDER */
.divider{height:1px;background:#F1F5F9;margin:16px 0}

/* SCORE RESULT */
.score-card{text-align:center;padding:28px 20px;border-radius:16px;margin-bottom:16px;animation:fadeUp .35s ease}
.score-emoji{font-size:48px;margin-bottom:10px}
.score-num{font-family:'Fraunces',serif;font-size:32px;font-weight:700;margin-bottom:6px}
.score-msg{font-size:14px;color:#64748B}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* FILE LIBRARY */
.file-lib-item{display:flex;align-items:center;gap:12px;padding:14px;background:#FAFBFF;
  border:1.5px solid #E8EDFF;border-radius:12px;margin-bottom:10px;cursor:pointer;transition:border-color .15s}
.file-lib-item:hover{border-color:#4F46E5}
.file-lib-item.selected{border-color:#4F46E5;background:#EEF2FF}
.file-lib-icon{width:40px;height:40px;background:#EEF2FF;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.file-lib-name{font-size:13px;font-weight:700;color:#0F172A}
.file-lib-meta{font-size:11px;color:#94A3B8;margin-top:2px}
.file-lib-actions{display:flex;gap:6px;margin-left:auto;flex-shrink:0}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handle = async () => {
    setLoading(true); setError(""); setMsg("");
    try {
      if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (e) throw e;
        setMsg("✅ Account created! Check email to verify, then login.");
        setMode("login");
      } else {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        onAuth(data.user);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <div className="auth-logo-name">ReviseIQ</div>
        </div>
        <div className="auth-title">{mode === "login" ? "Welcome back!" : "Create Account"}</div>
        <div className="auth-sub">{mode === "login" ? "Login to continue your revision" : "Start your smart revision journey"}</div>
        {error && <div className="auth-err">⚠️ {error}</div>}
        {msg && <div style={{ background: "#F0FDF4", color: "#16A34A", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{msg}</div>}
        {mode === "signup" && <input className="auth-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />}
        <input className="auth-input" placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="auth-input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
        <button className="auth-btn" onClick={handle} disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login →" : "Create Account →"}</button>
        <div className="auth-switch">
          {mode === "login" ? <>Don't have an account? <span onClick={() => setMode("signup")}>Sign up free</span></> : <>Already have account? <span onClick={() => setMode("login")}>Login</span></>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE LIBRARY (Supabase storage)
// ═══════════════════════════════════════════════════════════════════════════════
function useFileLibrary(userId) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from("user_files").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setFiles(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const addFile = async (file, extractedText, subject) => {
    const path = `${userId}/${Date.now()}_${file.name}`;
    await supabase.storage.from("study-files").upload(path, file);
    const { data } = await supabase.from("user_files").insert({
      user_id: userId, name: file.name, subject: subject || "General",
      size: file.size, storage_path: path, extracted_text: extractedText,
      topics: [], created_at: new Date().toISOString()
    }).select().single();
    setFiles(p => [data, ...p]);
    return data;
  };

  const deleteFile = async (id, path) => {
    await supabase.storage.from("study-files").remove([path]);
    await supabase.from("user_files").delete().eq("id", id);
    setFiles(p => p.filter(f => f.id !== id));
  };

  return { files, loading, addFile, deleteFile, reload: load };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: HOME
// ═══════════════════════════════════════════════════════════════════════════════
function TabHome({ user, progress, files, onGoTo }) {
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "Student";
  const pct = progress.totalQ > 0 ? Math.round(progress.correct / progress.totalQ * 100) : 0;

  return (
    <div>
      <div className="banner">
        <div className="banner-greeting">Hello, {name} 👋</div>
        <div className="banner-title">Ready to revise today?<br />Let's make it count.</div>
        <div className="banner-stats">
          <div><div className="banner-stat-num">{files.length}</div><div className="banner-stat-label">Files Saved</div></div>
          <div><div className="banner-stat-num">{progress.studied}</div><div className="banner-stat-label">Topics Done</div></div>
          <div><div className="banner-stat-num">{pct}%</div><div className="banner-stat-label">Quiz Accuracy</div></div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-num">{progress.quizzes}</div>
          <div className="stat-label">Quizzes Taken</div>
          <div className="prog-wrap"><div className="prog-bar" style={{ width: Math.min(progress.quizzes * 10, 100) + "%" }} /></div>
        </div>
        <div className="stat-box">
          <div className="stat-num" style={{ color: "#EA580C" }}>{progress.weak.length}</div>
          <div className="stat-label">Weak Topics</div>
          {progress.weak.slice(0, 1).map(t => <div key={t} style={{ fontSize: 11, color: "#EA580C", fontWeight: 700, marginTop: 6, background: "#FFF7ED", padding: "3px 8px", borderRadius: 6 }}>{t}</div>)}
        </div>
      </div>

      <div className="card">
        <div className="card-title">⚡ Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {[
            { icon: "💡", label: "Explain Topic", tab: "explain" },
            { icon: "✏️", label: "Take Quiz", tab: "quiz" },
            { icon: "🗂️", label: "Flashcards", tab: "flashcards" },
            { icon: "🎤", label: "Interview Prep", tab: "interview" },
            { icon: "📁", label: "My Files", tab: "files" },
            { icon: "📊", label: "Progress", tab: "progress" },
          ].map(a => (
            <button key={a.tab} className="btn btn-outline" style={{ padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, fontSize: 12 }} onClick={() => onGoTo(a.tab)}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      </div>

      {progress.weak.length > 0 && (
        <div className="card" style={{ borderColor: "#FDBA74" }}>
          <div className="card-title">⚠️ Weak Topics — Revise These!</div>
          <div className="chips">
            {progress.weak.map(t => (
              <button key={t} className="chip" style={{ borderColor: "#EA580C", color: "#EA580C", background: "#FFF7ED" }} onClick={() => onGoTo("explain", t)}>{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: FILE LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════
function TabFiles({ userId, library }) {
  const { files, loading, addFile, deleteFile } = library;
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [subject, setSubject] = useState("");
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const fileRef = useRef();

  const processFiles = async (newFiles) => {
    setUploading(true); setError(""); setProgress("");
    for (const f of newFiles) {
      try {
        setProgress(`Reading ${f.name}...`);
        const b64 = await fileToBase64(f);
        setProgress(`AI analyzing ${f.name}...`);
        const ct = f.type === "application/pdf" ? "document" : "image";
        const msg = [{
          role: "user", content: [
            ct === "document" ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
              : { type: "image", source: { type: "base64", media_type: f.type, data: b64 } },
            { type: "text", text: `Extract and summarize all content from this study document. Return a comprehensive text summary of all topics, concepts, formulas and key points covered. Be thorough.` }
          ]
        }];
        const text = await callAI(msg, 1500);
        setProgress(`Saving ${f.name} to cloud...`);
        await addFile(f, text, subject || "General");
      } catch (e) { setError(`Failed: ${f.name} — ${e.message}`); }
    }
    setPending([]);
    setProgress("");
    setUploading(false);
  };

  return (
    <div>
      <div className="page-title">📁 My Study Files</div>
      <div className="page-sub">Upload once — saved forever to your account</div>

      <div className="card">
        <label className="label">Subject Name (optional)</label>
        <input className="input" placeholder="e.g. Basic Electronics, Mechanics..." value={subject} onChange={e => setSubject(e.target.value)} style={{ marginBottom: 12 }} />
        <div className={`drop${drag ? " drag" : ""}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); setPending(Array.from(e.dataTransfer.files)); }}
          onClick={() => fileRef.current.click()}>
          <div className="drop-icon">📂</div>
          <div className="drop-title">Drop PDF, notes, lab manuals</div>
          <div className="drop-sub">AI reads, extracts & saves everything</div>
          <input ref={fileRef} type="file" style={{ display: "none" }} accept=".pdf,image/*" multiple onChange={e => setPending(Array.from(e.target.files))} />
        </div>
        {pending.map((f, i) => (
          <div key={i} className="file-chip" style={{ marginTop: 8 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <div className="file-chip-info">
              <div className="file-chip-name">{f.name}</div>
              <div className="file-chip-size">{(f.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
            <button className="btn btn-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "none" }} onClick={() => setPending(p => p.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {pending.length > 0 && (
          <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={() => processFiles(pending)} disabled={uploading}>
            {uploading ? "⏳ Processing..." : `🧠 Analyze & Save ${pending.length} File(s)`}
          </button>
        )}
        {uploading && <div className="spin-wrap"><div className="spinner" /><div className="spin-text">{progress}</div></div>}
        {error && <div className="err">⚠️ {error}</div>}
      </div>

      {loading && <div className="spin-wrap"><div className="spinner" /><div className="spin-text">Loading your files...</div></div>}

      {!loading && files.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>No files yet</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>Upload your first PDF or notes above!</div>
        </div>
      )}

      {files.map(f => (
        <div key={f.id} className="file-lib-item">
          <div className="file-lib-icon">📄</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="file-lib-name">{f.name}</div>
            <div className="file-lib-meta">{f.subject} · {(f.size / 1024 / 1024).toFixed(1)} MB · {new Date(f.created_at).toLocaleDateString()}</div>
          </div>
          <div className="file-lib-actions">
            <button className="btn btn-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "none" }} onClick={() => deleteFile(f.id, f.storage_path)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: EXPLAIN
// ═══════════════════════════════════════════════════════════════════════════════
function TabExplain({ files, onStudied, initTopic }) {
  const [topic, setTopic] = useState(initTopic || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [useAll, setUseAll] = useState(false);
  const [difficulty, setDifficulty] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { if (initTopic) setTopic(initTopic); }, [initTopic]);

  const explain = async () => {
    if (!topic.trim()) { setError("Enter a topic."); return; }
    setLoading(true); setResult(null); setError("");
    const context = useAll
      ? files.map(f => f.extracted_text || "").join("\n\n")
      : selectedFile?.extracted_text || "";
    const diffMap = { basic: "very simple beginner level", medium: "intermediate level with more depth", hard: "advanced level with technical details", extreme: "expert level with full technical depth" };
    const prompt = `You are an expert mechatronics/electronics teacher. Explain "${topic}" at ${diffMap[difficulty]}.
${context ? `\n\nUse this study material as context:\n${context.slice(0, 3000)}` : ""}

Format EXACTLY like this:

SIMPLE EXPLANATION:
(Clear explanation matching the difficulty level, 4-5 sentences)

FORMULA:
(Key formulas or "No formula needed")

REAL-LIFE EXAMPLE:
(One practical mechatronics/electronics example)

KEY POINTS:
• Point 1
• Point 2
• Point 3

COMMON MISTAKES:
(What students usually get wrong about this topic)

VIVA QUESTIONS:
Q1: (question)
Answer: (answer)

Q2: (question)
Answer: (answer)`;

    try {
      const text = await callAI([{ role: "user", content: prompt }], 1400);
      setResult({ topic: topic.trim(), text, difficulty });
      onStudied(topic.trim(), 80);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const section = (key, text) => {
    const patterns = {
      simple: /SIMPLE EXPLANATION:\s*([\s\S]*?)(?=FORMULA:|$)/i,
      formula: /FORMULA:\s*([\s\S]*?)(?=REAL-LIFE|$)/i,
      reallife: /REAL-LIFE EXAMPLE:\s*([\s\S]*?)(?=KEY POINTS:|$)/i,
      keypoints: /KEY POINTS:\s*([\s\S]*?)(?=COMMON MISTAKES:|$)/i,
      mistakes: /COMMON MISTAKES:\s*([\s\S]*?)(?=VIVA QUESTIONS:|$)/i,
      viva: /VIVA QUESTIONS:\s*([\s\S]*?)$/i,
    };
    const m = text.match(patterns[key]);
    return m ? m[1].trim() : "";
  };

  return (
    <div>
      <div className="page-title">💡 Explain a Topic</div>
      <div className="page-sub">Simple to expert — AI explains with examples & viva prep</div>

      <div className="card">
        <label className="label">Topic</label>
        <input className="input" placeholder="e.g. Ohm's Law, PID Controller, Op-Amp..." value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && explain()} />

        <div style={{ marginTop: 14 }}>
          <label className="label">Difficulty Level</label>
          <div className="diff-wrap">
            {["basic", "medium", "hard", "extreme"].map(d => (
              <button key={d} className={`diff-pill diff-${d}${difficulty === d ? " active" : ""}`} onClick={() => setDifficulty(d)}>
                {d === "basic" ? "🟢 Basic" : d === "medium" ? "🔵 Medium" : d === "hard" ? "🟠 Hard" : "🔴 Extreme"}
              </button>
            ))}
          </div>
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <label className="label">Use which files as context?</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button className={`btn btn-sm ${useAll ? "btn-primary" : "btn-outline"}`} onClick={() => { setUseAll(true); setSelectedFile(null); }}>📚 All Files</button>
              <button className={`btn btn-sm ${!useAll ? "btn-primary" : "btn-outline"}`} onClick={() => setUseAll(false)}>📄 Pick One</button>
            </div>
            {!useAll && (
              <div style={{ maxHeight: 180, overflowY: "auto" }}>
                {files.map(f => (
                  <div key={f.id} className={`file-lib-item${selectedFile?.id === f.id ? " selected" : ""}`} style={{ padding: 10, marginBottom: 6 }} onClick={() => setSelectedFile(f)}>
                    <span style={{ fontSize: 16 }}>📄</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>{f.subject}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="chips">
          {["Ohm's Law", "Kirchhoff's Laws", "DC Motor", "PWM", "Op-Amp", "PID Control", "Transistor", "Capacitor", "Sensor", "Arduino"].map(t => (
            <button key={t} className="chip" onClick={() => setTopic(t)}>{t}</button>
          ))}
        </div>

        <button className="btn btn-primary btn-full" style={{ marginTop: 14 }} onClick={explain} disabled={loading || !topic.trim()}>
          {loading ? "⏳ Thinking..." : "⚡ Explain This Topic"}
        </button>
        {error && <div className="err">⚠️ {error}</div>}
      </div>

      {loading && <div className="spin-wrap"><div className="spinner" /><div className="spin-text">AI is preparing your explanation…</div></div>}

      {result && !loading && (
        <div className="card" style={{ animation: "fadeUp .35s ease" }}>
          <div style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", margin: "-20px -20px 18px", padding: "18px 20px", borderRadius: "16px 16px 0 0" }}>
            <div style={{ color: "#C7D2FE", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em" }}>{result.difficulty.toUpperCase()} LEVEL</div>
            <div style={{ color: "#fff", fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, marginTop: 2 }}>{result.topic}</div>
          </div>
          {[
            { key: "simple", label: "💡 Explanation", type: "text" },
            { key: "formula", label: "📐 Formula", type: "formula" },
            { key: "reallife", label: "🌍 Real-Life Example", type: "text" },
            { key: "keypoints", label: "📌 Key Points", type: "text" },
            { key: "mistakes", label: "⚠️ Common Mistakes", type: "text" },
            { key: "viva", label: "🎤 Viva Questions", type: "viva" },
          ].map((sec, i) => {
            const content = section(sec.key, result.text);
            if (!content) return null;
            return (
              <div key={sec.key}>
                {i > 0 && <div className="divider" />}
                <div className="tag tag-indigo">{sec.label}</div>
                {sec.type === "formula"
                  ? <div style={{ background: "#F8FAFF", border: "1px solid #E8EDFF", borderLeft: "3px solid #4F46E5", borderRadius: 8, padding: "12px 14px", fontFamily: "monospace", fontSize: 14, color: "#0F172A" }}>{content}</div>
                  : sec.type === "viva"
                    ? content.split(/\n(?=Q\d+:)/).map((q, qi) => q.trim() && <div key={qi} style={{ background: "#EEF2FF", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#334155", marginBottom: 8, lineHeight: 1.6 }}>{q.trim()}</div>)
                    : <div style={{ fontSize: 14, lineHeight: 1.75, color: "#334155", whiteSpace: "pre-wrap" }}>{content}</div>
                }
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: QUIZ
// ═══════════════════════════════════════════════════════════════════════════════
function TabQuiz({ files, onQuizResult }) {
  const [topic, setTopic] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [useAll, setUseAll] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [numQ, setNumQ] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setQuestions([]); setAnswers({}); setSubmitted(false); setScore(null); setError("");
    const context = useAll ? files.map(f => f.extracted_text || "").join("\n\n").slice(0, 4000)
      : (selectedFile?.extracted_text || "").slice(0, 4000);
    const topicStr = topic.trim() || "mechatronics and electronics";
    const diffMap = { basic: "simple beginner", medium: "intermediate", hard: "advanced", extreme: "expert level challenging" };
    const prompt = `Create exactly ${numQ} ${diffMap[difficulty]} multiple choice questions about "${topicStr}" for an engineering student.
${context ? `\nBase questions on this material:\n${context}` : ""}
Return ONLY valid JSON array:
[{"q":"Question?","options":["A) opt1","B) opt2","C) opt3","D) opt4"],"answer":"A","explanation":"Why A is correct"}]`;
    try {
      const text = await callAI([{ role: "user", content: prompt }], 1500);
      const parsed = tryJSON(text);
      if (Array.isArray(parsed) && parsed.length > 0) setQuestions(parsed);
      else throw new Error("Could not generate questions. Try again.");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const submit = () => {
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
    const pct = Math.round(correct / questions.length * 100);
    setSubmitted(true);
    setScore({ correct, total: questions.length, pct });
    onQuizResult(topic || "General", correct, questions.length);
  };

  const retake = () => { setAnswers({}); setSubmitted(false); setScore(null); };

  return (
    <div>
      <div className="page-title">✏️ Quiz Generator</div>
      <div className="page-sub">AI generates questions from your files or any topic</div>

      {!questions.length && (
        <div className="card">
          <label className="label">Topic (optional)</label>
          <input className="input" placeholder="e.g. Kirchhoff's Laws, or leave blank for general quiz..." value={topic} onChange={e => setTopic(e.target.value)} />

          <div style={{ marginTop: 12 }}>
            <label className="label">Difficulty</label>
            <div className="diff-wrap">
              {["basic", "medium", "hard", "extreme"].map(d => (
                <button key={d} className={`diff-pill diff-${d}${difficulty === d ? " active" : ""}`} onClick={() => setDifficulty(d)}>
                  {d === "basic" ? "🟢 Basic" : d === "medium" ? "🔵 Medium" : d === "hard" ? "🟠 Hard" : "🔴 Extreme"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="label">Number of Questions</label>
            <select className="input" value={numQ} onChange={e => setNumQ(+e.target.value)}>
              {[3, 5, 8, 10, 15].map(n => <option key={n} value={n}>{n} Questions</option>)}
            </select>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label className="label">Generate from which files?</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button className={`btn btn-sm ${useAll ? "btn-primary" : "btn-outline"}`} onClick={() => { setUseAll(true); setSelectedFile(null); }}>📚 All Files</button>
                <button className={`btn btn-sm ${!useAll && !selectedFile ? "btn-primary" : "btn-outline"}`} onClick={() => { setUseAll(false); setSelectedFile(null); }}>🤖 AI Only</button>
                <button className={`btn btn-sm ${!useAll && selectedFile ? "btn-primary" : "btn-outline"}`} onClick={() => setUseAll(false)}>📄 One File</button>
              </div>
              {!useAll && (
                <div style={{ maxHeight: 160, overflowY: "auto" }}>
                  {files.map(f => (
                    <div key={f.id} className={`file-lib-item${selectedFile?.id === f.id ? " selected" : ""}`} style={{ padding: 9, marginBottom: 5 }} onClick={() => setSelectedFile(f)}>
                      <span>📄</span>
                      <div><div style={{ fontSize: 12, fontWeight: 700 }}>{f.name}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{f.subject}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary btn-full" style={{ marginTop: 14 }} onClick={generate} disabled={loading}>
            {loading ? "⏳ Generating..." : "🎯 Generate Quiz"}
          </button>
          {error && <div className="err">⚠️ {error}</div>}
          {loading && <div className="spin-wrap"><div className="spinner" /><div className="spin-text">Creating your quiz…</div></div>}
        </div>
      )}

      {score && (
        <div className="score-card" style={{ background: score.pct >= 60 ? "#F0FDF4" : "#FEF2F2", border: `1.5px solid ${score.pct >= 60 ? "#BBF7D0" : "#FECACA"}` }}>
          <div className="score-emoji">{score.pct >= 80 ? "🏆" : score.pct >= 60 ? "✅" : "📖"}</div>
          <div className="score-num" style={{ color: score.pct >= 60 ? "#16A34A" : "#DC2626" }}>{score.correct}/{score.total} — {score.pct}%</div>
          <div className="score-msg">{score.pct >= 80 ? "Excellent work! 💪" : score.pct >= 60 ? "Good job! Review the wrong ones." : "Keep practicing — revise and retry!"}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
            <button className="btn btn-outline" onClick={retake}>🔄 Retake Same</button>
            <button className="btn btn-primary" onClick={() => { setQuestions([]); setScore(null); }}>📝 New Quiz</button>
          </div>
        </div>
      )}

      {questions.map((q, i) => {
        const sel = answers[i];
        return (
          <div key={i} className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>Q{i + 1} of {questions.length}</div>
            <div className="quiz-q">{q.q}</div>
            {(q.options || []).map(opt => {
              const letter = opt[0];
              let cls = "quiz-opt";
              if (submitted) {
                if (letter === q.answer) cls += " correct";
                else if (letter === sel) cls += " wrong";
              } else if (sel === letter) cls += " selected";
              return (
                <button key={opt} className={cls} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: letter }))}>{opt}</button>
              );
            })}
            {submitted && (
              <div className={`quiz-explain ${answers[i] === q.answer ? "explain-correct" : "explain-wrong"}`}>
                {answers[i] === q.answer ? "✅ Correct! " : "❌ Wrong. "}{q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {questions.length > 0 && !submitted && (
        <button className="btn btn-primary btn-full" disabled={Object.keys(answers).length < questions.length} onClick={submit}>
          📊 Submit ({Object.keys(answers).length}/{questions.length} answered)
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: FLASHCARDS
// ═══════════════════════════════════════════════════════════════════════════════
function TabFlashcards({ files }) {
  const [topic, setTopic] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setCards([]); setIdx(0); setFlipped(false); setKnown(new Set()); setError("");
    const context = selectedFile?.extracted_text?.slice(0, 3000) || "";
    const prompt = `Create 10 flashcards for "${topic || "mechatronics basics"}".
${context ? `Based on:\n${context}` : ""}
Return ONLY valid JSON:
[{"front":"Term or question","back":"Definition or answer with formula if applicable"}]`;
    try {
      const text = await callAI([{ role: "user", content: prompt }], 1000);
      const parsed = tryJSON(text);
      if (Array.isArray(parsed)) setCards(parsed);
      else throw new Error("Could not generate cards.");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const cur = cards[idx];

  return (
    <div>
      <div className="page-title">🗂️ Flashcards</div>
      <div className="page-sub">Tap card to flip — mark what you know</div>

      {!cards.length && (
        <div className="card">
          <label className="label">Topic</label>
          <input className="input" placeholder="e.g. Ohm's Law, Capacitors..." value={topic} onChange={e => setTopic(e.target.value)} />
          {files.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label className="label">From file (optional)</label>
              {files.map(f => (
                <div key={f.id} className={`file-lib-item${selectedFile?.id === f.id ? " selected" : ""}`} style={{ padding: 9, marginBottom: 5 }} onClick={() => setSelectedFile(selectedFile?.id === f.id ? null : f)}>
                  <span>📄</span><div><div style={{ fontSize: 12, fontWeight: 700 }}>{f.name}</div></div>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={generate} disabled={loading}>
            {loading ? "⏳ Creating..." : "🗂️ Generate Flashcards"}
          </button>
          {error && <div className="err">⚠️ {error}</div>}
          {loading && <div className="spin-wrap"><div className="spinner" /><div className="spin-text">Making flashcards…</div></div>}
        </div>
      )}

      {cards.length > 0 && cur && (
        <div style={{ animation: "fadeUp .35s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{idx + 1}/{cards.length}</span>
            <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 700 }}>✅ {known.size} known</span>
          </div>
          <div className="prog-wrap"><div className="prog-bar green" style={{ width: (known.size / cards.length * 100) + "%" }} /></div>

          <div className="fc-wrap" onClick={() => setFlipped(f => !f)}>
            <div className={`fc${flipped ? " flipped" : ""}`}>
              <div className="fc-face fc-front">
                <div className="fc-label">Tap to reveal answer</div>
                <div className="fc-text">{cur.front}</div>
              </div>
              <div className="fc-face fc-back">
                <div className="fc-label">Answer</div>
                <div className="fc-text" style={{ fontSize: 13 }}>{cur.back}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
            <button className="btn btn-full" style={{ background: "#FEF2F2", color: "#DC2626", border: "none", flex: 1 }}
              onClick={() => { setFlipped(false); if (idx < cards.length - 1) setIdx(i => i + 1); }}>
              🔄 Still Learning
            </button>
            <button className="btn btn-full" style={{ background: "#F0FDF4", color: "#16A34A", border: "none", flex: 1 }}
              onClick={() => { setKnown(k => new Set([...k, idx])); setFlipped(false); if (idx < cards.length - 1) setIdx(i => i + 1); }}>
              ✅ I Know This
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
            <button className="btn btn-outline btn-sm" onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={idx === 0}>← Prev</button>
            <button className="btn btn-outline btn-sm" onClick={() => { setCards([]); setIdx(0); setKnown(new Set()); }}>↩ Reset</button>
            <button className="btn btn-outline btn-sm" onClick={() => { setIdx(i => Math.min(i + 1, cards.length - 1)); setFlipped(false); }} disabled={idx === cards.length - 1}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: INTERVIEW PRACTICE
// ═══════════════════════════════════════════════════════════════════════════════
function TabInterview({ files }) {
  const [setup, setSetup] = useState(true);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [mode, setMode] = useState("type");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatRef = useRef();

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const startInterview = async () => {
    setSetup(false);
    setLoading(true);
    const context = files.slice(0, 2).map(f => f.extracted_text || "").join("\n").slice(0, 2000);
    const sys = `You are a professional interviewer at ${company || "a top engineering company"} interviewing for a ${role || "Mechatronics Engineer"} position. Start with a warm greeting, then ask interview questions one by one. After each answer, give brief feedback (1-2 sentences) and ask the next question. Cover technical mechatronics topics, practical scenarios, and soft skills. Be encouraging but professional. Keep questions and feedback concise.${context ? `\n\nCandidate's study background:\n${context}` : ""}`;
    const greeting = await callAI([{ role: "user", content: sys + "\n\nStart the interview now with a greeting and your first question." }], 400);
    setMessages([{ role: "ai", text: greeting }]);
    setLoading(false);
  };

  const sendMsg = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const history = newMsgs.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
      history.unshift({ role: "user", content: `You are interviewing for ${role || "Mechatronics Engineer"} at ${company || "a top company"}. Be a professional interviewer. After the user's answer give 1 sentence feedback then ask next question.` });
      const reply = await callAI(history, 500);
      setMessages(p => [...p, { role: "ai", text: reply }]);
    } catch (e) { setMessages(p => [...p, { role: "ai", text: "Sorry, error occurred. Please try again." }]); }
    finally { setLoading(false); }
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Voice not supported on this browser. Use Chrome."); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = e => { const t = e.results[0][0].transcript; setInput(t); sendMsg(t); };
    rec.start();
  };

  if (setup) return (
    <div>
      <div className="page-title">🎤 Interview Practice</div>
      <div className="page-sub">AI takes your mock interview — type or speak your answers</div>
      <div className="card">
        <label className="label">Company Name (optional)</label>
        <input className="input" placeholder="e.g. Tata Motors, L&T, Bosch..." value={company} onChange={e => setCompany(e.target.value)} style={{ marginBottom: 12 }} />
        <label className="label">Role</label>
        <input className="input" placeholder="e.g. Mechatronics Engineer, Automation Engineer..." value={role} onChange={e => setRole(e.target.value)} style={{ marginBottom: 12 }} />
        <label className="label">Answer Mode</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className={`btn btn-sm ${mode === "type" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("type")}>⌨️ Type</button>
          <button className={`btn btn-sm ${mode === "voice" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("voice")}>🎤 Voice</button>
          <button className={`btn btn-sm ${mode === "both" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("both")}>🎤+⌨️ Both</button>
        </div>
        <button className="btn btn-primary btn-full" onClick={startInterview}>🚀 Start Interview</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button className="btn btn-outline btn-sm" onClick={() => { setSetup(true); setMessages([]); }}>← Back</button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{company || "Mock Interview"}</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>{role || "Mechatronics Engineer"}</div>
        </div>
      </div>

      <div className="chat-wrap" ref={chatRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === "ai" ? "chat-ai" : "chat-user"}`}>{m.text}</div>
        ))}
        {loading && <div className="chat-msg chat-ai" style={{ opacity: .6 }}>💭 Thinking...</div>}
      </div>

      <div className="chat-input-wrap">
        {(mode === "type" || mode === "both") && (
          <input className="input" style={{ flex: 1 }} placeholder="Type your answer..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg(input)} disabled={loading} />
        )}
        {(mode === "voice" || mode === "both") && (
          <button className="btn btn-outline" onClick={startVoice} disabled={loading || listening} style={{ flexShrink: 0 }}>
            {listening ? "🔴 Listening..." : "🎤"}
          </button>
        )}
        {(mode === "type" || mode === "both") && (
          <button className="btn btn-primary" onClick={() => sendMsg(input)} disabled={loading || !input.trim()} style={{ flexShrink: 0 }}>Send</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════
function TabProgress({ progress, files }) {
  const pct = progress.totalQ > 0 ? Math.round(progress.correct / progress.totalQ * 100) : 0;

  return (
    <div>
      <div className="page-title">📊 My Progress</div>
      <div className="page-sub">Full tracking — studied, quizzes, weak & strong topics</div>

      <div className="stat-grid">
        <div className="stat-box"><div className="stat-num">{progress.studied}</div><div className="stat-label">Topics Studied</div></div>
        <div className="stat-box"><div className="stat-num">{progress.quizzes}</div><div className="stat-label">Quizzes Taken</div></div>
        <div className="stat-box">
          <div className="stat-num">{pct}%</div><div className="stat-label">Quiz Accuracy</div>
          <div className="prog-wrap"><div className={`prog-bar${pct >= 60 ? " green" : " orange"}`} style={{ width: pct + "%" }} /></div>
        </div>
        <div className="stat-box"><div className="stat-num" style={{ color: "#EA580C" }}>{progress.weak.length}</div><div className="stat-label">Weak Topics</div></div>
      </div>

      {progress.weak.length > 0 && (
        <div className="card" style={{ borderColor: "#FDBA74" }}>
          <div className="card-title">⚠️ Weak Topics</div>
          {progress.weak.map(t => <div key={t} className="topic-row"><div className="topic-name">{t}</div><span className="topic-badge badge-weak">Weak</span></div>)}
        </div>
      )}

      {progress.strong.length > 0 && (
        <div className="card" style={{ borderColor: "#86EFAC" }}>
          <div className="card-title">💪 Strong Topics</div>
          {progress.strong.map(t => <div key={t} className="topic-row"><div className="topic-name">{t}</div><span className="topic-badge badge-done">Strong</span></div>)}
        </div>
      )}

      {progress.history.length > 0 && (
        <div className="card">
          <div className="card-title">📖 Study History</div>
          {[...progress.history].reverse().slice(0, 15).map((h, i) => (
            <div key={i} className="topic-row">
              <div className="topic-name">{h.topic}</div>
              <span className="topic-badge" style={{ background: h.score >= 70 ? "#F0FDF4" : "#FFF7ED", color: h.score >= 70 ? "#16A34A" : "#EA580C" }}>{h.score}%</span>
            </div>
          ))}
        </div>
      )}

      {progress.history.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
          <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>No progress yet</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>Start studying and taking quizzes — everything tracks here!</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
function TabSettings({ user, onLogout }) {
  const name = user?.user_metadata?.full_name || "Student";
  const email = user?.email || "";
  return (
    <div>
      <div className="page-title">⚙️ Settings</div>
      <div className="page-sub">Your account & preferences</div>
      <div className="card">
        <div className="card-title">👤 Account</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>{name[0]?.toUpperCase()}</div>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>{name}</div><div style={{ fontSize: 13, color: "#64748B" }}>{email}</div></div>
        </div>
        <button className="btn btn-red btn-full" onClick={onLogout}>🚪 Logout</button>
      </div>
      <div className="card">
        <div className="card-title">📱 App Info</div>
        <div className="setting-row">
          <div><div className="setting-label">ReviseIQ</div><div className="setting-sub">AI Study Assistant for Engineers</div></div>
        </div>
        <div className="setting-row">
          <div><div className="setting-label">AI Model</div><div className="setting-sub">Claude Sonnet (Best quality)</div></div>
        </div>
        <div className="setting-row">
          <div><div className="setting-label">Storage</div><div className="setting-sub">Supabase Cloud — your files saved forever</div></div>
        </div>
        <div className="setting-row">
          <div><div className="setting-label">Version</div><div className="setting-sub">2.0 — Full Featured</div></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [explainInit, setExplainInit] = useState("");
  const [progress, setProgress] = useState({ studied: 0, quizzes: 0, correct: 0, totalQ: 0, weak: [], strong: [], history: [] });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => { setUser(session?.user || null); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  const library = useFileLibrary(user?.id);

  const onStudied = useCallback((topic, score) => {
    setProgress(p => {
      const hist = [...p.history.filter(h => h.topic !== topic), { topic, score, date: Date.now() }];
      const weak = hist.filter(h => h.score < 70).map(h => h.topic);
      const strong = hist.filter(h => h.score >= 70).map(h => h.topic);
      return { ...p, studied: hist.length, history: hist, weak, strong };
    });
  }, []);

  const onQuizResult = useCallback((topic, correct, total) => {
    const pct = Math.round(correct / total * 100);
    setProgress(p => ({
      ...p,
      quizzes: p.quizzes + 1,
      correct: p.correct + correct,
      totalQ: p.totalQ + total,
    }));
    onStudied(topic, pct);
  }, [onStudied]);

  const goTo = (t, initTopic = "") => { setTab(t); if (initTopic) setExplainInit(initTopic); };

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  if (authLoading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F4FF" }}><div className="spin-wrap"><div className="spinner" /><div className="spin-text">Loading ReviseIQ…</div></div></div>;
  if (!user) return <AuthScreen onAuth={setUser} />;

  const TABS = [
    { id: "home", label: "🏠 Home" },
    { id: "files", label: "📁 Files" },
    { id: "explain", label: "💡 Explain" },
    { id: "quiz", label: "✏️ Quiz" },
    { id: "flashcards", label: "🗂️ Cards" },
    { id: "interview", label: "🎤 Interview" },
    { id: "progress", label: "📊 Progress" },
    { id: "settings", label: "⚙️ Settings" },
  ];

  return (
    <>
      <style>{css}</style>
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">⚡</div>
          <div className="nav-logo-name">ReviseIQ</div>
        </div>
        <div className="nav-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`nav-tab${tab === t.id ? " active" : ""}`} onClick={() => { setTab(t.id); setExplainInit(""); }}>{t.label}</button>
          ))}
        </div>
        <div className="nav-avatar" onClick={() => setTab("settings")}>{user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}</div>
      </nav>
      <div className="page">
        {tab === "home" && <TabHome user={user} progress={progress} files={library.files} onGoTo={goTo} />}
        {tab === "files" && <TabFiles userId={user.id} library={library} />}
        {tab === "explain" && <TabExplain files={library.files} onStudied={onStudied} initTopic={explainInit} />}
        {tab === "quiz" && <TabQuiz files={library.files} onQuizResult={onQuizResult} />}
        {tab === "flashcards" && <TabFlashcards files={library.files} />}
        {tab === "interview" && <TabInterview files={library.files} />}
        {tab === "progress" && <TabProgress progress={progress} files={library.files} />}
        {tab === "settings" && <TabSettings user={user} onLogout={logout} />}
      </div>
    </>
  );
}
