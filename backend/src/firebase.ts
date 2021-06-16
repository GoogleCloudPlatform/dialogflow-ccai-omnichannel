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
import * as admin from 'firebase-admin';

export interface User {
    disabled?: boolean,
    uid?: string,
    phoneNumber?: string,
    email?: string,
    emailVerified?: boolean,
    password?: string,
    displayName?: string,
    photoURL?: string,
    providerId?: string,
    providerUid?: string,
    country?: string
}

export class Firebase {
    public config: any;
    public debug: any;
    public fbApp: any;

    constructor(global){
        this.config = global;
        this.debug = global.debugger;
        this.fbApp = admin.initializeApp();
    }
}

// https://firebase.google.com/docs/auth/admin/manage-users
export class FirebaseUsers extends Firebase {
    async getUser(u: User):Promise<User> {
        var userPromise:Promise<User>;
        if(u.phoneNumber){
            userPromise = admin.auth().getUser(u.phoneNumber);
        } else if(u.email){
            userPromise = admin.auth().getUserByEmail(u.email);
        } else if(u.uid){
            userPromise = admin.auth().getUserByPhoneNumber(u.uid);
        } else {
            userPromise = null;
        }
        return userPromise;
    }

    public async getAllUsers(nextPageToken:string):Promise<any> {
        return admin.auth().listUsers(1000, nextPageToken);
    }

    async createUser(u: User):Promise<User>{
        return admin.auth().createUser(u);
    }

    async updateUser(uid:string, u: User):Promise<User>{
        return admin.auth().updateUser(uid, (u));
    }

    async deleteUser(uid:string):Promise<void>{
        return admin.auth().deleteUser(uid);
    }

}