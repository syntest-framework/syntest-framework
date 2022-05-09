experiment_name="new"
times=( 5 10 20 )
inferences=( 0 1 )
modes=( "roulette" "elitist" "dynamic" )

cd ../../

for time in "${times[@]}"; do
  for inference in "${inferences[@]}"; do
    for mode in "${modes[@]}"; do
      if [[ "$inference" == 0 && "$mode" == "elitist" ]]; then
        break
      fi

      echo "creating experiment ex=${experiment_name}time=${time},inference${inference},mode=${mode}"
      docker build --build-arg time_per_target=${time} --build-arg use_type_inference=${inference} --build-arg type_inference_mode="${mode}" --tag="syntest/javascript:${experiment_name}-t${time}-inference${inference}-mode${mode}" .
    done
  done
done


#docker run --name experiment --env target_root_directory="./benchmark/top10npm/axios" --env include="./benchmark/top10npm/axios/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/commanderjs" --env include="./benchmark/top10npm/commanderjs/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/commanderjs" --env include="./benchmark/top10npm/commanderjs/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/lodash" --env include="./benchmark/top10npm/lodash/result.js" syntest/javascript:t5-inference1-moderoulette

#docker cp experiment:/app/syntest-javascript/syntest ./