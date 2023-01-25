import {
  createChannel,
  expandThread,
  isBotItselfMessage,
  sendMessageAsUser,
  sendMessageToThread,
  socketModeClient,
} from "./slack/index.ts";

socketModeClient.addEventListener("message", ({ detail: { body, ack } }) => {
  ack();
  const { event: { text, username } } = body;
  console.info(`got message "${text}" by ${username}`);
});
socketModeClient.addEventListener(
  "app_mention",
  async ({ detail: { body, ack } }) => {
    ack();
    const { event } = body;
    if (isBotItselfMessage(body)) {
      console.info("Skip app_mention because this is my message");
      return;
    }

    const { text, user } = event;
    console.info(`got mention "${text}" by ${user}`);
    const result = await sendMessageAsUser({
      text,
    }, user);
    console.log(result);
  },
);
socketModeClient.addEventListener(
  "slack_event",
  async ({ detail: { body, ack } }) => {
    if (body.type != "message_action") return;

    ack();

    const threadDate = new Date(body.message.thread_ts * 1000);
    const datetime =
      `${threadDate.getUTCFullYear()}-${threadDate.getMonth()}-${threadDate.getUTCDay()}-${threadDate.getHours()}-${threadDate.getMinutes()}`;
    const channel = await createChannel(
      `talk-at-${body.channel.name.slice(0, 10)}-${datetime}abs`,
      `copy of conversation at [URL]`,
    );
    if (!channel.ok) {
      console.error("something wrong");
      return;
    }
    await expandThread(
      channel.channel.id,
      body.channel.id,
      body.message.thread_ts,
    );
    await sendMessageToThread(
      `このスレッドは <#${channel.channel.id}> に移行しました。`,
      body.channel.id,
      body.message.thread_ts,
    );
  },
);

await socketModeClient.start();
