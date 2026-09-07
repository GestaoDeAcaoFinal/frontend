import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, throwError } from 'rxjs';

import { ApiError } from '../../core/api/api-error.interceptor';
import { Corretora } from '../../core/api/api.models';
import { CorretoraService } from '../../services/corretora.service';
import { CorretoraFormComponent } from './corretora-form.component';

describe('CorretoraFormComponent', () => {
  const corretora: Corretora = {
    id: 1, cnpj: '12345678000190', razaoSocial: 'Corretora Teste SA',
    nomeFantasia: 'Corretora Teste', email: null, telefone: null, cep: '01001000',
    logradouro: null, numero: null, complemento: null, bairro: null, cidade: 'São Paulo',
    uf: 'SP', situacaoCadastral: 'ATIVA', validadaNaCvm: true,
    dataCadastro: '2026-09-04T08:00:00'
  };
  let component: CorretoraFormComponent;
  let fixture: ComponentFixture<CorretoraFormComponent>;
  let service: jasmine.SpyObj<CorretoraService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<CorretoraService>('CorretoraService', ['salvar']);
    await TestBed.configureTestingModule({
      imports: [CorretoraFormComponent],
      providers: [
        provideRouter([]),
        { provide: CorretoraService, useValue: service }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorretoraFormComponent);
    component = fixture.componentInstance;
  });

  it('renderiza o fluxo em um painel financeiro acessível', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('main.page-shell')).not.toBeNull();
    expect(host.querySelector('nav[aria-label="Navegação estrutural"]')).not.toBeNull();
    expect(host.querySelector('form.finance-form')).not.toBeNull();
    expect(host.querySelector('.form-actions')).not.toBeNull();
  });

  it('não envia CNPJ e CEP inválidos', () => {
    component.form.setValue({ cnpj: '123', cep: '12A' });

    component.salvar();

    expect(component.form.invalid).toBeTrue();
    expect(service.salvar).not.toHaveBeenCalled();
  });

  it('bloqueia duplicidade enquanto salva e apresenta a resposta enriquecida', () => {
    const response = new Subject<Corretora>();
    service.salvar.and.returnValue(response);
    component.form.setValue({ cnpj: '12.345.678/0001-90', cep: '01001-000' });

    component.salvar();
    component.salvar();

    expect(service.salvar).toHaveBeenCalledOnceWith({
      cnpj: '12.345.678/0001-90',
      cep: '01001-000'
    });
    expect(component.state.loading).toBeTrue();

    response.next(corretora);
    response.complete();

    expect(component.state.loading).toBeFalse();
    expect(component.state.data).toEqual(corretora);
    expect(component.state.successMessage).toBe('Corretora cadastrada com sucesso.');
  });

  it('preserva valores e associa erros do backend aos campos', () => {
    service.salvar.and.returnValue(throwError(() => new ApiError(
      409,
      'Conflito',
      'CNPJ já cadastrado',
      { cnpj: ['CNPJ já cadastrado'] }
    )));
    component.form.setValue({ cnpj: '12345678000190', cep: '01001000' });

    component.salvar();

    expect(component.form.getRawValue()).toEqual({
      cnpj: '12345678000190',
      cep: '01001000'
    });
    expect(component.form.controls.cnpj.errors?.['server']).toEqual(['CNPJ já cadastrado']);
    expect(component.state.error?.message).toBe('CNPJ já cadastrado');
  });
});
