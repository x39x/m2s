export function anytls(clash: any): any {
    const singbox: any = {
        type: clash.type,
        tag: clash.name,
        server: clash.server,
        server_port: clash.port,
        password: clash.password,
    };
    if (clash["idle-session-check-interval"] !== undefined) {
        singbox.idle_session_check_interval = clash["idle-session-check-interval"];
    }
    if (clash["idle-session-timeout"] !== undefined) {
        singbox.idle_session_timeout = clash["idle-session-timeout"];
    }
    if (clash["min-idle-session"] !== undefined) {
        singbox.min_idle_session = clash["min-idle-session"];
    }

    singbox.tls = {
        enabled: true,
        server_name: clash.sni ?? clash.servername,
        alpn: clash.alpn,
        utls: {
            enabled: true,
            fingerprint: clash["client-fingerprint"],
        },
    };
    if (clash["skip-cert-verify"] !== undefined) {
        singbox.tls.insecure = clash["skip-cert-verify"];
    }

    return singbox;
}
