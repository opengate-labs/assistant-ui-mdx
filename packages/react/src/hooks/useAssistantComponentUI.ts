import { useEffect } from "react";
import { useComponentUIsStore } from "../context/react/AssistantContext";
import { AssistantComponentUIProps } from "../context/stores/AssistantComponentUIs";

export const useAssistantComponentUI = <TData = unknown>(
  componentUI: AssistantComponentUIProps<TData>,
) => {
  const componentUIsStore = useComponentUIsStore();
  useEffect(() => {
    console.log('Registering component UI:', componentUI.componentType);
    const store = componentUIsStore.getState();
    const unsubscribe = store.setComponentUI(
      componentUI.componentType,
      componentUI.render,
    );
    console.log('Component UI registered successfully:', componentUI.componentType);
    return () => {
      console.log('Unregistering component UI:', componentUI.componentType);
      unsubscribe();
    };
  }, [componentUIsStore, componentUI.componentType, componentUI.render]);
};