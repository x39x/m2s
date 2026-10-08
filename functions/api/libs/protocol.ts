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

    const tlsEnabled = clashProxy.tls ?? !!serverName;
    if (!tlsEnabled) {
        return;
    }

    const tlsConfig: any = {
        enabled: true,
        server_name: serverName ?? clashProxy.server,
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

// port from https://github.com/MetaCubeX/mihomo/blob/Meta/common/utils/mbps.go
function toMbps(value: string | number): number {
    const s = String(value).trim();

    // 没有单位，默认 Mbps
    if (/^\d+$/.test(s)) {
        return Number(s);
    }

    const match = s.match(/^(\d+)\s*([KMGTP]?)(b|B)?$/i);
    if (!match) {
        return 0;
    }

    let result = Number(match[1]);
    const unit = match[2].toUpperCase();
    const type = match[3]?.toLowerCase();

    switch (unit) {
        case "K":
            result *= 1000;
            break;
        case "M":
            result *= 1000 ** 2;
            break;
        case "G":
            result *= 1000 ** 3;
            break;
        case "T":
            result *= 1000 ** 4;
            break;
    }

    // bit → byte
    if (type === "b") {
        result /= 8;
    }

    // Bps → Mbps
    return result / 1000 ** 2;
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
export function vmess(clashProxy: any): any {
    const singboxOutbound: any = createCommonOutbound(clashProxy);

    singboxOutbound.uuid = clashProxy.uuid;
    singboxOutbound.alter_id = clashProxy.alterId;
    singboxOutbound.security = clashProxy.cipher;

    for (const [clashKey, singboxKey] of [
        ["packet-encoding", "packet_encoding"],
        ["global-padding", "global_padding"],
        ["authenticated-length", "authenticated_length"],
    ]) {
        if (clashProxy[clashKey] !== undefined) {
            singboxOutbound[singboxKey] = clashProxy[clashKey];
        }
    }

    // V2Ray transport
    const { network } = clashProxy;
    const opts = network ? clashProxy[`${network}-opts`] : undefined;

    switch (network) {
        case undefined:
            break;

        case "http":
            if (opts) {
                singboxOutbound.transport = {
                    type: "http",
                    ...(opts.method !== undefined && { method: opts.method }),
                    ...(opts.path !== undefined && { path: opts.path }),
                    ...(opts.headers !== undefined && { headers: opts.headers }),
                };
            }
            break;

        case "ws": {
            if (!opts) {
                break;
            }
            const httpUpgrade = opts["v2ray-http-upgrade"] === true;

            singboxOutbound.transport = {
                type: httpUpgrade ? "httpupgrade" : "ws",
                ...(opts.path !== undefined && { path: opts.path }),
                ...(opts.headers !== undefined && { headers: opts.headers }),
            };

            if (httpUpgrade) {
                if (opts.headers?.Host !== undefined) {
                    singboxOutbound.transport.host = opts.headers.Host;
                }
            } else {
                if (opts["max-early-data"] !== undefined) {
                    singboxOutbound.transport.max_early_data = opts["max-early-data"];
                }
                if (opts["early-data-header-name"] !== undefined) {
                    singboxOutbound.transport.early_data_header_name =
                        opts["early-data-header-name"];
                }
            }
            break;
        }
        default:
            return;
    }

    applyTls(clashProxy, singboxOutbound);
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

    if (clashProxy.flow !== undefined) {
        singboxOutbound.flow = clashProxy.flow;
    }
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

export function hysteria2(clashProxy: any): any {
    if (clashProxy["realm-opts"]?.enable === true) {
        return;
    }

    const singboxOutbound: any = createCommonOutbound(clashProxy);
    if (clashProxy.ports !== undefined) {
        singboxOutbound.server_ports = String(clashProxy.ports)
            .split(/[/,]/)
            .map((port) => port.replace("-", ":"));
    }
    if (clashProxy.password !== undefined) {
        singboxOutbound.password = clashProxy.password;
    }

    if (clashProxy["hop-interval"] !== undefined) {
        const interval = String(clashProxy["hop-interval"]).trim();
        const [min, max] = interval.split("-", 2);

        singboxOutbound.hop_interval = /^\d+$/.test(min) ? `${min}s` : min;

        if (max !== undefined) {
            singboxOutbound.hop_interval_max = /^\d+$/.test(max) ? `${max}s` : max;
        }
    }

    if (clashProxy.up !== undefined) {
        singboxOutbound.up_mbps = toMbps(clashProxy.up);
    }
    if (clashProxy.down !== undefined) {
        singboxOutbound.down_mbps = toMbps(clashProxy.down);
    }
    if (clashProxy["bbr-profile"] !== undefined) {
        singboxOutbound.bbr_profile = clashProxy["bbr-profile"];
    }

    if (clashProxy.obfs !== undefined) {
        singboxOutbound.obfs = {
            type: clashProxy.obfs,
            ...(clashProxy["obfs-password"] !== undefined && {
                password: clashProxy["obfs-password"],
            }),
            ...(clashProxy["obfs-min-packet-size"] !== undefined && {
                min_packet_size: clashProxy["obfs-min-packet-size"],
            }),
            ...(clashProxy["obfs-max-packet-size"] !== undefined && {
                max_packet_size: clashProxy["obfs-max-packet-size"],
            }),
        };
    }

    applyTls(clashProxy, singboxOutbound);

    return singboxOutbound;
}
