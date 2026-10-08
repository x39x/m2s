export async function convert(urls: string[], template: string) {
    const params = new URLSearchParams();

    for (const url of urls) {
        params.append("url", url);
    }
    if (template) {
        params.set("template", template);
    }
    params.set("cipher", "thanku");

    const response = await fetch(`/api/convert?${params}`, {
        method: "GET",
    });

    if (!response.ok) {
        throw new Error(`Convert failed: ${response.status}`);
    }

    return response.json();
}
