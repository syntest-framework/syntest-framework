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
    "log_to_file": ["info", "warn", "error"]
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