import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorretoraFormComponent } from './corretora-form.component';

describe('CorretoraFormComponent', () => {
  let component: CorretoraFormComponent;
  let fixture: ComponentFixture<CorretoraFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorretoraFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorretoraFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
