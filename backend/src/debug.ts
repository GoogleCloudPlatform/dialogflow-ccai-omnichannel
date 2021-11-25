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
     public trace(fileName:string, msg:string, obj: object): void{
        if(this.debug){
            if(obj && typeof obj === 'object'){
                console.log(`Debugger ${fileName}: ${msg} - ${JSON.stringify(obj)}`);
                console.dir(obj);
            } if(obj) {
                console.log(`Debugger ${fileName}: ${msg} - ${obj}`);
            } else {
                console.log(`Debugger ${fileName}: ${msg}`);
            }
        }
    }

    /**
     * Logging
     */
    public traceError(msg:string, fileName:string, e: object): void{
        if(this.debug){
            if(e){
                console.error(`Error ${fileName}: ${msg} ${JSON.stringify(e)}`);
            } else {
                console.error(`Error ${fileName}: ${msg}`);
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
}