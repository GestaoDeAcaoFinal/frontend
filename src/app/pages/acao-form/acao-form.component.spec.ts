import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ApiError } from '../../core/api/api-error.interceptor';
import { Acao, Corretora } from '../../core/api/api.models';
import { AcaoService } from '../../services/acao.service';
import { CorretoraService } from '../../services/corretora.service';
import { AcaoFormComponent } from './acao-form.component';

const corretora: Corretora = { id: 2, cnpj: '12345678000190', razaoSocial: 'XP', nomeFantasia: null, email: null, telefone: null, cep: '01001000', logradouro: null, numero: null, complemento: null, bairro: null, cidade: 'São Paulo', uf: 'SP', situacaoCadastral: null, validadaNaCvm: true, dataCadastro: null };
const acao: Acao = { id: 1, ticker: 'PETR4', nomeEmpresa: 'Petrobras', mercado: 'B3', moeda: 'BRL', cotacaoAtual: 35, dataHoraCotacao: '2026-09-04T10:00:00', corretoraRelacionada: corretora };

describe('AcaoFormComponent', () => {
  let fixture: ComponentFixture<AcaoFormComponent>;
  let component: AcaoFormComponent;
  let acaoService: jasmine.SpyObj<AcaoService>;
  let corretoraService: jasmine.SpyObj<CorretoraService>;
  beforeEach(async () => {
    acaoService = jasmine.createSpyObj('AcaoService', ['salvar']);
    corretoraService = jasmine.createSpyObj('CorretoraService', ['listar']);
    corretoraService.listar.and.returnValue(of([corretora]));
    await TestBed.configureTestingModule({ imports: [AcaoFormComponent], providers: [provideRouter([]), { provide: AcaoService, useValue: acaoService }, { provide: CorretoraService, useValue: corretoraService }] }).compileComponents();
    fixture = TestBed.createComponent(AcaoFormComponent); component = fixture.componentInstance; fixture.detectChanges();
  });
  it('renderiza o fluxo em um painel financeiro acessível', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('main.page-shell')).not.toBeNull();
    expect(host.querySelector('nav[aria-label="Navegação estrutural"]')).not.toBeNull();
    expect(host.querySelector('form.finance-form')).not.toBeNull();
    expect(host.querySelector('.form-actions')).not.toBeNull();
  });
  it('carrega corretoras e não envia formulário inválido', () => {
    expect(component.corretorasState.data).toEqual([corretora]);
    component.form.setValue({ ticker: 'P', corretoraId: 0 }); component.salvar();
    expect(acaoService.salvar).not.toHaveBeenCalled();
  });
  it('envia somente ticker e corretoraId e bloqueia duplicidade', () => {
    const pending = new Subject<Acao>(); acaoService.salvar.and.returnValue(pending);
    component.form.setValue({ ticker: 'PETR4', corretoraId: 2 }); component.salvar(); component.salvar();
    expect(acaoService.salvar).toHaveBeenCalledOnceWith({ ticker: 'PETR4', corretoraId: 2 });
    pending.next(acao); expect(component.state.data).toEqual(acao);
  });
  it('preserva valores quando cadastro falha e expõe erros por campo', () => {
    acaoService.salvar.and.returnValue(throwError(() => new ApiError(422, 'Dados inválidos', 'Revise os campos.', { ticker: ['Ticker inválido'] })));
    component.form.setValue({ ticker: 'PETR4', corretoraId: 2 }); component.salvar();
    expect(component.form.getRawValue()).toEqual({ ticker: 'PETR4', corretoraId: 2 });
    expect(component.form.controls.ticker.errors?.['server']).toEqual(['Ticker inválido']);
  });
});
