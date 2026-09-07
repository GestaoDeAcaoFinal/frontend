import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomeComponent } from './home.component';

type Rgb = [number, number, number];

function parseCssRgb(value: string): Rgb {
  const channels = value.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3) {
    throw new Error(`Cor CSS inválida: ${value}`);
  }

  return [channels[0], channels[1], channels[2]];
}

function relativeLuminance(rgb: Rgb): number {
  const [red, green, blue] = rgb.map(channel => {
    const value = channel / 255;
    return value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return .2126 * red + .7152 * green + .0722 * blue;
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + .05) / (darker + .05);
}

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

  it('usa um contêiner neutro e preserva o main único do shell', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.firstElementChild?.matches('.page-shell.home-page')).toBeTrue();
    expect(host.firstElementChild?.tagName).toBe('DIV');
    expect(host.querySelector('main')).toBeNull();
  });

  it('expõe o hero e estrutura cada acesso rápido com título e descrição', () => {
    const host = fixture.nativeElement as HTMLElement;
    const quickActions = Array.from(host.querySelectorAll('.quick-action'));

    expect(host.querySelector('.hero-panel')).not.toBeNull();
    expect(quickActions.length).toBe(6);
    quickActions.forEach(action => {
      expect(action.querySelector('strong')).not.toBeNull();
      expect(action.querySelector('span')).not.toBeNull();
    });
  });

  it('mantém contraste AA nas descrições dos acessos rápidos', () => {
    const action = (fixture.nativeElement as HTMLElement).querySelector('.quick-action') as HTMLElement;
    const description = action.querySelector('span') as HTMLElement;
    const foreground = parseCssRgb(getComputedStyle(description).color);
    const background = parseCssRgb(getComputedStyle(action).backgroundColor);

    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
