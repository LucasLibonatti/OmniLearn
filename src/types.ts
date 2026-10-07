// Contratos de dados: substitua os mocks por Supabase/Gemini mantendo estes tipos.
export type QType='multiple'|'tf'|'fill'|'match'|'short';
export interface Question{id:string;type:QType;topic:string;prompt:string;options?:string[];answer:string;accept?:string[];pairs?:[string,string][];explanation:string}
export interface Subject{id:string;name:string;topic:string;progress:number;last:string;questions:number;streak:number;tone:string}
export interface Material{id:string;name:string;pages:number;status:'ready'|'processing'}
export interface StudySession{id:string;subjectId:string;minutes:number;questions:Question[]}
export interface UserProgress{name:string;xp:number;level:number;streak:number;answered:number;accuracy:number;mastery:number}
export interface Achievement{id:string;icon:string;title:string;desc:string;unlocked:boolean}
export interface SessionResult{correct:number;total:number;xp:number;misses:Record<string,number>}
