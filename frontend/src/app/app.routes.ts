import { Routes } from '@angular/router';
import { PhotosComponent } from './pages/photos/photos.component';
import { AlbumsComponent } from './pages/albums/albums.component';
import { AppComponent } from './app.component';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'photos',
        pathMatch: 'full'
    },
    {
        path: '',
        title: 'Application',
        component: AppComponent
    },
    {
        path: 'photos',
        title: 'Photos',
        component: PhotosComponent
    },

    {
        path: 'albums',
        title: 'Albums',
        component: AlbumsComponent
    }

];
