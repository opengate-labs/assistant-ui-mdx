// Component parsing transform stream for assistant-stream
// This follows the same pattern as toolResultStream

import { AssistantMessage } from "@assistant-ui/react";

// Regex to match assistant-component tags
const COMPONENT_REGEX = /<assistant-component\s+type="([^"]+)"(?:\s+fallback="([^"]*)")?>(.*?)<\/assistant-component>/gs;

interface ComponentPart {
  type: "component";
  componentType: string;
  data: unknown;
  fallbackText?: string;
}

interface TextPart {
  type: "text";
  text: string;
}

function parseStructuredResponse(text: string): (ComponentPart | TextPart)[] {
  const responses: (ComponentPart | TextPart)[] = [];
  let lastIndex = 0;
  
  let match;
  while ((match = COMPONENT_REGEX.exec(text)) !== null) {
    // Add preceding text as text response
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        responses.push({ type: "text", text: textContent });
      }
    }
    
    // Add component response
    try {
      const data = JSON.parse(match[3]);
      responses.push({
        type: "component",
        componentType: match[1],
        data,
        fallbackText: match[2] || undefined,
      });
    } catch (e) {
      // Invalid JSON, treat as text
      responses.push({ type: "text", text: match[0] });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      responses.push({ type: "text", text: remainingText });
    }
  }
  
  // If no structured components found, return the original text
  return responses.length > 0 ? responses : [{ type: "text", text }];
}

export function componentParseStream(): TransformStream<AssistantMessage, AssistantMessage> {
  let pendingComponent: {
    type: string;
    fallbackText?: string;
    buffer: string;
  } | null = null;

  return new TransformStream({
    transform(message, controller) {
      // Only process assistant messages
      if (message.role !== "assistant") {
        controller.enqueue(message);
        return;
      }

      // Look for text parts that might contain components
      let hasComponents = false;
      const newParts = [];

      for (const part of message.parts) {
        if (part.type === "text") {
          const text = part.text;
          
          // Early detection: Look for the start of assistant-component tags
          if (text.includes('<assistant-com') || text.includes('<assistant-component')) {
            console.log('Early component detection in text:', text.substring(text.indexOf('<assistant-com'), text.indexOf('<assistant-com') + 50));
            
            // Check for complete component first
            const completeComponentRegex = /<assistant-component\s+type="([^"]+)"(?:\s+fallback="([^"]*)")?>(.*?)<\/assistant-component>/gs;
            let completeMatch = completeComponentRegex.exec(text);
            
            if (completeMatch) {
              // Complete component - parse normally
              hasComponents = true;
              const structuredParts = parseStructuredResponse(text);
              newParts.push(...structuredParts);
              pendingComponent = null; // Clear any pending component
            } else {
              // Incomplete component - check if we can extract type
              const partialTagRegex = /<assistant-component(?:\s+type="([^"]*)"?)?(?:\s+fallback="([^"]*)"?)?/g;
              let partialMatch = partialTagRegex.exec(text);
              
              if (partialMatch && partialMatch[1]) {
                // We have at least the component type
                hasComponents = true;
                console.log('Creating loading component for type:', partialMatch[1]);
                
                // Store pending component info
                pendingComponent = {
                  type: partialMatch[1],
                  fallbackText: partialMatch[2],
                  buffer: text
                };
                
                // Add text before the component tag
                const beforeComponent = text.substring(0, partialMatch.index);
                if (beforeComponent.trim()) {
                  newParts.push({ type: "text", text: beforeComponent });
                }
                
                // Add loading component
                newParts.push({
                  type: "component",
                  componentType: partialMatch[1],
                  data: null, // No data yet - will show loading
                  fallbackText: partialMatch[2] || undefined,
                });
                
                // Don't add the remaining text since it's part of the component
              } else if (text.includes('<assistant-com')) {
                // Very early detection - just "<assistant-com"
                hasComponents = true;
                console.log('Very early component detection, creating generic loading component');
                
                // Add text before the component start
                const beforeComponent = text.substring(0, text.indexOf('<assistant-com'));
                if (beforeComponent.trim()) {
                  newParts.push({ type: "text", text: beforeComponent });
                }
                
                // Add generic loading component
                newParts.push({
                  type: "component",
                  componentType: "menu-options", // Default assumption
                  data: null, // No data yet - will show loading
                  fallbackText: undefined,
                });
                
                pendingComponent = {
                  type: "menu-options",
                  buffer: text
                };
              }
            }
          } else if (pendingComponent && text.includes('</assistant-component>')) {
            // We had a pending component and now we see the closing tag
            hasComponents = true;
            console.log('Completing pending component with closing tag');
            
            // Try to parse the complete component from the combined buffer
            const completeText = pendingComponent.buffer + text;
            const structuredParts = parseStructuredResponse(completeText);
            
            if (structuredParts.length > 0 && structuredParts.some(p => p.type === "component")) {
              // Successfully parsed complete component
              newParts.push(...structuredParts);
            } else {
              // Failed to parse, keep as text
              newParts.push({ type: "text", text: completeText });
            }
            
            pendingComponent = null;
          } else {
            // No component indicators, keep as text
            newParts.push(part);
          }
        } else {
          // Keep non-text parts unchanged
          newParts.push(part);
        }
      }

      if (hasComponents) {
        const updatedMessage = {
          ...message,
          parts: newParts,
          content: newParts,
        };
        
        console.log('Emitting message with components:', updatedMessage);
        controller.enqueue(updatedMessage);
      } else {
        // No components found, pass through unchanged
        controller.enqueue(message);
      }
    }
  });
}