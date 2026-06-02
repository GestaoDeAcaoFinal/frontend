import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OperacaoService } from '../../services/operacao.service';

@Component({
  selector: 'app-operacao-form',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './operacao-form.component.html',
  styleUrl: './operacao-form.component.css'
})
export class OperacaoFormComponent {

  acaoId!: number;
  quantidade!: number;
  tipoOperacao: string = 'COMPRA';
  precoVenda!: number;

  constructor(private operacaoService: OperacaoService) {}

  salvar() {

    if (this.tipoOperacao === 'COMPRA') {

      this.operacaoService
        .comprar(this.acaoId, this.quantidade)
        .subscribe({
          next: () => alert('Compra realizada'),
          error: err => console.error(err)
        });

    } else {

      this.operacaoService
        .vender(
          this.acaoId,
          this.quantidade,
          this.precoVenda
        )
        .subscribe({
          next: () => alert('Venda realizada'),
          error: err => {

            if (err.error?.message) {
              alert(err.error.message);
            } else {
              alert('Erro ao realizar venda');
            }

            console.error(err);
          }
        });

    }
  }
}
