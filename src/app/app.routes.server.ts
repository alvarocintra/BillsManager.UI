import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Client },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'categories', renderMode: RenderMode.Server },
  { path: 'categories/add', renderMode: RenderMode.Server },
  { path: 'categories/:id', renderMode: RenderMode.Server },
  { path: 'bills', renderMode: RenderMode.Server },
  { path: 'bills/add', renderMode: RenderMode.Server },
  { path: 'bills/:id', renderMode: RenderMode.Server },
  { path: 'imports', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server }
];
