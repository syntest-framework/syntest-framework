module.exports = {
    // seed: 'test',
    population_size: 30,
    max_depth: 5,

    // mutation chances
    resample_gene_chance: 0.01,
    delta_mutation_chance: 0.8,
    sample_func_as_arg: 0.5,
    explore_illegal_values: false,

    algorithm: "DynaMOSA",
    search_time: 5,
    total_time: 6000,
    iteration_budget: 100000,

    probe_objective: true,
    modifier_extraction: true,
    constant_pool: true,
    constant_pool_probability: 0.5,

    // logging
    console_log_level: "info",
    log_to_file: ["info", "warn", "error"],

    use_type_inference: false,
    type_inference_mode: 'roulette',

    // target_root_directory: "./benchmark/custom/simple",

    // target_root_directory: "./benchmark/top10npm/axios",
    // target_root_directory: "./benchmark/top10npm/chalk",
    // target_root_directory: "./benchmark/top10npm/commanderjs",
    // target_root_directory: "./benchmark/top10npm/express",
    target_root_directory: "./benchmark/top10npm/lodash",

    // target_root_directory: "./benchmark/top10npm/moment",

    include: [
        // "./benchmark/top10npm/axios/lib/core/buildFullPath.js",
        // "./benchmark/top10npm/axios/lib/core/Axios.js",

        "./benchmark/top10npm/lodash/result.js",
        // "./benchmark/top10npm/lodash/slice.js",
        // "./benchmark/top10npm/lodash/split.js",
        // "./benchmark/top10npm/lodash/uniq.js",
        // "./benchmark/top10npm/lodash/unzip.js",

        // "./benchmark/top10npm/commanderjs/lib/help.js",

        // "./benchmark/top10npm/axios/lib/core/*.js",

        // "./benchmark/top10npm/axios/lib/**/*.js",
        // "./benchmark/top10npm/chalk/source/**/*.js",
        // "./benchmark/top10npm/commanderjs/lib/**/*.js",
        // "./benchmark/top10npm/express/lib/**/*.js",
        // "./benchmark/top10npm/lodash/**/*.js",

        // "./benchmark/top10npm/moment/src/**/*.js",

        // "./benchmark/custom/simple/tests.js"


    ],
    exclude: [
        './benchmark/top10npm/lodash/test/.internal/*.js',
        './benchmark/top10npm/lodash/test/**/*.js',

        "./benchmark/top10npm/commanderjs/lib/argument.js",
        "./benchmark/top10npm/commanderjs/lib/command.js",
        // "./benchmark/top10npm/commanderjs/lib/error.js",

      "./benchmark/top10npm/chalk/source/vendor/supports-color/*.*",
    ]
}
