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
import { Injectable } from '@angular/core';
import {
HttpRequest,
HttpHandler,
HttpEvent,
HttpInterceptor
} from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const idToken = localStorage.getItem('token');
        if (idToken) {
            const cloned = req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + idToken)
            });
            return next.handle(cloned);
        }
        else {
            return next.handle(req);
        }
    }
}
