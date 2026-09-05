import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';

type Rgb = [number, number, number];

function parseCssColor(value: string): { rgb: Rgb; alpha: number } {
  const channels = value.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3) {
    throw new Error(`Cor CSS inválida: ${value}`);
  }

  return {
    rgb: [channels[0], channels[1], channels[2]],
    alpha: channels[3] ?? 1
  };
}

function compositeColor(foreground: ReturnType<typeof parseCssColor>, background: Rgb): Rgb {
  return foreground.rgb.map((channel, index) =>
    channel * foreground.alpha + background[index] * (1 - foreground.alpha)
  ) as Rgb;
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

  it('remove transição e movimento quando a redução de movimento está ativa', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector('.btn-finance-primary') as HTMLElement;
    const mediaRules = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules))
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule);
    const reducedMotionRule = mediaRules.find(rule =>
      rule.conditionText === '(prefers-reduced-motion: reduce)'
    );

    expect(reducedMotionRule).toBeDefined();
    if (!reducedMotionRule) return;

    const originalMedia = reducedMotionRule.media.mediaText;
    reducedMotionRule.media.mediaText = 'all';

    try {
      expect(getComputedStyle(action).transitionDuration).toBe('0s');
      const hoverRule = Array.from(reducedMotionRule.cssRules)
        .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
        .find(rule => rule.selectorText === '.btn-finance-primary:hover');
      expect(hoverRule?.style.transform).toBe('none');
    } finally {
      reducedMotionRule.media.mediaText = originalMedia;
    }
  });

  it('mantém contraste AA no botão primário', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector('.btn-finance-primary') as HTMLElement;
    const style = getComputedStyle(action);
    const background = parseCssColor(style.backgroundColor).rgb;
    const foreground = compositeColor(parseCssColor(style.color), background);

    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('mantém foco perceptível nos fundos claro e escuro', () => {
    const backgrounds: Rgb[] = [[255, 255, 255], [7, 26, 47]];

    for (const background of backgrounds) {
      const surface = document.createElement('div');
      const control = document.createElement('input');
      surface.style.backgroundColor = `rgb(${background.join(', ')})`;
      surface.style.padding = '1rem';
      surface.appendChild(control);
      document.body.appendChild(surface);
      control.focus();

      try {
        expect(control.matches(':focus-visible')).toBeTrue();
        const outline = compositeColor(
          parseCssColor(getComputedStyle(control).outlineColor),
          background
        );
        expect(contrastRatio(outline, background))
          .withContext(`fundo rgb(${background.join(', ')})`)
          .toBeGreaterThanOrEqual(3);
      } finally {
        surface.remove();
      }
    }
  });
});
