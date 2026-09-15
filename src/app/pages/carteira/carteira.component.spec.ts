import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { ApiError } from '../../core/api/api-error.interceptor';
import { ResumoCarteira } from '../../core/api/api.models';
import { OperacaoService } from '../../services/operacao.service';
import { CarteiraComponent } from './carteira.component';

registerLocaleData(localePt, 'pt-BR');

const resumo: ResumoCarteira = {
  posicoes: [
    { acaoId: 7, ticker: 'AAPL', quantidadeAtual: 2, precoMedio: 525, custoTotal: 1050, cotacaoAtual: 550, valorAtual: 1100 }
  ],
  quantidadeTotal: 2,
  precoMedioCarteira: 525,
  custoTotalCarteira: 1050,
  valorAtualCarteira: 1100
};

describe('CarteiraComponent', () => {
  let component: CarteiraComponent;
  let fixture: ComponentFixture<CarteiraComponent>;
  let service: jasmine.SpyObj<OperacaoService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<OperacaoService>('OperacaoService', ['resumirCarteira']);
    service.resumirCarteira.and.returnValue(of(resumo));
    await TestBed.configureTestingModule({
      imports: [CarteiraComponent],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: OperacaoService, useValue: service }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CarteiraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega e apresenta a carteira consolidada em BRL', () => {
    expect(service.resumirCarteira).toHaveBeenCalledTimes(1);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="valor-atual"]')?.textContent).toContain('1.100,00');
    expect(host.querySelector('[data-testid="resultado"]')?.textContent).toContain('50,00');
    expect(host.querySelector('[data-testid="numero-posicoes"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-testid="posicao-AAPL"]')?.textContent).toContain('AAPL');
    expect(host.textContent).toContain('convertidos para BRL pela cotação atual');
  });

  it('expõe carregamento, erro com retry e estado vazio', () => {
    const pending = new Subject<ResumoCarteira>();
    service.resumirCarteira.and.returnValue(pending);
    component.carregarCarteira();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    pending.error(new ApiError(503, 'Indisponível', 'Carteira indisponível.'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('Carteira indisponível.');

    service.resumirCarteira.and.returnValue(of({ ...resumo, posicoes: [], quantidadeTotal: 0 }));
    (fixture.nativeElement.querySelector('[data-testid="carteira-retry"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma ação em posse');
  });
});
