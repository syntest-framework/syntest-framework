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
import { Channel, Connection } from "amqplib";
import amqp = require("amqplib");

export class RabbitProducer {
  protected _name: string;
  public _connection: Connection;
  public _isConnectionPresent: boolean;
  private _rabbit_host = "amqp://localhost";
  constructor(name: string, url: string) {
    this._name = name;
    this._rabbit_host = "amqp://" + url;
  }

  get host() {
    return this._rabbit_host;
  }

  async connect(): Promise<void> {
    this._connection = await amqp.connect(this._rabbit_host);
    this._isConnectionPresent = true;
  }

  async sendData(data: unknown): Promise<void> {
    if (!this._isConnectionPresent)
      throw new Error("Tried to send data without initializing connection.");
    const message = JSON.stringify(data);

    const channel: Channel = await this._connection.createChannel();
    await channel.assertQueue(this._name, { durable: true });
    channel.sendToQueue(this._name, Buffer.from(message));
    await channel.close();
  }

  async close(): Promise<void> {
    await this._connection.close();
    this._isConnectionPresent = false;
  }
}
