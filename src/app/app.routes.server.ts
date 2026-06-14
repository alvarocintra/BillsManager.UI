import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'login', renderMode: RenderMode.Server },
  { path: 'categories', renderMode: RenderMode.Client },
  { path: 'categories/add', renderMode: RenderMode.Client },
  { path: 'categories/:id', renderMode: RenderMode.Client },
  { path: 'bills', renderMode: RenderMode.Client },
  { path: 'bills/add', renderMode: RenderMode.Client },
  { path: 'bills/:id', renderMode: RenderMode.Client },
  { path: 'trips', renderMode: RenderMode.Client },
  { path: 'trips/dashboard', renderMode: RenderMode.Client },
  { path: 'trips/add', renderMode: RenderMode.Client },
  { path: 'trips/view/:id', renderMode: RenderMode.Client },
  { path: 'imports', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server }
];
