import {useNavigate,Link} from 'react-router-dom';import {Upload,Sparkles,Timer,TrendingUp} from 'lucide-react';import {Btn,Card,Logo} from './ui';
const steps=[[Upload,'Envie seus materiais','Adicione de 1 a 3 slides ou arquivos da matéria.'],[Sparkles,'A IA cria seu treino','Seu conteúdo é transformado em perguntas e exercícios.'],[Timer,'Estude por 15 minutos','Responda, aprenda com seus erros e evolua.'],[TrendingUp,'Acompanhe sua evolução','Veja seus pontos fortes, dificuldades e domínio estimado.']] as const;
const feats=[['🔥','Sequência diária'],['🧠','Revisão inteligente'],['📈','Evolução por assunto'],['🏆','XP e conquistas']];
export function Landing(){return <div className="min-h-screen">
<header className="max-w-6xl mx-auto flex items-center justify-between p-5"><Logo/><div className="flex gap-2"><Btn to="/login" v="s">Entrar</Btn><Btn to="/cadastro" className="hidden sm:inline-flex">Começar</Btn></div></header>
<section className="max-w-6xl mx-auto px-5 py-12 grid md:grid-cols-2 gap-12 items-center fade">
<div><h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">Estude melhor. <span className="text-indigo-600">Todos os dias.</span></h1>
<p className="mt-5 text-lg text-slate-600">Transforme seus slides e materiais em uma rotina de estudos inteligente de 15 minutos.</p>
<div className="mt-8 flex flex-wrap gap-3"><Btn to="/cadastro">Começar gratuitamente</Btn><a href="#como" className="inline-flex items-center rounded-2xl px-5 py-3 font-semibold border border-slate-200 bg-white hover:bg-slate-50">Ver como funciona</a></div></div>
<Card className="p-6 rotate-1 shadow-xl shadow-indigo-100"><div className="flex justify-between text-sm font-semibold text-slate-500"><span>História · Questão 7 de 18</span><span>🔥 12</span></div>
<div className="h-2 rounded-full bg-slate-100 mt-3"><div className="h-full w-2/5 rounded-full bg-indigo-600"/></div>
<p className="font-bold text-lg mt-5">Qual acontecimento marca o início da Revolução Francesa?</p>
<div className="mt-4 grid gap-2">{['Congresso de Viena','Queda da Bastilha','Revolução Industrial'].map((o,i)=><div key={o} className={`rounded-2xl border-2 px-4 py-3 font-medium ${i===1?'border-emerald-500 bg-emerald-50 text-emerald-800':'border-slate-100'}`}>{i===1?'✓ ':''}{o}</div>)}</div>
<p className="mt-4 text-center font-bold text-amber-500">+10 XP</p></Card></section>
<section id="como" className="max-w-6xl mx-auto px-5 py-16"><h2 className="text-3xl font-extrabold">Como funciona?</h2>
<div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{steps.map(([I,t,d],i)=><Card key={t}><span className="grid place-items-center w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600"><I size={22}/></span><p className="mt-4 text-xs font-bold text-slate-400">ETAPA {i+1}</p><h3 className="font-bold text-lg">{t}</h3><p className="text-slate-600 mt-1">{d}</p></Card>)}</div></section>
<section className="max-w-6xl mx-auto px-5 pb-20 grid grid-cols-2 md:grid-cols-4 gap-4">{feats.map(([e,t])=><Card key={t} className="text-center"><div className="text-3xl">{e}</div><p className="font-bold mt-2">{t}</p></Card>)}</section>
<footer className="text-center text-sm text-slate-500 pb-10">OmniLearn · Estude melhor. Todos os dias.</footer></div>;}
export function Auth({mode}:{mode:'login'|'signup'}){const nav=useNavigate();const l=mode==='login';
 const F=({t,label,type='text'}:{t:string;label:string;type?:string})=><label className="block"><span className="text-sm font-semibold">{label}</span><input id={t} type={type} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white"/></label>;
 return <div className="min-h-screen grid place-items-center p-5 bg-gradient-to-b from-indigo-50 to-white"><div className="w-full max-w-md fade"><div className="mb-6 flex justify-center"><Logo/></div>
<Card className="p-8"><h1 className="text-2xl font-extrabold">{l?'Bem-vindo de volta':'Comece sua jornada'}</h1>
<form className="mt-6 space-y-4" onSubmit={e=>{e.preventDefault();nav('/dashboard')}}>{!l&&<F t="n" label="Nome"/>}<F t="e" label="E-mail" type="email"/><F t="s" label="Senha" type="password"/>
<Btn className="w-full" onClick={()=>nav('/dashboard')}>{l?'Entrar':'Criar minha conta'}</Btn></form>
<Btn v="s" className="w-full mt-3" onClick={()=>nav('/dashboard')}>Continuar com Google</Btn>
<p className="mt-6 text-center text-sm text-slate-600">{l?<>Não possui uma conta? <Link className="font-semibold text-indigo-600" to="/cadastro">Criar conta</Link></>:<>Já tem conta? <Link className="font-semibold text-indigo-600" to="/login">Entrar</Link></>}</p></Card></div></div>;}
