import { apiClient } from "../client.ts";

function createView(channel_name: string) {
  return {
    title: {
      type: "plain_text",
      text: "Error!",
      emoji: true,
    },
    type: "modal",
    close: {
      type: "plain_text",
      text: "OK",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Already created a channel named #${channel_name}.  Please check the channel and rename the channel if needed.`,
        },
      },
    ],
  };
}

export const showNameTakenErrorModal = async (
  channel_name: string,
  trigger_id?: string,
  interactivity_pointer?: string
) => {
  await apiClient.views.open({
    view: createView(channel_name),
    trigger_id,
    interactivity_pointer,
  });
};
