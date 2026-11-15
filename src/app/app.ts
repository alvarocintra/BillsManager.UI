import { afterNextRender, ChangeDetectorRef, Component, HostListener, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faTimes, faSignOutAlt, faUser, faFileInvoiceDollar, faSuitcaseRolling, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { TenantAccess } from './models/auth.models';
import { LanguageService, SupportedLanguage } from './services/language.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterModule,
    FontAwesomeModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.scss'
})
export class App implements OnChanges, OnInit {
  manageOpen = false;
  tripsOpen = false;
  investmentsOpen = false;
  userMenuOpen = false;
  faChevronDown = faChevronDown;
  faBars = faBars;
  faTimes = faTimes;
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  faBills = faFileInvoiceDollar;
  faTrips = faSuitcaseRolling;
  faInvestments = faChartLine;
  public sidebarOpen = true;
  public isMobile = false;
  currentUser: any = null;
  tenantAccess: TenantAccess[] = [];
  activeTenantId = '';
  isAuthenticated = false;
  isScrolled = false;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef, public readonly languageService: LanguageService) {
    afterNextRender(() => {
      this.setSidebarOpen();
      this.updateScrollState();
      this.languageService.initialize();
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.syncTenantSelection();
    this.isAuthenticated = this.authService.isAuthenticated();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.syncTenantSelection();
      this.cdr.detectChanges();
    });

    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setSidebarOpen();
  }

  setSidebarOpen() {
    const mediaQuery = window?.matchMedia('(max-width: 900px)');
    this.isMobile = Boolean(mediaQuery?.matches);
    mediaQuery?.addEventListener('change', () => {
      this.isMobile = mediaQuery.matches;
      if (mediaQuery.matches) {
        this.sidebarOpen = false;
        this.closeSubmenus();
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

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  changeLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
  }

  closeMobileNavigation(): void {
    this.closeSubmenus();
    this.sidebarOpen = false;
  }

  toggleManage() {
    this.manageOpen = !this.manageOpen;
    if (this.manageOpen) {
      this.tripsOpen = false;
      this.investmentsOpen = false;
    }
  }

  toggleTrips() {
    this.tripsOpen = !this.tripsOpen;
    if (this.tripsOpen) {
      this.manageOpen = false;
      this.investmentsOpen = false;
    }
  }

  toggleInvestments() {
    this.investmentsOpen = !this.investmentsOpen;
    if (this.investmentsOpen) {
      this.manageOpen = false;
      this.tripsOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && !target.closest('.submenu-wrap')) {
      this.closeSubmenus();
    }
    if (target instanceof Element && !target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
    if (this.isMobile && target instanceof Element && !target.closest('.topbar')) {
      this.sidebarOpen = false;
      this.closeSubmenus();
    }
  }

  private closeSubmenus(): void {
    this.manageOpen = false;
    this.tripsOpen = false;
    this.investmentsOpen = false;
  }

  logout() {
    this.authService.logout();
  }

  changeTenant(tenantId: string): void {
    if (!tenantId || tenantId === this.activeTenantId) {
      return;
    }

    this.authService.selectTenant(tenantId);
    window.location.reload();
  }

  private syncTenantSelection(): void {
    this.tenantAccess = this.authService.getTenantAccess();
    this.activeTenantId = this.authService.getTenantId() ?? '';
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    this.isScrolled = window.scrollY > 8;
  }
}
