import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
    { path: 'categories', loadComponent: () => import('./categories/categories').then(m => m.Categories), canActivate: [authGuard] },
    { path: 'categories/add', loadComponent: () => import('./category-details/category-details').then(m => m.CategoryDetails), canActivate: [authGuard] },
    { path: 'categories/:id', loadComponent: () => import('./category-details/category-details').then(m => m.CategoryDetails), canActivate: [authGuard] },
    { path: 'bills', loadComponent: () => import('./bills/bills').then(m => m.Bills), canActivate: [authGuard] },
    { path: 'imports', loadComponent: () => import('./imports/imports').then(m => m.Imports), canActivate: [authGuard] },
    { path: 'bills/add', loadComponent: () => import('./bill-details/bill-details').then(m => m.BillDetails), canActivate: [authGuard] },
    { path: 'bills/:id', loadComponent: () => import('./bill-details/bill-details').then(m => m.BillDetails), canActivate: [authGuard] },
    { path: 'trips', loadComponent: () => import('./trips/trips').then(m => m.Trips), canActivate: [authGuard] },
    { path: 'trips/add', loadComponent: () => import('./trip-details/trip-details').then(m => m.TripDetails), canActivate: [authGuard] },
    { path: 'trips/view/:id', loadComponent: () => import('./trip-view/trip-view').then(m => m.TripView), canActivate: [authGuard] },
    { path: 'trips/dashboard', loadComponent: () => import('./trip-dashboard/trip-dashboard').then(m => m.TripDashboard), canActivate: [authGuard] },
    { path: 'trips/:id', loadComponent: () => import('./trip-details/trip-details').then(m => m.TripDetails), canActivate: [authGuard] },
    { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard), canActivate: [authGuard] },
];
