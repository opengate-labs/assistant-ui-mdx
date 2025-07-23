import {
  LanguageModelV1FilePart,
  LanguageModelV1ImagePart,
  LanguageModelV1Message,
  LanguageModelV1TextPart,
  LanguageModelV1ToolCallPart,
  LanguageModelV1ToolResultPart,
} from "@ai-sdk/provider";
import {
  TextMessagePart,
  ThreadMessage,
  ToolCallMessagePart,
} from "@assistant-ui/react";

const assistantMessageSplitter = () => {
  const stash: LanguageModelV1Message[] = [];
  let assistantMessage = {
    role: "assistant" as const,
    content: [] as (LanguageModelV1TextPart | LanguageModelV1ToolCallPart)[],
  };
  let toolMessage = {
    role: "tool" as const,
    content: [] as LanguageModelV1ToolResultPart[],
  };

  return {
    addTextMessagePart: (part: TextMessagePart) => {
      if (toolMessage.content.length > 0) {
        stash.push(assistantMessage);
        stash.push(toolMessage);

        assistantMessage = {
          role: "assistant" as const,
          content: [] as (
            | LanguageModelV1TextPart
            | LanguageModelV1ToolCallPart
          )[],
        };

        toolMessage = {
          role: "tool" as const,
          content: [] as LanguageModelV1ToolResultPart[],
        };
      }

      assistantMessage.content.push(part);
    },
    addToolCallPart: (part: ToolCallMessagePart) => {
      assistantMessage.content.push({
        type: "tool-call",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
      });

      toolMessage.content.push({
        type: "tool-result",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        ...("artifact" in part ? { artifact: part.artifact } : {}),
        result:
          part.result === undefined
            ? "Error: tool is has no configured code to run"
            : part.result,
        isError: part.isError ?? part.result === undefined,
      });
    },
    getMessages: () => {
      if (toolMessage.content.length > 0) {
        return [...stash, assistantMessage, toolMessage];
      }

      return [...stash, assistantMessage];
    },
  };
};

/**
 * @deprecated This is an internal API and may change without notice.
 */
export function toLanguageModelMessages(
  message: readonly ThreadMessage[],
  options: { unstable_includeId?: boolean | undefined } = {},
): LanguageModelV1Message[] {
  const includeId = options.unstable_includeId ?? false;
  return message.flatMap((message) => {
    const role = message.role;
    switch (role) {
      case "system": {
        return [
          {
            ...(includeId
              ? { unstable_id: (message as ThreadMessage).id }
              : {}),
            role: "system",
            content: message.content[0].text,
          },
        ];
      }

      case "user": {
        const attachments = "attachments" in message ? message.attachments : [];
        const content = [
          ...message.content,
          ...attachments.map((a) => a.content).flat(),
        ];
        const msg: LanguageModelV1Message = {
          ...(includeId ? { unstable_id: (message as ThreadMessage).id } : {}),
          role: "user",
          content: content.map(
            (
              part,
            ):
              | LanguageModelV1TextPart
              | LanguageModelV1ImagePart
              | LanguageModelV1FilePart => {
              const type = part.type;
              switch (type) {
                case "text": {
                  return part;
                }

                case "image": {
                  return {
                    type: "image",
                    image: new URL(part.image),
                  };
                }

                case "file": {
                  return {
                    type: "file",
                    data: new URL(part.data),
                    mimeType: part.mimeType,
                  };
                }

                default: {
                  const unhandledType: "audio" = type;
                  throw new Error(
                    `Unspported message part type: ${unhandledType}`,
                  );
                }
              }
            },
          ),
        };
        return [msg];
      }

      case "assistant": {
        const splitter = assistantMessageSplitter();
        for (const part of message.content) {
          const type = part.type;
          switch (type) {
            case "reasoning":
            case "source":
            case "file": {
              break; // reasoning, source, and file parts are omitted
            }

            case "text": {
              splitter.addTextMessagePart(part);
              break;
            }
            case "tool-call": {
              splitter.addToolCallPart(part);
              break;
            }
            case "component": {
              // Convert component back to its original text representation
              const componentText = `<assistant-component type="${part.componentType}"${part.fallbackText ? ` fallback="${part.fallbackText}"` : ''}>\n${JSON.stringify(part.data, null, 2)}\n</assistant-component>`;
              splitter.addTextMessagePart({
                type: "text",
                text: componentText,
              });
              break;
            }
            default: {
              const unhandledType: never = type;
              throw new Error(`Unhandled message part type: ${unhandledType}`);
            }
          }
        }
        return splitter.getMessages();
      }

      default: {
        const unhandledRole: never = role;
        throw new Error(`Unknown message role: ${unhandledRole}`);
      }
    }
  });
}
