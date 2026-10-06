import "./style.css";
import { generate as generateConfig } from "./generate";
import { subscribe, type Proxy } from "./subscribe";

const app = document.querySelector<HTMLDivElement>("#app")!;

interface SubscriptionInput {
    id: number;
    url: string;
}

let subscriptions: SubscriptionInput[] = [
    {
        id: 1,
        url: "",
    },
];

let generatedConfig: unknown = null;

function render() {
    app.innerHTML = `
        <main class="container">


            <section class="card">
                <div class="section-header">
                    <div>
                        <h2>Subscriptions</h2>
                        <p>Add one or more subscriptions.</p>
                    </div>

                    <button id="add-subscription" class="button secondary">
                        Add
                    </button>
                </div>

                <div id="subscriptions">
                    ${renderSubscriptions()}
                </div>
            </section>

            <section class="card">
                <div class="section-header">
                    <div>
                        <h2>Template</h2>
                    </div>
                </div>

                <select id="template" class="select">
                    <option value="mac">macOS</option>
                    <option value="iphone">iPhone</option>
                </select>
            </section>

            <section class="actions">
                <button id="generate" class="button primary">
                    Generate Configuration
                </button>
            </section>

            <section class="card">
                <div class="section-header">
                    <div>
                        <h2>Nodes</h2>
                        <p id="node-count">0 nodes</p>
                    </div>
                </div>

                <div id="nodes" class="nodes empty">
                    No nodes yet.
                </div>
            </section>

            <section class="card">
                <div class="section-header">

                    <div class="output-actions">
                        <button id="copy" class="button secondary">
                            Copy
                        </button>

                        <button id="download" class="button secondary">
                            Download
                        </button>
                    </div>
                </div>

                <pre id="output" class="output">
                    <code>{}</code>
                </pre>
            </section>

        </main>
    `;

    bindEvents();
}

function renderSubscriptions() {
    return subscriptions
        .map(
            (subscription) => `
                <div class="subscription">
                    <input
                        type="url"
                        class="subscription-input"
                        data-id="${subscription.id}"
                        placeholder="https://example.com/subscription"
                        value="${escapeHtml(subscription.url)}"
                    />

                    ${
                        subscriptions.length > 1
                            ? `
                                <button
                                    class="icon-button remove-subscription"
                                    data-id="${subscription.id}"
                                    type="button"
                                >
                                    ×
                                </button>
                            `
                            : ""
                    }
                </div>
            `,
        )
        .join("");
}

function bindEvents() {
    document
        .querySelector<HTMLButtonElement>("#add-subscription")
        ?.addEventListener("click", () => {
            subscriptions.push({
                id: Date.now(),
                url: "",
            });

            render();
        });

    document.querySelectorAll<HTMLInputElement>(".subscription-input").forEach((input) => {
        input.addEventListener("input", () => {
            const id = Number(input.dataset.id);

            const subscription = subscriptions.find((item) => item.id === id);

            if (subscription) {
                subscription.url = input.value;
            }
        });
    });

    document.querySelectorAll<HTMLButtonElement>(".remove-subscription").forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);

            subscriptions = subscriptions.filter((item) => item.id !== id);

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

    const proxies = await subscribe(urls);

    generatedConfig = generateConfig(proxies, template);

    renderNodes(proxies);
    renderOutput(generatedConfig);
}

function renderNodes(proxies: Proxy[]) {
    const container = document.querySelector<HTMLDivElement>("#nodes")!;
    const count = document.querySelector<HTMLParagraphElement>("#node-count")!;

    count.textContent = `${proxies.length} nodes`;

    if (proxies.length === 0) {
        container.classList.add("empty");
        container.textContent = "No nodes found.";
        return;
    }

    container.classList.remove("empty");

    container.innerHTML = proxies
        .map(
            (proxy) => `
                <label class="node">
                    <span class="node-name">
                        ${escapeHtml(String(proxy.tag ?? "Unnamed"))}
                    </span>

                    <span class="node-type">
                        ${escapeHtml(String(proxy.type ?? ""))}
                    </span>
                </label>
            `,
        )
        .join("");
}

function renderOutput(config: unknown) {
    const output = document.querySelector<HTMLPreElement>("#output")!;

    output.textContent = JSON.stringify(config, null, 2);
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

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

render();
