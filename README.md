# syntest-framework

![](https://github.com/syntest-framework/syntest-framework/actions/workflows/node.js.yml/badge.svg)

Common core of the SynTest Framework

# Prerequisites
* install Node.js v. 12.18.3 LTL
* install truffle (`npm install -g truffle`)

# How to use
Since there is no npm package yet:
* Clone this project

`git clone git@github.com:syntest-framework/syntest-framework.git`

* Install dependencies

`npm install`
* Compile to javascript

`npm run tsc:w`
* Install as npm module in you project

`npm install /path/to/syntest-framework`

# Features
- [x] Create and Draw a Control Flow Graph of the code.
- [x] Compute approach level distance using the Control Flow Graph.
- [x] Compute branch distance for:
	- [x] integer comparisons
	- [x] float comparisons
	- [ ] boolean evaluations
	- [ ] strings comparisons
- [x] Find test-cases that cover certain branches.
- [x] Add assertions to the generated test cases.
- [x] Allow the user to configure the algorithm's parameters and other settings
	- [x] set the seed of the randomness object
	- [x] choose the search algorithm and parameters like population_size
	- [x] select stopping criteria
	- [x] choose mutation probabilities
	- [x] configure the log level
	
# Documentation

* [Control flow graph explanation](docs/ControlFlowGraph.md)


# Contributors

- Dimitri Stallenberg
- Mitchell Olsthoorn
- Annibale Panichella
