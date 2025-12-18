document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:4002/api/interview";

  // Telas
  const dashboardScreen = document.getElementById("dashboard-screen");
  const trainingScreen = document.getElementById("training-screen");
  const startTrainingButtons = document.querySelectorAll("[data-start-training]");
  const backDashboardBtn = document.getElementById("back-dashboard");

  // Config painel
  const roleInput = document.getElementById("role-input");
  const levelSelect = document.getElementById("level-select");
  const areaInput = document.getElementById("area-input");
  const styleSelect = document.getElementById("style-select");
  const modeSelect = document.getElementById("mode-select");
  const startBtn = document.getElementById("start-btn");

  // Modal
  const configModal = document.getElementById("config-modal");
  const configBackdrop = document.getElementById("config-backdrop");
  const modalRole = document.getElementById("modal-role");
  const modalLevel = document.getElementById("modal-level");
  const modalArea = document.getElementById("modal-area");
  const modalStyle = document.getElementById("modal-style");
  const modalMode = document.getElementById("modal-mode");
  const modalStartBtn = document.getElementById("modal-start-btn");
  const modalCloseBtn = document.getElementById("modal-close-btn");

  // Chat
  const messagesContainer = document.getElementById("messages");
  const answerForm = document.getElementById("answer-form");
  const answerInput = document.getElementById("answer-input");
  const sendBtn = document.getElementById("send-btn");
  const statusEl = document.getElementById("status");

  // Stats dentro da sessão
  const statAnswersEl = document.getElementById("stat-answers");
  const statFeedbacksEl = document.getElementById("stat-feedbacks");

  // Stats do dashboard
  const totalSessionsEl = document.getElementById("total-sessions");
  const lastSessionDateEl = document.getElementById("last-session-date");
  const lastResultLabelEl = document.getElementById("last-result-label");
  const bestScoreLabelEl = document.getElementById("best-score-label");

  let messages = [];
  let answersCount = 0;
  let feedbacksCount = 0;
  let isLoading = false;
  let sessionClosed = false;

  // estatísticas persistidas
  let stats = {
    totalSessions: 0,
    bestScore: null,
    lastResult: null,
    lastScore: null,
    lastDate: null,
  };

  // ===== Helpers UI =====
  function openModal() {
    configModal?.classList.remove("hidden");
  }

  function closeModal() {
    configModal?.classList.add("hidden");
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  function updateSessionStatsUI() {
    if (statAnswersEl) statAnswersEl.textContent = answersCount;
    if (statFeedbacksEl) statFeedbacksEl.textContent = feedbacksCount;
  }

  function updateDashboardFromStats() {
    if (totalSessionsEl) {
      totalSessionsEl.textContent = stats.totalSessions || 0;
    }

    if (lastSessionDateEl) {
      if (stats.lastDate) {
        const d = new Date(stats.lastDate);
        const dateStr = d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        const timeStr = d.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        lastSessionDateEl.textContent = `${dateStr} · ${timeStr}`;
      } else {
        lastSessionDateEl.textContent = "Nenhuma sessão ainda";
      }
    }

    if (lastResultLabelEl) {
      lastResultLabelEl.classList.remove(
        "text-emerald-300",
        "text-amber-300",
        "text-slate-400"
      );

      if (!stats.lastResult) {
        lastResultLabelEl.textContent =
          "Treine uma entrevista para ver o resultado aqui.";
        lastResultLabelEl.classList.add("text-slate-400");
      } else {
        lastResultLabelEl.textContent = stats.lastResult;
        if (/aprovado/i.test(stats.lastResult)) {
          lastResultLabelEl.classList.add("text-emerald-300");
        } else {
          lastResultLabelEl.classList.add("text-amber-300");
        }
      }
    }

    if (bestScoreLabelEl) {
      if (stats.bestScore != null) {
        bestScoreLabelEl.textContent =
          "Melhor desempenho: " + stats.bestScore.toFixed(1) + " / 10";
      } else {
        bestScoreLabelEl.textContent = "Melhor desempenho: —";
      }
    }
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem("hiremindStats");
      if (raw) {
        const parsed = JSON.parse(raw);
        stats = { ...stats, ...parsed };
      }
    } catch (e) {
      console.warn("Não foi possível ler stats do localStorage:", e);
    }
    updateDashboardFromStats();
  }

  function saveStats() {
    try {
      localStorage.setItem("hiremindStats", JSON.stringify(stats));
    } catch (e) {
      console.warn("Não foi possível salvar stats no localStorage:", e);
    }
  }

  // Escapa HTML básico e aplica markdown simples (**bold** + quebras de linha)
  function renderMarkdown(text) {
    if (!text) return "";
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // **negrito**
    safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Quebra de linha
    safe = safe.replace(/\n/g, "<br/>");

    return safe;
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
        "leading-relaxed",
        "text-[13px]",
        "flex",
        "flex-col",
        "gap-1"
      );

      const label = document.createElement("div");
      label.classList.add(
        "text-[10px]",
        "uppercase",
        "tracking-[0.16em]",
        "mb-0.5"
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

      if (msg.typing) {
        content.innerHTML =
          '<span class="inline-flex gap-1">' +
          '<span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>' +
          '<span class="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>' +
          '<span class="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"></span>' +
          "</span>";
      } else {
        content.innerHTML = renderMarkdown(msg.content);
      }

      wrapper.appendChild(label);
      wrapper.appendChild(content);
      messagesContainer.appendChild(wrapper);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function addTypingMessage() {
    messages.push({ role: "assistant", content: "", typing: true });
    renderMessages();
  }

  function removeTypingMessage() {
    messages = messages.filter((m) => !m.typing);
    renderMessages();
  }

  function beginLoading(context) {
    isLoading = true;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.add("opacity-60", "cursor-not-allowed");
      if (context === "answer") sendBtn.textContent = "Gerando...";
    }
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.classList.add("opacity-60", "cursor-not-allowed");
      if (context === "start") startBtn.textContent = "Iniciando...";
    }
    if (modalStartBtn) {
      modalStartBtn.disabled = true;
      modalStartBtn.classList.add("opacity-60", "cursor-not-allowed");
      if (context === "modal") modalStartBtn.textContent = "Iniciando...";
    }
  }

  function endLoading() {
    isLoading = false;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.classList.remove("opacity-60", "cursor-not-allowed");
      sendBtn.textContent = "Enviar resposta";
    }
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.classList.remove("opacity-60", "cursor-not-allowed");
      startBtn.textContent = "Começar entrevista";
    }
    if (modalStartBtn) {
      modalStartBtn.disabled = false;
      modalStartBtn.classList.remove("opacity-60", "cursor-not-allowed");
      modalStartBtn.textContent = "Começar entrevista";
    }
  }

  // ===== Dashboard Charts (Chart.js) =====
  function initDashboardCharts() {
    if (typeof Chart === "undefined") return;

    const sessionsCanvas = document.getElementById("sessionsChart");
    const skillsCanvas = document.getElementById("skillsChart");

    if (!sessionsCanvas || !skillsCanvas) return;

    // Mock: sessões por semana
    const ctx1 = sessionsCanvas.getContext("2d");
    new Chart(ctx1, {
      type: "line",
      data: {
        labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
        datasets: [
          {
            label: "Entrevistas concluídas",
            data: [2, 4, 3, 6],
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,0.15)",
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: "#22c55e",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#e5e7eb",
              font: { size: 11 },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#9ca3af", font: { size: 10 } },
            grid: { color: "rgba(55,65,81,0.4)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#9ca3af", font: { size: 10 }, stepSize: 1 },
            grid: { color: "rgba(31,41,55,0.6)" },
          },
        },
      },
    });

    // Mock: força por área (0 a 10)
    const ctx2 = skillsCanvas.getContext("2d");
    new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: ["Técnico", "Comunicação", "Postura"],
        datasets: [
          {
            data: [7, 8, 9],
            backgroundColor: ["#38bdf8", "#34d399", "#f97316"],
            borderColor: "#020617",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#e5e7eb",
              font: { size: 10 },
            },
          },
        },
        cutout: "60%",
      },
    });
  }

  // ===== Parse de resultado da IA =====
  function parseResultFromReply(reply) {
    if (!reply) return { result: null, score: null };

    const resultMatch = reply.match(/Resultado:\s*(.+)/i);
    const result = resultMatch ? resultMatch[1].trim() : null;

    const techMatch = reply.match(
      /Conhecimento técnico:\s*(\d+)\s*de\s*10/i
    );
    const commMatch = reply.match(/Comunicação:\s*(\d+)\s*de\s*10/i);
    const postMatch = reply.match(
      /Postura profissional:\s*(\d+)\s*de\s*10/i
    );

    const parts = [];
    if (techMatch) parts.push(parseInt(techMatch[1], 10));
    if (commMatch) parts.push(parseInt(commMatch[1], 10));
    if (postMatch) parts.push(parseInt(postMatch[1], 10));

    const score =
      parts.length > 0
        ? parts.reduce((sum, v) => sum + v, 0) / parts.length
        : null;

    return { result, score };
  }

  function handleAssistantReplyForStats(reply) {
    if (sessionClosed) return;

    const { result, score } = parseResultFromReply(reply);

    if (!result && score == null) return;

    stats.totalSessions += 1;
    if (score != null) {
      stats.lastScore = score;
      if (stats.bestScore == null || score > stats.bestScore) {
        stats.bestScore = score;
      }
    }

    stats.lastResult = result || "Sessão encerrada";
    stats.lastDate = new Date().toISOString();
    sessionClosed = true;

    saveStats();
    updateDashboardFromStats();
  }

  // ===== Chamada à API =====
  async function callInterviewApi(history) {
    const role = roleInput?.value.trim() || "Desenvolvedor Jr";
    const level = levelSelect?.value || "junior";
    const area = areaInput?.value.trim() || "tecnologia";
    const style = styleSelect?.value || "equilibrado";
    const mode = modeSelect?.value || "completo";

    // remove mensagens de "typing" e qualquer campo extra antes de enviar
    const sanitizedHistory = (history || [])
      .filter((m) => !m.typing)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const payload = {
      role,
      level,
      area,
      style,
      mode,
      messages: sanitizedHistory,
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Erro da API:", errorData);
      throw new Error(errorData.error || "Erro na API");
    }

    const data = await res.json();
    return data.reply || "Não consegui gerar uma resposta agora.";
  }

  async function startInterview(trigger = "start") {
    if (isLoading) return;
    beginLoading(trigger);

    messages = [];
    answersCount = 0;
    feedbacksCount = 0;
    sessionClosed = false;
    updateSessionStatsUI();
    renderMessages();

    setStatus("Gerando primeira pergunta da entrevista…");
    addTypingMessage();

    try {
      const reply = await callInterviewApi([
        {
          role: "user",
          content:
            "Quero iniciar uma entrevista para essa vaga. Faça a primeira pergunta.",
        },
      ]);

      removeTypingMessage();
      messages.push({ role: "assistant", content: reply });
      feedbacksCount += 1;
      updateSessionStatsUI();
      renderMessages();
      setStatus("");

      handleAssistantReplyForStats(reply);
    } catch (err) {
      console.error(err);
      removeTypingMessage();
      setStatus(
        "Erro ao falar com a IA. Verifique se o servidor está rodando e tente novamente."
      );
    } finally {
      endLoading();
    }
  }

  // ===== Navegação / Modal =====
  startTrainingButtons.forEach((btn) =>
    btn.addEventListener("click", () => openModal())
  );

  modalCloseBtn?.addEventListener("click", () => closeModal());
  configBackdrop?.addEventListener("click", () => closeModal());

  modalStartBtn?.addEventListener("click", async () => {
    // Copia dados do modal para o painel
    if (modalRole && roleInput) roleInput.value = modalRole.value;
    if (modalLevel && levelSelect) levelSelect.value = modalLevel.value;
    if (modalArea && areaInput) areaInput.value = modalArea.value;
    if (modalStyle && styleSelect) styleSelect.value = modalStyle.value;
    if (modalMode && modeSelect) modeSelect.value = modalMode.value;

    // Troca para a tela de treinamento
    dashboardScreen?.classList.add("hidden");
    trainingScreen?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

    closeModal();
    await startInterview("modal");
  });

  backDashboardBtn?.addEventListener("click", () => {
    trainingScreen?.classList.add("hidden");
    dashboardScreen?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  startBtn?.addEventListener("click", () => {
    startInterview("start");
  });

  // ===== Enviar resposta =====
  answerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const answer = answerInput?.value.trim();
    if (!answer) return;

    messages.push({ role: "user", content: answer });
    answersCount += 1;
    updateSessionStatsUI();
    renderMessages();
    if (answerInput) answerInput.value = "";

    setStatus("Analisando resposta e gerando próxima pergunta…");
    addTypingMessage();
    beginLoading("answer");

    try {
      const reply = await callInterviewApi(messages);
      removeTypingMessage();
      messages.push({ role: "assistant", content: reply });
      feedbacksCount += 1;
      updateSessionStatsUI();
      renderMessages();
      setStatus("");

      handleAssistantReplyForStats(reply);
    } catch (err) {
      console.error(err);
      removeTypingMessage();
      setStatus(
        "Erro ao falar com a IA. Verifique se o servidor está rodando e tente novamente."
      );
    } finally {
      endLoading();
    }
  });

  // inicia os gráficos do dashboard e carrega stats salvos
  initDashboardCharts();
  loadStats();
});
