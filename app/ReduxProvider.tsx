"use client";

import { Provider } from "react-redux";
import { store } from "@/app/store/store";

export function ReduxProvider(props: { children: React.ReactNode }) {
  return <Provider store={store}>{props.children}</Provider>;
}

