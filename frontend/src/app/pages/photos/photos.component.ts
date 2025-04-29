import {Component, OnInit} from '@angular/core';
import {PhotoService} from "../../services/photo.service";
import {NgForOf} from "@angular/common";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.scss'
})
export class PhotosComponent implements OnInit {
  photos: any[] = [];
  private subscription!: Subscription;
  eventId: string = 'event123';
  constructor(private photoService: PhotoService) { }


  loadPhotos() {
    this.photoService.getPhotosByEvent(this.eventId).subscribe({
      next: (data) => {
        this.photos = data;
      },
      error: (err) => console.error('Erreur chargement:', err)
    });
  }

  deletePhoto(photoId: string) {
    this.photoService.deletePhoto(photoId).subscribe({
      next: (res) => {
        console.log('Suppression réussie', res);
        this.loadPhotos();
      },
      error: (err) => console.error('Erreur suppression:', err)
    });
  }

  ngOnInit() {
    this.loadPhotos();
    this.subscription = this.photoService.photoUploaded$.subscribe(() => {
      this.loadPhotos();
    });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
