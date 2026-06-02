import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AcaoService } from '../../services/acao.service';

@Component({
  selector: 'app-acao-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './acao-list.component.html',
  styleUrl: './acao-list.component.css'
})
export class AcaoListComponent implements OnInit {

  acoes: any[] = [];

  constructor(private acaoService: AcaoService) {}

  ngOnInit(): void {
    this.carregarAcoes();
  }

  carregarAcoes() {
    this.acaoService.listar().subscribe({
      next: (dados) => {
        this.acoes = dados;
      },
      error: (erro) => {
        console.error(erro);
      }
    });
  }
}
