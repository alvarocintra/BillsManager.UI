import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'categories', loadComponent: () => import('./categories/categories').then(m => m.Categories) },
    { path: 'categories/add', loadComponent: () => import('./category-details/category-details').then(m => m.CategoryDetails) },
    { path: 'categories/:id', loadComponent: () => import('./category-details/category-details').then(m => m.CategoryDetails) },
    { path: 'bills', loadComponent: () => import('./bills/bills').then(m => m.Bills) },
    { path: 'bills/add', loadComponent: () => import('./bill-details/bill-details').then(m => m.BillDetails) },
    { path: 'bills/:id', loadComponent: () => import('./bill-details/bill-details').then(m => m.BillDetails) },
    { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) },
];
