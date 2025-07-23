import { 
  AssistantRuntime,
  ChatModelAdapter, 
  ChatModelRunOptions,
  useLocalRuntime,
  INTERNAL 
} from "@assistant-ui/react";
import { 
  UseChatRuntimeOptions, 
  useChatRuntime 
} from "@assistant-ui/react-ai-sdk";
import {
  DataStreamDecoder,
  unstable_toolResultStream,
  AssistantMessageAccumulator,
} from "assistant-stream";
import { asAsyncIterableStream } from "assistant-stream/utils";
import { componentParseStream } from "./componentParseStream";
import { toLanguageModelMessages } from "@assistant-ui/react-ai-sdk";

const { splitLocalRuntimeOptions } = INTERNAL;

class ComponentAwareChatAdapter implements ChatModelAdapter {
  constructor(
    private options: Omit<UseChatRuntimeOptions, keyof any>,
  ) {}

  async *run({
    messages,
    runConfig,
    abortSignal,
    context,
    unstable_assistantMessageId,
    unstable_getMessage,
  }: ChatModelRunOptions) {
    const headersValue =
      typeof this.options.headers === "function"
        ? await this.options.headers()
        : this.options.headers;

    abortSignal.addEventListener(
      "abort",
      () => {
        if (!abortSignal.reason?.detach) this.options.onCancel?.();
      },
      { once: true },
    );

    const headers = new Headers(headersValue);
    headers.set("Content-Type", "application/json");

    const result = await fetch(this.options.api, {
      method: "POST",
      headers,
      credentials: this.options.credentials ?? "same-origin",
      body: JSON.stringify({
        system: context.system,
        messages: toLanguageModelMessages(messages, {
          unstable_includeId: this.options.sendExtraMessageFields,
        }),
        tools: Object.fromEntries(
          Object.entries(context.tools ?? {}).map(([name, tool]) => [
            name,
            {
              ...(tool.description ? { description: tool.description } : undefined),
              parameters: tool.parameters,
            },
          ]),
        ),
        ...(unstable_assistantMessageId ? { unstable_assistantMessageId } : {}),
        runConfig,
        state: unstable_getMessage().metadata.unstable_state || undefined,
        ...context.callSettings,
        ...context.config,
        ...this.options.body,
      }),
      signal: abortSignal,
    });

    await this.options.onResponse?.(result);

    try {
      if (!result.ok) {
        throw new Error(`Status ${result.status}: ${await result.text()}`);
      }
      if (!result.body) {
        throw new Error("Response body is null");
      }

      // Add component parsing to the stream pipeline
      const stream = result.body
        .pipeThrough(new DataStreamDecoder())
        .pipeThrough(unstable_toolResultStream(context.tools, abortSignal))
        .pipeThrough(new AssistantMessageAccumulator())
        .pipeThrough(componentParseStream()); // Add our component parser

      yield* asAsyncIterableStream(stream);

      this.options.onFinish?.(unstable_getMessage());
    } catch (error: unknown) {
      this.options.onError?.(error as Error);
      throw error;
    }
  }
}

export const useChatRuntimeWithComponents = (
  options: UseChatRuntimeOptions,
): AssistantRuntime => {
  const { localRuntimeOptions, otherOptions } =
    splitLocalRuntimeOptions(options);

  return useLocalRuntime(
    new ComponentAwareChatAdapter(otherOptions),
    localRuntimeOptions,
  );
};