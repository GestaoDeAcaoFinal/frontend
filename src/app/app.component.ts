import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Nexo Capital';
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private hadSession = false;
  private readonly sessionWatcher = effect(() => {
    const authenticated = this.auth.isAuthenticated();
    if (this.hadSession && !authenticated && !this.router.url.startsWith('/login')) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    }
    this.hadSession = authenticated;
  });

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
