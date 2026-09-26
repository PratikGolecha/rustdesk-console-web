export default {
  "menu.clientSetup": "Client Setup",
  "pages.clientSetup.title": "Client Setup",
  "pages.clientSetup.subtitle":
    "Give staff the server settings for their RustDesk clients so nobody has to type them.",
  "pages.clientSetup.loadFailed": "Failed to load client setup",
  "pages.clientSetup.notReady":
    "Client setup is not ready yet. An administrator has to set: {missing}.",
  "pages.clientSetup.copy": "Copy",
  "pages.clientSetup.copied": "Copied to clipboard",
  "pages.clientSetup.copyFailed":
    "Copy failed, select the text and copy manually",
  "pages.clientSetup.warning.title": "Please note",
  "pages.clientSetup.config.title": "Config string",
  "pages.clientSetup.config.desc":
    "Paste into RustDesk: Settings > Network > ID/Relay Server > Import server config, or use one of the commands below.",
  "pages.clientSetup.decoded": "Decoded contents",
  "pages.clientSetup.fileName.title": "Windows installer file name",
  "pages.clientSetup.fileName.desc":
    "Download the official RustDesk installer and rename it to this name. The client reads its server settings from its own file name.",
  "pages.clientSetup.fileName.licensed": "Licensed form (works for any values)",
  "pages.clientSetup.fileName.plain": "Readable form",
  "pages.clientSetup.fileName.unusable": "Not usable: {reason}",
  "pages.clientSetup.commands.title": "One-line setup per operating system",
  "pages.clientSetup.commands.desc":
    "RustDesk must already be installed. Run as administrator (Windows) or with sudo (macOS/Linux). This overwrites the client server settings.",
  "pages.clientSetup.os.windowsPowerShell":
    "Windows PowerShell (Run as administrator)",
  "pages.clientSetup.os.windowsCmd":
    "Windows Command Prompt (Run as administrator)",
  "pages.clientSetup.os.macos": "macOS Terminal",
  "pages.clientSetup.os.linux": "Linux shell",
  "pages.clientSetup.deepLink.title": "Mobile deep link",
  "pages.clientSetup.hbbs.title": "Relay servers (for the hbbs command)",
  "pages.clientSetup.hbbs.desc":
    "hbbs chooses a relay per connection, rotating through the healthy servers of this list (no geographic routing). Start hbbs with:",
  "pages.clientSetup.hbbs.none":
    "No relay servers configured; hbbs uses its own default.",
  "pages.clientSetup.settings.title":
    "Server connection settings (administrators)",
  "pages.clientSetup.settings.idServer": "ID / rendezvous server",
  "pages.clientSetup.settings.idServerExtra":
    "host or host:port of hbbs, for example id.example.com",
  "pages.clientSetup.settings.relayServers": "Relay servers",
  "pages.clientSetup.settings.relayServersExtra":
    "One host[:port] per entry (hbbr, default port 21117). Several are allowed: list them in the hbbs -r option.",
  "pages.clientSetup.settings.pinRelay": "Put the relay into the client config",
  "pages.clientSetup.settings.pinRelayExtra":
    "Only possible with exactly one relay. Leave off to let hbbs choose (recommended).",
  "pages.clientSetup.settings.apiServer": "API server URL",
  "pages.clientSetup.settings.apiServerExtra":
    "The URL of this console as seen from client machines. Empty uses the site backend URL from General settings.",
  "pages.clientSetup.settings.publicKey": "Public key override",
  "pages.clientSetup.settings.publicKeyExtra":
    "Normally read from the file set in RUSTDESK_KEY_FILE. Enter the id_ed25519.pub value here only to override it.",
  "pages.clientSetup.settings.keySource.file":
    "Key source: key file on the server",
  "pages.clientSetup.settings.keySource.manual": "Key source: manual override",
  "pages.clientSetup.settings.keySource.none": "No public key available",
  "pages.clientSetup.settings.save": "Save",
  "pages.clientSetup.settings.saveSuccess": "Client setup saved",
  "pages.clientSetup.settings.saveFailed": "Failed to save client setup",
};
