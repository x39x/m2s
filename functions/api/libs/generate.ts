import iphoneTemplate from "../template/iphone.json";
import macTemplate from "../template/mac.json";

const GROUP_TAGS = ["cuckoo", "godwit", "seagull", "urltest"];

const templates: Record<string, any> = {
    mac: macTemplate,
    iphone: iphoneTemplate,
};

export function generate(proxies: any[], templateName: string) {
    const template = templates[templateName];

    if (!template) {
        throw new Error(`Unknown template: ${templateName}`);
    }

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
