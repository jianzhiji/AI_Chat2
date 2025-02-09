const chatLog = document.getElementById("chatLog");
const inputMessage = document.getElementById("inputMessage");
const loading = document.getElementById("loading");
let currentMessageElement = null;

// 输入框自适应高度
inputMessage.addEventListener("input", () => {
  inputMessage.style.height = "auto";
  inputMessage.style.height = inputMessage.scrollHeight + "px";
});

// 回车键发送（Shift+Enter换行）
inputMessage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const message = inputMessage.value.trim();
  if (!message) return;

  addMessage(message, "user-message");
  inputMessage.value = "";
  loading.style.display = "block";

  try {
    const response = await fetch(
      "https://api.chatanywhere.com.cn/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "sk-nejgbSZirjUTB61dynxVk6NHdFgSkDGtcCHsKFYWBNDx5WHg",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
          stream: true,
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP错误! 状态码: ${response.status}`);
    await processStream(response);
  } catch (error) {
    console.error("请求失败:", error);
    addMessage(`请求失败: ${error.message}`, "error-message");
  } finally {
    loading.style.display = "none";
    currentMessageElement = null;
  }
}

async function processStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop();

    for (const chunk of chunks) {
      try {
        const jsonStr = chunk.replace("data: ", "");
        const data = JSON.parse(jsonStr);
        const content = data.choices[0].delta.content;

        if (content) {
          if (!currentMessageElement) {
            currentMessageElement = document.createElement("div");
            currentMessageElement.className = "ai-message";
            chatLog.appendChild(currentMessageElement);
          }
          currentMessageElement.textContent += content;
          chatLog.scrollTop = chatLog.scrollHeight;
        }
      } catch (e) {
        console.warn("解析JSON时出错:", e);
      }
    }
  }
}

function addMessage(content, className) {
  const messageElement = document.createElement("div");
  messageElement.className = className;
}
