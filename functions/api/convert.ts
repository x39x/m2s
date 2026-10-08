import YAML from "yaml";

import { fetchSubscriptions } from "./libs/fetch";
import { generate } from "./libs/generate";
import { anytls, hysteria2, shadowsocks, trojan, vless, vmess } from "./libs/protocol";

const converters: Record<string, (proxy: any) => any> = {
    ss: shadowsocks,
    vmess,
    trojan,
    vless,
    anytls,
    hysteria2,
};

export async function onRequestGet(context: any) {
    try {
        const url = new URL(context.request.url);
        const cipher = url.searchParams.get("cipher");
        if (cipher !== "thanku") {
            return new Response(
                JSON.stringify({
                    error: "please say 'thanku'",
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const urls = url.searchParams.getAll("url");
        const template = url.searchParams.get("template");

        if (urls.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "url is required",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const results = await fetchSubscriptions(urls);
        const proxies = [];

        for (const result of results) {
            if (!result.ok) {
                continue;
            }

            const data = YAML.parse(result.text);

            if (!data || !Array.isArray(data.proxies)) {
                continue;
            }

            for (const proxy of data.proxies) {
                const converter = converters[proxy.type];

                if (!converter) {
                    console.warn(
                        `Unsupported proxy type: ${proxy.type} (${proxy.name ?? "unknown"})`,
                    );
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

        if (!template) {
            return new Response(JSON.stringify(proxies), {
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }

        const config = generate(proxies, template);

        return new Response(JSON.stringify(config), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error(error);

        return new Response(
            JSON.stringify({
                error: "Invalid request",
            }),
            {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
    }
}
