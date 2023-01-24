# Creating plugins

## Setup

To ensure the plugins are usable by the tool please use the following setup.

### Structure

```
example-plugin
- lib
    - index.ts
    - [PluginName].ts
```

### Index

Make sure that the index file exports the plugin as follows:

```javascript
export * as plugin from "./[PluginName]";
```

### Plugin file

Make sure that the plugin file exports the plugin as follows:

```javascript
export default class [PluginName] extends PluginInterface {...};
```

The specific export style is required to enable the tool to load the plugins.

## Usage

The `PluginInterface` has a bunch of methods that are called during certain events that occur during the process of running the tool. The methods are optional to implement.

The methods follow the following structure

```
on[EventName][Timing]
```

Here the `EventName` can, for example, be the setup of the program.
The `Timing` could be "Start" to indicate the start of the setup of the program. So the event hook is called `onSetupStart`.

Please take a look at [PluginInterface](../src/event/PluginInterface.ts) for all available event hooks.

Each event hook has one argument, namely the program state.
The [ProgramState](../src/event/ProgramState.ts) object has the following structure:

```typescript
interface ProgramState {
  targetPool?: TargetPool;
  archive?: Archive<any>;
  algorithm?: SearchAlgorithm<any>;
}
```

As can be seen from the structure, some of the properties are optional. For some of the early events not all properties are available yet. For example, at the setup start event there is no archive or algorithm yet.
