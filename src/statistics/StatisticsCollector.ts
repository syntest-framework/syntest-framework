import { RuntimeVariable } from "./RuntimeVariable";
import { TotalTimeBudget } from "../search/budget/TotalTimeBudget";
import { Encoding } from "../search/Encoding";

/**
 * Collector for runtime statistics.
 *
 * @author Mitchell Olsthoorn
 */
export class StatisticsCollector<T extends Encoding> {
  /**
   * Mapping from runtime variable to value.
   * @protected
   */
  protected _variables: Map<RuntimeVariable, any>;

  /**
   * Mapping from total search time to another mapping from runtime variable to value.
   * @protected
   */
  protected _eventVariables: Map<number, Map<number, any>>;

  /**
   * Total search time budget from the search process.
   * @protected
   */
  protected _timeBudget: TotalTimeBudget<T>;

  /**
   * Constructor.
   *
   * @param timeBudget The time budget to use for tracking time
   */
  constructor(timeBudget: TotalTimeBudget<T>) {
    this._timeBudget = timeBudget;
    this._variables = new Map<RuntimeVariable, any>();
    this._eventVariables = new Map<number, Map<number, any>>();
  }

  /**
   * Record a static variable in the collector.
   *
   * @param variable The variable type to record
   * @param value The variable value
   */
  public recordVariable(
    variable: RuntimeVariable,
    value: any
  ): StatisticsCollector<T> {
    this._variables.set(variable, value);
    return this;
  }

  /**
   * Record a dynamic variable in the collector.
   *
   * The event is recorded at the current time of the search process.
   *
   * @param variable The variable type to record
   * @param value The variable value
   */
  public recordEventVariable(
    variable: RuntimeVariable,
    value: any
  ): StatisticsCollector<T> {
    const eventTime = this._timeBudget.getCurrentBudget();

    // If other events already exist on this event time add it, otherwise create a new one
    if (this._eventVariables.has(eventTime)) {
      this._eventVariables.get(eventTime).set(variable, value);
    } else {
      this._eventVariables.set(
        eventTime,
        new Map<number, any>().set(variable, value)
      );
    }

    return this;
  }

  /**
   * Return the static variables stored in the collector
   */
  public getVariables(): Map<RuntimeVariable, any> {
    return this._variables;
  }

  /**
   * Return the dynamic variables stored in the collector
   */
  public getEventVariables(): Map<number, Map<number, any>> {
    return this._eventVariables;
  }
}
