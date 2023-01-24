import { SocketModeClient } from "https://deno.land/x/slack_socket_mode@1.0.3/mod.ts";
import { SlackAPI } from "https://deno.land/x/deno_slack_api@1.5.0/mod.ts";

const Consts = {
  CHANNEL_DEV_NULL: "C04LA6ST1D2",
};

const socketToken = Deno.env.get("SLACK_SOCKET_TOKEN");
if (!socketToken) Deno.exit(1);
export const socketModeClient = new SocketModeClient({ appToken: socketToken });

const apiToken = Deno.env.get("SLACK_OAUTH_TOKEN");
if (!apiToken) Deno.exit(1);
export const apiClient = SlackAPI(apiToken);

const userInfoCache: { [key: string]: any } = {};
export async function getUserInfo(userId: string) {
  if (userId in userInfoCache) {
    return userInfoCache[userId];
  }
  const res = await apiClient.users.info({ user: userId });
  if (res.ok) {
    const { user } = res;
    userInfoCache[userId] = user;
    console.debug(`fetched: ${userId}, ${user.name}`);
    return user;
  } else {
    console.warn(`can't find user ${userId}. ${res.error}`);
    return null;
  }
}

export function isBotItselfMessage(body: any) {
  const { api_app_id, event } = body;
  return event.subtype === "bot_message" && api_app_id === event.app_id;
}

export async function sendMessageToThread(text: string, channel: string, thread_ts: string) {
  return await apiClient.chat.postMessage({
    text,
    channel,
    thread_ts
  });
}

/*
 * [x] text support
 * [ ] attachment support
 */
export async function sendMessageAsUser(args: any, userId: string) {
  const { profile: { display_name, image_72 } } = await getUserInfo(userId);

  if (!args.text) {
    console.warn(`unsupported request: ${args}`);
    return;
  }

  const text = args.text as string;
  const result = await apiClient.chat.postMessage({
    text,
    channel: Consts.CHANNEL_DEV_NULL,
    username: display_name,
    icon_url: image_72,
    ...args
  });
  return result;
}

export async function getEntireMessagesOfThread(channel: string, ts: string) {
  const results = []
  let cursor = undefined
  while(true) {
    const result: any = await apiClient.conversations.replies({
      channel,
      ts,
      limit: 200,
      cursor
    });
    if(!result.ok) {
      console.error('error at getEntireMessageOfThread', result.error);
      return [];
    }

    // skip first message after second loop because first message of array is always the thread parent message
    results.push(...(cursor ? result.messages.slice(1) : result.messages));

    if(result.has_more) {
      cursor = result.response_metadata?.next_cursor
    } else {
      break;
    } 
  }

  // sort by ts. somehow slack returns response new to old
  return results.sort((a, b) => a.ts - b.ts);
}

export async function expandThread(toChannel: string, fromChannel: string, ts: string) {
  const messages = await getEntireMessagesOfThread(fromChannel, ts);
  for (const message of messages) {
    await sendMessageAsUser({
      text: message.text,
      channel: toChannel
    }, message.user)
    console.info(`sent request ${message.text} by ${message.user}`)
  }
}

export async function createChannel(name: string, topic: string) {
  console.info(name, topic)
  const createResult = await apiClient.conversations.create({
    name
  });
  if(!createResult.ok) {
    console.error("error at createChannel.create", createResult.error)
    return createResult
  }

  const topicResult = await apiClient.conversations.setTopic({
    channel: createResult.channel.id,
    topic
  })
  if(!topicResult.ok) {
    console.error("error at createChannel.setTopic", topicResult.error)
  }
  return topicResult
}