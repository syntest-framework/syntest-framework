time=5
inference=1
mode="roulette"

experiments=( "axios" "commanderjs" )
experimentFiles=( "axios/lib/**/*.js" "commanderjs/lib/**/*.js" )

for x in {0..1}
do
  for i in {1..10}
  do
    docker rm experiment
    echo "running experiment ${i} for ${experiments[$x]} with files ${experimentFiles[$x]}"
    docker run --name experiment --env target_root_directory="./benchmark/top10npm/${experiments[$x]}" --env include="./benchmark/top10npm/${experimentFiles[$x]}" syntest/javascript:t${time}-inference${inference}-mode${mode}
    docker cp experiment:/app/syntest-javascript/syntest "./results/${time}-${inference}-${mode}-${experiments[$x]}-${i}"
  done
done

#docker run --name experiment --env target_root_directory="./benchmark/top10npm/axios" --env include="./benchmark/top10npm/axios/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/commanderjs" --env include="./benchmark/top10npm/commanderjs/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/commanderjs" --env include="./benchmark/top10npm/commanderjs/lib/**/*.js" syntest/javascript:t5-inference1-moderoulette
#docker run --name experiment --env target_root_directory="./benchmark/top10npm/lodash" --env include="./benchmark/top10npm/lodash/result.js" syntest/javascript:t5-inference1-moderoulette
#

#docker cp experiment:/app/syntest-javascript/syntest ./