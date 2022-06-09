experiment_names=( "new8" )
times=( 60 )
inferences=( true false )
modes=( "roulette" ) #"elitist" ) # "dynamic" )

benchmark_name=(
"javascript_algorithms_matrix"
"javascript_algorithms_sort"
"javascript_algorithms_tree"
"javascript_algorithms_knapsack"
"javascript_algorithms_graph"
"axios"
"commanderjs"
"express"
"moment"
"moment"
"lodash"
"lodash"
"lodash"
"lodash"
"lodash"
"lodash"
"lodash"
"lodash"
"lodash"
"lodash" )
benchmarks=(
"large_projects/javascript-algorithms"
"large_projects/javascript-algorithms"
"large_projects/javascript-algorithms"
"large_projects/javascript-algorithms"
"large_projects/javascript-algorithms"
"top10npm/axios"
"top10npm/commanderjs"
"top10npm/express"
"top10npm/moment/src"
"top10npm/moment/src"
"top10npm/lodash"
"top10npm/lodash"
"top10npm/lodash"
"top10npm/lodash"
"top10npm/lodash"
"top10npm/lodash"
"top10npm/lodash"
"top10npm/lodash"
"top10npm/lodash"
"top10npm/lodash" )
benchmark_files=(
"large_projects/javascript-algorithms/src/algorithms/math/matrix/*.js"
"large_projects/javascript-algorithms/src/algorithms/sorting/counting-sort/*.js"
"large_projects/javascript-algorithms/src/data-structures/tree/red-black-tree/*.js"
"large_projects/javascript-algorithms/src/algorithms/sets/knapsack-problem/*.js"
"large_projects/javascript-algorithms/src/algorithms/graph/**/*.js"
"top10npm/axios/lib/core/*.js"
"top10npm/commanderjs/lib/**/*.js"
"top10npm/express/lib/**/*.js"
"top10npm/moment/src/lib/create/**/*.js"
"top10npm/moment/src/lib/moment/**/*.js"
"top10npm/lodash/.internal/equalArrays.js"
"top10npm/lodash/hasPath.js"
"top10npm/lodash/random.js"
"top10npm/lodash/result.js"
"top10npm/lodash/slice.js"
"top10npm/lodash/split.js"
"top10npm/lodash/toNumber.js"
"top10npm/lodash/transform.js"
"top10npm/lodash/truncate.js"
"top10npm/lodash/unzip.js" )
x=0

for experiment_name in "${experiment_names[@]}"; do
  for time in "${times[@]}"; do
    for inference in "${inferences[@]}"; do
      for mode in "${modes[@]}"; do
        if [[ "$inference" == false && "$mode" == "elitist" ]]; then
          break
        fi

        if [[ "$inference" == false && "$mode" == "dynamic" ]]; then
          break
        fi

        for x in {0..18}; do
          for i in {6..10}; do
            echo "running experiment3 ex=${experiment_name} time=${time} inference=${inference} mode=${mode} trial ${i} for ${benchmark_name[$x]} with files ${benchmark_files[$x]}"
            docker rm experiment3
            docker run --name experiment3 --env time_per_target=${time} --env use_type_inference=${inference} --env type_inference_mode=${mode} --env target_root_directory="./benchmark/${benchmarks[$x]}" --env include="./benchmark/${benchmark_files[$x]}" syntest/javascript:${experiment_name}
            docker cp experiment3:/app/syntest-javascript/syntest "./results/${experiment_name}-${time}-${inference}-${mode}-${benchmark_name[$x]}-${x}-${i}"
          done
        done
      done
    done
  done
done