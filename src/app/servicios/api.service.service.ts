import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../enviroments/env';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  constructor(private http: HttpClient) { }

  /**
   * Crea un convenio enviando el token Bearer capturado en el Tab 1
   */
  crearConvenio(data: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(env.apiCrearConvenio, data, { headers });
  }

  crearFolios(data: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(env.apiCrearFolios, data, { headers });
  }

  vincularOfertas(data: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(env.apiVincularOfertas, data, { headers });
  }
}