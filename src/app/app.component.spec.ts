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
    expect(compiled.querySelector('h1')?.textContent).toContain('Sua carteira, organizada');
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

  it('empilha barras e ações no breakpoint móvel', () => {
    const mediaRules = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules))
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule);
    const mobileRule = mediaRules.find(rule => rule.conditionText === '(max-width: 760px)');

    expect(mobileRule).toBeDefined();
    if (!mobileRule) return;

    const originalMedia = mobileRule.media.mediaText;
    mobileRule.media.mediaText = 'all';

    const pageShell = document.createElement('div');
    pageShell.className = 'page-shell';
    const listToolbar = document.createElement('div');
    listToolbar.className = 'list-toolbar';
    const primaryAction = document.createElement('a');
    primaryAction.className = 'btn-finance-primary';
    listToolbar.appendChild(primaryAction);
    const formActions = document.createElement('div');
    formActions.className = 'form-actions';
    const formAction = document.createElement('button');
    formActions.appendChild(formAction);
    pageShell.append(listToolbar, formActions);
    document.body.appendChild(pageShell);

    try {
      expect(pageShell.getBoundingClientRect().width)
        .toBeCloseTo(Math.min(document.documentElement.clientWidth - 16, 1180), 0);
      expect(getComputedStyle(pageShell).paddingTop).toBe('20px');
      expect(getComputedStyle(listToolbar).flexDirection).toBe('column');
      expect(getComputedStyle(listToolbar).alignItems).toBe('stretch');
      expect(getComputedStyle(primaryAction).width).toBe(getComputedStyle(listToolbar).width);
      expect(getComputedStyle(formActions).flexDirection).toBe('column');
      expect(getComputedStyle(formActions).alignItems).toBe('stretch');
      expect(getComputedStyle(formAction).width).toBe(getComputedStyle(formActions).width);
    } finally {
      pageShell.remove();
      mobileRule.media.mediaText = originalMedia;
    }
  });

  it('reduz transições, animações e rolagem quando a preferência está ativa', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
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

    const probe = document.createElement('div');
    probe.style.setProperty('animation-duration', '2s');
    probe.style.setProperty('scroll-behavior', 'smooth');
    probe.style.setProperty('transition-duration', '2s');
    document.body.appendChild(probe);

    try {
      const style = getComputedStyle(probe);
      expect(style.scrollBehavior).toBe('auto');
      expect(style.transitionDuration).toBe('1e-05s');
      expect(style.animationDuration).toBe('1e-05s');
    } finally {
      probe.remove();
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
