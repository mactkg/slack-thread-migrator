import { apiClient } from "../client.ts";

const view = {
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
        type: "plain_text",
        text: "I can't read messages because I'm not in the channel. Please invite me!",
        emoji: true,
      },
    },
  ],
};

export const showNoPermissionModal = async (
  trigger_id?: string,
  interactivity_pointer?: string
) => {
  await apiClient.views.open({
    view,
    trigger_id,
    interactivity_pointer,
  });
};
