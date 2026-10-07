import YAML from "yaml";

import { shadowsocks, vless, anytls, trojan } from "./protocol";

export type Proxy = {
    type: string;
    tag: string;
    [key: string]: any;
};

const converters: Record<string, (proxy: any) => Proxy> = {
    ss: shadowsocks,
    anytls: anytls,
    trojan: trojan,
    vless: vless,
};

interface SubscriptionResult {
    url: string;
    ok: boolean;
    text: string;
}

export async function subscribe(urls: string[]): Promise<Proxy[]> {
    if (urls.length === 0) {
        return [];
    }

    const results = (await fetchSubscriptions(urls)) as SubscriptionResult[];

    const proxies: Proxy[] = [];

    for (const result of results) {
        if (!result.ok) {
            console.warn(`Failed to fetch subscription: ${result.url}`);
            continue;
        }

        const data = YAML.parse(result.text);

        if (!data || !Array.isArray(data.proxies)) {
            console.warn(`Invalid subscription: ${result.url}`);
            continue;
        }

        for (const proxy of data.proxies) {
            const converter = converters[proxy.type];

            if (!converter) {
                console.warn(`Unsupported proxy type: ${proxy.type} (${proxy.name ?? "unknown"})`);
                continue;
            }

            try {
                const converted = converter(proxy);

                if (converted) {
                    proxies.push(converted);
                }
            } catch (error) {
                console.warn(
                    `Failed to convert proxy: ${proxy.name ?? "unknown"} (${proxy.type})`,
                    error,
                );
            }
        }
    }

    return proxies;
}

async function fetchSubscriptions(urls: string[]): Promise<SubscriptionResult[]> {
    const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            urls,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.status}`);
    }

    return response.json();
}
