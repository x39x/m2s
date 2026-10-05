export async function onRequestPost(context: any) {
    try {
        const body = await context.request.json();
        const urls = body.urls;

        if (!Array.isArray(urls)) {
            return new Response(
                JSON.stringify({
                    error: "urls must be an array",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const results = await Promise.all(
            urls.map(async (url: string) => {
                try {
                    const response = await fetch(url, {
                        headers: {
                            "User-Agent": "clash-verge/v2.5.1",
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

        return new Response(JSON.stringify(results), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch {
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
