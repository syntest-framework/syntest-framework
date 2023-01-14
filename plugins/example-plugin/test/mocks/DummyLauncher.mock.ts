import { EventManager, Launcher } from "@syntest/core"
import { ExamplePlugin } from "../../src"

export class DummyLauncher extends Launcher {
    async processArguments(args: string[]): Promise<void> {
        EventManager.registerListener(new ExamplePlugin())
    }
    async setup(): Promise<void> {}
    async preprocess(): Promise<void> {}
    async process(): Promise<void> {}
    async postprocess(): Promise<void> {}
    async exit(): Promise<void> {}
    
}