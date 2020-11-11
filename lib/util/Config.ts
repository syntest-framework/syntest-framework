let config: any = {
    "seed": null,

    "population_size": 20,

    "max_depth": 5,

    // mutation chances
    "resample_gene_chance": 0.01,
    "delta_mutation_chance": 0.8,
    "sample_func_as_arg": 0.5,

    "algorithm": "NSGA2",
    "stopping_criteria": [
        {
            "criterion": "generation_limit",
            "limit": 10
        },
        {
            "criterion": "coverage",
            "limit": 100
        }
    ],


    // logging
    "console_log_level": "debug",
    "log_to_file": ["info", "warn", "error"],

    // gene defaults
    "string_alphabet": '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    "string_maxlength": 32,

    "fixed_bits": 128,
    "fixed_decimals": 18,

    "ufixed_bits": 128,
    "ufixed_decimals": 18,

    "int_bits": 256,

    "uint_bits": 256
}


export function setConfig(configFromFile: any) {
    for (let key of Object.keys(configFromFile['search'])) {
        config[key] = configFromFile['search'][key]
    }
}

export function getConfig() { // TODO maybe make immutable
    return config
}

export function getSetting(setting: string): any {
    return config[setting]
}
