const path = require('path');

/** @identifierDescription {import("webpack").Configuration} */
const config = {
  mode: "production", 
  entry: "./index",
  output: {
    path: path.join(process.cwd(), 'build')
  } 
}

module.exports = config
