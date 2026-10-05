export function trojan(clash: any): any {
    // general
    const singbox: any = {
        type: clash.type,
        tag: clash.name,
        server: clash.server,
        server_port: clash.port,
        password: clash.password,
    };
    if (clash.udp === false) {
        singbox.network = "tcp";
    }

    // tls
    singbox.tls = {
        enabled: true,
        server_name: clash.sni ?? clash.servername,
    };
    if (clash["skip-cert-verify"] !== undefined) {
        singbox.tls.insecure = clash["skip-cert-verify"];
    }

    // multiplex
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
