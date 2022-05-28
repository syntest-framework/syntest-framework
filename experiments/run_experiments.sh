experiment_names=( "new2" )
times=( 60 )
inferences=( 0 1 )
modes=( "roulette" ) #"elitist" ) # "dynamic" )

benchmarks=( "axios" "commanderjs" "lodash" "lodash" "lodash" "lodash" "lodash")
benchmark_files=( "axios/lib/core/*.js" "commanderjs/lib/**/*.js" "lodash/result.js" "lodash/slice.js" "lodash/split.js" "lodash/uniq.js" "lodash/unzip.js")

for experiment_name in "${experiment_names[@]}"; do
  for time in "${times[@]}"; do
    for inference in "${inferences[@]}"; do
      for mode in "${modes[@]}"; do
        if [[ "$inference" == 0 && "$mode" == "elitist" ]]; then
          break
        fi

        for x in {0..6}; do
          for i in {1..10}; do
            echo "running experiment ex=${experiment_name}time=${time},inference${inference},mode=${mode} trial ${i} for ${benchmarks[$x]} with files ${benchmark_files[$x]}"
            docker rm experiment
            docker run --name experiment --env time_per_target=${time} --env use_type_inference=${inference} --env type_inference_mode=${mode} --env target_root_directory="./benchmark/top10npm/${benchmarks[$x]}" --env include="./benchmark/top10npm/${benchmark_files[$x]}" syntest/javascript:${experiment_name}
            docker cp experiment:/app/syntest-javascript/syntest "./results/${experiment_name}-${time}-${inference}-${mode}-${benchmarks[$x]}-${x}-${i}"
          done
        done

      done
    done
  done
done

#docker run --name experiment --env target_root_directory="./benchmark/top10npm/axios" --env include="./benchmark/top10npm/axios/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/commanderjs" --env include="./benchmark/top10npm/commanderjs/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/commanderjs" --env include="./benchmark/top10npm/commanderjs/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/lodash" --env include="./benchmark/top10npm/lodash/result.js" syntest/javascript:t5-inference1-moderoulette

#docker cp experiment:/app/syntest-javascript/syntest ./