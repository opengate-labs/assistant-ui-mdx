import type { FC } from "react";
import { useAssistantComponentUI } from "../hooks/useAssistantComponentUI";
import type {
  AssistantComponentUIProps,
  ComponentMessagePartComponent,
} from "../context/stores/AssistantComponentUIs";

export type AssistantComponentUI = FC & {
  unstable_component: AssistantComponentUIProps;
};

export const makeAssistantComponentUI = <TData = unknown>(
  componentUI: AssistantComponentUIProps<TData>,
): AssistantComponentUI => {
  const ComponentUI: AssistantComponentUI = () => {
    useAssistantComponentUI(componentUI);
    return null;
  };
  ComponentUI.unstable_component = componentUI as AssistantComponentUIProps;
  return ComponentUI;
};

export type { ComponentMessagePartComponent, ComponentUIProps } from "../context/stores/AssistantComponentUIs";