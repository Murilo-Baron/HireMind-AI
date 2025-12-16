document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:4002/api/interview";

  // Telas
  const dashboardScreen = document.getElementById("dashboard-screen");
  const trainingScreen = document.getElementById("training-screen");
  const startTrainingButtons = document.querySelectorAll("[data-start-training]");
  const backDashboardBtn = document.getElementById("back-dashboard");

  // Config painel (sessão)
  const roleInput = document.getElementById("role-input");
  const levelSelect = document.getElementById("level-select");
  const areaInput = document.getElementById("area-input");
  const styleSelect = document.getElementById("style-select");
  const startBtn = document.getElementById("start-btn");

  // Modal de configuração inicial
  const configModal = document.getElementById("config-modal");
  const configBackdrop = document.getElementById("config-backdrop");
  const modalRole = document.getElementById("modal-role");
  const modalLevel = document.getElementById("modal-level");
  const modalArea = document.getElementById("modal-area");
  const modalStyle = document.getElementById("modal-style");
  const modalStartBtn = document.getElementById("modal-start-btn");
  const modalCloseBtn = document.getElementById("modal-close-btn");

  // Chat
  const messagesContainer = document.getElementById("messages");
  const answerForm = document.getElementById("answer-form");
  const answerInput = document.getElementById("answer-input");
  const statusEl = document.getElementById("status");

  // Stats
  const statAnswersEl = document.getElementById("stat-answers");
  const statFeedbacksEl = document.getElementById("stat-feedbacks");

  // Estado
  let messages = [];
  let answersCount = 0;
  let feedbacksCount = 0;

  // ========= Helpers =========
  function openModal() {
    if (configModal) configModal.classList.remove("hidden");
  }

  function closeModal() {
    if (configModal) configModal.classList.add("hidden");
  }

  function renderMessages() {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = "";

    messages.forEach((msg) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add(
        "max-w-[80%]",
        "rounded-2xl",
        "px-3",
        "py-2",
        "text-[13px]",
        "leading-relaxed"
      );

      const label = document.createElement("div");
      label.classList.add(
        "text-[10px]",
        "uppercase",
        "tracking-[0.16em]",
        "mb-1"
      );

      if (msg.role === "user") {
        wrapper.classList.add(
          "ml-auto",
          "bg-sky-500/15",
          "border",
          "border-sky-400/70"
        );
        label.classList.add("text-sky-300");
        label.textContent = "Você";
      } else {
        wrapper.classList.add(
          "mr-auto",
          "bg-slate-900/90",
          "border",
          "border-slate-600/80"
        );
        label.classList.add("text-slate-400");
        label.textContent = "Entrevistador IA";
      }

      const content = document.createElement("div");
      content.textContent = msg.content;

      wrapper.appendChild(label);
      wrapper.appendChild(content);
      messagesContainer.appendChild(wrapper);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  function updateStats() {
    if (statAnswersEl) statAnswersEl.textContent = answersCount;
    if (statFeedbacksEl) statFeedbacksEl.textContent = feedbacksCount;
  }

  async function callInterviewApi(history) {
    const role = roleInput?.value.trim() || "Desenvolvedor Jr";
    const level = levelSelect?.value || "junior";
    const area = areaInput?.value.trim() || "tecnologia";
    const style = styleSelect?.value || "equilibrado";

    const payload = { role, level, area, style, messages: history };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Erro ao falar com a API");
    }

    const data = await res.json();
    return data.reply || "Não consegui gerar uma resposta agora.";
  }

  async function startInterview() {
    messages = [];
    answersCount = 0;
    feedbacksCount = 0;
    updateStats();
    renderMessages();
    setStatus("Gerando primeira pergunta da entrevista...");

    try {
      const reply = await callInterviewApi([
        {
          role: "user",
          content:
            "Quero iniciar uma entrevista para essa vaga. Faça a primeira pergunta.",
        },
      ]);

      messages.push({ role: "assistant", content: reply });
      feedbacksCount += 1;
      updateStats();
      renderMessages();
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus(
        "Erro ao falar com a IA. Verifique se o servidor está rodando e tente novamente."
      );
    }
  }

  // ========= Navegação e modal =========

  // Abrir modal ao clicar em "Iniciar treinamento" no dashboard
  if (startTrainingButtons.length > 0) {
    startTrainingButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        openModal();
      });
    });
  }

  // Fechar modal (botão X ou clicar no backdrop)
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }
  if (configBackdrop) {
    configBackdrop.addEventListener("click", closeModal);
  }

  // Botão do modal -> copia configs, troca tela e inicia entrevista
  if (modalStartBtn) {
    modalStartBtn.addEventListener("click", async () => {
      // copiar valores do modal para o painel lateral
      if (modalRole && roleInput) roleInput.value = modalRole.value;
      if (modalLevel && levelSelect) levelSelect.value = modalLevel.value;
      if (modalArea && areaInput) areaInput.value = modalArea.value;
      if (modalStyle && styleSelect) styleSelect.value = modalStyle.value;

      // trocar tela
      if (dashboardScreen) dashboardScreen.classList.add("hidden");
      if (trainingScreen) trainingScreen.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });

      closeModal();
      await startInterview();
    });
  }

  // botão "voltar para dashboard"
  if (backDashboardBtn) {
    backDashboardBtn.addEventListener("click", () => {
      if (trainingScreen) trainingScreen.classList.add("hidden");
      if (dashboardScreen) dashboardScreen.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // botão "Começar entrevista" dentro do painel lateral
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startInterview();
    });
  }

  // ========= Enviar resposta =========
  if (answerForm) {
    answerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const answer = answerInput?.value.trim();
      if (!answer) return;

      messages.push({ role: "user", content: answer });
      answersCount += 1;
      updateStats();
      renderMessages();
      if (answerInput) answerInput.value = "";
      setStatus("Analisando resposta e gerando próxima pergunta...");

      try {
        const reply = await callInterviewApi(messages);
        messages.push({ role: "assistant", content: reply });
        feedbacksCount += 1;
        updateStats();
        renderMessages();
        setStatus("");
      } catch (err) {
        console.error(err);
        setStatus(
          "Erro ao falar com a IA. Verifique se o servidor está rodando e tente novamente."
        );
      }
    });
  }
});
