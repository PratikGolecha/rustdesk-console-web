import { request } from "@umijs/max";

export type ClientConfigSettings = {
  idServer: string;
  relayServers: string[];
  pinRelay: boolean;
  apiServer: string;
  /** manual override only */
  publicKey: string;
  effectiveKey: string;
  keySource: "manual" | "file" | "none";
  keyFile: { configured: boolean; error?: string };
};

export type ClientConfigUpdate = Partial<
  Pick<
    ClientConfigSettings,
    "idServer" | "relayServers" | "pinRelay" | "apiServer" | "publicKey"
  >
>;

export type FileNameArtifact = {
  filename: string;
  verified: boolean;
  reason?: string;
};

export type ClientSetup = {
  ready: boolean;
  missing: string[];
  warnings?: string[];
  server: {
    idServer: string;
    relayServers: string[];
    relayPinned: boolean;
    apiServer: string;
    publicKey: string;
    keySource: "manual" | "file" | "none";
  };
  hbbs: { relayArgument: string; defaultRelayPort: number };
  config?: {
    string: string;
    json: { key: string; host: string; api: string; relay: string };
    fileNames: { licensed: FileNameArtifact; plain: FileNameArtifact };
    deepLink: { url: string; note: string };
    commands: {
      windowsPowerShell: string;
      windowsCmd: string;
      macos: string;
      linux: string;
    };
  };
};

export async function getClientConfigSettings() {
  return request<ClientConfigSettings>("/api/client-config/settings", {
    method: "GET",
  });
}

export async function updateClientConfigSettings(data: ClientConfigUpdate) {
  return request<ClientConfigSettings>("/api/client-config/settings", {
    method: "PUT",
    data,
  });
}

export async function getClientSetup() {
  return request<ClientSetup>("/api/client-config/setup", { method: "GET" });
}
