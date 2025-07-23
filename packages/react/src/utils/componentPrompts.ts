/**
 * Pre-built prompt templates for common structured component responses.
 * 
 * These can be added to your system prompts or model instructions to enable
 * structured component rendering for common use cases.
 */

export const STRUCTURED_RESPONSE_SYSTEM_PROMPT = `
When responding with structured data that should render as custom components instead of plain text, use this format:

<assistant-component type="COMPONENT_TYPE" fallback="Optional fallback text">
{
  "key": "value",
  "data": "here"
}
</assistant-component>

The component type determines which custom React component will render the data.
The fallback text is shown if no component is registered for that type.
The JSON data inside will be passed as props to the component.

Available component types you can use:
`;

export const MENU_COMPONENT_PROMPT = `
- menu-options: For restaurant menus, product catalogs, or option lists
  Example:
  <assistant-component type="menu-options" fallback="Menu: Pizza $12, Pasta $10">
  {
    "title": "Restaurant Menu",
    "categories": [
      {
        "name": "Main Dishes",
        "items": [
          {"name": "Margherita Pizza", "price": "$12.99", "description": "Fresh tomatoes and mozzarella"},
          {"name": "Spaghetti Carbonara", "price": "$10.99", "description": "Creamy pasta with pancetta"}
        ]
      }
    ]
  }
  </assistant-component>
`;

export const PRODUCT_GRID_PROMPT = `
- product-grid: For product listings, search results, or item grids
  Example:
  <assistant-component type="product-grid" fallback="Products: iPhone, MacBook, iPad">
  {
    "title": "Featured Products",
    "products": [
      {
        "id": "iphone15",
        "name": "iPhone 15 Pro",
        "price": "$999",
        "image": "/images/iphone15.jpg",
        "rating": 4.8,
        "inStock": true
      }
    ]
  }
  </assistant-component>
`;

export const DATA_CHART_PROMPT = `
- data-chart: For charts, graphs, or data visualizations
  Example:
  <assistant-component type="data-chart" fallback="Sales data: Q1: 100, Q2: 150, Q3: 120, Q4: 180">
  {
    "title": "Quarterly Sales Report",
    "type": "line",
    "data": {
      "labels": ["Q1", "Q2", "Q3", "Q4"],
      "datasets": [{
        "label": "Sales ($k)",
        "data": [100, 150, 120, 180],
        "borderColor": "rgb(75, 192, 192)"
      }]
    }
  }
  </assistant-component>
`;

export const CARD_LIST_PROMPT = `
- card-list: For information cards, feature lists, or step-by-step processes
  Example:
  <assistant-component type="card-list" fallback="Steps: 1. Plan 2. Design 3. Build 4. Test">
  {
    "title": "Development Process",
    "cards": [
      {
        "title": "Plan",
        "description": "Define requirements and create project roadmap",
        "icon": "📋",
        "status": "completed"
      },
      {
        "title": "Design",
        "description": "Create wireframes and user interface designs",
        "icon": "🎨",
        "status": "in-progress"
      }
    ]
  }
  </assistant-component>
`;

export const FORM_COMPONENT_PROMPT = `
- interactive-form: For forms, surveys, or data input interfaces
  Example:
  <assistant-component type="interactive-form" fallback="Contact form: Name, Email, Message fields">
  {
    "title": "Contact Us",
    "fields": [
      {"name": "name", "label": "Full Name", "type": "text", "required": true},
      {"name": "email", "label": "Email Address", "type": "email", "required": true},
      {"name": "message", "label": "Message", "type": "textarea", "required": true}
    ],
    "submitLabel": "Send Message"
  }
  </assistant-component>
`;

/**
 * Combines all component prompts into a single system instruction.
 * Add this to your system prompt or model context to enable structured responses.
 */
export const getAllComponentPrompts = () => {
  return [
    STRUCTURED_RESPONSE_SYSTEM_PROMPT,
    MENU_COMPONENT_PROMPT,
    PRODUCT_GRID_PROMPT,
    DATA_CHART_PROMPT,
    CARD_LIST_PROMPT,
    FORM_COMPONENT_PROMPT,
  ].join('\n\n');
};

/**
 * Creates a custom component prompt for your specific use case.
 */
export const createComponentPrompt = (
  componentType: string,
  description: string,
  exampleData: object,
  fallbackText: string
) => {
  return `
- ${componentType}: ${description}
  Example:
  <assistant-component type="${componentType}" fallback="${fallbackText}">
  ${JSON.stringify(exampleData, null, 2)}
  </assistant-component>
`;
};