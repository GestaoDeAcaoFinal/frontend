import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacaoListComponent } from './operacao-list.component';

describe('OperacaoListComponent', () => {
  let component: OperacaoListComponent;
  let fixture: ComponentFixture<OperacaoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperacaoListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperacaoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
