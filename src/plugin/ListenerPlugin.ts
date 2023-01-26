import { Encoding, ListenerInterface } from "..";
import { PluginInterface } from "./PluginInterface";

export type ListenerOptions<T extends Encoding> = unknown;

export interface ListenerPlugin<T extends Encoding> extends PluginInterface<T> {
  createListener<O extends ListenerOptions<T>>(
    options: O
  ): ListenerInterface<T>;
}
