import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CorretoraService } from '../../services/corretora.service';

@Component({
  selector: 'app-corretora-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './corretora-list.component.html',
  styleUrl: './corretora-list.component.css'
})
export class CorretoraListComponent implements OnInit {

  corretoras: any[] = [];

  constructor(private corretoraService: CorretoraService) {}

  ngOnInit(): void {
    this.carregarCorretoras();
  }

  carregarCorretoras() {
    this.corretoraService.listar().subscribe({
      next: (dados) => {
        this.corretoras = dados;
      },
      error: (erro) => {
        console.error('Erro ao carregar corretoras', erro);
      }
    });
  }
}
