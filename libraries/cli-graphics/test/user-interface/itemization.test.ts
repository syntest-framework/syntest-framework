/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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
import * as chai from "chai";

import { ItemizationItem } from "../../lib/UserInterface";

import { UserInterfaceExtends } from "./UserInterface.extends";

const expect = chai.expect;

/**
 * This test is only added such that the github action does not fail.
 */
describe("itemization test", () => {
  it("nested subitems", () => {
    const userinterface = new UserInterfaceExtends();

    const items: ItemizationItem[] = [
      {
        text: "Item 1",
        subItems: [
          {
            text: "Subitem 1.1",
            subItems: [
              {
                text: "Subitem 1.1.1",
              },
            ],
          },
        ],
      },
      {
        text: "Item 2",
      },
      {
        text: "Item 3",
        subItems: [
          {
            text: "Subitem 3.1",
          },
          {
            text: "Subitem 3.2",
          },
        ],
      },
    ];

    expect(userinterface.itemization(items)).to.equal(
      `  - Item 1
    - Subitem 1.1
      - Subitem 1.1.1
  - Item 2
  - Item 3
    - Subitem 3.1
    - Subitem 3.2
`,
    );
  });
});
