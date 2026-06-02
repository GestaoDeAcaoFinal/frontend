import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AcaoService } from '../../services/acao.service';

@Component({
  selector: 'app-acao-form',
  imports: [RouterLink, FormsModule],
  templateUrl: './acao-form.component.html',
  styleUrl: './acao-form.component.css'
})
export class AcaoFormComponent {

  ticker: string = '';
  corretoraId!: number;

  constructor(private acaoService: AcaoService) {}

  salvar() {

    const acao = {
      ticker: this.ticker,
      corretoraId: this.corretoraId
    };

    this.acaoService.salvar(acao).subscribe({
      next: () => {
        alert('Ação cadastrada com sucesso!');
      },
      error: (err) => {
        alert('Erro ao cadastrar ação');
        console.error(err);
      }
    });
  }
}
