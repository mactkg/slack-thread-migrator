import { NameTakenError, NotInChannelError } from "../slack/actions.ts";
import {
  createChannel,
  expandThread,
  sendMessageToThread,
  setTopic,
} from "../slack/index.ts";
import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";
import { showNoPermissionModal } from "../slack/views/NoPermissionModal.ts";
import { showNameTakenErrorModal } from "../slack/views/NameTakenErrorModal.ts";

export class MigrateThreadJob {
  errors: string[] = [];

  constructor(
    private channelId: string,
    private channelName: string,
    private thread_ts: string,
    private trigger_id: string
  ) {}

  async run(): Promise<boolean> {
    try {
      return await this._run();
    } catch (e) {
      if (e instanceof NotInChannelError) {
        await showNoPermissionModal(this.trigger_id);
      } else if (e instanceof NameTakenError) {
        await showNameTakenErrorModal(e.channel_name, this.trigger_id);
      }

      return false;
    }
  }

  async _run() {
    const channel = await createChannel(this.migrateChannelName());
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
