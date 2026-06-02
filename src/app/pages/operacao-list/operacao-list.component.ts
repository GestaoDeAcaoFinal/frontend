import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { OperacaoService } from '../../services/operacao.service';

@Component({
  selector: 'app-operacao-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './operacao-list.component.html',
  styleUrl: './operacao-list.component.css'
})
export class OperacaoListComponent implements OnInit {

  operacoes: any[] = [];

  constructor(private operacaoService: OperacaoService) {}

  ngOnInit(): void {

    this.operacaoService
      .listar()
      .subscribe(data => {

        this.operacoes = data;

      });
  }
}
