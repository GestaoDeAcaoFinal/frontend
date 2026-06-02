import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CorretoraService } from '../../services/corretora.service';

@Component({
  selector: 'app-corretora-form',
  imports: [RouterLink, FormsModule],
  templateUrl: './corretora-form.component.html',
  styleUrl: './corretora-form.component.css'
})
export class CorretoraFormComponent {

  cnpj: string = '';
  cep: string = '';

  constructor(private corretoraService: CorretoraService) {}

  salvar() {

    const corretora = {
      cnpj: this.cnpj,
      cep: this.cep
    };

    this.corretoraService.salvar(corretora).subscribe({
      next: (response) => {
        alert('Corretora cadastrada com sucesso!');
        console.log(response);
      },
      error: (err) => {
        alert('Erro ao cadastrar corretora');
        console.error(err);
      }
    });
  }
}
