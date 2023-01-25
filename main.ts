import {
  isBotItselfMessage,
  sendMessageAsUser,
  socketModeClient,
} from "./slack/index.ts";
import { ExpandThreadJob } from "./jobs/expandThreadJob.ts";

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

    const expanding = new ExpandThreadJob(
      body.channel.id,
      body.channel.name,
      body.message.thread_ts,
    );
    const result = await expanding.run();
    if (!result) {
      console.error(expanding.errors);
    }
  },
);

await socketModeClient.start();
