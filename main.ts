import {
  socketModeClient,
} from "./slack/index.ts";
import { MigrateThreadJob } from "./jobs/expandThreadJob.ts";

socketModeClient.addEventListener(
  "slack_event",
  async ({ detail: { body, ack } }) => {
    if (body.type != "message_action") return;

    ack();

    const migrage = new MigrateThreadJob(
      body.channel.id,
      body.channel.name,
      body.message.thread_ts,
    );
    const result = await migrage.run();
    if (!result) {
      console.error(migrage.errors);
    }
  },
);

await socketModeClient.start();
