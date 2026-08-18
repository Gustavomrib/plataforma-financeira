# Plataforma Financeira

## Descrição

Aplicação full-stack para controle financeiro pessoal com autenticação de usuários, registro de receitas e despesas, resumo financeiro e dashboard web.

## Objetivo

Entregar um MVP funcional de gestão financeira pessoal, com foco em segurança básica, persistência em banco PostgreSQL e fluxo real de uso em backend + frontend.

## Funcionalidades

- cadastro e login de usuários;
- autenticação com JWT;
- proteção de rotas privadas;
- CRUD de transações;
- separação por usuário autenticado;
- resumo financeiro com receitas, despesas e saldo;
- integração frontend/backend;
- persistência em banco PostgreSQL.

## Tecnologias

- Backend: Node.js + Express
- Banco de dados: PostgreSQL
- ORM: Prisma
- Frontend: React + Vite
- Segurança: bcrypt + JWT

## Estrutura do projeto

- backend/: API, Prisma, middlewares e autenticação
- backend/src/controllers/: controladores de autenticação e transações
- backend/src/middlewares/: autenticação JWT
- backend/src/routes/: rotas públicas e privadas
- backend/prisma/: schema e migrações do banco
- frontend/: aplicação React para uso do usuário

## Pré-requisitos

- Node.js 18+
- PostgreSQL instalado e em execução
- Banco local criado com o nome `plataforma_financeira`
- acesso de usuário com permissão para criar banco e tabelas

## Configuração do PostgreSQL

Crie o banco local:

```sql
CREATE DATABASE plataforma_financeira;
```

Ajuste a string de conexão no arquivo `.env` do backend:

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/plataforma_financeira?schema=public"
JWT_SECRET="troque_por_uma_chave_segura"
PORT=3000
```

O projeto usa o arquivo `.env.example` como base.

## Instalação do backend

```bash
cd backend
npm install
```

## Instalação do frontend

```bash
cd ../frontend
npm install
```

## Variáveis de ambiente

Crie o arquivo `backend/.env` a partir de `backend/.env.example`.

Exemplo:

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/plataforma_financeira?schema=public"
JWT_SECRET="troque_por_uma_chave_segura"
PORT=3000
```

## Prisma

Gere o cliente do Prisma:

```bash
cd backend
npx prisma generate
```

Rode as migrações:

```bash
npx prisma migrate dev
```

Ou em ambiente já preparado:

```bash
npx prisma migrate deploy
```

Validação do schema:

```bash
npx prisma validate
```

## Como iniciar o backend

```bash
cd backend
npm run dev
```

O servidor fica disponível em:

```text
http://localhost:3000
```

## Como iniciar o frontend

```bash
cd frontend
npm run dev
```

## Modelos do banco

### User

- id: Int @id @default(autoincrement())
- name: String
- email: String @unique
- password: String
- createdAt: DateTime @default(now())
- transactions: Transaction[]

### Transaction

- id: Int @id @default(autoincrement())
- description: String
- amount: Decimal
- type: INCOME | EXPENSE
- date: DateTime
- createdAt: DateTime @default(now())
- userId: Int
- user: User

### Relacionamento

O relacionamento é `User 1:N Transaction`, em que cada transação pertence a um único usuário e cada usuário pode ter várias transações.

## Principais endpoints da API

### Autenticação

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Transações

- `POST /transactions`
- `GET /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`
- `GET /transactions/summary`

## Autenticação

A autenticação é feita com JWT. O backend verifica o token no header `Authorization: Bearer <token>`, busca o usuário correspondente e usa o `req.user.id` para garantir que cada operação tenha escopo restrito ao usuário autenticado.

## Executando o projeto localmente

1. Criar o banco PostgreSQL.
2. Configurar `backend/.env`.
3. Instalar dependências do backend.
4. Executar `npx prisma generate`.
5. Executar `npx prisma migrate dev`.
6. Iniciar backend.
7. Instalar dependências do frontend.
8. Iniciar frontend.
9. Registrar usuário, fazer login e usar o dashboard.

## Observações

- Senhas são armazenadas com hash via bcrypt.
- A API não retorna a senha do usuário.
- O frontend envia o token em requisições autenticadas.
- As transações são filtradas pelo usuário autenticado.
