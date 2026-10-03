(function () {
  function createMiko() {
    if (document.getElementById("miko-button")) return;

    const button = document.createElement("button");
    button.id = "miko-button";
    button.className = "miko-button";
    button.type = "button";
    button.setAttribute("aria-label", "Open Miko AI Assistant");
    button.innerHTML = '<span aria-hidden="true">🐤</span>';

    const panel = document.createElement("div");
    panel.id = "miko-panel";
    panel.className = "miko-panel";

    panel.innerHTML = `
      <div class="miko-header">
        <div class="miko-title">Miko 🎬</div>
        <div class="miko-subtitle">World Movie App AI Assistant</div>
      </div>

      <div class="miko-messages" id="miko-messages">
        <div class="miko-message bot">
          Hello! I'm Miko 👋<br>
          میں آپ کو movies اور World Movie App کے بارے میں مدد دے سکتا ہوں۔
        </div>
      </div>

      <div class="miko-input-area">
        <input
          id="miko-input"
          class="miko-input"
          type="text"
          placeholder="Ask Miko... / Miko سے پوچھیں..."
          autocomplete="off"
        >
        <button id="miko-send" class="miko-send" type="button">
          Send
        </button>
      </div>
    `;

    document.body.appendChild(button);
    document.body.appendChild(panel);

    const messages = document.getElementById("miko-messages");
    const input = document.getElementById("miko-input");
    const send = document.getElementById("miko-send");

    button.addEventListener("click", function () {
      panel.classList.toggle("open");

      if (panel.classList.contains("open")) {
        input.focus();
      }
    });

    function addMessage(text, type) {
      const message = document.createElement("div");
      message.className = "miko-message " + type;
      message.textContent = text;
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
    }

    async function getReply(text) {
      const question = text.trim();
      const lower = question.toLowerCase();

      if (
        lower.includes("hello") ||
        lower.includes("hi") ||
        lower.includes("salam") ||
        lower.includes("اسلام") ||
        lower.includes("سلام")
      ) {
        return "Hello! 👋 میں Miko ہوں۔ آپ movie کا نام، genre، language یا category بتا سکتے ہیں۔";
      }

      if (
        lower.includes("membership") ||
        lower.includes("premium") ||
        lower.includes("ممبر") ||
        lower.includes("پریمیم")
      ) {
        return "⭐ Membership section میں available plans دیکھ سکتے ہیں۔";
      }

      let searchQuery = question;

      const result = await fetch(
        "/api/miko/movies?q=" + encodeURIComponent(searchQuery) + "&limit=6"
      );

      if (!result.ok) {
        throw new Error("Miko movie API error");
      }

      const data = await result.json();

      if (data.success && data.movies && data.movies.length > 0) {
        const movies = data.movies;

        let reply = "🎬 مجھے یہ movies ملیں:\\n\\n";

        movies.forEach(function (movie, index) {
          reply +=
            (index + 1) +
            ". " +
            movie.title +
            "\\n" +
            "Genre: " + (movie.genre || "N/A") +
            " | Language: " + (movie.language || "N/A") +
            "\\n" +
            "Year: " + (movie.year || "N/A") +
            " | Rating: " + (movie.rating || "N/A") +
            "\\n\\n";
        });

        reply += "آپ کسی movie کا نام بتائیں تو میں اس کی details تلاش کر سکتا ہوں۔";

        return reply;
      }

      if (
        lower.includes("movie") ||
        lower.includes("movies") ||
        lower.includes("film") ||
        lower.includes("فلم") ||
        lower.includes("مووی")
      ) {
        return "🍿 مجھے اس وقت آپ کی database میں اس search کے مطابق کوئی movie نہیں ملی۔ Movie کا نام یا genre دوبارہ لکھیں۔";
      }

      if (
        lower.includes("recommend") ||
        lower.includes("suggest") ||
        lower.includes("تجویز") ||
        lower.includes("مشورہ")
      ) {
        return "🎯 آپ action، comedy، drama، horror، mystery یا کسی language کا نام لکھیں، میں موجودہ movie database میں تلاش کروں گا۔";
      }

      if (
        lower.includes("help") ||
        lower.includes("مدد")
      ) {
        return "🤖 میں آپ کے لیے موجودہ movie database میں titles، genres، languages اور categories تلاش کر سکتا ہوں۔";
      }

      return "🤖 میں Miko ہوں۔ Movie کا نام، genre یا language لکھیں، مثلاً: Caligari، horror، English یا Punjabi۔";
    }

    async function sendMessage() {
      const text = input.value.trim();

      if (!text) return;

      addMessage(text, "user");
      input.value = "";

      addMessage("Miko سوچ رہا ہے... 🔎", "bot");

      try {
        const reply = await getReply(text);

        const thinking = messages.lastElementChild;
        if (thinking && thinking.classList.contains("bot")) {
          thinking.remove();
        }

        addMessage(reply, "bot");
      } catch (error) {
        const thinking = messages.lastElementChild;
        if (thinking && thinking.classList.contains("bot")) {
          thinking.remove();
        }

        addMessage(
          "معذرت، ابھی movie search میں مسئلہ آ رہا ہے۔ دوبارہ کوشش کریں۔",
          "bot"
        );
      }
    }

    send.addEventListener("click", sendMessage);

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        sendMessage();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createMiko);
  } else {
    createMiko();
  }
})();
