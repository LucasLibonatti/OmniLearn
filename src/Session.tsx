import {useEffect,useMemo,useState} from 'react';import {useNavigate,useParams} from 'react-router-dom';import {Check,X} from 'lucide-react';
import {Btn,Bar,Card,useCtx} from './ui';import {questions} from './data';
const norm=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
export default function Session(){const {id}=useParams();const nav=useNavigate();const {finish}=useCtx();
 const qs=useMemo(()=>{const r=id==='rev'?questions.filter(q=>['Estados Gerais','Constituição de 1791'].includes(q.topic)):questions;return r.length?r:questions;},[id]);
 const [i,setI]=useState(0);const [sel,setSel]=useState<string|null>(null);const [ok,setOk]=useState<boolean|null>(null);const [txt,setTxt]=useState('');const [mt,setMt]=useState<Record<string,string>>({});
 const [run,setRun]=useState(0);const [hits,setHits]=useState(0);const [xp,setXp]=useState(0);const [gain,setGain]=useState(0);const [miss,setMiss]=useState<Record<string,number>>({});const [secs,setSecs]=useState(900);
 useEffect(()=>{const t=setInterval(()=>setSecs(s=>Math.max(0,s-1)),1000);return()=>clearInterval(t);},[]);
 const q=qs[i];const mm=`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
 const check=(v:string)=>{if(ok!==null)return;setSel(v);
  const c=q.type==='short'?!!q.accept?.some(a=>norm(v).includes(a)):q.type==='match'?q.pairs!.every(([a,b])=>mt[a]===b):v===q.answer;
  const g=c?10+(run>=2?5:0):3;setOk(c);setGain(g);setXp(x=>x+g);setRun(c?run+1:0);
  if(c)setHits(h=>h+1);else setMiss(m=>({...m,[q.topic]:(m[q.topic]??0)+1}));};
 const next=()=>{if(i+1<qs.length){setI(i+1);setSel(null);setOk(null);setTxt('');setMt({});}else{finish({correct:hits,total:qs.length,xp,misses:miss});nav('/resultado');}};
 return <div className="min-h-screen max-w-2xl mx-auto p-5 flex flex-col">
 <div className="flex items-center gap-3"><button aria-label="Sair da sessão" onClick={()=>nav('/dashboard')} className="p-2 rounded-xl hover:bg-slate-100"><X size={22}/></button><div className="flex-1"><Bar v={(i+(ok!==null?1:0))/qs.length*100}/></div><span className="font-mono font-bold text-slate-600">{mm}</span></div>
 <p className="mt-4 text-sm font-semibold text-slate-500">História · Questão {i+1} de {qs.length} · <span className="text-amber-600">{xp} XP</span></p>
 <div key={i} className="fade flex-1"><h1 className="text-2xl font-extrabold mt-4">{q.prompt}</h1>
 <div className="mt-6 grid gap-3 relative">
  {q.type!=='match'&&q.type!=='short'&&q.options!.map((o,k)=>{const right=ok!==null&&o===q.answer,wrong=ok===false&&sel===o;
   return <button key={o} onClick={()=>check(o)} disabled={ok!==null} className={`flex items-center gap-3 text-left rounded-2xl border-2 px-4 py-4 font-medium transition ${right?'border-emerald-500 bg-emerald-50 pop':wrong?'border-red-300 bg-red-50 shake':'border-slate-200 bg-white hover:border-indigo-400'}`}>
   <span className="grid place-items-center w-8 h-8 rounded-lg bg-slate-100 text-sm font-bold">{'ABCD'[k]}</span>{o}{right&&<Check className="ml-auto text-emerald-600"/>}{wrong&&<X className="ml-auto text-red-500"/>}</button>;})}
  {q.type==='match'&&<>{q.pairs!.map(([a])=><div key={a} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><span className="font-semibold w-32">{a}</span>
   <select aria-label={a} disabled={ok!==null} value={mt[a]??''} onChange={e=>setMt({...mt,[a]:e.target.value})} className="flex-1 rounded-xl border border-slate-200 p-2"><option value="">Escolha…</option>{q.pairs!.map(([,b])=><option key={b}>{b}</option>)}</select></div>)}
   {ok===null&&<Btn onClick={()=>check('m')} disabled={Object.keys(mt).length<q.pairs!.length}>Verificar</Btn>}</>}
  {q.type==='short'&&<><input aria-label="Sua resposta" value={txt} disabled={ok!==null} onChange={e=>setTxt(e.target.value)} placeholder="Digite sua resposta" className="rounded-2xl border-2 border-slate-200 px-4 py-4"/>{ok===null&&<Btn onClick={()=>check(txt)} disabled={!txt.trim()}>Verificar</Btn>}</>}
  {ok!==null&&<span key={i} className="xp absolute right-2 -top-6 font-extrabold text-amber-500 text-xl pointer-events-none">+{gain} XP</span>}</div></div>
 {ok!==null&&<Card className={`pop mt-4 ${ok?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'}`}><p className="font-extrabold">{ok?'✓ Muito bem! Você acertou.':'✕ Ainda não!'}</p>{!ok&&<p className="font-semibold">Resposta correta: {q.type==='match'?q.pairs!.map(p=>p.join(' → ')).join(' · '):q.answer}</p>}<p className="text-sm text-slate-700 mt-1">{q.explanation}</p><Btn className="w-full mt-4" onClick={next}>{ok?'Continuar':'Entendi'}</Btn></Card>}
 </div>;}
