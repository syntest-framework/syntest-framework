export const properties = {
    // Files
    "src_directory": {
        description: 'Path to the directory under test',
        type: 'string',
        default: './src/',
        alias: 'srcDirectory'
    },

    "test_directory": {
        description: 'Path to the temporary test directory',
        type: 'string',
        default: './temp_test/',
        alias: 'testDirectory'
    },
    "exclude": {
        description: 'files to exclude',
        items: {
            type: 'string'
        },
        default: [],
    },


    "seed": {
        description: 'Seed to be used by the pseudo random number generator.',
        type: 'string',
        default: null
    },

    "population_size": {
        description: 'Size of the population.',
        type: 'number',
        default: 20
    },

    "max_depth": {
        description: 'Max depth of an individual\'s gene tree.',
        type: 'number',
        default: 5
    },

    // mutation chances
    "resample_gene_chance": {
        description: 'Chance a gene gets resampled from scratch.',
        type: 'number',
        default: 0.01
    },
    "delta_mutation_chance": {
        description: 'Chance a delta mutation is performed.',
        type: 'number',
        default: 0.8
    },
    "sample_func_as_arg": {
        description: 'Chance the return value of a function is used as argument for another function.',
        type: 'number',
        default: 0.5
    },

    "crossover_chance": {
        description: 'Chance crossover happens at a certain branch point.',
        type: 'number',
        default: 0.3
    },

    "algorithm": {
        description: 'Algorithm to be used by the tool',
        type: 'string',
        default: "MOSA"
    },
    "subAlgorithm": {
        description: 'Algorithm to be used as sub algorithm when using a MultiGA',
        type: 'string',
        default: "SimpleGA"
    },

    "stopping_criteria": {
        description: 'Stopping criteria',
        type: 'array',
        default: [
            {
                "criterion": "generation_limit",
                "limit": 10
            },
            {
                "criterion": "coverage",
                "limit": 100
            }
        ]
    },

    // logging
    "console_log_level": {
        description: 'Log level of the tool',
        type: 'string',
        default: "debug"
    },
    "log_to_file": {
        description: 'Log level of the tool',
        type: 'array',
        items: {
            type: 'string'
        },
        default: ["info", "warn", "error"],
    },

    "draw_cfg": {
        description: 'Whether to draw the Control Flow Graph of the code under test.',
        type: 'boolean',
        default: false
    },

    // gene defaults
    "string_alphabet": {
        description: 'The alphabet to be used by the string gene.',
        type: 'string',
        default: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    },

    "string_maxlength":  {
        description: 'Maximal length of the string gene.',
        type: 'number',
        default: 32
    },

    "fixed_bits":  {
        description: 'Number of bits used by the fixed gene.',
        type: 'number',
        default: 128
    },
    "fixed_decimals":  {
        description: 'Number of decimals used by the fixed gene.',
        type: 'number',
        default: 18
    },

    "ufixed_bits": {
        description: 'Number of bits used by the ufixed gene.',
        type: 'number',
        default: 128
    },
    "ufixed_decimals": {
        description: 'Number of decimals used by the ufixed gene.',
        type: 'number',
        default: 18
    },

    "int_bits": {
        description: 'Number of bits used by the int gene.',
        type: 'number',
        default: 256
    },

    "uint_bits": {
        description: 'Number of bits used by the uint gene.',
        type: 'number',
        default: 256
    },

    // csv output
    "csv_output": {
        description: 'The path where the csv should be saved',
        type: 'string',
        default: './coverage'
    },

    "csv_output_values": {
        description: 'The values that should be written to csv',
        type: 'array',
        items: {
            type: 'string'
        },
        default: ["targetName", "branch", "coveredBranches", "totalBranches", "branchCoverage"],
    },
}

