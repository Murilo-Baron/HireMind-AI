// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const interviewRoutes = require("./src/routes/interviewRoutes");

const app = express();
const PORT = process.env.PORT || 4002;

// middlewares
app.use(cors());
app.use(express.json());

// rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API de Entrevista IA está rodando 👋" });
});

// rotas da IA
app.use("/api", interviewRoutes);

// middleware simples de erro
app.use((err, req, res, next) => {
  console.error("Erro:", err);
  res.status(500).json({ message: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
