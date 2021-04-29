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
import * as df from '@google-cloud/dialogflow-cx';
import * as cx from './dialogflow-cx';

export class DialogflowCXV3Beta1 extends cx.DialogflowCX {
    constructor(global){
        super(global); // calling Parent's constructor
        this.sessionClient = new df.v3beta1.SessionsClient();
    }

    // TODO methods that are different for CX V3beta1 if there are any
}

export class DialogflowCXV3Beta1Stream extends cx.DialogflowCXStream {
    constructor(global){
        super(global); // calling Parent's constructor
    }

    // TODO methods that are different for CX V3beta1 if there are any
}
