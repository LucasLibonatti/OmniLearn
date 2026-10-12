import { Link } from 'react-router-dom';
import { Btn, Card, Logo } from './ui';

function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="max-w-3xl mx-auto flex items-center justify-between p-5">
        <Logo />
        <Btn v="s" to="/">
          Voltar
        </Btn>
      </header>
      <main className="max-w-3xl mx-auto px-5 pb-20 fade">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">Última atualização: {updated}</p>
        <Card className="mt-6 space-y-5 leading-relaxed">{children}</Card>
        <p className="text-xs text-slate-400 mt-4">
          Este texto é um modelo simplificado e não constitui aconselhamento jurídico. Revise com um profissional antes de
          usar em produção.
        </p>
      </main>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="font-bold text-lg pt-2">{children}</h2>;

export function Guidelines() {
  return (
    <LegalShell title="Diretrizes e Termos de Uso" updated="hoje">
      <p>
        Bem-vindo ao <strong>OmniLearn</strong>. Ao criar uma conta e usar o serviço, você concorda com as regras abaixo.
        Escrevemos tudo em linguagem simples para facilitar.
      </p>

      <H>Sobre o serviço</H>
      <p>
        O OmniLearn é uma ferramenta de estudos que usa inteligência artificial para transformar os materiais que você
        envia (PDF ou PPTX) em perguntas e exercícios de revisão. É um apoio ao estudo, não substitui professores, livros,
        cursos ou orientação profissional.
      </p>

      <H>Uso aceitável</H>
      <ul className="list-disc pl-5 space-y-1">
        <li>Você é responsável pelo conteúdo que envia e por ter o direito de usá-lo.</li>
        <li>Não envie dados pessoais sensíveis de terceiros nem conteúdo ilegal, ofensivo ou protegido por direitos autorais sem autorização.</li>
        <li>Não é permitido tentar burlar limites de uso, automatizar acessos de forma abusiva ou explorar falhas do sistema.</li>
        <li>A conta é pessoal. Não compartilhe suas credenciais.</li>
      </ul>

      <H>Conteúdo gerado por IA</H>
      <p>
        As questões, respostas e explicações são geradas automaticamente por IA e <strong>podem conter erros</strong>.
        Nós não garantimos que estejam corretas, completas ou atualizadas. Confira sempre com seu material de estudo e
        use o bom senso. Este é um apoio ao estudo; verifique informações importantes.
      </p>

      <H>Isenção de responsabilidade</H>
      <p>
        O OmniLearn é fornecido "como está", sem garantias de qualquer tipo. Não nos responsabilizamos por decisões,
        resultados acadêmicos, notas, aprovações ou quaisquer danos decorrentes do uso indevido do conteúdo gerado ou
        das informações exibidas. O índice de "domínio estimado" e as estatísticas são estimativas e{' '}
        <strong>não representam uma probabilidade real de aprovação</strong>.
      </p>

      <H>Privacidade e seus dados</H>
      <p>
        Guardamos apenas o necessário para o funcionamento do serviço: seus dados de conta, os materiais enviados, as
        questões geradas e seu histórico de respostas. Usamos provedores de nuvem e um serviço de IA para processar o
        conteúdo. Você pode excluir sua conta a qualquer momento na página de perfil, o que remove seus dados e arquivos.
      </p>

      <H>Propriedade dos materiais</H>
      <p>
        Os direitos sobre os arquivos que você envia continuam sendo seus. Ao enviar, você nos autoriza a processá-los
        apenas para gerar as questões e operar o serviço.
      </p>

      <H>Alterações e contato</H>
      <p>
        Podemos atualizar estas diretrizes de tempos em tempos. Se tiver dúvidas, entre em contato pelo e-mail de suporte
        do projeto.
      </p>
    </LegalShell>
  );
}

export function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-5">
      <div className="max-w-md w-full text-center fade">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="p-8">
          <p className="text-6xl font-extrabold text-indigo-600">404</p>
          <h1 className="text-2xl font-extrabold mt-2">Página não encontrada</h1>
          <p className="text-slate-600 mt-2">
            O link que você abriu não existe ou foi movido. Confira o endereço ou volte para o início.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Btn to="/dashboard">Ir para o painel</Btn>
            <Btn v="s" to="/">
              Página inicial
            </Btn>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Precisa de ajuda? Veja as <Link className="font-semibold text-indigo-600" to="/diretrizes">diretrizes</Link>.
          </p>
        </Card>
      </div>
    </div>
  );
}
