import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../core/api/api-base-url.token';
import { OperacaoAcao } from '../core/api/api.models';

@Injectable({
  providedIn: 'root'
})
export class OperacaoService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/operacoes`;
  }

  listar(): Observable<OperacaoAcao[]> {
    return this.http.get<OperacaoAcao[]>(this.apiUrl);
  }

  comprar(acaoId: number, quantidade: number): Observable<OperacaoAcao> {
    const params = new HttpParams().set('quantidade', quantidade);
    return this.http.post<OperacaoAcao>(
      `${this.apiUrl}/comprar/${acaoId}`,
      {},
      { params }
    );
  }

  vender(acaoId: number, quantidade: number, precoVenda: number): Observable<OperacaoAcao> {
    const params = new HttpParams()
      .set('quantidade', quantidade)
      .set('precoVenda', precoVenda);
    return this.http.post<OperacaoAcao>(
      `${this.apiUrl}/vender/${acaoId}`,
      {},
      { params }
    );
  }

  listarHistorico(acaoId: number): Observable<OperacaoAcao[]> {
    return this.http.get<OperacaoAcao[]>(`${this.apiUrl}/${acaoId}`);
  }

  listarCompras(): Observable<OperacaoAcao[]> {
    return this.http.get<OperacaoAcao[]>(`${this.apiUrl}/compras`);
  }

  listarVendas(): Observable<OperacaoAcao[]> {
    return this.http.get<OperacaoAcao[]>(`${this.apiUrl}/vendas`);
  }

  buscarPorId(id: number): Observable<OperacaoAcao> {
    return this.http.get<OperacaoAcao>(`${this.apiUrl}/buscar/${id}`);
  }
}
