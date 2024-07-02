import { CreateWebWorkerMLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm";

const form = document.querySelector("form");
const input = document.querySelector("input");
const template = document.querySelector("#message-template");
const $messages = document.querySelector("ul");
const container = document.querySelector("main");
const button = document.querySelector("button");
const $info = document.querySelector("small");
const $loading = document.querySelector(".loading");

let messages = [];
let end = false;

/* Llama-3-8B-Instruct-q4f32_1-MLC-1k */
const SELECTED_MODEL = "gemma-2b-it-q4f32_1-MLC";

const engine = await CreateWebWorkerMLCEngine(
  new Worker('/worker.js', {type: 'module'}),
  SELECTED_MODEL, 
  {
  initProgressCallback: (info) => {
    $info.textContent = `${info.text}`;
    if (info.progress === 1 && !end) {
      end = true;
      $loading?.parentNode?.removeChild($loading);
      button.disabled = false;
      addMessage("¡Hola! Soy un BOT que se ejecuta en tu navegador. ¿En qué puedo ayudarte hoy?", 'bot');
      input.focus();
    }
  },
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const textMessage = input.value.trim();

  if (textMessage !== "") {
    input.value = "";
  }

  addMessage(textMessage, "user");
  button.setAttribute("disabled", '');

  const userMessage = {
    role: 'user',
    content: textMessage
  };

  messages.push(userMessage);

  const chunks = await engine.chat.completions.create({
    messages,
    temperature: 1,
    stream: true
  })

  let reply = "";

  const botText = addMessage("Escribiendo...", "bot");

  for await(const chunk of chunks){
    const choice = chunk.choices[0];
    const content = choice?.delta?.content ?? ""
    reply += content
    botText.textContent = reply

  }

  button.removeAttribute("disabled");
  messages.push({
    role: 'assistant',
    content: reply
  })

  container.scrollTop = container.scrollHeight;

});

function addMessage(text, sender) {
  const clonedTemplate = template.content.cloneNode(true);
  const newMessage = clonedTemplate.querySelector(".message");

  const who = newMessage.querySelector("span");
  const $text = newMessage.querySelector("p");

  $text.textContent = text;
  who.textContent = sender === "bot" ? "BOT" : "Tú";
  newMessage.classList.add(sender);

  $messages.appendChild(newMessage);
  container.scrollTop = container.scrollHeight;

  return $text;
}

