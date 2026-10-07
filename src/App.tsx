import {useState} from 'react';import {Navigate,Route,Routes} from 'react-router-dom';
import {Ctx} from './ui';import {user as u0} from './data';import type {SessionResult} from './types';
import {Landing,Auth} from './pages_public';import Session from './Session';
import {Layout,Dashboard,Subjects,SubjectPage,NewSubject,Configure,Result,Review,Stats,Achievements,Profile} from './pages_app';
export default function App(){const [user,setUser]=useState(u0);const [last,setLast]=useState<SessionResult|null>(null);
 const finish=(r:SessionResult)=>{setLast(r);setUser(x=>({...x,xp:x.xp+r.xp,answered:x.answered+r.total}));};
 return <Ctx.Provider value={{user,last,finish}}><Routes>
 <Route path="/" element={<Landing/>}/><Route path="/login" element={<Auth mode="login"/>}/><Route path="/cadastro" element={<Auth mode="signup"/>}/>
 <Route path="/sessao/:id" element={<Session/>}/>
 <Route element={<Layout/>}><Route path="/dashboard" element={<Dashboard/>}/><Route path="/materias" element={<Subjects/>}/><Route path="/materias/nova" element={<NewSubject/>}/><Route path="/materias/:id" element={<SubjectPage/>}/>
 <Route path="/sessao/configurar" element={<Configure/>}/><Route path="/resultado" element={<Result/>}/><Route path="/revisao" element={<Review/>}/><Route path="/estatisticas" element={<Stats/>}/><Route path="/conquistas" element={<Achievements/>}/><Route path="/perfil" element={<Profile/>}/></Route>
 <Route path="*" element={<Navigate to="/"/>}/></Routes></Ctx.Provider>;}
