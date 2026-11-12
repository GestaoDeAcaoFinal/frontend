import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AcaoService, AtualizacaoCotacao } from '../../services/acao.service';
import { AtualizarCotacoesComponent } from './atualizar-cotacoes.component';

describe('AtualizarCotacoesComponent', () => {
  it('bloqueia clique duplicado e informa falhas parciais antes de recarregar os dados', () => {
    const request = new Subject<AtualizacaoCotacao[]>();
    const service = jasmine.createSpyObj('AcaoService', ['atualizarTodasCotacoes']);
    service.atualizarTodasCotacoes.and.returnValue(request);
    TestBed.configureTestingModule({ imports: [AtualizarCotacoesComponent], providers: [
      { provide: AuthService, useValue: { hasRole: () => true } },
      { provide: AcaoService, useValue: service }
    ] });
    const fixture = TestBed.createComponent(AtualizarCotacoesComponent);
    const component = fixture.componentInstance;
    const emit = spyOn(component.atualizadas, 'emit');
    component.atualizar(); component.atualizar(); fixture.detectChanges();
    expect(service.atualizarTodasCotacoes).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('button').disabled).toBeTrue();
    request.next([{ ticker: 'PETR4', sucesso: true }, { ticker: 'MGLU3', sucesso: false, erro: 'Provedor indisponível' }]);
    request.complete(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('1 de 2');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('MGLU3');
    expect(emit).toHaveBeenCalledTimes(1);
    expect(component.atualizando).toBeFalse();
  });
});
