import { ComponentMessagePart, TextMessagePart } from "../types/AssistantTypes";

export type StructuredResponseItem = {
  type: "component";
  componentType: string;
  data: unknown;
  fallbackText?: string;
} | {
  type: "text";
  content: string;
};

const COMPONENT_REGEX = /<assistant-component\s+type="([^"]+)"(?:\s+fallback="([^"]*)")?>(.*?)<\/assistant-component>/gs;

export function parseStructuredResponse(text: string): StructuredResponseItem[] {
  const responses: StructuredResponseItem[] = [];
  let lastIndex = 0;
  
  let match;
  while ((match = COMPONENT_REGEX.exec(text)) !== null) {
    // Add preceding text as text response
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        responses.push({ type: "text", content: textContent });
      }
    }
    
    // Add component response
    try {
      const data = JSON.parse(match[3]);
      responses.push({
        type: "component",
        componentType: match[1],
        data,
        fallbackText: match[2],
      });
    } catch (e) {
      // Invalid JSON, treat as text
      responses.push({ type: "text", content: match[0] });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      responses.push({ type: "text", content: remainingText });
    }
  }
  
  // If no structured components found, return the original text
  return responses.length > 0 ? responses : [{ type: "text", content: text }];
}

export function convertStructuredResponseToMessageParts(
  structuredResponses: StructuredResponseItem[]
): (TextMessagePart | ComponentMessagePart)[] {
  return structuredResponses.map((response) => {
    if (response.type === "text") {
      return {
        type: "text" as const,
        text: response.content,
      };
    } else {
      return {
        type: "component" as const,
        componentType: response.componentType,
        data: response.data,
        fallbackText: response.fallbackText,
      };
    }
  });
}