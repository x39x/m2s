import type { Proxy } from "./subscribe";
import iphoneTemplate from "./template/iphone.json";
import macTemplate from "./template/mac.json";

const GROUP_TAGS = ["cuckoo", "godwit", "seagull", "urltest"];

const templates = {
    mac: macTemplate,
    iphone: iphoneTemplate,
};

export function generate(proxies: Proxy[], templateName: string) {
    const template = templates[templateName];

    const config = structuredClone(template);

    const tags = proxies.map((proxy) => proxy.tag);

    for (const outbound of config.outbounds) {
        if (GROUP_TAGS.includes(outbound.tag)) {
            outbound.outbounds.push(...tags);
        }
    }

    config.outbounds.push(...proxies);

    return config;
}
