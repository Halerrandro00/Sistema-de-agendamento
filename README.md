# Sistema de Agendamento Médico

**Dupla:** [Nome da Dupla]  
**Projeto:** Sistema de Agendamento Médico  
**Tecnologias:** Node.js, Next.js, Supabase, HTML, CSS, JavaScript, Jest

## Descrição

Backend para uma clínica médica que permite marcação e gerenciamento de consultas com três tipos de usuários: Admin, Médico e Paciente.

## Funcionalidades

### Tipos de Usuários

- **Admin**: Gerencia médicos e usuários
- **Médico**: Visualiza e gerencia suas consultas
- **Paciente**: Agenda, remarca ou cancela consultas

### Recursos Principais

- ✅ Agenda de horários disponível por médico
- ✅ Histórico de consultas
- ✅ Upload de receitas e documentos (simulado)
- ✅ Sistema de notificações (log interno)
- ✅ Dois tipos de autenticação (Email/Senha + OAuth Google)
- ✅ Autorização baseada em permissões
- ✅ Validação de dados completa
- ✅ TDD com Jest
- ✅ API RESTful

## Requisitos Atendidos

### ✅ Requisitos Obrigatórios

- **Node.js no backend**: Implementado com Next.js App Router
- **Dois tipos diferentes de autenticação**: 
  - Email/senha via Supabase Auth
  - OAuth Google via Supabase Auth
- **Três tipos de usuários**: Admin, Médico, Paciente
- **Autorização baseada em regras**: Sistema de permissões por tipo de usuário
- **Validação de dados**: express-validator equivalente implementado
- **TDD com Jest**: Testes unitários completos
- **Conexão com banco de dados**: Supabase (PostgreSQL)
- **API RESTful**: Endpoints REST para todas as funcionalidades

## Tecnologias Utilizadas

### Backend
- **Next.js 14** - Framework React com App Router
- **Supabase** - Backend as a Service (PostgreSQL + Auth + Storage)
- **TypeScript** - Tipagem estática
- **Jest** - Framework de testes

### Frontend
- **HTML5** - Estrutura das páginas
- **CSS3** - Estilização responsiva
- **JavaScript ES6+** - Lógica do frontend
- **Fetch API** - Comunicação com a API

### Banco de Dados
- **PostgreSQL** (via Supabase)
- **Row Level Security (RLS)** - Segurança a nível de linha
- **Triggers e Functions** - Automação de timestamps

## Estrutura do Projeto

\`\`\`
medical-appointment-system/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   ├── appointments/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── doctors/route.ts
│   └── layout.tsx
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── validation.ts
│   └── permissions.ts
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── scripts/
│   └── database-setup.sql
├── __tests__/
│   ├── auth.test.js
│   ├── appointments.test.js
│   ├── validation.test.js
│   └── permissions.test.js
├── package.json
├── jest.setup.js
└── README.md
\`\`\`

## Configuração e Instalação

### 1. Pré-requisitos

- Node.js >= 18.0.0
- Conta no Supabase
- Git

### 2. Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Execute o script SQL em `scripts/database-setup.sql` no SQL Editor
3. Configure as variáveis de ambiente (veja seção abaixo)
4. Configure OAuth Google nas configurações de Auth (opcional)

### 3. Instalação

\`\`\`bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]
cd medical-appointment-system

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas credenciais do Supabase
\`\`\`

### 4. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
\`\`\`

### 5. Executar o Projeto

\`\`\`bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

# Testes
npm test

# Testes com coverage
npm run test:coverage
\`\`\`

## API Endpoints

### Autenticação

- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/register` - Registro de usuário

### Consultas

- `GET /api/appointments` - Listar consultas
- `POST /api/appointments` - Criar consulta
- `PUT /api/appointments/[id]` - Atualizar consulta
- `DELETE /api/appointments/[id]` - Cancelar consulta

### Médicos

- `GET /api/doctors` - Listar médicos

## Sistema de Permissões

### Admin
- Gerenciar usuários (CRUD)
- Gerenciar médicos (CRUD)
- Visualizar todas as consultas
- Cancelar/reagendar consultas

### Médico
- Visualizar suas consultas
- Atualizar status das consultas
- Visualizar dados dos pacientes
- Criar/visualizar documentos

### Paciente
- Agendar consultas
- Visualizar suas consultas
- Cancelar/reagendar suas consultas
- Visualizar lista de médicos

## Testes

O projeto implementa TDD com Jest, incluindo:

- **Testes de Autenticação**: Login, registro, validações
- **Testes de Consultas**: CRUD, permissões, validações
- **Testes de Validação**: Email, senha, CRM, telefone
- **Testes de Permissões**: Controle de acesso por tipo de usuário

\`\`\`bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Gerar relatório de coverage
npm run test:coverage
\`\`\`

## Validações Implementadas

- **Email**: Formato válido obrigatório
- **Senha**: Mínimo 6 caracteres
- **CRM**: Formato brasileiro (123456/UF)
- **Telefone**: Formato brasileiro (11) 99999-9999
- **Datas**: Consultas apenas em datas futuras
- **Horários**: Verificação de disponibilidade

## Segurança

- **Row Level Security (RLS)** no Supabase
- **Autenticação JWT** via Supabase Auth
- **Validação de permissões** em todos os endpoints
- **Sanitização de dados** de entrada
- **Variáveis de ambiente** para credenciais sensíveis

## Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. Deploy automático a cada push

### Outras Plataformas

- **Heroku**: Suporte nativo ao Node.js
- **Railway**: Deploy simples com GitHub
- **Netlify**: Para aplicações full-stack
- **AWS/GCP/Azure**: Para deploy em cloud

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Contato

- **Desenvolvedor 1**: [email1@exemplo.com]
- **Desenvolvedor 2**: [email2@exemplo.com]
- **Repositório**: [URL_DO_REPOSITORIO]
- **Demo**: [URL_DA_DEMO]
