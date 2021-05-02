import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhonenrComponent } from './phonenr.component';

describe('PhonenrComponent', () => {
  let component: PhonenrComponent;
  let fixture: ComponentFixture<PhonenrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhonenrComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhonenrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
