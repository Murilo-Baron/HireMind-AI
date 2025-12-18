// backend/interviewRoute.js
const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// modelo do Groq – use o que você já estiver usando e funcionando
const MODEL_NAME = "llama-3.1-8b-instant"; // troque se quiser outro

async function callLlama(messages) {
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    messages,
    temperature: 0.35,
    max_tokens: 512,
  });

  const reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    "Não consegui gerar uma resposta agora.";

  return reply;
}

router.post("/interview", async (req, res) => {
  try {
    const { role, level, area, style, messages: history } = req.body;

    const safeHistory = Array.isArray(history) ? history : [];

    // contamos quantas respostas o candidato já deu
    const userAnswersCount = safeHistory.filter(
      (m) => m.role === "user"
    ).length;

    const maxQuestions = 8; // limite de “perguntas principais” que a IA vai fazer

    const systemPrompt = `
Você é um ENTREVISTADOR DE EMPREGO especializado em entrevistas para vagas de tecnologia.

DADOS DA SESSÃO
- Cargo-alvo: ${role || "Desenvolvedor Jr"}
- Nível: ${level || "junior"}
- Área / contexto: ${area || "tecnologia"}
- Estilo da entrevista: ${
      style || "equilibrado"
    } (equilibrado = técnico + comportamental)
- Perguntas principais já feitas ao candidato: ${userAnswersCount}
- Máximo de perguntas principais previstas: ${maxQuestions}

OBJETIVO GERAL
Simular uma entrevista de emprego real, com clima profissional e amigável, ajudando o candidato a treinar respostas. Você deve:
- conduzir a entrevista com foco em desenvolvedores júnior ou pleno;
- manter um ritmo natural de perguntas;
- dar feedback rápido, SEM virar aula teórica gigante.

FORMATO DAS RESPOSTAS (MUITO IMPORTANTE)
- Use SEMPRE português do Brasil.
- NÃO use Markdown pesado: não use **asteriscos**, nem títulos com #, nem listas marcadas.
- Escreva no máximo 5 frases por resposta.
- Frases curtas e diretas, como se estivesse falando com o candidato numa call.

ENQUANTO A ENTREVISTA ESTIVER ACONTECENDO
Se ainda NÃO chegou ao máximo de perguntas principais (${maxQuestions}) e ainda não tem informação suficiente:
1) Se a mensagem do usuário for uma resposta, comece com um FEEDBACK bem curto (1 ou 2 frases) dizendo:
   - 1 ponto forte;
   - 1 sugestão de melhoria.
2) Em seguida, faça APENAS UMA nova pergunta principal de entrevista, clara e objetiva.
3) Misture perguntas técnicas e comportamentais de acordo com os dados da sessão.

QUANDO ATINGIR OU PASSAR O LIMITE de perguntas principais (${maxQuestions})
Ou se você perceber que já tem informação suficiente:
1) NÃO faça uma nova pergunta principal.
2) Em vez disso, faça o FECHAMENTO da entrevista, em texto simples, seguindo a ordem:
   a) Uma avaliação geral em até 4 frases resumindo a performance.
   b) Atribua notas de 0 a 10 para:
      - conhecimento técnico;
      - comunicação;
      - postura profissional.
      Descreva isso em texto corrido, por exemplo: 
      "Conhecimento técnico: 7 de 10. Comunicação: 8 de 10. Postura profissional: 9 de 10."
   c) Diga claramente o resultado final usando EXATAMENTE uma das frases abaixo:
      - "Resultado: Aprovado para seguir no processo."
      - "Resultado: Em desenvolvimento. Ainda não aprovado."
   d) Dê 1 ou 2 recomendações diretas de próximos passos para o candidato estudar ou praticar.
3) Depois do fechamento, se o candidato continuar falando, responda de forma breve apenas para agradecer ou orientar próximo passo, sem abrir uma nova entrevista.

ESTILO
- Tom profissional, empático e direto.
- Não tente "ensinar um curso inteiro"; foque em treinar entrevista.
- Não peça para o candidato repetir as mesmas informações várias vezes.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...safeHistory,
    ];

    const reply = await callLlama(messages);

    res.json({ reply });
  } catch (err) {
    console.error("Erro na rota /api/interview:", err.message || err);
    res.status(500).json({
      error:
        "Erro ao conversar com a IA: " +
        (err.message || "verifique o log do servidor"),
    });
  }
});

module.exports = router;
