module.exports = {
    // seed: 'test',
    population_size: 10,
    max_depth: 5,

    // mutation chances
    resample_gene_chance: 0.01,
    delta_mutation_chance: 0.8,
    sample_func_as_arg: 0.5,
    explore_illegal_values: false,

    algorithm: "DynaMOSA",
    search_time: 10,
    total_time: 10,
    iteration_budget: 1000,

    probe_objective: true,
    modifier_extraction: true,
    constant_pool: true,
    constant_pool_probability: 0.5,

    // logging
    console_log_level: "info",
    log_to_file: ["info", "warn", "error"],
    include: [
        "./benchmark/**/*.js"
    ]
}
