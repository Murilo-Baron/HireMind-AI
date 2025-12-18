// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

// carrega variáveis de ambiente
require("dotenv").config({ path: path.join(__dirname, ".env") });

const interviewRoute = require("./src/routes/interviewRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// saúde / teste rápido
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "HireMind AI backend ok" });
});

// rotas da IA
app.use("/api", interviewRoute);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`API HireMind AI rodando na porta ${PORT}`);
});
