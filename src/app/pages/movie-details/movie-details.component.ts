import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MoviesService } from 'src/app/services/movies.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.scss']
})
export class MovieDetailsComponent implements OnInit {

  getMovieDetailResult?: any;
  getMovieVideoResult?: string;
  getMovieCastResult?: any;
  isTrailerPlaying: boolean = false;
  trailerUrl: SafeResourceUrl | null = null;
  movieId: string | null = null;

  constructor(
    private moviesService: MoviesService,
    private route: ActivatedRoute,
    private title: Title,
    private meta: Meta,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    // Get the movie ID from the route parameter
    this.route.paramMap.subscribe(params => {
      this.movieId = params.get('id');
      console.log('Movie ID:', this.movieId);
      
      if (this.movieId) {
        this.getMovie(this.movieId);
        this.getVideo(this.movieId);
        this.getMovieCast(this.movieId);
      }
    });
  }

  getMovie(id: string) {
    this.moviesService.getMovieDetails(id).subscribe({
      next: (result) => {
        console.log('Movie details:', result);
        this.getMovieDetailResult = result;
        this.updateMetaTags();
      },
      error: (error) => {
        console.error('Error fetching movie details:', error);
      }
    });
  }

  updateMetaTags() {
    if (this.getMovieDetailResult) {
      this.title.setTitle(`${this.getMovieDetailResult.original_title} | ${this.getMovieDetailResult.tagline || 'Movie Details'}`);
      this.meta.updateTag({ name: 'title', content: this.getMovieDetailResult.original_title });
      this.meta.updateTag({ name: 'description', content: this.getMovieDetailResult.overview });

      // facebook
      this.meta.updateTag({ property: 'og:type', content: "website" });
      this.meta.updateTag({ property: 'og:url', content: window.location.href });
      this.meta.updateTag({ property: 'og:title', content: this.getMovieDetailResult.original_title });
      this.meta.updateTag({ property: 'og:description', content: this.getMovieDetailResult.overview });
      this.meta.updateTag({ property: 'og:image', content: `https://image.tmdb.org/t/p/original/${this.getMovieDetailResult.backdrop_path}` });
    }
  }

  getVideo(id: string) {
    this.moviesService.getMovieVideo(id).subscribe({
      next: (result) => {
        console.log('Video results:', result);
        if (result && result.results) {
          const trailer = result.results.find(element => 
            element.type === "Trailer" && element.site === "YouTube"
          );
          if (trailer) {
            console.log('Found trailer:', trailer);
            this.getMovieVideoResult = trailer.key;
          } else {
            console.log('No trailer found in results');
          }
        }
      },
      error: (error) => {
        console.error('Error fetching video:', error);
      }
    });
  }

  getMovieCast(id: string) {
    this.moviesService.getMovieCast(id).subscribe({
      next: (result) => {
        console.log('Cast results:', result);
        this.getMovieCastResult = result.cast;
      },
      error: (error) => {
        console.error('Error fetching cast:', error);
      }
    });
  }

  playTrailer() {
    console.log('Play trailer clicked');
    console.log('Video key:', this.getMovieVideoResult);
    
    if (this.getMovieVideoResult) {
      console.log('Creating trailer URL with key:', this.getMovieVideoResult);
      this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${this.getMovieVideoResult}?autoplay=1&rel=0`
      );
      this.isTrailerPlaying = true;
    } else {
      console.log('No video key available');
    }
  }

  closeTrailer() {
    this.isTrailerPlaying = false;
    this.trailerUrl = null;
  }
}
