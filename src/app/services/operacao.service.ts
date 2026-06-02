import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OperacaoService {

  private apiUrl = 'http://localhost:8080/operacoes';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<any[]>(this.apiUrl);
  }

  comprar(acaoId: number, quantidade: number) {
    return this.http.post(
      `${this.apiUrl}/comprar/${acaoId}?quantidade=${quantidade}`,
      {}
    );
  }

  vender(acaoId: number, quantidade: number, precoVenda: number) {
    return this.http.post(
      `${this.apiUrl}/vender/${acaoId}?quantidade=${quantidade}&precoVenda=${precoVenda}`,
      {}
    );
  }
}
