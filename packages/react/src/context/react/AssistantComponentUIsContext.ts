import { createContext } from "react";
import { AssistantComponentUIsStore } from "../stores/AssistantComponentUIs";

export const AssistantComponentUIsContext = createContext<
  AssistantComponentUIsStore | undefined
>(undefined);