import { useContext } from "react";
import { AssistantComponentUIsContext } from "../context/react/AssistantComponentUIsContext";
import { AssistantComponentUIsStore } from "../context/stores/AssistantComponentUIs";

export const useComponentUIs = (): AssistantComponentUIsStore => {
  const componentUIs = useContext(AssistantComponentUIsContext);
  if (!componentUIs) {
    throw new Error(
      "This component must be used within AssistantRuntimeProvider.",
    );
  }
  return componentUIs;
};