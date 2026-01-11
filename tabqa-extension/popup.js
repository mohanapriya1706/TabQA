let indexed = false;

// UI elements
const indexBtn = document.getElementById("indexBtn");
const askBtn = document.getElementById("askBtn");
const questionInput = document.getElementById("question");
const statusDiv = document.getElementById("status");

// 1️ Handle "Index this page"
indexBtn.addEventListener("click", async () => {
  statusDiv.innerText = "Indexing page...";
  
  // Get current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Ask content script for page text
  chrome.tabs.sendMessage(
    tab.id,
    { action: "GET_PAGE_TEXT" },
    async (response) => {
      if (!response || !response.text) {
        statusDiv.innerText = "Failed to get page content.";
        return;
      }

      try {
        // Send text to backend for indexing
        await fetch("http://127.0.0.1:8000/index", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: response.text
          })
        });

        indexed = true;
        questionInput.disabled = false;
        askBtn.disabled = false;
        statusDiv.innerText = "Page indexed. You can ask questions now.";

      } catch (error) {
        statusDiv.innerText = "Indexing failed. Is backend running?";
      }
    }
  );
});

// 2️ Handle "Ask"
askBtn.addEventListener("click", async () => {
  const question = questionInput.value.trim();
  if (!question) return;

  statusDiv.innerText = "Thinking...";

  try {
    const res = await fetch("http://127.0.0.1:8000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    statusDiv.innerText = data.answer || "No answer returned.";

  } catch (error) {
    statusDiv.innerText = "Failed to get answer.";
  }
});
