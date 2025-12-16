// backend/src/routes/interviewRoutes.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// POST /api/interview
router.post("/interview", async (req, res, next) => {
  try {
    const { role, level, area, messages } = req.body;

    if (!GROQ_API_KEY) {
      return res
        .status(500)
        .json({ message: "GROQ_API_KEY não configurada no servidor." });
    }

    if (!role || !level || !area) {
      return res.status(400).json({
        message: "Campos 'role', 'level' e 'area' são obrigatórios.",
      });
    }

    // mensagens da conversa vinda do front (formato: { role: "user" | "assistant", content })
    const chatMessages = Array.isArray(messages) ? messages : [];

    // monta o prompt de sistema para o modelo
    const systemMessage = {
      role: "system",
      content: `
Você é um recrutador experiente conduzindo uma entrevista de emprego.
Vaga: ${role}
Nível: ${level}
Área: ${area}

Regras:
- Faça uma pergunta por vez.
- Sempre dê um feedback curto e claro sobre a última resposta do candidato (quando houver).
- Depois do feedback, traga a PRÓXIMA pergunta da entrevista.
- Seja direto, profissional e responda SEMPRE em português do Brasil.
- Não escreva código, a não ser que a vaga seja para desenvolvimento e faça sentido pedir exemplos.
`,
    };

    // converte mensagens do front para o formato esperado pela API
    const formattedMessages = [
      systemMessage,
      ...chatMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.1-8b-instant",
        messages: formattedMessages,
        temperature: 0.4,
        max_tokens: 600,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const reply =
      response.data.choices?.[0]?.message?.content ||
      "Não consegui gerar uma resposta no momento.";

    res.json({ reply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    next(err);
  }
});

module.exports = router;
