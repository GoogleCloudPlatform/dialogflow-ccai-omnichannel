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

export class Debug {
    private debug: boolean;

    constructor(global) {
        this.debug = global.debug;
    }

    /**
     * Logging
     */
    public log(msg): void{
        if(this.debug){
            if (typeof msg === 'string' || msg instanceof String) {
                console.log(msg);
            } else {
                console.dir(msg);
            }
        }
    }

    /**
     * Logging
     */
     public trace(fileName:string, msg:string, obj: any): void{
        if(this.debug){
            if(this.isBoolean(obj) || typeof obj === 'number') {
                console.log(`DEBUG ${fileName}: ${msg} - ${obj.toString()}`);
            } else if(obj && typeof obj === 'string') {
                console.log(`DEBUG ${fileName}: ${msg} - ${obj}`);
            } else if(obj){
                console.log(`DEBUG ${fileName}: ${msg} - ${JSON.stringify(obj)}`);
            } else {
                console.log(`DEBUG ${fileName}: ${msg}`);
            }
        }
    }

    /**
     * Logging
     */
    public traceError(msg:string, fileName:string, e: object): void{
        if(this.debug){
            if(e){
                console.error(`ERR ${fileName}: ${msg} ${JSON.stringify(e)}`);
            } else {
                console.error(`ERR ${fileName}: ${msg}`);
            }
        }
    }

    /**
     * Error Logging
     */
     public error(msg): void{
        if(this.debug){
            if (typeof msg === 'string' || msg instanceof String) {
                console.error(msg);
            } else {
                console.dir(msg);
            }
        }
    }

    private isBoolean(val) {
        return val === false || val === true;
    }
}