import { SocketModeClient } from "https://deno.land/x/slack_socket_mode@1.0.3/mod.ts";
import { SlackAPI } from "https://deno.land/x/deno_slack_api@1.5.0/mod.ts";

const socketToken = Deno.env.get("SLACK_SOCKET_TOKEN");
if (!socketToken) Deno.exit(1);
export const socketModeClient = new SocketModeClient({ appToken: socketToken });

const apiToken = Deno.env.get("SLACK_OAUTH_TOKEN");
if (!apiToken) Deno.exit(1);
export const apiClient = SlackAPI(apiToken);
