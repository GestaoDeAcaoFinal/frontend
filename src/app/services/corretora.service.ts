import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CorretoraService {

  private apiUrl = 'http://localhost:8080/corretoras';

  constructor(private http: HttpClient) { }

  salvar(corretora: any): Observable<any> {
    return this.http.post(this.apiUrl, corretora);
  }

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
