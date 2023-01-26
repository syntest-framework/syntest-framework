import { Encoding } from "..";
import { UserInterface } from "../ui/UserInterface";
import { PluginInterface } from "./PluginInterface";

export type UserInterfaceOptions = unknown;

export interface UserInterfacePlugin<T extends Encoding>
  extends PluginInterface<T> {
  createUserInterface<O extends UserInterfaceOptions>(
    options: O
  ): UserInterface;
}
