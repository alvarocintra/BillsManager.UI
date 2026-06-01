import { afterNextRender, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faTimes, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterModule,
    FontAwesomeModule,
    CommonModule
  ],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.scss'
})
export class App implements OnChanges, OnInit {
  manageOpen = false;
  faChevronDown = faChevronDown;
  faBars = faBars;
  faTimes = faTimes;
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  public sidebarOpen = true;
  currentUser: any = null;
  isAuthenticated = false;

  constructor(private authService: AuthService) {
    afterNextRender(() => {
      this.setSidebarOpen();
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setSidebarOpen();
  }

  setSidebarOpen() {
    const mediaQuery = window?.matchMedia('(max-width: 768px)');
    mediaQuery?.addEventListener('change', () => {
      if (mediaQuery.matches) {
        this.sidebarOpen = false;
      } else {
        this.sidebarOpen = true;
      }
    });
    if (mediaQuery?.matches) {
      this.sidebarOpen = false;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleManage() {
    this.manageOpen = !this.manageOpen;
  }

  logout() {
    this.authService.logout();
  }
}
