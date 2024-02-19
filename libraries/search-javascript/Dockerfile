FROM node:16.13

# set environment variables for run time
ENV time_per_target=
ENV incorporate_execution_information=
ENV type_inference_mode=
ENV target_root_directory=
ENV include=
#ENV=NODE_OPTIONS="--max-old-space-size=16384"

WORKDIR /app/syntest-framework
COPY ./syntest-framework .
RUN npm install
RUN npm run build

WORKDIR /app/syntest-javascript
COPY ./syntest-javascript .
RUN npm install
# RUN npm run build

ENTRYPOINT
ENTRYPOINT [ \
    "npm", "run", "run-ts", "--", \
    "--search_time=${time_per_target}", \
    "--incorporate_execution_information=${incorporate_execution_information}", \
    "--type_inference_mode=${type_inference_mode}", \
    "--target_root_directory=${target_root_directory}", \
    "--include=${include}" \
    ]
