import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../environments/environment';
import { API_BASE_URL } from './core/api/api-base-url.token';
import { ApiError } from './core/api/api-error.interceptor';
import { appConfig } from './app.config';

describe('appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(appConfig.providers ?? []),
        provideHttpClientTesting()
      ]
    });
  });

  it('fornece a URL base configurada pelo ambiente', () => {
    expect(TestBed.inject(API_BASE_URL)).toBe(environment.apiBaseUrl);
    expect(environment.apiBaseUrl).toBe('http://localhost:8080');
  });

  it('registra o interceptor de erro sem adicionar autenticação', () => {
    const http = TestBed.inject(HttpClient);
    const httpTesting = TestBed.inject(HttpTestingController);
    let received: ApiError | undefined;

    http.get('/resource').subscribe({ error: error => received = error });
    const request = httpTesting.expectOne('/resource');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush(
      { status: 404, title: 'Recurso não encontrado', detail: 'Ação não encontrada' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(received).toEqual(jasmine.any(ApiError));
    expect(received?.message).toBe('Ação não encontrada');
    httpTesting.verify();
  });
});
