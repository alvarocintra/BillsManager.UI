import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Exclui do prerender as rotas com parâmetros
  { path: 'categories/:id', renderMode: RenderMode.Server },
  { path: 'bills/:id', renderMode: RenderMode.Server },
  // As restantes continuam a ser pré-renderizadas
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];