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
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpsService } from '../https.service';
import { NgForm } from '@angular/forms';
import { ValidationManager } from 'ng2-validation-manager';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers:  [ HttpsService ]
})
export class ProfileComponent implements AfterViewInit {

  username: string;
  phoneNr: string;
  email: string;
  password: string;
  public serverMsg: string;

  form: any;

  constructor(
    public auth: AngularFireAuth,
    private https: HttpsService
  ) {
    this.username =  '';
    this.phoneNr =  '';
    this.email = '';
    this.password = '';
    this.serverMsg = '';

    this.form = new ValidationManager({
      email       : 'required|email',
      username    : 'required|pattern:[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*',
      phoneNr     : 'required|pattern:^[0-9\-]*$',
      password    : 'required|rangeLength:8,50',
      repassword  : 'required|equalTo:password'
    });
  }

  async ngAfterViewInit() {
    this.form.setErrorMessage('phoneNr', 'pattern', 'The phonenumber can only contain numbers and needs the country code.');
  }

  async load() {
    this.auth.currentUser.then(function(user){
      console.log(user?.uid);
    });
  }

  onSubmit(f: NgForm): void {
    const me = this;
    f.valueChanges?.pipe().subscribe(data => {
      this.serverMsg = '';
    });
    this.username = f.value.username;
    this.phoneNr = f.value.phoneNr;
    this.email = f.value.email;
    this.password = f.value.password;

    this.https.createUser(this.email, this.password, this.username, `+${this.phoneNr}`).pipe().subscribe(data => {
     if(data.success) {
        // f.reset();
        this.serverMsg = 'ok';
     } else {
        if(data.msg && data.msg.message) this.serverMsg = data.msg.message;
        console.log(this.serverMsg);
     }
    });

  }

}
