import type { Proxy, SubscriptionInput } from "./state";

export function renderApp(app: HTMLDivElement, subscriptions: SubscriptionInput[]) {
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
                    ${renderSubscriptions(subscriptions)}
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

                <pre id="output" class="output"><code>{}</code></pre>
            </section>

        </main>
    `;
}

function renderSubscriptions(subscriptions: SubscriptionInput[]) {
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

export function renderNodes(proxies: Proxy[]) {
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

export function renderOutput(config: unknown) {
    const output = document.querySelector<HTMLPreElement>("#output")!;

    output.textContent = JSON.stringify(config, null, 2);
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
