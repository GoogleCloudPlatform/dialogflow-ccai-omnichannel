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
import { Component, OnInit } from '@angular/core';
import { HttpsService } from '../https.service';
import { FormControl, FormGroupDirective, NgForm, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { ValidationManager } from 'ng2-validation-manager';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers:  [ HttpsService ]
})
export class ProfileComponent implements OnInit {
  form: any;

  constructor(
    private https: HttpsService
  ) {
    // this.form.setErrorMessage('username', 'pattern', 'Pattern must be part of this family: [A-Za-z0-9.-_]');
  }

  ngOnInit(): void {
    this.form = new ValidationManager({
      email       : 'required|email',
      username    : 'required|pattern:[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*',
      phoneNr     : 'required|pattern:^[0-9\-]*$',
      password    : 'required|rangeLength:8,50',
      repassword  : 'required|equalTo:password'
    });
  }

  onSubmit(f: NgForm): void {
    console.log(f.value);
    // this.username = f.value.username;
    // this.phoneNr = f.value.phoneNr;
    // this.email = f.value.email;
    // this.password = f.value.password;

    // TODO check if passwords are similar

    // this.https.createUser(this.email, this.password, this.username, `+${this.phoneNr}`).pipe().subscribe(data => {
    //  console.log(data);
    // });

    // if user is logged in, prefill the fields

    f.reset();
  }

}
