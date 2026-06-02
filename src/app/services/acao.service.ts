import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AcaoService {

  private apiUrl = 'http://localhost:8080/acoes';

  constructor(private http: HttpClient) {}

  salvar(acao: any): Observable<any> {
    return this.http.post(this.apiUrl, acao);
  }

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
