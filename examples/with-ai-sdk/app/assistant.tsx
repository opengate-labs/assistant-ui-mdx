"use client";

import { AssistantRuntimeProvider, makeAssistantComponentUI } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";

const MenuItem = makeAssistantComponentUI({
  componentType: 'menu-options',
  render: ({data, status,componentType,fallbackText}) => {
    console.log("------ MenuItem render - status:", status, "data:", data)

    // Handle running state or null data (component still streaming)
    if (status.type === 'running' || data === null) {
      console.log("RUNNING/NULL DATA")
      return <div style={{ padding: '16px', border: '2px dashed #ccc', borderRadius: '8px' }}>
        <div>🍽️ Loading menu...</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Preparing delicious options for you
        </div>
      </div>
    }

    if (status.type === 'incomplete') {
      console.log("INCOMPLETE")
      return <div style={{ padding: '16px', border: '2px solid #f44336', borderRadius: '8px', color: '#f44336' }}>
        Incomplete: {status.reason}
      </div>
    }

    console.log("COMPLETE - rendering with data:", data)

    // Render the actual menu
    return <div style={{ 
      padding: '16px', 
      border: '2px solid #4caf50', 
      borderRadius: '8px', 
      backgroundColor: '#f9f9f9' 
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#2e7d32' }}>
        🍽️ {data?.title || 'Menu'}
      </h3>
      {data?.categories?.map((category, idx) => (
        <div key={idx} style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
            {category.name}
          </h4>
          {category.items?.map((item, itemIdx) => (
            <div key={itemIdx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px',
              marginBottom: '4px',
              backgroundColor: 'white',
              borderRadius: '4px'
            }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                {item.description && (
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {item.description}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 'bold', color: '#4caf50' }}>
                {item.price}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>

  }
})

export const Assistant = () => {
  const runtime = useChatRuntime({
    api: "/api/chat",
    onFinish: (message) => {
      console.log('Message finished:', message);
    }
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Register the component - it will be rendered automatically when AI uses it */}
      <MenuItem />
      
      <div className="grid h-dvh gap-x-2 px-4 py-4">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
};
