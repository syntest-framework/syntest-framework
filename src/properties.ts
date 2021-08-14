export class Properties {
  public static include: string[];
  public static exclude: string[];

  public static statistics_directory: string;
  public static log_directory: string;
  public static final_suite_directory: string;
  public static cfg_directory: string;

  public static temp_test_directory: string;
  public static temp_log_directory: string;

  public static seed: string | null;
  public static max_depth: number;
  public static explore_illegal_values: boolean;

  public static resample_gene_probability: number;
  public static delta_mutation_probability: number;
  public static sample_existing_value_probability: number;
  public static crossover_probability: number;
  public static constant_pool_probability: number;
  public static sample_func_as_arg: number;

  public static algorithm: string;
  public static sub_algorithm: string;
  public static population_size: number;

  public static stopping_criteria: {}[];
  public static search_time: number;
  public static total_time: number;
  public static iteration_budget: number;
  public static evaluation_budget: number;

  public static enhanced_cfg: boolean;
  public static probe_objective: boolean;
  public static modifier_extraction: boolean;
  public static constant_pool: boolean;
  public static console_log_level: string;
  public static log_to_file: string[];
  public static user_interface: string;

  public static string_alphabet: string;
  public static string_maxlength: number;
  public static numeric_decimals: number;
  public static numeric_max_value: number;
  public static numeric_signed: boolean;

  public static output_properties: string[];
  public static configuration: string;

  public static draw_cfg: boolean;

  public static getDescription(property: string): string {
    return properties[property].description;
  }
}

export const properties = {
  // Files
  include: {
    description: "Files/Directories to include",
    type: "array",
    items: {
      type: "string",
    },
    default: ["./src/**/*.*"],
  },

  exclude: {
    description: "Files/Directories to exclude",
    items: {
      type: "string",
    },
    default: [],
  },

  // directories
  statistics_directory: {
    description: "The path where the csv should be saved",
    type: "string",
    default: "syntest/statistics",
  },

  log_directory: {
    description: "The path where the logs should be saved",
    type: "string",
    default: "syntest/logs",
  },

  user_interface: {
    description: "The user interface you use",
    type: "string",
    default: "regular",
  },

  final_suite_directory: {
    description: "The path where the csv should be saved",
    type: "string",
    default: "syntest/tests",
  },

  cfg_directory: {
    description: "The path where the csv should be saved",
    type: "string",
    default: "syntest/cfg",
  },

  temp_test_directory: {
    description: "Path to the temporary test directory",
    type: "string",
    default: ".syntest/tests",
  },

  temp_log_directory: {
    description: "Path to the temporary log directory",
    type: "string",
    default: ".syntest/logs",
  },

  // random generator settings
  seed: {
    description: "Seed to be used by the pseudo random number generator.",
    type: "string",
    default: null,
  },

  // sampling settings
  max_depth: {
    description: "Max depth of an individual's gene tree.",
    type: "number",
    default: 5,
  },

  // mutation settings
  explore_illegal_values: {
    description:
      "Allow primitives to become values outside of the specified bounds.",
    type: "boolean",
    default: false,
  },

  // probability settings
  resample_gene_probability: {
    description: "Probability a gene gets resampled from scratch.",
    type: "number",
    default: 0.01,
  },
  delta_mutation_probability: {
    description: "Probability a delta mutation is performed.",
    type: "number",
    default: 0.8,
  },
  sample_existing_value_probability: {
    description:
      "Probability the return value of a function is used as argument for another function.",
    type: "number",
    default: 0.5,
  },
  crossover_probability: {
    description: "Probability crossover happens at a certain branch point.",
    type: "number",
    default: 0.8,
  },

  // algorithm settings
  algorithm: {
    description: "Algorithm to be used by the tool",
    type: "string",
    default: "MOSA",
  },
  sub_algorithm: {
    description: "Algorithm to be used as sub algorithm when using a MultiGA",
    type: "string",
    default: "SimpleGA",
  },
  population_size: {
    description: "Size of the population.",
    type: "number",
    default: 20,
  },

  stopping_criteria: {
    description: "Stopping criteria",
    type: "array",
    default: [
      {
        criterion: "generation_limit",
        limit: 10,
      },
      {
        criterion: "coverage",
        limit: 100,
      },
    ],
  },
  search_time: {
    description: "Search time budget",
    type: "number",
    default: 3600,
  },
  total_time: {
    description: "Total time budget",
    type: "number",
    default: 3600,
  },
  iteration_budget: {
    description: "Iteration budget",
    type: "number",
    default: Number.MAX_SAFE_INTEGER,
  },
  evaluation_budget: {
    description: "Evaluation budget",
    type: "number",
    default: Number.MAX_SAFE_INTEGER,
  },

  enhanced_cfg: {
    description: "Enable enhanced CFG creation",
    type: "boolean",
    default: false,
  },
  probe_objective: {
    description: "Enable the probe objectives",
    type: "boolean",
    default: false,
  },
  modifier_extraction: {
    description: "Enable modifier extraction",
    type: "boolean",
    default: false,
  },
  constant_pool: {
    description: "Enable constant pool",
    type: "boolean",
    default: false,
  },

  // logging
  console_log_level: {
    description: "Log level of the tool",
    type: "string",
    default: "debug",
  },
  log_to_file: {
    description: "Log level of the tool",
    type: "array",
    items: {
      type: "string",
    },
    default: ["info", "warn", "error"],
  },

  // gene defaults
  string_alphabet: {
    description: "The alphabet to be used by the string gene.",
    type: "string",
    default: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
  string_maxlength: {
    description: "Maximal length of the string gene.",
    type: "number",
    default: 100,
  },

  numeric_decimals: {
    description: "Number of decimals placed used by the numeric gene.",
    type: "number",
    default: 64,
  },
  numeric_max_value: {
    description: "Max value used by the numeric gene.",
    type: "number",
    default: Number.MAX_SAFE_INTEGER,
  },
  numeric_signed: {
    description: "Whether the numeric genes are signed.",
    type: "boolean",
    default: true,
  },

  // statistics output settings
  output_properties: {
    description: "The values that should be written to csv",
    type: "array",
    items: {
      type: "string",
    },
    default: [
      "timestamp",
      "targetName",
      "coveredBranches",
      "totalBranches",
      "fitnessEvaluations",
    ],
    // default: ["timestamp", "targetName", "branch", "coveredBranches", "totalBranches", "branchCoverage"],
  },
  configuration: {
    description: "The name of the configuration.",
    type: "string",
    default: "",
  },

  // probability to sample from constant pool
  constant_pool_probability: {
    description:
      "probability to sample from the constant pool instead creating random values",
    type: "number",
    default: 0.5,
  },

  // misc output settings
  draw_cfg: {
    description:
      "Whether to draw the Control Flow Graph of the code under test.",
    type: "boolean",
    default: true,
  },

  sample_func_as_arg: {
    description: "TODO",
    type: "number",
    default: 0.5,
  },
};
