# Reobote Consórcios

Plataforma de consórcios inteligente, sem juros, para realização de objetivos pessoais e profissionais.

## Sobre o Projeto

Aplicação web moderna para apresentação dos serviços da Reobote Consórcios, incluindo:
- Simulador de consórcio
- Mapa interativo de unidades
- Integração com WhatsApp para atendimento rápido
- Design profissional e responsivo

## Tecnologias Utilizadas

- **Next.js 16** - Framework React
- **React 19** - Biblioteca de interfaces
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **Lucide React** - Ícones
- **React Simple Maps** - Mapa interativo
- **Class Variance Authority** - Variantes de componentes
- **Vercel Analytics** - Análise de métricas

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
pnpm install
```

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Inicia o servidor de desenvolvimento |
| `pnpm build` | Cria a build de produção |
| `pnpm start` | Inicia o servidor de produção |
| `pnpm lint` | Executa o ESLint para verificação de código |

## Configuração

Os dados de contato e unidades estão em `lib/site-config.ts` e `lib/units.ts`. Edite esses arquivos para configurar:
- Número do WhatsApp
- Telefone
- Email
- Endereço
- Redes sociais
- Unidades por estado

## Estrutura de Pastas

```
.
├── app/               # Páginas e layouts do Next.js App Router
├── components/
│   ├── site/         # Componentes específicos do site
│   └── ui/           # Componentes UI reutilizáveis
└── lib/              # Utilitários e configurações
```

## Licença

Projeto privado da Reobote Consórcios.
