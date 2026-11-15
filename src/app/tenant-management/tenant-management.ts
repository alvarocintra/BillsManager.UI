import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';
import { TenantsRepository } from '../services/tenants.repository';
import { Tenant, TenantUser } from '../models/auth.models';

@Component({
  selector: 'app-tenant-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-management.html',
  styleUrl: './tenant-management.scss'
})
export class TenantManagement implements OnInit {
  tenants: Tenant[] = [];
  private readonly adminContextByTenantId = new Map<string, string>();
  private readonly memberCountByTenantId = new Map<string, number>();
  selectedTenant: Tenant | null = null;
  users: TenantUser[] = [];
  loadingTenants = false;
  loadingUsers = false;
  savingTenant = false;
  addingUser = false;
  editingTenantId: string | null = null;
  tenantForm = { title: '', description: '', isActive: true };
  newUser = { email: '', role: 'Viewer' as 'Viewer' | 'Editor' };
  private adminTenantId = '';
  private readonly adminTenantIds: string[] = [];

  constructor(
    private readonly auth: AuthService,
    private readonly repo: TenantsRepository,
    private readonly toastr: ToastrService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const adminIds = this.auth.getTenantAccess()
      .filter(access => access.role?.toLowerCase() === 'admin')
      .map(access => access.id);
    this.adminTenantIds.push(...new Set(adminIds));
    this.adminTenantId = this.adminTenantIds.find(id => id === this.auth.getTenantId()) ?? this.adminTenantIds[0] ?? '';
    if (!this.adminTenantIds.length) {
      this.tenants = [];
      this.loadingTenants = false;
      return;
    }
    this.loadTenants();
  }

  loadTenants(): void {
    this.loadingTenants = true;
    const results = new Map<string, { tenant: Tenant; adminTenantId: string }>();
    let remaining = this.adminTenantIds.length;
    let hadError = false;

    for (const adminTenantId of this.adminTenantIds) {
      this.repo.getTenants(adminTenantId).subscribe({
        next: tenants => {
          for (const tenant of tenants ?? []) {
            const normalizedTenant = { ...tenant, members: tenant.members ?? [] };
            if (normalizedTenant.id) results.set(normalizedTenant.id, { tenant: normalizedTenant, adminTenantId });
          }
          finishRequest();
        },
        error: error => {
          hadError = true;
          this.showError(error, 'Não foi possível carregar os tenants.');
          finishRequest();
        }
      });
    }

    const finishRequest = (): void => {
      remaining--;
      if (remaining > 0) return;

      this.tenants = [...results.values()].map(result => result.tenant);
      this.adminContextByTenantId.clear();
      for (const [tenantId, result] of results) this.adminContextByTenantId.set(tenantId, result.adminTenantId);
      if (this.selectedTenant) {
        const selected = results.get(this.selectedTenant.id);
        this.selectedTenant = selected?.tenant ?? null;
        if (selected) this.adminTenantId = selected.adminTenantId;
      }
      if (!this.selectedTenant && this.tenants.length) this.selectTenant(this.tenants[0]);
      else if (this.selectedTenant) this.selectTenant(this.selectedTenant);
      if (!this.tenants.length && !hadError) this.toastr.info('Não há tenants administrados para as permissões disponíveis neste token.');
      this.loadingTenants = false;
      this.cdr.detectChanges();
    };
  }

  selectTenant(tenant: Tenant): void {
    this.selectedTenant = tenant;
    this.adminTenantId = this.adminContextByTenantId.get(tenant.id) ?? this.adminTenantId;
    this.cancelTenantEdit();
    this.loadUsers();
  }

  loadUsers(): void {
    if (!this.selectedTenant) { this.users = []; return; }
    this.loadingUsers = true;
    this.repo.getUsers(this.adminTenantId, this.selectedTenant.id).subscribe({
      next: users => {
        this.users = users ?? [];
        if (this.selectedTenant?.id) this.memberCountByTenantId.set(this.selectedTenant.id, this.users.length);
        this.loadingUsers = false;
        this.cdr.detectChanges();
      },
      error: error => { this.users = []; this.loadingUsers = false; this.showError(error, 'Não foi possível carregar os usuários.'); this.cdr.detectChanges(); }
    });
  }

  editTenant(tenant: Tenant): void {
    this.editingTenantId = tenant.id;
    this.tenantForm = { title: tenant.title, description: tenant.description ?? '', isActive: tenant.isActive };
  }

  cancelTenantEdit(): void {
    this.editingTenantId = null;
    this.tenantForm = { title: '', description: '', isActive: true };
  }

  saveTenant(): void {
    const title = this.tenantForm.title.trim();
    if (!title) { this.toastr.error('Informe o nome do tenant.'); return; }
    const payload = { title, description: this.tenantForm.description.trim(), isActive: this.tenantForm.isActive };
    this.savingTenant = true;
    const request = this.editingTenantId
      ? this.repo.updateTenant(this.adminTenantId, { ...payload, id: this.editingTenantId, members: [] })
      : this.repo.createTenant(this.adminTenantId, payload);
    request.subscribe({
      next: tenant => {
        this.toastr.success(this.editingTenantId ? 'Tenant atualizado.' : 'Tenant criado. Renove o token para atualizar suas permissões.');
        this.cancelTenantEdit();
        this.savingTenant = false;
        if (tenant?.id) {
          this.selectedTenant = tenant;
          if (!this.tenants.some(item => item.id === tenant.id)) {
            this.tenants = [tenant, ...this.tenants];
            this.toastr.info('Para administrar este novo tenant, renove o token e selecione-o como workspace ativo.');
            this.loadingTenants = false;
            this.cdr.detectChanges();
            return;
          }
        }
        this.loadTenants();
      },
      error: error => { this.savingTenant = false; this.showError(error, 'Não foi possível salvar o tenant.'); this.cdr.detectChanges(); }
    });
  }

  async deleteTenant(tenant: Tenant): Promise<void> {
    const confirmed = window.confirm(`Remover “${tenant.title}”? As associações dos usuários serão removidas, mas os dados pertencentes ao tenant não serão apagados.`);
    if (!confirmed) return;
    this.repo.deleteTenant(this.adminTenantId, tenant.id).subscribe({
      next: () => { this.toastr.success('Tenant removido.'); if (this.selectedTenant?.id === tenant.id) { this.selectedTenant = null; this.users = []; } this.loadTenants(); },
      error: error => this.showError(error, 'Não foi possível remover o tenant.')
    });
  }

  addUser(): void {
    if (!this.selectedTenant || !this.newUser.email.trim()) { this.toastr.error('Informe o e-mail do usuário.'); return; }
    this.addingUser = true;
    this.repo.addUser(this.adminTenantId, this.selectedTenant.id, this.newUser.email.trim(), this.newUser.role).subscribe({
      next: () => { this.toastr.success('Usuário adicionado.'); this.newUser = { email: '', role: 'Viewer' }; this.addingUser = false; this.loadUsers(); },
      error: error => { this.addingUser = false; this.showError(error, 'Não foi possível adicionar o usuário.'); this.cdr.detectChanges(); }
    });
  }

  updateRole(user: TenantUser, role: 'Viewer' | 'Editor'): void {
    if (!this.selectedTenant || user.role === 'Admin') return;
    const previousRole = user.role;
    user.role = role;
    this.repo.updateUserRole(this.adminTenantId, this.selectedTenant.id, user.id, role).subscribe({
      next: () => this.toastr.success('Papel do usuário atualizado.'),
      error: error => { user.role = previousRole; this.showError(error, 'Não foi possível alterar o papel do usuário.'); this.cdr.detectChanges(); }
    });
  }

  removeUser(user: TenantUser): void {
    if (!this.selectedTenant || user.role === 'Admin' || !window.confirm(`Remover ${user.email} deste tenant?`)) return;
    this.repo.removeUser(this.adminTenantId, this.selectedTenant.id, user.id).subscribe({
      next: () => { this.toastr.success('Usuário removido do tenant.'); this.loadUsers(); },
      error: error => this.showError(error, 'Não foi possível remover o usuário.')
    });
  }

  displayName(user: TenantUser): string { return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email; }

  memberCount(tenant: Tenant): number {
    return tenant.members?.length ?? this.memberCountByTenantId.get(tenant.id ?? '') ?? 0;
  }

  private showError(error: any, fallback: string): void {
    const status = error?.status;
    if (status === 403) this.toastr.error('Sem permissão Admin para este tenant.');
    else if (status === 404) this.toastr.error('Tenant ou usuário não encontrado.');
    else this.toastr.error(typeof error?.error === 'string' ? error.error : error?.error?.message ?? fallback);
  }
}
