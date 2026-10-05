export function ss(clash: any) {
    const singbox: any = {
        type: "shadowsocks",
        tag: clash.name,
        server: clash.server,
        server_port: clash.port,
        method: clash.cipher,
        password: clash.password,
    };
    if (clash.udp === false) {
        singbox.network = "tcp";
    }

    if (clash["udp-over-tcp"] !== undefined) {
        singbox.udp_over_tcp = {
            enable: clash["udp-over-tcp"],
            version: clash["udp-over-tcp-version"] ?? 1,
        };
    }

    if (clash.plugin === "obfs") {
        const opts = clash["plugin-opts"];

        singbox.plugin = "obfs-local";
        singbox.plugin_opts = {
            mode: opts?.mode,
            host: opts?.host ?? "",
        };
    }

    if (clash.smux?.enabled === true) {
        singbox.multiplex = {
            enabled: true,
            protocol: clash.smux.protocol ?? "h2mux",
            padding: clash.smux.padding ?? false,
        };

        if (clash.smux["max-streams"] !== undefined) {
            singbox.multiplex.max_streams = clash.smux["max-streams"];
        } else {
            if (clash.smux["min-streams"] !== undefined) {
                singbox.min_streams = clash.smux["min-streams"] !== undefined;
            }
            if (clash.smux["max-connections"] !== undefined) {
                singbox.max_connections = clash.smux["max-connections"] !== undefined;
            }
        }
    }

    return singbox;
}
