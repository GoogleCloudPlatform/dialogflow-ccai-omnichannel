import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss']
})
export class CallComponent implements OnInit {
  public phone: string;
  public name: string;

  constructor() { 
    this.name = "";
    this.phone = "";
  }

  ngOnInit(): void {
  }

  onSubmit(f: NgForm): void {
    const phone = f.value.phone;
    const name = f.value.name;
    if (phone.length > 0) {
      // TODO
    }
    f.reset();
  }
}
