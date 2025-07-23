import { ComponentType } from "react";
import { create } from "zustand";
import { MessagePartStatus } from "../../types/AssistantTypes";
import { Unsubscribe } from "../../types";

export type ComponentUIProps<TData = unknown> = {
  componentType: string;
  data: TData;
  fallbackText?: string;
};

export type ComponentMessagePartComponent<TData = unknown> = ComponentType<
  ComponentUIProps<TData> & {
    status: MessagePartStatus;
  }
>;

export type AssistantComponentUIProps<TData = unknown> = {
  componentType: string;
  render: ComponentMessagePartComponent<TData>;
};

export type AssistantComponentUIsStore = {
  /**
   * Get the component UI configured for a given component type.
   */
  getComponentUI: (
    componentType: string,
  ) => ComponentMessagePartComponent | null;

  /**
   * Registers a component UI for a given component type. Returns an unsubscribe function to remove the component UI.
   */
  setComponentUI: (
    componentType: string,
    render: ComponentMessagePartComponent,
  ) => Unsubscribe;
};

export const makeAssistantComponentUIsStore = () =>
  create<AssistantComponentUIsStore>((set) => {
    const renderers = new Map<string, ComponentMessagePartComponent[]>();

    return Object.freeze({
      getComponentUI: (componentType) => {
        const arr = renderers.get(componentType);
        const last = arr?.at(-1);
        if (last) return last;
        return null;
      },
      setComponentUI: (componentType, render) => {
        let arr = renderers.get(componentType);
        if (!arr) {
          arr = [];
          renderers.set(componentType, arr);
        }
        arr.push(render);
        set({}); // notify the store listeners

        return () => {
          const idx = arr.indexOf(render);
          if (idx !== -1) {
            arr.splice(idx, 1);
          }
          if (idx === arr.length) {
            set({}); // notify the store listeners
          }
        };
      },
    }) satisfies AssistantComponentUIsStore;
  });