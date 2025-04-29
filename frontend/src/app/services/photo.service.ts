import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private photoUploadedSource = new Subject<void>();
  photoUploaded$ = this.photoUploadedSource.asObservable();
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }
  notifyPhotoUploaded() {
    this.photoUploadedSource.next();
  }
  uploadPhoto(photo: File, eventId: string): Observable<any> {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('eventId', eventId);

    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  getPhotosByEvent(eventId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/photos/${eventId}`);
  }

  deletePhoto(photoId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/photos/${photoId}`);
  }
}
