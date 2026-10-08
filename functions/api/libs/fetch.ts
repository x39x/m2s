export interface SubscriptionResult {
    url: string;
    ok: boolean;
    text: string;
}

export async function fetchSubscriptions(urls: string[]): Promise<SubscriptionResult[]> {
    return Promise.all(
        urls.map(async (url) => {
            try {
                const response = await fetch(url, {
                    headers: {
                        "User-Agent": "clash-verge/v2.5.7",
                    },
                });

                if (!response.ok) {
                    return {
                        url,
                        ok: false,
                        text: "",
                    };
                }

                return {
                    url,
                    ok: true,
                    text: await response.text(),
                };
            } catch (error) {
                console.warn(`Failed to fetch: ${url}`, error);

                return {
                    url,
                    ok: false,
                    text: "",
                };
            }
        }),
    );
}
