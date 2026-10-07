function createCommonOutbound(clashProxy: any): any {
    return {
        type: clashProxy.type,
        tag: clashProxy.name,
        server: clashProxy.server,
        server_port: clashProxy.port,
        ...(clashProxy.udp === false && { network: "tcp" }),
    };
}

function applyTls(clashProxy: any, singboxOutbound: any) {
    const serverName = clashProxy.sni ?? clashProxy.servername;
    if (!clashProxy.tls && !serverName) {
        singboxOutbound.tls = {
            enabled: false,
        };
        return;
    }

    const tlsConfig: any = {
        enabled: true,
        server_name: serverName,
    };
    if (clashProxy["skip-cert-verify"] !== undefined) {
        tlsConfig.insecure = clashProxy["skip-cert-verify"];
    }

    if (clashProxy.alpn !== undefined) {
        tlsConfig.alpn = clashProxy.alpn;
    }

    if (clashProxy["client-fingerprint"] !== undefined) {
        tlsConfig.utls = {
            enabled: true,
            fingerprint: clashProxy["client-fingerprint"],
        };
    }

    const realityOptions = clashProxy["reality-opts"];
    if (realityOptions?.["public-key"] !== undefined) {
        tlsConfig.reality = {
            enabled: true,
            public_key: realityOptions["public-key"],
            short_id: realityOptions["short-id"],
        };
    }

    singboxOutbound.tls = tlsConfig;
}

function applyMultiplex(clashProxy: any, singboxOutbound: any) {
    const smuxConfig = clashProxy.smux;

    if (!smuxConfig?.enabled) {
        return;
    }

    const multiplexConfig: any = {
        enabled: true,
        protocol: smuxConfig.protocol ?? "h2mux",
        padding: smuxConfig.padding ?? false,
    };

    if (smuxConfig["max-streams"] !== undefined) {
        multiplexConfig.max_streams = smuxConfig["max-streams"];
    } else {
        if (smuxConfig["min-streams"] !== undefined) {
            multiplexConfig.min_streams = smuxConfig["min-streams"];
        }

        if (smuxConfig["max-connections"] !== undefined) {
            multiplexConfig.max_connections = smuxConfig["max-connections"];
        }
    }
    if (smuxConfig["brutal-opts"].enabled === true) {
        multiplexConfig.brutal = {
            enabled: true,
            up_mbps: smuxConfig["brutal-opts"].up ?? 100,
            down_mbps: smuxConfig["brutal-opts"].down ?? 100,
        };
    }

    singboxOutbound.multiplex = multiplexConfig;
}

export function shadowsocks(clashProxy: any) {
    const singboxOutbound: any = createCommonOutbound(clashProxy);
    singboxOutbound.method = clashProxy.cipher;
    singboxOutbound.password = clashProxy.password;

    if (clashProxy["udp-over-tcp"] !== undefined) {
        singboxOutbound.udp_over_tcp = {
            enable: clashProxy["udp-over-tcp"],
            version: clashProxy["udp-over-tcp-version"] ?? 1,
        };
    }

    // singbox only support obfs/v2ray-plugin
    if (clashProxy.plugin === "obfs") {
        const opts = clashProxy["plugin-opts"];
        singboxOutbound.plugin = "obfs-local";
        singboxOutbound.plugin_opts = {
            mode: opts?.mode,
            host: opts?.host ?? "",
        };
    }

    applyMultiplex(clashProxy, singboxOutbound);
    return singboxOutbound;
}

export function trojan(clashProxy: any): any {
    const singboxOutbound: any = createCommonOutbound(clashProxy);
    singboxOutbound.password = clashProxy.password;

    applyTls(clashProxy, singboxOutbound);
    applyMultiplex(clashProxy, singboxOutbound);

    return singboxOutbound;
}

export function vless(clashProxy: any): any {
    const singboxOutbound: any = createCommonOutbound(clashProxy);
    singboxOutbound.uuid = clashProxy.uuid;
    singboxOutbound.flow = clashProxy.flow ?? "xtls-rprx-vision";

    if (clashProxy["packet-encoding"] !== undefined) {
        singboxOutbound.packet_encoding = clashProxy["packet-encoding"];
    }

    applyTls(clashProxy, singboxOutbound);
    applyMultiplex(clashProxy, singboxOutbound);

    return singboxOutbound;
}

export function anytls(clashProxy: any): any {
    const singboxOutbound: any = createCommonOutbound(clashProxy);
    singboxOutbound.password = clashProxy.password;

    if (clashProxy["idle-session-check-interval"] !== undefined) {
        singboxOutbound.idle_session_check_interval = clashProxy["idle-session-check-interval"];
    }
    if (clashProxy["idle-session-timeout"] !== undefined) {
        singboxOutbound.idle_session_timeout = clashProxy["idle-session-timeout"];
    }
    if (clashProxy["min-idle-session"] !== undefined) {
        singboxOutbound.min_idle_session = clashProxy["min-idle-session"];
    }

    applyTls(clashProxy, singboxOutbound);

    return singboxOutbound;
}
