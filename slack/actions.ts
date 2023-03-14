import { apiClient } from "./client.ts";
import { CHANNEL_DEV_NULL } from "./constants.ts";

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

export async function sendMessageToThread(
  text: string,
  channel: string,
  thread_ts: string,
) {
  return await apiClient.chat.postMessage({
    text,
    channel,
    thread_ts,
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
    channel: CHANNEL_DEV_NULL,
    username: display_name,
    icon_url: image_72,
    ...args,
  });
  return result;
}

export async function getEntireMessagesOfThread(channel: string, ts: string) {
  const results = [];
  let cursor = undefined;
  while (true) {
    const result: any = await apiClient.conversations.replies({
      channel,
      ts,
      limit: 200,
      cursor,
    });
    if (!result.ok) {
      console.error("error at getEntireMessageOfThread", result.error);
      return [];
    }

    // skip first message after second loop because first message of array is always the thread parent message
    results.push(...(cursor ? result.messages.slice(1) : result.messages));

    if (result.has_more) {
      cursor = result.response_metadata?.next_cursor;
    } else {
      break;
    }
  }

  // sort by ts. somehow slack returns response new to old
  return results.sort((a, b) => a.ts - b.ts);
}

export async function expandThread(
  toChannel: string,
  fromChannel: string,
  ts: string,
) {
  const messages = await getEntireMessagesOfThread(fromChannel, ts);
  for (const message of messages) {
    await sendMessageAsUser({
      text: message.text,
      channel: toChannel,
    }, message.user);
    console.info(`sent request ${message.text} by ${message.user}`);
  }
}

export async function createChannel(name: string) {
  const createResult = await apiClient.conversations.create({
    name,
  });
  if (!createResult.ok) {
    console.error("error at createChannel.create", createResult.error);
  }
  return createResult;
}

export async function setTopic(channelId: string, topic: string) {
  const topicResult = await apiClient.conversations.setTopic({
    channel: channelId,
    topic,
  });
  if (!topicResult.ok) {
    console.error("error at createChannel.setTopic", topicResult.error);
  }
  return topicResult;
}
