import { UiService } from './services/uiService';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title: string = 'Photos share';
  selectedFile: File | null = null;
  previewUrl: string = ""; 

  constructor(public uiService: UiService){

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

  resetdata(){
    this.previewUrl = "";
    this.selectedFile = null;
  }

}
