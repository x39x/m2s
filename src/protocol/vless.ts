export function vless(clash: any): any {
    // general
    const singbox: any = {
        type: clash.type,
        tag: clash.name,
        server: clash.server,
        server_port: clash.port,
        uuid: clash.uuid,
        flow: clash.flow,
        // password: clash.password,
    };
    if (clash.udp === false) {
        singbox.network = "tcp";
    }

    if (clash["packet-encoding"] !== undefined) {
        singbox.packet_encoding = clash["packet-encoding"];
    }
    if (clash.flow !== undefined) {
        singbox.flow = clash.flow;
    }

    singbox.tls = {
        enabled: clash.tls,
        server_name: clash.sni ?? clash.servername,
        utls: {
            enabled: true,
            fingerprint: clash["client-fingerprint"],
        },
        reality: {
            enabled: true,
            public_key: clash["reality-opts"]["public-key"],
            short_id: clash["reality-opts"]["short-id"],
        },
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
