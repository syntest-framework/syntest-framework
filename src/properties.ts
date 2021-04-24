export const properties = {
  // Files
  include: {
    description: "Files/Directories to include",
    items: {
      type: "string"
    },
    default: [
      "./src/**/*.*"
    ]
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
  subAlgorithm: {
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
    default: 1000,
  },

  probe_objective: {
    description: "Enable the probe objectives",
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

  // misc output settings
  draw_cfg: {
    description:
      "Whether to draw the Control Flow Graph of the code under test.",
    type: "boolean",
    default: false,
  },
};
