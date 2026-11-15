import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Tenant, TenantUser } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class TenantsRepository {
  private readonly apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  getTenants(adminTenantId: string): Observable<Tenant[]> {
    return this.http.get<Array<Tenant & { tenantId?: string }>>(this.apiUrl, { headers: { 'X-Tenant-Id': adminTenantId } })
      .pipe(map(tenants => tenants.map(tenant => ({ ...tenant, id: tenant.id ?? tenant.tenantId ?? '' }))));
  }
  createTenant(adminTenantId: string, tenant: Pick<Tenant, 'title' | 'description' | 'isActive'>): Observable<Tenant> { return this.http.post<Tenant>(this.apiUrl, tenant, { headers: { 'X-Tenant-Id': adminTenantId } }); }
  updateTenant(adminTenantId: string, tenant: Tenant): Observable<Tenant> { return this.http.put<Tenant>(`${this.apiUrl}/${encodeURIComponent(tenant.id)}`, { title: tenant.title, description: tenant.description, isActive: tenant.isActive }, { headers: { 'X-Tenant-Id': adminTenantId } }); }
  deleteTenant(adminTenantId: string, id: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`, { headers: { 'X-Tenant-Id': adminTenantId } }); }
  getUsers(adminTenantId: string, tenantId: string): Observable<TenantUser[]> { return this.http.get<TenantUser[]>(`${this.apiUrl}/${encodeURIComponent(tenantId)}/users`, { headers: { 'X-Tenant-Id': adminTenantId } }); }
  addUser(adminTenantId: string, tenantId: string, email: string, role: 'Viewer' | 'Editor'): Observable<TenantUser> { return this.http.post<TenantUser>(`${this.apiUrl}/${encodeURIComponent(tenantId)}/users`, { email, role }, { headers: { 'X-Tenant-Id': adminTenantId } }); }
  updateUserRole(adminTenantId: string, tenantId: string, userId: string, role: 'Viewer' | 'Editor'): Observable<void> { return this.http.put<void>(`${this.apiUrl}/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}/role`, { role }, { headers: { 'X-Tenant-Id': adminTenantId } }); }
  removeUser(adminTenantId: string, tenantId: string, userId: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}`, { headers: { 'X-Tenant-Id': adminTenantId } }); }
}
