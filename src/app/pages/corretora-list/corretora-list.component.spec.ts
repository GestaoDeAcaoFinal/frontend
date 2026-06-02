import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorretoraListComponent } from './corretora-list.component';

describe('CorretoraListComponent', () => {
  let component: CorretoraListComponent;
  let fixture: ComponentFixture<CorretoraListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorretoraListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorretoraListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
