import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { OperacaoAcao, ResumoCarteira } from '../../core/api/api.models';
import { OperacaoService } from '../../services/operacao.service';
import { HomeComponent } from './home.component';

registerLocaleData(localePt, 'pt-BR');

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
  let operacaoService: jasmine.SpyObj<OperacaoService>;

  const carteira: ResumoCarteira = {
    quantidadeTotal: 12,
    precoMedioCarteira: 30,
    custoTotalCarteira: 360,
    valorAtualCarteira: 420,
    posicoes: [
      { acaoId: 1, ticker: 'PETR4', quantidadeAtual: 8, precoMedio: 25, custoTotal: 200, cotacaoAtual: 35, valorAtual: 280 },
      { acaoId: 2, ticker: 'VALE3', quantidadeAtual: 4, precoMedio: 40, custoTotal: 160, cotacaoAtual: 35, valorAtual: 140 }
    ]
  };

  const operacoes: OperacaoAcao[] = [
    {
      id: 2,
      quantidade: 4,
      precoUnitario: 40,
      precoMedio: 40,
      lucroPrejuizo: null,
      dataOperacao: '2026-09-10T10:00:00',
      valorTotal: 160,
      tipoOperacao: 'COMPRA',
      acao: {
        id: 2,
        ticker: 'VALE3',
        nomeEmpresa: 'Vale',
        mercado: 'BR',
        moeda: 'BRL',
        cotacaoAtual: 35,
        dataHoraCotacao: null,
        corretoraRelacionada: {} as OperacaoAcao['acao']['corretoraRelacionada']
      }
    },
    {
      id: 1,
      quantidade: 8,
      precoUnitario: 25,
      precoMedio: 25,
      lucroPrejuizo: null,
      dataOperacao: '2026-09-12T14:30:00',
      valorTotal: 200,
      tipoOperacao: 'COMPRA',
      acao: {
        id: 1,
        ticker: 'PETR4',
        nomeEmpresa: 'Petrobras',
        mercado: 'BR',
        moeda: 'BRL',
        cotacaoAtual: 35,
        dataHoraCotacao: null,
        corretoraRelacionada: {} as OperacaoAcao['acao']['corretoraRelacionada']
      }
    }
  ];

  beforeEach(async () => {
    operacaoService = jasmine.createSpyObj<OperacaoService>('OperacaoService', ['resumirCarteira', 'listar']);
    operacaoService.resumirCarteira.and.returnValue(of(carteira));
    operacaoService.listar.and.returnValue(of(operacoes));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: OperacaoService, useValue: operacaoService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('apresenta indicadores financeiros obtidos da API', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('Sua carteira, organizada');
    expect(host.querySelector('[data-testid="valor-atual"]')?.textContent).toContain('420,00');
    expect(host.querySelector('[data-testid="custo-total"]')?.textContent).toContain('360,00');
    expect(host.querySelector('[data-testid="resultado"]')?.textContent).toContain('60,00');
    expect(host.querySelector('[data-testid="quantidade-total"]')?.textContent).toContain('12');
  });

  it('mostra a distribuição por ativo e as operações mais recentes', () => {
    const host = fixture.nativeElement as HTMLElement;
    const allocations = Array.from(host.querySelectorAll('.allocation-row'));
    const recentOperations = Array.from(host.querySelectorAll('.recent-operation'));

    expect(allocations.length).toBe(2);
    expect(allocations[0].textContent).toContain('PETR4');
    expect(allocations[0].querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('66.67');
    expect(recentOperations.length).toBe(2);
    expect(recentOperations[0].textContent).toContain('PETR4');
    expect(recentOperations[1].textContent).toContain('VALE3');
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
