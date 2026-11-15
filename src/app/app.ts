import { afterNextRender, ChangeDetectorRef, Component, HostListener, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faChevronDown, faTimes, faSignOutAlt, faUser, faFileInvoiceDollar, faSuitcaseRolling, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { Tenant, TenantAccess } from './models/auth.models';
import { LanguageService, SupportedLanguage } from './services/language.service';
import { TenantsRepository } from './services/tenants.repository';
import { Router } from '@angular/router';
import { ThemeService } from './services/theme.service';

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
  tenantNames = new Map<string, string>();
  activeTenantId = '';
  isAuthenticated = false;
  isAdmin = false;
  isScrolled = false;

  constructor(
    private authService: AuthService,
    private tenantsRepository: TenantsRepository,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public readonly languageService: LanguageService,
    public readonly themeService: ThemeService
  ) {
    afterNextRender(() => {
      this.setSidebarOpen();
      this.updateScrollState();
      this.languageService.initialize();
    });
  }

  ngOnInit(): void {
    this.languageService.initialize();
    this.currentUser = this.authService.getCurrentUser();
    this.syncTenantSelection();
    this.isAdmin = this.authService.getTenantAccess().some(access => access.id === this.activeTenantId && access.role?.toLowerCase() === 'admin');
    this.isAuthenticated = this.authService.isAuthenticated();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.syncTenantSelection();
      this.isAdmin = this.authService.getTenantAccess().some(access => access.id === this.activeTenantId && access.role?.toLowerCase() === 'admin');
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
    this.userMenuOpen = false;
    window.location.assign('/dashboard');
  }

  private syncTenantSelection(): void {
    this.tenantAccess = this.authService.getTenantAccess();
    this.activeTenantId = this.authService.getTenantId() ?? '';
    this.isAdmin = this.tenantAccess.some(access => access.id === this.activeTenantId && access.role?.toLowerCase() === 'admin');
    this.loadTenantNames();
  }

  tenantLabel(tenant: TenantAccess): string {
    const name = this.tenantNames.get(tenant.id);
    return `${name ? `${name} · ` : ''}${tenant.id}${tenant.role ? ` · ${tenant.role}` : ''}`;
  }

  private loadTenantNames(): void {
    const adminTenantIds = this.tenantAccess
      .filter(access => access.role?.toLowerCase() === 'admin')
      .map(access => access.id);
    if (!adminTenantIds.length) return;

    for (const adminTenantId of adminTenantIds) {
      this.tenantsRepository.getTenants(adminTenantId).subscribe({
        next: tenants => {
          const names = new Map(this.tenantNames);
          for (const tenant of tenants) names.set(tenant.id, tenant.title);
          this.tenantNames = names;
          this.cdr.detectChanges();
        }
      });
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    this.isScrolled = window.scrollY > 8;
  }
}
