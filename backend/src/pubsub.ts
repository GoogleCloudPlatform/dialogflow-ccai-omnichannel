/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { PubSub } from '@google-cloud/pubsub';

export class MyPubSub {
    private pubsub: PubSub;
    public config: any;
    public debug: any;

    constructor(global){
        this.config = global;
        this.debug = global.debugger;
        this.pubsub = new PubSub({
            projectId: global['gc_project_id']
        });
    }

    public async pushToChannel(json: object, topicName = this.config.pubsub['topic_name']):Promise<any> {
        const topic = this.pubsub.topic(`projects/${this.config['gc_project_id']}/topics/${topicName}`);
        const dataBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
        const messageId = await topic.publish(dataBuffer);
        this.debug.log(json);
        this.debug.log(`Message ${messageId} published to topic: ${topicName}`);
    }
}

module.exports = {
    MyPubSub
}