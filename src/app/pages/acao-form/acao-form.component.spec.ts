import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcaoFormComponent } from './acao-form.component';

describe('AcaoFormComponent', () => {
  let component: AcaoFormComponent;
  let fixture: ComponentFixture<AcaoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcaoFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcaoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
