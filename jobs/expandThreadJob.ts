import {
  createChannel,
  expandThread,
  sendMessageToThread,
  setTopic,
} from "../slack/index.ts";
import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

export class MigrateThreadJob {
  errors: string[] = [];

  constructor(
    private channelId: string,
    private channelName: string,
    private thread_ts: string,
  ) {}

  async run() {
    const channel = await createChannel(
      this.migrateChannelName(),
    );
    if (!channel.ok) {
      if (channel.error) {
        this.errors.push(channel.error);
      }
      return false;
    }

    const topic = await setTopic(
      channel.channel.id,
      this.migrateChannelTopic()
    );
    if (!topic.ok) {
      if (topic.error) {
        this.errors.push(topic.error);
      }
      return false;
    }

    await expandThread(channel.channel.id, this.channelId, this.thread_ts);

    const notifyRes = await sendMessageToThread(
      `このスレッドは <#${channel.channel.id}> に移行しました。`,
      this.channelId,
      this.thread_ts
    );
    if (!notifyRes.ok && channel.error) {
      this.errors.push(channel.error);
    }
    return notifyRes.ok;
  }

  private migrateChannelName() {
    return `talk-at-${this.channelName.slice(0, 10)}-${this.channelDateTime()}`;
  }

  private migrateChannelTopic() {
    return `copy of conversation at [URL]`;
  }

  private tsInMs(): number {
    return parseFloat(this.thread_ts) * 1000;
  }

  private channelDateTime() {
    const date = datetime(this.tsInMs());
    return date.format("YYYY-MM-dd-hh-mm");
  }
}
