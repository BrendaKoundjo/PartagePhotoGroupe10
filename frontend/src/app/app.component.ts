import { UiService } from './services/uiService';
import { Component } from '@angular/core';
import {ActivatedRoute, RouterLink, RouterOutlet, RouterLinkActive, Router, NavigationEnd} from '@angular/router';
import {PhotoService} from "./services/photo.service";
import {filter} from "rxjs";
import {NgIf} from "@angular/common";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title: string = 'Photos share';
  selectedFile: File | null = null;
  previewUrl: string = "";
  eventId: string = 'event123';
  currentRoute: string = '';
  uploadSuccess: boolean = false;

  constructor(
    public uiService: UiService,
    private photoService: PhotoService,
    private router: Router){
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const nav = event as NavigationEnd;
      this.currentRoute = nav.urlAfterRedirects;
    });
  }

  onFileSelected(event: Event): void{
    const input = event.target as HTMLInputElement;
    if(input.files && input.files.length > 0 ){
      this.selectedFile = input.files[0];

      // Préparer l'aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }

  }

  upload() {
    if (this.selectedFile && this.eventId) {
      this.photoService.uploadPhoto(this.selectedFile, this.eventId).subscribe({
        next: (res) => {
          console.log('Upload réussi', res);
          this.photoService.notifyPhotoUploaded();
          this.uploadSuccess = true;
          this.resetdata();
          this.uiService.close_forms();

          // Réinitialiser le message après 2 secondes
          setTimeout(() => this.uploadSuccess = false, 2000);
        },
        error: (err) => console.error('Erreur upload:', err)
      });
    }
  }

  openDynamicForm() {
    if (this.currentRoute.includes('/photos')) {
      this.uiService.open_form('.upload-image');
    } else if (this.currentRoute.includes('/albums')) {
      this.uiService.open_form('.upload-album');
    }
  }

  resetdata(){
    this.previewUrl = "";
    this.selectedFile = null;
  }

}
