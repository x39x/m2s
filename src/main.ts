import "./style.css";
import { convert } from "./api";
import { renderApp, renderNodes, renderOutput } from "./render";
import { addSubscription, removeSubscription, subscriptions, updateSubscription } from "./state";

const app = document.querySelector<HTMLDivElement>("#app")!;

function render() {
    renderApp(app, subscriptions);
    bindEvents();
}

function bindEvents() {
    document
        .querySelector<HTMLButtonElement>("#add-subscription")
        ?.addEventListener("click", () => {
            addSubscription();
            render();
        });

    document.querySelectorAll<HTMLInputElement>(".subscription-input").forEach((input) => {
        input.addEventListener("input", () => {
            const id = Number(input.dataset.id);

            updateSubscription(id, input.value);
        });
    });

    document.querySelectorAll<HTMLButtonElement>(".remove-subscription").forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);

            removeSubscription(id);
            render();
        });
    });

    document
        .querySelector<HTMLButtonElement>("#generate")
        ?.addEventListener("click", handleGenerate);

    document.querySelector<HTMLButtonElement>("#copy")?.addEventListener("click", copy);
    document.querySelector<HTMLButtonElement>("#download")?.addEventListener("click", download);
}

async function handleGenerate() {
    const urls = subscriptions.map((subscription) => subscription.url.trim()).filter(Boolean);

    const template = document.querySelector<HTMLSelectElement>("#template")!.value;

    const result = await convert(urls, template);
    const nodes = await convert(urls, "");

    renderNodes(nodes);
    renderOutput(result);
}

async function copy() {
    const output = document.querySelector<HTMLPreElement>("#output")!;

    await navigator.clipboard.writeText(output.textContent ?? "");
}

function download() {
    const output = document.querySelector<HTMLPreElement>("#output")!;

    const blob = new Blob([output.textContent ?? ""], {
        type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    a.click();

    URL.revokeObjectURL(url);
}

render();
