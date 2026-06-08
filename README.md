# Totus — Gestor de Obrigações

Sistema de gestão de obrigações gerenciais da Totus Contabilidade e Gestão Empresarial.

---

## 🚀 Como publicar no Vercel (passo a passo)

### 1. Criar conta no GitHub (se não tiver)
- Acesse: https://github.com
- Clique em "Sign up" e crie sua conta gratuita

### 2. Criar repositório no GitHub
- Após entrar, clique no botão **"+"** no canto superior direito
- Clique em **"New repository"**
- Nome: `totus-agenda`
- Deixe como **Public**
- Clique em **"Create repository"**

### 3. Subir os arquivos
Na página do repositório criado, clique em **"uploading an existing file"** e faça upload de todos os arquivos desta pasta mantendo a estrutura:

```
totus-agenda/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── manifest.json
└── src/
    ├── main.jsx
    └── App.jsx
```

### 4. Publicar no Vercel
- Acesse: https://vercel.com
- Clique em **"Sign up"** e entre com sua conta do GitHub
- Clique em **"Add New Project"**
- Selecione o repositório **totus-agenda**
- Clique em **"Deploy"** — o Vercel detecta automaticamente que é um projeto Vite/React
- Em 2 minutos seu app estará no ar com um link tipo: `totus-agenda.vercel.app`

### 5. Adicionar à tela inicial do iPad
- Abra o link no **Safari** do iPad
- Toque no ícone de **Compartilhar** (quadrado com seta para cima)
- Toque em **"Adicionar à Tela de Início"**
- O app abrirá sem barra do navegador, como um app nativo ✅

---

## 📱 Compatibilidade
- ✅ iPad / iPhone (Safari)
- ✅ Android (Chrome)
- ✅ Desktop (qualquer navegador)

## 💾 Dados
Os dados são salvos localmente no navegador (localStorage).
Para sincronizar entre dispositivos, será necessário implementar uma integração com banco de dados em uma próxima versão.

---

*Totus Contabilidade e Gestão Empresarial Ltda — CRC/CE: 003220/O-0*
