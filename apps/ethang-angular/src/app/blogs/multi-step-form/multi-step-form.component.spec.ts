import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiStepFormComponent } from './multi-step-form.component';

describe('MultiStepFormComponent', () => {
  let component: MultiStepFormComponent;
  let fixture: ComponentFixture<MultiStepFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiStepFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiStepFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
