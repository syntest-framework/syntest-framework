module.exports = {
    // seed: 'test',
    population_size: 50,
    max_depth: 5,

    // mutation chances
    resample_gene_probability: 0.01,
    delta_mutation_probability: 0.8,
    sample_func_as_arg: 0.5,
    explore_illegal_values: false,

    algorithm: "DynaMOSA",
    search_time: 5,
    total_time: 60000,
    iteration_budget: 1000000,

    probe_objective: true,
    modifier_extraction: true,
    constant_pool: true,
    constant_pool_probability: 0.5,

    // logging
    console_log_level: "info",
    log_to_file: ["info", "warn", "error"],

    incorporate_execution_information: true,
    type_inference_mode: 'roulette', // none roulette elitist
    random_type_probability: 0.1,

    draw_cfg: false,

    // target_root_directory: "./benchmark/custom/simple",

    // target_root_directory: "./benchmark/top10npm/axios",
    target_root_directory: "./benchmark/top10npm/commanderjs",
    // target_root_directory: "./benchmark/top10npm/express",
    // target_root_directory: "./benchmark/top10npm/lodash",
    // target_root_directory: "./benchmark/top10npm/moment/src",

    // target_root_directory: "./benchmark/large_projects/javascript-algorithms",

    // target_root_directory: "./benchmark/top10npm/chalk",
    // target_root_directory: "./benchmark/large_projects/jquery",
    // target_root_directory: "./benchmark/large_projects/npm_cli",

    include: [
        // "./benchmark/top10npm/axios/lib/core/buildFullPath.js",
        // "./benchmark/top10npm/axios/lib/core/Axios.js",

        // "./benchmark/top10npm/commanderjs/lib/help.js",

        // "./benchmark/top10npm/lodash/.internal/equalArrays.js",
        // "./benchmark/top10npm/lodash/hasPath.js",
        // "./benchmark/top10npm/lodash/random.js",
        // "./benchmark/top10npm/lodash/result.js",
        // "./benchmark/top10npm/lodash/slice.js",
        // "./benchmark/top10npm/lodash/split.js",
        // "./benchmark/top10npm/lodash/toNumber.js",
        // "./benchmark/top10npm/lodash/transform.js",
        // "./benchmark/top10npm/lodash/truncate.js",
        // "./benchmark/top10npm/lodash/unzip.js",


        // "./benchmark/top10npm/express/lib/view.js",

        // "./benchmark/top10npm/axios/lib/core/*.js",
        "./benchmark/top10npm/commanderjs/lib/**/*.js",

        // "./benchmark/top10npm/express/lib/**/*.js",
        // "./benchmark/top10npm/lodash/**/*.js",
        // "./benchmark/top10npm/moment/src/lib/create/**/*.js",
        // "./benchmark/top10npm/moment/src/lib/moment/**/*.js",

        // "./benchmark/large_projects/javascript-algorithms/src/data-structures/tree/red-black-tree/*.js",
        // "./benchmark/large_projects/javascript-algorithms/src/algorithms/math/matrix/*.js",
        // "./benchmark/large_projects/javascript-algorithms/src/algorithms/sorting/counting-sort/*.js",
        // "./benchmark/large_projects/javascript-algorithms/src/algorithms/graph/**/*.js",
        // "./benchmark/large_projects/javascript-algorithms/src/algorithms/sets/knapsack-problem/*.js"

        // "./benchmark/large_projects/javascript-algorithms/src/algorithms/graph/detect-cycle/detectUndirectedCycleUsingDisjointSet.js",


        // "./benchmark/top10npm/chalk/source/**/*.js",
        // "./benchmark/large_projects/jquery/src/core/**/*.js",
        // "./benchmark/large_projects/npm_cli/lib/auth/*.js",

        // "./benchmark/custom/simple/tests.js"


    ],
    exclude: [
        './benchmark/top10npm/lodash/test/.internal/*.js',
        './benchmark/top10npm/lodash/test/**/*.js',

        "./benchmark/top10npm/commanderjs/lib/argument.js",
        "./benchmark/top10npm/commanderjs/lib/command.js",
        "./benchmark/top10npm/commanderjs/lib/error.js",

        "./benchmark/top10npm/express/lib/router/index.js",
        "./benchmark/top10npm/express/lib/express.js",

        "./benchmark/top10npm/moment/src/lib/create/local.js",
        "./benchmark/top10npm/moment/src/lib/create/utc.js",

        "./benchmark/top10npm/moment/src/lib/moment/clone.js",
        "./benchmark/top10npm/moment/src/lib/moment/creation-data.js",
        "./benchmark/top10npm/moment/src/lib/moment/valid.js",
        "./benchmark/top10npm/moment/src/lib/moment/moment.js"

        // "./benchmark/top10npm/chalk/source/vendor/supports-color/*.*",

    ]
}
