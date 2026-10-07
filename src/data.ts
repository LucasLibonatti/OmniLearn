import type {Achievement,Question,Subject,UserProgress} from './types';
// Dados mockados. Pipeline futuro: upload → extração → Gemini → banco de questões → sessão → análise de erros → próxima sessão.
export const user:UserProgress={name:'Lucas Martins',xp:850,level:12,streak:12,answered:245,accuracy:82,mastery:82};
export const subjects:Subject[]=[
{id:'historia',name:'História',topic:'Revolução Francesa',progress:82,last:'Hoje',questions:18,streak:12,tone:'bg-amber-100 text-amber-700'},
{id:'matematica',name:'Matemática',topic:'Funções',progress:67,last:'Ontem',questions:24,streak:5,tone:'bg-sky-100 text-sky-700'},
{id:'biologia',name:'Biologia',topic:'Genética',progress:91,last:'Hoje',questions:30,streak:9,tone:'bg-emerald-100 text-emerald-700'},
{id:'fisica',name:'Física',topic:'Cinemática',progress:58,last:'Há 3 dias',questions:15,streak:3,tone:'bg-violet-100 text-violet-700'}];
export const weak=[{topic:'Estados Gerais',wrong:3,of:5,level:'Precisa revisar',dot:'🔴'},{topic:'Constituição de 1791',wrong:2,of:4,level:'Em desenvolvimento',dot:'🟠'},{topic:'Iluminismo',wrong:1,of:5,level:'Quase lá',dot:'🟡'}];
export const weekly=[['Seg',72],['Ter',75],['Qua',68],['Qui',81],['Sex',79],['Sáb',84],['Dom',82]] as [string,number][];
export const achievements:Achievement[]=[
{id:'1',icon:'🏆',title:'Primeira sessão',desc:'Complete sua primeira sessão.',unlocked:true},
{id:'2',icon:'🔥',title:'Semana perfeita',desc:'Estude 7 dias seguidos.',unlocked:true},
{id:'3',icon:'📚',title:'100 questões',desc:'Responda 100 questões.',unlocked:true},
{id:'4',icon:'🧠',title:'Mestre da matéria',desc:'Alcance 90% de domínio.',unlocked:false},
{id:'5',icon:'⚡',title:'Consistente',desc:'Estude por 30 dias.',unlocked:false}];
export const questions:Question[]=[
{id:'q1',type:'multiple',topic:'Revolução Francesa',prompt:'Qual acontecimento é considerado um dos principais marcos do início da Revolução Francesa?',options:['Congresso de Viena','Queda da Bastilha','Revolução Industrial','Guerra dos Sete Anos'],answer:'Queda da Bastilha',explanation:'A Queda da Bastilha, em 1789, tornou-se um dos símbolos do início da Revolução Francesa.'},
{id:'q2',type:'tf',topic:'Estados Gerais',prompt:'Os Estados Gerais foram convocados por Luís XVI em 1789.',options:['Verdadeiro','Falso'],answer:'Verdadeiro',explanation:'Com a crise financeira, Luís XVI convocou os Estados Gerais pela primeira vez desde 1614.'},
{id:'q3',type:'fill',topic:'Revolução Francesa',prompt:'A Declaração dos Direitos do Homem e do ____ foi aprovada em 1789.',options:['Cidadão','Rei','Clero','Povo'],answer:'Cidadão',explanation:'O documento afirmou liberdade, igualdade e direitos naturais.'},
{id:'q4',type:'match',topic:'Iluminismo',prompt:'Associe cada pensador à sua ideia principal.',pairs:[['Montesquieu','Separação dos poderes'],['Rousseau','Contrato social'],['Voltaire','Tolerância e liberdade']],answer:'',explanation:'São três referências centrais do Iluminismo que inspiraram os revolucionários.'},
{id:'q5',type:'short',topic:'Estados Gerais',prompt:'Qual grupo social formava a imensa maioria da população francesa e tinha só um voto por estado?',accept:['terceiro estado','terceiro'],answer:'Terceiro Estado',explanation:'O Terceiro Estado (burguesia, camponeses e trabalhadores) era a maioria, mas votava por estado, não por cabeça.'},
{id:'q6',type:'multiple',topic:'Constituição de 1791',prompt:'Qual regime a Constituição de 1791 estabeleceu na França?',options:['República jacobina','Monarquia constitucional','Império','Absolutismo'],answer:'Monarquia constitucional',explanation:'O rei foi mantido, mas com poderes limitados por uma constituição.'},
{id:'q7',type:'tf',topic:'Constituição de 1791',prompt:'A Constituição de 1791 aboliu a monarquia.',options:['Verdadeiro','Falso'],answer:'Falso',explanation:'A monarquia só caiu em 1792, com a proclamação da República.'},
{id:'q8',type:'multiple',topic:'Estados Gerais',prompt:'Quantos estados compunham os Estados Gerais?',options:['Dois','Três','Quatro','Cinco'],answer:'Três',explanation:'Clero (1º), nobreza (2º) e povo (3º).'}];
