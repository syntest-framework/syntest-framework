/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// import TypedEventEmitter from "typed-emitter";
// import { RabbitProducer } from "../lib/RabbitProducer";
// import { Events } from "@syntest/core";
// import { PublisherPlugin } from "../lib/PublisherPlugin";

import * as chai from "chai";
// var chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
// chai.use(chaiAsPromised);

/**
 * This test can simulates behavior of the plugin, through emission of the events.
 * Will only work if actual RabbitMQ is hosted at specified ip and ports.
 */
describe("simulationTest", () => {
  it("SimpleTest", () => {
    expect(2).to.eql(2);
    /*
    const rp: RabbitProducer = new RabbitProducer("queue", "0.0.0.0:5672")
    
    await rp.connect()
    const pb: PublisherPlugin = new PublisherPlugin(rp)
    pb.setupEventListener();

    (<TypedEventEmitter<Events>>process).emit("initializeStart");
    (<TypedEventEmitter<Events>>process).emit("searchInitializationStart", null, null, undefined, null);
    (<TypedEventEmitter<Events>>process).emit("searchInitializationStart", null, null, undefined, null);
    await new Promise(f => setTimeout(f, 1000));

    await rp.close()*/
  });
});
