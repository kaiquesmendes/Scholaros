# ScholarOS - Plataforma Acadêmica Inteligente 🎓

## 📚 Sobre o Projeto

ScholarOS é uma plataforma web moderna que combina rede social acadêmica, assistente de estudos com IA, ferramentas de produtividade e sistema inteligente de redação. Desenvolvida para universitários e estudantes do ENEM, a plataforma tem como objetivo melhorar o desempenho acadêmico sem tornar o estudo cansativo.

## ✨ Funcionalidades Principais

### 🎯 Dashboard Inteligente
- Progresso acadêmico em tempo real
- Matérias em andamento
- Metas diárias e produtividade semanal
- Radar de aprovação e nível de preparação

### ✍️ Editor de Redação com IA
- Correção ortográfica e gramatical
- Análise de argumentação e coerência
- Modo ENEM, Faculdade e TCC
- Feedback detalhado estilo professor

### 📄 Sistema de PDFs Inteligente
- Upload e processamento automático
- Resumos gerados por IA
- Flashcards e questões automáticas
- Mapas mentais e revisões rápidas

### 🧠 Mapa Cognitivo
- Análise visual de desempenho
- Identificação de dificuldades
- Métricas de retenção e produtividade
- Horários mais produtivos

### 👥 Rede Social Acadêmica
- Perfis acadêmicos completos
- Grupos e salas de estudo
- Compartilhamento de materiais
- Sistema de reputação e conquistas

### ⏰ Sistema Anti-Procrastinação
- Pausas inteligentes
- Micro-metas
- Reorganização automática de cronograma

## 🛠️ Tecnologias Utilizadas

### Frontend
- React.js 18
- TailwindCSS
- Framer Motion
- Recharts
- React Query
- Zustand

### Backend
- Node.js
- Express.js
- Firebase Admin
- OpenAI API

### Banco de Dados
- Firebase Firestore / Supabase

### Autenticação
- Firebase Auth (Google, GitHub, Email)

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 16+
- NPM ou Yarn
- Conta Firebase
- Chave da API OpenAI

### Configuração

1. Clone o repositório:
```bash
git clone https://github.com/yourusername/scholaros.git
cd scholaros

Instale as dependências do frontend:
cd frontend
npm install

Instale as dependências do backend:

cd ../backend
npm install

Configure as variáveis de ambiente:

Crie um arquivo .env no frontend:
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_API_URL=http://localhost:3001

Crie um arquivo .env no backend:

PORT=3001
OPENAI_API_KEY=your_openai_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

cd backend
npm run dev


cd frontend
npm start

📦 Deploy Gratuito
Frontend (Vercel)
Crie uma conta na Vercel

Conecte seu repositório GitHub

Configure as variáveis de ambiente

Deploy automático

Backend (Render)
Crie uma conta no Render

Conecte seu repositório

Configure o arquivo render.yaml ou deploy manual

Configure as variáveis de ambiente

Banco de Dados (Firebase)
Crie um projeto no Firebase

Ative Authentication e Firestore

Configure as regras de segurança

🎨 Design e UX
Interface moderna inspirada em Notion + Discord + Duolingo

Dark mode elegante

Animações suaves e responsivas

Design mobile-first

Feedback visual em todas as ações

🔮 Futuras Implementações
IA personalizada por usuário

Chamadas de vídeo e salas ao vivo

Sistema de gamificação avançada

Aplicativo mobile (React Native)

Integração com universidades

Sistema de voz para estudos

👥 Contribuição
Contribuições são bem-vindas! Leia o guia de contribuição antes de enviar pull requests.

📄 Licença
Este projeto está sob a licença MIT.

📧 Contato
Para dúvidas ou sugestões, entre em contato: contato@scholaros.com

Desenvolvido com ❤️ por [ScholarOS Team]


## Instruções de Deploy (deploy-instructions.md)

```markdown
# Instruções de Deploy - ScholarOS

## Deploy no Vercel (Frontend)

1. Crie uma conta em https://vercel.com
2. Instale o CLI da Vercel: `npm i -g vercel`
3. No diretório frontend: `vercel --prod`
4. Configure as variáveis de ambiente no painel da Vercel
5. O deploy será automático em pushes para main

## Deploy no Render (Backend)

1. Crie uma conta em https://render.com
2. Clique em "New +" > "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
   - Environment Variables: Adicione todas do .env

## Deploy do Firebase

1. Crie um projeto em https://console.firebase.google.com
2. Ative Authentication (Google, GitHub, Email)
3. Crie um Firestore Database
4. Regras de segurança do Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /documents/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
Configuração do OpenAI
Acesse https://platform.openai.com

Crie uma API Key

Adicione créditos (ou use modo gratuito)

Configure rate limits no backend

Monitoramento e Logs
Vercel Analytics para frontend

Render Logs para backend

Firebase Console para banco de dados

Sentry para erros (opcional)

Otimizações para Produção
Habilite compressão no Express

Use CDN para assets estáticos

Implemente caching com Redis (opcional)

Configure CORS corretamente

Use rate limiting para evitar abusos

text

Este projeto é uma base sólida e profissional para o ScholarOS. Ele inclui todas as funcionalidades principais solicitadas, com uma arquitetura limpa, componentes reutilizáveis e pronto para deploy gratuito. A plataforma é moderna, responsiva e utiliza as melhores práticas de desenvolvimento web.

Para expandir o projeto, você pode adicionar mais funcionalidades seguindo o mesmo padrão modular implementado.

