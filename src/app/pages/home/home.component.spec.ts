import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('apresenta a carteira sem inventar indicadores financeiros', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('Sua carteira, organizada');
    expect(host.querySelectorAll('.domain-card').length).toBe(3);
    expect(host.querySelectorAll('.quick-action').length).toBe(6);
    expect(host.textContent).not.toContain('Rentabilidade');
    expect(host.textContent).not.toContain('Patrimônio');
  });

  it('expõe navegação para os seis fluxos principais', () => {
    const destinations = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.quick-action'))
      .map(link => link.getAttribute('href'));
    expect(destinations).toEqual([
      '/corretoras/nova',
      '/corretoras',
      '/acoes/nova',
      '/acoes',
      '/operacoes/nova',
      '/operacoes'
    ]);
  });
});
