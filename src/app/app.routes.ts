import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { AppShellComponent } from './components/app-shell/app-shell.component';
import { LandingComponent } from './pages/auth/landing.component';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { ForgotComponent } from './pages/auth/forgot.component';
import { ResetComponent } from './pages/auth/reset.component';
import { DashboardComponent } from './pages/app/dashboard.component';
import { LibraryComponent } from './pages/app/library.component';
import { StoryEditorComponent } from './pages/app/story-editor.component';
import { StoryReaderComponent } from './pages/app/story-reader.component';
import { StoryListComponent } from './pages/app/story-list.component';
import { CollectionsComponent, CollectionDetailComponent } from './pages/app/collections.component';
import { CategoriesComponent } from './pages/app/categories.component';
import { SearchComponent } from './pages/app/search.component';
import { ProfileComponent, ProfileEditComponent } from './pages/app/profile.component';
import { NotificationsComponent, ActivityComponent } from './pages/app/notifications-activity.component';
import { StatisticsComponent } from './pages/app/statistics.component';
import { TimelineComponent } from './pages/app/timeline.component';
import { SettingsComponent } from './pages/app/settings.component';
import { AdminComponent } from './pages/app/admin.component';
import { SharedReaderComponent } from './pages/public/shared-reader.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, canActivate: [guestGuard] },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'forgot', component: ForgotComponent, canActivate: [guestGuard] },
  { path: 'reset', component: ResetComponent, canActivate: [guestGuard] },
  { path: 's/:token', component: SharedReaderComponent },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'library', component: LibraryComponent },
      { path: 'story/new', component: StoryEditorComponent },
      { path: 'story/:id', component: StoryReaderComponent },
      { path: 'story/:id/edit', component: StoryEditorComponent },
      { path: 'favourites', component: StoryListComponent, data: { mode: 'favourites' } },
      { path: 'archive', component: StoryListComponent, data: { mode: 'archive' } },
      { path: 'trash', component: StoryListComponent, data: { mode: 'trash' } },
      { path: 'shared', component: StoryListComponent, data: { mode: 'shared' } },
      { path: 'collections', component: CollectionsComponent },
      { path: 'collections/:id', component: CollectionDetailComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'search', component: SearchComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile/edit', component: ProfileEditComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'activity', component: ActivityComponent },
      { path: 'statistics', component: StatisticsComponent },
      { path: 'timeline', component: TimelineComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'admin', component: AdminComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
