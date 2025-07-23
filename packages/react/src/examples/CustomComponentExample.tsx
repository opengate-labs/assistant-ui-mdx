/**
 * Example implementation showing how to use the custom component rendering system
 * for structured LLM responses.
 * 
 * This example demonstrates:
 * 1. Creating custom React components for structured data
 * 2. Registering components with makeAssistantComponentUI
 * 3. Using prompt templates to instruct the AI
 * 4. Rendering the components in the UI
 */

import React from 'react';
import {
  AssistantRuntimeProvider,
  Thread,
  makeAssistantComponentUI,
  type ComponentUIProps,
} from '@assistant-ui/react';
import { getAllComponentPrompts } from '../utils/componentPrompts';

// Example: Menu Component
interface MenuData {
  title: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      price: string;
      description?: string;
    }>;
  }>;
}

const MenuComponent: React.FC<ComponentUIProps<MenuData> & { status: any }> = ({
  data,
  status,
}) => (
  <div className="menu-component border rounded-lg p-4 my-4">
    <h3 className="text-xl font-bold mb-4">{data.title}</h3>
    {data.categories.map((category) => (
      <div key={category.name} className="mb-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-3">
          {category.name}
        </h4>
        <div className="space-y-2">
          {category.items.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-start p-3 bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                {item.description && (
                  <div className="text-sm text-gray-600">{item.description}</div>
                )}
              </div>
              <div className="font-bold text-green-600">{item.price}</div>
            </div>
          ))}
        </div>
      </div>
    ))}
    {status.type === 'running' && (
      <div className="text-sm text-gray-500">Updating menu...</div>
    )}
  </div>
);

// Example: Product Grid Component
interface ProductData {
  title: string;
  products: Array<{
    id: string;
    name: string;
    price: string;
    image?: string;
    rating?: number;
    inStock: boolean;
  }>;
}

const ProductGridComponent: React.FC<ComponentUIProps<ProductData> & { status: any }> = ({
  data,
}) => (
  <div className="product-grid my-4">
    <h3 className="text-xl font-bold mb-4">{data.title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.products.map((product) => (
        <div
          key={product.id}
          className="product-card border rounded-lg p-4 hover:shadow-lg transition-shadow"
        >
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover rounded mb-3"
            />
          )}
          <h4 className="font-semibold mb-2">{product.name}</h4>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-green-600">
              {product.price}
            </span>
            {product.rating && (
              <div className="flex items-center">
                <span className="text-yellow-500">★</span>
                <span className="text-sm ml-1">{product.rating}</span>
              </div>
            )}
          </div>
          <div
            className={`text-sm mt-2 ${
              product.inStock ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Example: Data Chart Component (using a simple bar chart)
interface ChartData {
  title: string;
  type: 'line' | 'bar';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }>;
  };
}

const DataChartComponent: React.FC<ComponentUIProps<ChartData> & { status: any }> = ({
  data,
}) => {
  const dataset = data.data.datasets[0];
  const maxValue = Math.max(...dataset.data);

  return (
    <div className="chart-component border rounded-lg p-4 my-4">
      <h3 className="text-xl font-bold mb-4">{data.title}</h3>
      <div className="space-y-2">
        {data.data.labels.map((label, index) => {
          const value = dataset.data[index];
          const percentage = (value / maxValue) * 100;
          
          return (
            <div key={label} className="flex items-center space-x-3">
              <div className="w-16 text-sm font-medium">{label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${percentage}%` }}
                >
                  <span className="text-white text-xs font-semibold">
                    {value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-sm text-gray-600 mt-2">{dataset.label}</div>
    </div>
  );
};

// Register the components
const MenuComponentUI = makeAssistantComponentUI<MenuData>({
  componentType: 'menu-options',
  render: MenuComponent,
});

const ProductGridComponentUI = makeAssistantComponentUI<ProductData>({
  componentType: 'product-grid', 
  render: ProductGridComponent,
});

const DataChartComponentUI = makeAssistantComponentUI<ChartData>({
  componentType: 'data-chart',
  render: DataChartComponent,
});

// Example usage in an app
export const CustomComponentExample: React.FC<{
  runtime: any; // Replace with your actual runtime type
}> = ({ runtime }) => {
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Register all component UIs */}
      <MenuComponentUI />
      <ProductGridComponentUI />
      <DataChartComponentUI />
      
      {/* The Thread component will automatically render structured components */}
      <Thread />
    </AssistantRuntimeProvider>
  );
};

// System prompt example for your AI model
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