import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes)]
    }).compileComponents();
  });

  it('cria o shell da aplicação', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renderiza a página inicial na saída de rotas', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Sistema de Gestão de Ações');
  });

  it('expõe navegação financeira acessível e ação principal', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const nav = host.querySelector('nav[aria-label="Navegação principal"]');
    const destinations = Array.from(nav?.querySelectorAll('a') ?? [])
      .map(link => link.getAttribute('href'));

    expect(nav).not.toBeNull();
    expect(destinations).toEqual(['/', '/corretoras', '/acoes', '/operacoes']);
    expect(host.querySelector('a[href="/operacoes/nova"]')?.textContent)
      .toContain('Nova operação');
    expect(host.querySelector('main.app-main router-outlet')).not.toBeNull();
  });
});
