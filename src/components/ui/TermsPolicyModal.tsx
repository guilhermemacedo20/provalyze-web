"use client";

import { X } from "lucide-react";

type Section = "terms" | "privacy";

type Block =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] };

type TermsPolicyModalProps = {
  open: boolean;
  section: Section;
  onSectionChange: (section: Section) => void;
  onClose: () => void;
};

const PRIVACY_BLOCKS: Block[] = [
  { type: "heading", text: "1. Identificação do responsável pelo tratamento" },
  {
    type: "paragraph",
    text: "Esta Política de Privacidade é aplicável ao sistema Provalyze, operado por: Guilherme Aires Pimenta de Macedo e Mariana da Rocha Pereira Moreira. Contato: provalyze@gmail.com",
  },
  {
    type: "paragraph",
    text: "Na implantação, o controlador será a instituição de ensino que adotar a plataforma.",
  },

  { type: "heading", text: "2. Dados pessoais tratados" },
  { type: "subheading", text: "Dados cadastrais e de autenticação:" },
  {
    type: "bullets",
    items: [
      "Nome completo, e-mail institucional, senha (armazenada apenas em formato criptografado) e perfil de acesso são necessários para identificar o usuário e controlar o que pode ser acessado no sistema.",
    ],
  },
  { type: "subheading", text: "Dados de sessão:" },
  {
    type: "bullets",
    items: [
      "Token de autenticação (JWT), armazenado no navegador do próprio usuário, necessário para manter a pessoa conectada sem exigir login a cada página.",
      "Código numérico temporário (também armazenado de forma criptografada no banco de dados), gerado apenas durante um pedido de redefinição de senha e com validade curta de 10 minutos, necessário para confirmar que quem está redefinindo a senha é o dono da conta.",
    ],
  },
  { type: "subheading", text: "Dados acadêmicos:" },
  {
    type: "bullets",
    items: [
      "Vínculo entre usuário e turma, necessário para organizar quem participa de qual turma.",
      "Temas e questões cadastrados por professores, necessário para o funcionamento do banco de questões.",
    ],
  },
  { type: "subheading", text: "Dados de avaliações:" },
  {
    type: "bullets",
    items: [
      "Respostas do aluno, nota, status de correção e eventos técnicos ocorridos durante a prova, necessário para apoiar a correção e a integridade da avaliação.",
    ],
  },

  { type: "heading", text: "3. Finalidade do uso de dados e hipóteses legais" },
  {
    type: "paragraph",
    text: "Não usamos os dados coletados para fins de publicidade, venda a terceiros ou qualquer finalidade fora do funcionamento do próprio sistema.",
  },

  { type: "heading", text: "4. Base legal (LGPD)" },
  {
    type: "paragraph",
    text: "O tratamento de dados cadastrais e acadêmicos é necessário para a execução do serviço solicitado pelo próprio usuário ao criar uma conta e usar a plataforma (art. 7º, V, da LGPD - execução de contrato ou procedimentos preliminares).",
  },
  {
    type: "paragraph",
    text: "O tratamento de dados voltados à segurança do sistema se apoia no legítimo interesse do responsável em proteger a plataforma e seus usuários (art. 7º, IX). Nesse caso:",
  },
  {
    type: "bullets",
    items: [
      "Finalidade legítima: prevenir acessos indevidos e proteger as contas dos usuários.",
      "Necessidade: não há forma de proteger o sistema sem registrar, de alguma forma, tentativas de acesso.",
      "Expectativa razoável do titular: qualquer usuário de um sistema com login espera que ele tenha proteções básicas de segurança.",
      "Riscos e salvaguardas: o risco é o registro reter mais dado do que o necessário; a salvaguarda é registrar apenas o mínimo, sem dados sensíveis.",
      "Oposição: o titular pode questionar esse tratamento pelo canal de comunicação informado, mas, por se tratar de proteção da própria conta, a oposição pode não ser acolhida quando comprometer a segurança do sistema.",
    ],
  },

  { type: "heading", text: "5. Uso de inteligência artificial no sistema" },
  {
    type: "paragraph",
    text: "O Provalyze utiliza inteligência artificial (Gemini, da Google) em duas frentes. Na correção de provas, para questões dissertativas, a resposta escrita pelo aluno é enviada ao serviço que sugere uma nota e uma justificativa, essa sugestão nunca é definitiva por si só, sendo sempre submetida à revisão e aprovação do professor responsável antes de valer como nota final. Na análise de desempenho, a IA também é usada para identificar lacunas de aprendizagem por tema e gerar recomendações pedagógicas para o professor, além de recomendações personalizadas de estudo para o próprio aluno após concluir uma prova, nesse caso, com base em dados agregados de desempenho (acertos e erros por tema), não no conteúdo literal das respostas dissertativas.",
  },

  { type: "heading", text: "6. Com quem compartilhamos os dados" },
  {
    type: "paragraph",
    text: "Hoje, o Provalyze compartilha dados com os fornecedores abaixo, cada um atuando como operador apenas para a finalidade específica indicada:",
  },
  {
    type: "bullets",
    items: [
      "Gemini (Google): recebe a resposta do aluno em questões dissertativas, para sugerir nota e justificativa.",
      "Resend: recebe o e-mail do usuário e o código de redefinição de senha, para envio da mensagem de recuperação de conta.",
      "Vercel: hospeda o front-end da aplicação.",
      "Railway: hospeda o back-end e o banco de dados, processando todos os dados do sistema e variáveis utilizadas.",
      "Cloudflare: atua como camada de cache e proteção contra ataques (DDoS) entre o usuário e o front-end. Não retém dados pessoais além do tráfego que passa por ele, apenas cacheia as páginas exibidas no front-end.",
    ],
  },
  {
    type: "paragraph",
    text: "Dentro da própria instituição, os dados acadêmicos de um aluno ficam visíveis apenas a ele mesmo, aos professores responsáveis por suas turmas e à administração/coordenação.",
  },

  { type: "heading", text: "7. Transferência internacional de dados" },
  {
    type: "paragraph",
    text: "Os fornecedores listados processam dados em servidores que podem estar localizados fora do Brasil. Isso caracteriza transferência internacional de dados, permitida pela LGPD desde que existam salvaguardas adequadas (art. 33), como cláusulas contratuais específicas ou adesão a padrões reconhecidos de proteção de dados.",
  },
  {
    type: "bullets",
    items: [
      "Gemini (Google): processamento global por padrão. Google possui certificação no EU-U.S. Data Privacy Framework e usa Cláusulas Contratuais Padrão (SCCs) como salvaguarda.",
      "Resend: dados armazenados nos Estados Unidos. Salvaguarda: DPA nos termos do art. 28 da GDPR, com SCCs e certificação no EU-U.S. Data Privacy Framework (incluindo extensão UK).",
      "Vercel: processamento distribuído globalmente, incluindo os Estados Unidos. Salvaguarda: DPA com SCCs (UE) e UK Addendum, além de certificação no Data Privacy Framework.",
      "Cloudflare: empresa sediada nos Estados Unidos. Salvaguarda: DPA próprio, apoiado no EU-U.S. Data Privacy Framework e, subsidiariamente, em SCCs, utilizando servidores ao redor do mundo.",
      "Railway: utilizamos a base do servidor nos Estados Unidos. A empresa oferece DPA compatível com a GDPR, referenciando SCCs/Data Privacy Framework conforme aplicável.",
    ],
  },

  { type: "heading", text: "8. Como protegemos os dados" },
  {
    type: "bullets",
    items: [
      "Senhas nunca são armazenadas em texto puro, apenas seu hash criptográfico.",
      "O acesso às funcionalidades do sistema exige autenticação por token e cada perfil só acessa o que sua função permite, essa verificação é feita no servidor, não apenas escondendo botões na tela.",
      "Ao excluir uma conta, os dados pessoais identificáveis são substituídos por valores genéricos e o histórico acadêmico associado permanece no sistema, mas sem identificar a pessoa (anonimização).",
    ],
  },
  {
    type: "paragraph",
    text: "Nenhum sistema digital está livre de falhas ou vulnerabilidades. Adotamos medidas técnicas e organizacionais razoáveis para reduzir riscos, mas não garantimos segurança absoluta.",
  },

  { type: "heading", text: "9. Resposta a incidentes de segurança" },
  {
    type: "paragraph",
    text: "Em caso de incidente de segurança envolvendo dados pessoais, seguimos o processo abaixo, baseado no que a Resolução CD/ANPD nº 15/2024 (Regulamento de Comunicação de Incidente de Segurança) exige:",
  },
  {
    type: "bullets",
    items: [
      "Detectar e confirmar o incidente.",
      "Conter o problema e preservar evidências.",
      "Identificar quais dados e quais titulares foram afetados.",
      "Avaliar se há risco relevante aos titulares, critério esse da LGPD que define se a comunicação é obrigatória. Essa avaliação considera: a categoria do dado afetado, quantos titulares foram afetados, se houve acesso/uso efetivo indevido dos dados ou apenas exposição potencial, e se havia proteção técnica ativa sobre o dado no momento do incidente.",
      "Quando a avaliação indicar risco ou dano relevante, a ANPD e os titulares afetados são comunicados por e-mail no prazo de 3 dias úteis a partir do momento em que tomamos conhecimento de que o incidente afetou dados pessoais (art. 6º da Resolução CD/ANPD nº 15/2024). A comunicação pode ser feita de forma preliminar dentro desse prazo, caso a extensão total do incidente ainda esteja sendo apurada, e complementada em até 20 dias úteis depois.",
      "Corrigir a causa do incidente e registrar as medidas tomadas. Mantemos registro de todo incidente de segurança por pelo menos 5 anos.",
    ],
  },

  { type: "heading", text: "10. Retenção e exclusão" },
  {
    type: "bullets",
    items: [
      "Enquanto a conta estiver ativa, os dados são mantidos para permitir o uso normal do sistema.",
      "Ao solicitar a exclusão da conta, o nome e o e-mail são anonimizados. O histórico de turmas, alunos e, quando aplicável, de avaliações permanece registrado de forma anônima por um prazo de 5 anos, seguindo o padrão das instituições de ensino brasileiras, podendo ser revogado por término de contrato, para preservar a integridade dos dados acadêmicos da turma como um todo.",
    ],
  },

  { type: "heading", text: "11. Seus direitos como titular de dados" },
  { type: "paragraph", text: "Conforme a LGPD, você pode solicitar, a qualquer momento:" },
  {
    type: "bullets",
    items: [
      "Confirmação de que tratamos seus dados, e acesso a eles.",
      "Correção de dados incompletos, inexatos ou desatualizados.",
      "Anonimização, bloqueio ou eliminação de dados tratados de forma desnecessária ou excessiva.",
      "Portabilidade dos dados a outro fornecedor, quando tecnicamente aplicável.",
      "Informação sobre com quem seus dados são compartilhados.",
      "Revogação do consentimento, quando o tratamento se basear nele, e oposição a tratamentos baseados em legítimo interesse.",
      "Revisão, por uma pessoa, de decisões tomadas unicamente por tratamento automatizado, por exemplo, a sugestão de nota por inteligência artificial, que já prevê aprovação do professor antes de valer como nota final.",
    ],
  },
  {
    type: "paragraph",
    text: "Hoje, a exclusão/anonimização da conta pode ser feita diretamente pela tela de Configurações do sistema. Para os demais direitos, entre em contato pelo canal indicado.",
  },

  { type: "heading", text: "12. Cookies" },
  {
    type: "paragraph",
    text: "O Provalyze não usa cookies para guardar informações, apenas é enviado o token de autorização nas requisições ao back-end. A sessão do usuário é mantida por um token salvo no armazenamento local do próprio navegador (localStorage), que só é lido pelo próprio sistema para confirmar que o usuário está autenticado.",
  },

  { type: "heading", text: "13. Uso por menores de idade" },
  {
    type: "paragraph",
    text: "O Provalyze é destinado exclusivamente a instituições de ensino superior (faculdades e universidades), este é o público-alvo definido para o sistema, composto por pessoas maiores de idade. O sistema não foi desenhado para uso por instituições de ensino básico (crianças e adolescentes), e não implementa, portanto, os mecanismos de consentimento parental exigidos pelo art. 14 da LGPD para esse público, já que ele está fora do escopo do projeto.",
  },

  { type: "heading", text: "14. Alterações desta Política" },
  {
    type: "paragraph",
    text: "Esta Política pode ser atualizada conforme o sistema evoluir. Alterações relevantes serão comunicadas dentro do próprio sistema.",
  },

  { type: "heading", text: "15. Contato" },
  { type: "paragraph", text: "provalyze@gmail.com" },
  { type: "paragraph", text: "Versão de setembro de 2026." },
];

const TERMS_BLOCKS: Block[] = [
  { type: "heading", text: "1. Aceitação" },
  {
    type: "paragraph",
    text: "Ao criar uma conta ou usar o Provalyze, você concorda com estes Termos de Uso e com a Política de Privacidade. Se você não concordar com algum ponto, não deve utilizar a plataforma.",
  },

  { type: "heading", text: "2. O que é o Provalyze" },
  {
    type: "paragraph",
    text: "O Provalyze é uma plataforma educacional para organização de cursos, matérias e turmas, e para criação, aplicação, correção e acompanhamento de avaliações acadêmicas.",
  },

  { type: "heading", text: "3. Quem pode utilizar o sistema" },
  {
    type: "paragraph",
    text: "O uso do Provalyze é destinado a pessoas maiores de idade, matriculadas ou vinculadas a instituição de ensino superior.",
  },

  { type: "heading", text: "4. Cadastro e conta" },
  {
    type: "bullets",
    items: [
      "As informações fornecidas no cadastro (nome, e-mail, perfil) devem ser verdadeiras e mantidas atualizadas.",
      "Você é responsável por manter sua senha em sigilo e por todas as atividades realizadas com sua conta, realizamos apenas o processo de criptografia no banco de dados para preservar sua autenticidade e segurança.",
      "Em caso de esquecimento de senha, é possível solicitar redefinição pelo fluxo de recuperação disponível na tela de login, onde você receberá um e-mail com o seu código de acesso.",
      "Administradores e coordenadores podem criar contas para outros usuários (professores e alunos), que devem então definir sua própria senha no primeiro acesso.",
    ],
  },

  { type: "heading", text: "5. Perfis e permissões" },
  {
    type: "bullets",
    items: [
      "Administrador e Coordenador: gerenciam usuários, cursos, matérias e turmas da instituição.",
      "Professor: cria e gerencia suas turmas, temas e questões; aplica e corrige avaliações.",
      "Aluno: participa das turmas em que está matriculado e realiza as avaliações a ele atribuídas.",
    ],
  },
  {
    type: "paragraph",
    text: "Cada perfil deve utilizar apenas as funcionalidades liberadas para ele, não é permitido tentar acessar funcionalidades restritas a outro perfil, sendo bloqueado diretamente pelo back-end da aplicação.",
  },

  { type: "heading", text: "6. Uso das avaliações" },
  {
    type: "bullets",
    items: [
      "Professores são responsáveis pelo conteúdo das questões e provas que criam.",
      "Alunos devem responder às avaliações com suas próprias respostas.",
      "O sistema pode registrar eventos técnicos durante a realização de uma prova, com a finalidade de apoiar a integridade da avaliação de maneira generalizada, sem trazer dados do próprio usuário.",
    ],
  },

  { type: "heading", text: "7. Conteúdo inserido por você" },
  {
    type: "paragraph",
    text: "Você é responsável pelo conteúdo que cadastra no sistema. Ao inserir esse conteúdo, você declara possuir os direitos necessários sobre ele. É proibido inserir conteúdo ilegal, ofensivo ou que viole direitos de terceiros.",
  },

  { type: "heading", text: "8. Propriedade intelectual" },
  {
    type: "paragraph",
    text: 'O software, a interface, a identidade visual, a marca "Provalyze" e o código-fonte da plataforma pertencem aos seus desenvolvedores. O conteúdo que você insere (questões, respostas, materiais) continua sendo seu, você concede à plataforma apenas o direito necessário para armazená-lo e exibi-lo dentro do próprio sistema, para as pessoas autorizadas a vê-lo.',
  },

  { type: "heading", text: "9. Condutas proibidas" },
  {
    type: "bullets",
    items: [
      "Acessar ou tentar acessar áreas ou dados que não são destinados ao seu perfil.",
      "Tentar burlar mecanismos de autenticação ou segurança do sistema.",
      "Utilizar a plataforma para fraudar avaliações.",
      "Interferir no funcionamento normal da plataforma para outros usuários.",
    ],
  },

  { type: "heading", text: "10. Disponibilidade do serviço" },
  {
    type: "paragraph",
    text: "Por se tratar de um projeto acadêmico em desenvolvimento, o Provalyze pode passar por indisponibilidades, manutenções, atualizações e eventuais falhas técnicas. Não garantimos disponibilidade contínua e ininterrupta do sistema.",
  },

  { type: "heading", text: "11. Responsabilidades" },
  {
    type: "bullets",
    items: [
      "A plataforma é responsável por manter o sistema funcionando conforme descrito e por proteger os dados conforme a Política de Privacidade.",
      "Professores e administradores são responsáveis pela correção e adequação do conteúdo acadêmico que cadastram.",
      "Alunos são responsáveis pela veracidade de suas respostas e pelo uso adequado da conta.",
    ],
  },

  { type: "heading", text: "12. Limitação de responsabilidade" },
  {
    type: "paragraph",
    text: "Na máxima medida permitida pela legislação brasileira, a plataforma não se responsabiliza por danos indiretos decorrentes do uso do sistema, ressalvadas as hipóteses em que a responsabilidade não possa ser legalmente afastada.",
  },

  { type: "heading", text: "13. Suspensão e encerramento" },
  {
    type: "paragraph",
    text: "Uma conta pode ser suspensa ou encerrada em caso de uso indevido da plataforma, mediante decisão da administração/coordenação da instituição responsável. O encerramento de uma conta segue o mesmo processo de anonimização descrito na Política de Privacidade, podendo ser excluída totalmente caso não tenha dados relevantes gerados no sistema.",
  },

  { type: "heading", text: "14. Alterações destes Termos" },
  {
    type: "paragraph",
    text: "Estes Termos podem ser atualizados conforme o sistema evoluir. Alterações relevantes serão comunicadas dentro do próprio sistema.",
  },

  { type: "heading", text: "15. Lei aplicável" },
  { type: "paragraph", text: "Estes Termos são regidos pela legislação brasileira." },
  { type: "paragraph", text: "Versão de setembro de 2026." },
];

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "heading":
      return (
        <h3
          key={index}
          className="mb-2 mt-5 text-[13px] font-semibold text-foreground first:mt-0"
        >
          {block.text}
        </h3>
      );
    case "subheading":
      return (
        <p key={index} className="mb-1.5 mt-3 text-[12px] font-semibold text-foreground">
          {block.text}
        </p>
      );
    case "paragraph":
      return (
        <p key={index} className="mb-2 text-[13px] leading-relaxed text-muted">
          {block.text}
        </p>
      );
    case "bullets":
      return (
        <ul key={index} className="mb-2 flex flex-col gap-1.5">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2 text-[13px] leading-relaxed text-muted">
              <span className="shrink-0 text-primary">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export function TermsPolicyModal({
  open,
  section,
  onSectionChange,
  onClose,
}: TermsPolicyModalProps) {
  if (!open) return null;

  const blocks = section === "terms" ? TERMS_BLOCKS : PRIVACY_BLOCKS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="relative flex max-h-[85vh] w-full max-w-[640px] flex-col rounded-lg border border-border bg-surface p-8 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="mb-5 flex shrink-0 gap-1 rounded-md border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => onSectionChange("terms")}
            className={`flex-1 rounded-sm py-2 text-[13px] font-medium transition-colors ${
              section === "terms"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Termos de Uso
          </button>
          <button
            type="button"
            onClick={() => onSectionChange("privacy")}
            className={`flex-1 rounded-sm py-2 text-[13px] font-medium transition-colors ${
              section === "privacy"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Política de Privacidade
          </button>
        </div>

        <div className="overflow-y-auto pr-2">
          {blocks.map((block, index) => renderBlock(block, index))}
        </div>
      </div>
    </div>
  );
}