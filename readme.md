# HireMind AI · Treino de Entrevistas com IA

Aplicação web para treinar **entrevistas de emprego** usando uma IA baseada em **LLaMA 3**.  
O usuário configura a vaga (cargo, nível, área, estilo da entrevista), responde às perguntas em um chat e recebe **feedback estruturado + score** ao final da sessão.

> Projeto focado em portfólio para dev Jr: front moderno, integração com API de IA, estado no navegador e gráficos com Chart.js.

---

## ✨ Funcionalidades

- 🎯 **Simulador de entrevista** com IA (LLaMA 3 via Groq)
- 📋 Configuração de sessão:
  - Nome do candidato
  - Cargo desejado
  - Nível (Júnior / Pleno / Sênior)
  - Área / contexto
  - Estilo da entrevista (técnica, comportamental, equilibrada)
- 💬 **Chat em tempo real** com:
  - Bubbles para usuário e entrevistador
  - Indicador de “digitando…”
  - **Enter** para enviar · **Shift+Enter** para quebrar linha
- 📊 **Dashboard inicial** com:
  - Total de sessões concluídas
  - Último resultado da entrevista
  - Melhor score
  - Gráficos em **Chart.js** (evolução e habilidades)
- 🧠 Feedback da IA com:
  - Comentários sobre resposta
  - Campos como:
    - `Conhecimento técnico: x de 10`
    - `Comunicação: x de 10`
    - `Postura profissional: x de 10`
  - `Resultado: Aprovado / Recomendado / Precisa melhorar`
- 💾 Persistência local:
  - Estatísticas salvas em `localStorage` (`hiremindStats`)

---

## 🧱 Stack utilizada

**Frontend**

- HTML5
- [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- [Chart.js](https://www.chartjs.org/) (via CDN)
- JavaScript puro (`script.js`)

**Backend**

- Node.js
- Express
- Integração com API de IA (Groq / LLaMA 3)
- `dotenv` para variáveis de ambiente
- CORS liberado para o frontend local

---

## 🏗 Arquitetura (visão geral)

```text
Frontend (index.html + script.js)
  └─ Chat, dashboard, gráficos, configuração de sessão
      ↓ chama via HTTP (POST)
Backend Node (Express)
  └─ Rota POST /api/interview
      └─ Monta prompt + contexto da conversa
      └─ Envia para modelo LLaMA 3 (Groq)
      └─ Retorna resposta em texto para o front