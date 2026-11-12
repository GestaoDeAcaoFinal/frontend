import { Component, EventEmitter, inject, Output } from '@angular/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AcaoService } from '../../services/acao.service';

@Component({
  selector: 'app-atualizar-cotacoes',
  template: `
    @if (auth.hasRole('ADMIN')) {
      <button type="button" class="btn-finance-secondary" [disabled]="atualizando" (click)="atualizar()">
        {{ atualizando ? 'Atualizando cotações…' : 'Atualizar todas as cotações' }}
      </button>
      @if (mensagem) { <p role="status" aria-live="polite">{{ mensagem }}</p> }
      @if (erro) { <p class="text-danger" role="alert">{{ erro }}</p> }
    }
  `
})
export class AtualizarCotacoesComponent {
  readonly auth = inject(AuthService);
  private readonly acoes = inject(AcaoService);
  @Output() readonly atualizadas = new EventEmitter<void>();
  atualizando = false;
  mensagem = '';
  erro = '';

  atualizar(): void {
    if (this.atualizando || !this.auth.hasRole('ADMIN')) return;
    this.atualizando = true;
    this.mensagem = '';
    this.erro = '';
    this.acoes.atualizarTodasCotacoes().pipe(finalize(() => this.atualizando = false)).subscribe({
      next: resultados => {
        const falhas = resultados.filter(resultado => !resultado.sucesso);
        this.mensagem = resultados.length === 0 ? 'Nenhuma ação cadastrada para atualizar.'
          : `${resultados.length - falhas.length} de ${resultados.length} cotações atualizadas.`;
        this.erro = falhas.map(falha => `${falha.ticker}: ${falha.erro}`).join('; ');
        this.atualizadas.emit();
      },
      error: erro => { this.erro = erro.message; }
    });
  }
}
