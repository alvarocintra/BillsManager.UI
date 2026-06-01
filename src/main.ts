import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {
  Chart,
  registerables,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.defaults.font.family = 'Poppins, sans-serif';
Chart.defaults.font.size = 14;
Chart.defaults.font.weight = 'normal';

Chart.register(...registerables);
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
