import { Component } from '@angular/core';
import { HttpsService } from '../https.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers:  [ HttpsService ]
})
export class DashboardComponent {

  constructor(
    private https: HttpsService
  ) {
  }
}
