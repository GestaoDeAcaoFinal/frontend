import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../core/api/api-error.interceptor';
import { Acao, Corretora } from '../../core/api/api.models';
import { AcaoService } from '../../services/acao.service';
import { AcaoListComponent } from './acao-list.component';

const corretora: Corretora = { id: 2, cnpj: '12345678000190', razaoSocial: 'XP', nomeFantasia: null, email: null, telefone: null, cep: '01001000', logradouro: null, numero: null, complemento: null, bairro: null, cidade: 'São Paulo', uf: 'SP', situacaoCadastral: null, validadaNaCvm: true, dataCadastro: null };
const acao: Acao = { id: 1, ticker: 'PETR4', nomeEmpresa: 'Petrobras', mercado: 'B3', moeda: 'BRL', cotacaoAtual: 35, dataHoraCotacao: null, corretoraRelacionada: corretora };

describe('AcaoListComponent', () => {
  let fixture: ComponentFixture<AcaoListComponent>; let component: AcaoListComponent; let service: jasmine.SpyObj<AcaoService>;
  beforeEach(async () => {
    service = jasmine.createSpyObj('AcaoService', ['listar', 'buscarPorId', 'buscarPorTicker', 'atualizarCotacao']); service.listar.and.returnValue(of([]));
    await TestBed.configureTestingModule({ imports: [AcaoListComponent], providers: [provideRouter([]), { provide: AcaoService, useValue: service }] }).compileComponents();
    fixture = TestBed.createComponent(AcaoListComponent); component = fixture.componentInstance; fixture.detectChanges();
  });
  it('representa lista vazia e permite retry após erro', () => {
    expect(component.listState.data).toEqual([]);
    service.listar.and.returnValue(throwError(() => new ApiError(503, 'Indisponível', 'Tente depois.'))); component.carregarAcoes();
    expect(component.listState.error?.status).toBe(503);
    service.listar.and.returnValue(of([acao])); component.carregarAcoes(); expect(component.listState.data).toEqual([acao]);
  });
  it('bloqueia consulta inválida e busca ticker válido', () => {
    component.searchForm.setValue({ criterio: 'id', valor: '0' }); component.buscar(); expect(service.buscarPorId).not.toHaveBeenCalled();
    service.buscarPorTicker.and.returnValue(of(acao)); component.searchForm.setValue({ criterio: 'ticker', valor: ' petr4 ' }); component.buscar();
    expect(service.buscarPorTicker).toHaveBeenCalledOnceWith('PETR4'); expect(component.searchState.data).toEqual(acao);
  });
  it('atualiza a ação visível e preserva dados se provedor falhar', () => {
    component.listState.data = [acao]; const atualizada = { ...acao, cotacaoAtual: 36 };
    service.atualizarCotacao.and.returnValue(of(atualizada)); component.atualizarCotacao(acao); expect(component.listState.data?.[0].cotacaoAtual).toBe(36);
    service.atualizarCotacao.and.returnValue(throwError(() => new ApiError(502, 'Provedor', 'Falhou.'))); component.atualizarCotacao(atualizada);
    expect(component.listState.data?.[0].cotacaoAtual).toBe(36); expect(component.updateErrors[1].status).toBe(502);
  });

  it('oculta o resultado anterior quando uma nova consulta falha', () => {
    service.buscarPorId.and.returnValues(
      of(acao),
      throwError(() => new ApiError(404, 'Não encontrada', 'Ação não encontrada.'))
    );

    component.searchForm.setValue({ criterio: 'id', valor: '1' });
    component.buscar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.search-result')).not.toBeNull();

    component.searchForm.setValue({ criterio: 'id', valor: '2' });
    component.buscar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ação não encontrada.');
    expect(fixture.nativeElement.querySelector('.search-result')).toBeNull();
  });

  it('organiza consulta e resultados como uma listagem financeira', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('div.page-shell')).not.toBeNull();
    expect(host.querySelector('section.filter-panel')).not.toBeNull();
    expect(host.querySelector('a.btn-finance-primary')).not.toBeNull();
  });
});
