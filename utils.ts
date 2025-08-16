import { createDefine } from "fresh";
import type { User } from "./lib/db.ts";

export interface State {
  title: string;
  user?: User | null;
}

export const define = createDefine<State>();
