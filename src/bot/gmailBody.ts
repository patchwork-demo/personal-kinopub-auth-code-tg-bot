import { decodeGmailBody } from "./extractCode.ts";

export type MailBodies = { html?: string; plain?: string };

type MessagePart = {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: MessagePart[] | null;
};

function merge(a: MailBodies, b: MailBodies): MailBodies {
  return {
    html: a.html ?? b.html,
    plain: a.plain ?? b.plain,
  };
}

function fromPart(part: MessagePart): MailBodies {
  const mime = part.mimeType ?? "";
  const data = part.body?.data;
  if (!data) return {};

  if (mime === "text/html") {
    return { html: decodeGmailBody(data) };
  }
  if (mime === "text/plain") {
    return { plain: decodeGmailBody(data) };
  }
  return {};
}

/** Walk MIME tree; first HTML and first plain found are kept. */
export function collectBodiesFromPayload(
  payload: MessagePart | undefined
): MailBodies {
  if (!payload) return {};

  let acc: MailBodies = fromPart(payload);

  const parts = payload.parts;
  if (parts) {
    for (const p of parts) {
      acc = merge(acc, collectBodiesFromPayload(p));
    }
  }

  return acc;
}
