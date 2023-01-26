import { Encoding } from "..";
import { EncodingSampler } from "../search/EncodingSampler";
import { PluginInterface } from "./PluginInterface";

export type SamplerOptions<T extends Encoding> = unknown;

export interface SamplerPlugin<T extends Encoding> extends PluginInterface<T> {
  createSamplerOperator<O extends SamplerOptions<T>>(
    options: O
  ): EncodingSampler<T>;
}
