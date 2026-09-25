<h1 align="center">Provalyze - Web</h1>

<p align="center">
  Front-end do Provalyze, plataforma de provas online, banco de questões e acompanhamento pedagógico.
</p>

## Sobre

Interface do professor, aluno e administrador para utilização da plataforma de maneira visual.

## Tecnologias e versões

Versões do repositório.

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 20+ | Runtime |
| Next.js | 15.5.23 | App Router, Turbopack |
| React | 19.1.0 | UI |
| TypeScript | 5.x | Tipagem |
| Tailwind CSS | 4.x | Estilização |
| ESLint | 9.x | Lint |
| lucide-react | 1.41.0 | Ícones do menu |

Chamadas HTTP: `src/services/api.ts`.

## Pré-requisitos

- Node.js 20+
- API rodando (`npm run start:dev` no `pfc-api`, em geral `http://localhost:3333`)

## Como rodar

```bash
npm install
```

Crie o `.env.local` na raiz:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

Variáveis com `NEXT_PUBLIC_`

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
  app/              # rotas (login, dashboard, questions, themes, …)
  components/       # shell, modal, forms
  config/           # menu por role
  lib/              # sessão e helpers
  services/         # cliente HTTP e serviços de domínio
public/             # logo e ícones
```

## Deploy (Vercel)

No projeto **web**, as envs do client precisam do prefixo:

- `NEXT_PUBLIC_API_URL` — URL pública da API, já com `/api`
