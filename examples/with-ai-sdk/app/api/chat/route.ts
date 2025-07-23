import { openai } from "@ai-sdk/openai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { getAllComponentPrompts } from "@assistant-ui/react";
import { streamText } from "ai";
import { z } from "zod";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    toolCallStreaming: true,
    system: SYSTEM_PROMPT_WITH_COMPONENTS,
    tools: {
      ...frontendTools(tools),
      weather: {
        description: "Get weather information",
        parameters: z.object({
          location: z.string().describe("Location to get weather for"),
        }),
        execute: async ({ location }) => {
          return `The weather in ${location} is sunny.`;
        },
      },
    },
  });

  return result.toDataStreamResponse();
}


export const SYSTEM_PROMPT_WITH_COMPONENTS = `
You are a helpful assistant that can provide structured responses using custom components.

${getAllComponentPrompts()}

When users ask about:
- Menus, catalogs, or lists: Use the menu-options component
- Products, items, or shopping: Use the product-grid component  
- Data, statistics, or trends: Use the data-chart component

Always provide meaningful fallback text for accessibility and cases where components aren't available.
`;

// Example conversation starters that would trigger component rendering:
export const EXAMPLE_PROMPTS = {
  menu: "What are the menu options at a typical Italian restaurant?",
  products: "Show me some popular smartphone models and their prices",
  chart: "Create a chart showing quarterly sales data for a tech company",
};

