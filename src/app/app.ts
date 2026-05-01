import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, FontAwesomeModule],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.scss'
})
export class App implements OnChanges, OnInit {
  manageOpen = false;
  faChevronDown = faChevronDown;
  faBars = faBars;
  faTimes = faTimes;
  public sidebarOpen = true;

  ngOnInit(): void {
    this.setSidebarOpen();
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
}
