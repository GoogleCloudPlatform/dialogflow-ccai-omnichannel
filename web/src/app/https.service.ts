import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';

@Injectable()
export class HttpsService {
  API_URL = environment.serverUrl;

  constructor(private http: HttpClient) { }

  getUser(email: string, password: string) {
    return this.http.post<any>(`${this.API_URL}/api/auth/login`, {
        email,
        password,
    });
  }

  createUser(email: string, password: string, username: string, phoneNr: string) {
    return this.http.post<any>(`${this.API_URL}/api/auth/register/`, {
        username,
        password,
        email,
        phoneNr
    });
  }

  resetPassword(email: string) {
    return this.http.post<any>(`${this.API_URL}/api/auth/reset/`, {
        email
    });
  }

  callMe(phoneNr: string, name: string) {
    return this.http.post<any>(`${this.API_URL}/api/callme/`, { From: phoneNr, Name: name });
  }

  /*setSession(auth) {
    localStorage.setItem('token', auth.token);
    var usersUrl = `${this.server}/users/current/?format=json`
    this.http.get(usersUrl).subscribe(user => {
        localStorage.setItem('user', JSON.stringify(user));
    });
  }*/

}