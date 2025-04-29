import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovieApiServiceService {
  private baseUrl = environment.tmdb.baseUrl;
  private apiKey = environment.tmdb.apiKey;

  constructor(private http: HttpClient) { }

  getMovieVideo(movieId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/${movieId}/videos?api_key=${this.apiKey}`);
  }
}