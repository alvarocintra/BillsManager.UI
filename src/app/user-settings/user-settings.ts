import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SupportedLanguage, LanguageService } from '../services/language.service';
import { ThemeService } from '../services/theme.service';
import { UserProfileRepository } from '../services/user-profile.repository';
import { ColorMode, UserProfile } from '../models/user-profile.model';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.scss'
})
export class UserSettings implements OnInit {
  profile: UserProfile | null = null;
  firstName = '';
  lastName = '';
  language: SupportedLanguage = 'pt-BR';
  colorMode: ColorMode = 'system';
  loading = true;
  saving = false;
  loadError = false;

  constructor(
    private readonly repository: UserProfileRepository,
    private readonly toastr: ToastrService,
    private readonly cdr: ChangeDetectorRef,
    public readonly languageService: LanguageService,
    public readonly themeService: ThemeService
  ) {}

  ngOnInit(): void { this.loadProfile(); }

  loadProfile(): void {
    this.loading = true;
    this.loadError = false;
    this.repository.getProfile().subscribe({
      next: profile => {
        this.profile = profile;
        this.firstName = profile.firstName ?? '';
        this.lastName = profile.lastName ?? '';
        this.language = profile.preferences?.language === 'en-GB' ? 'en-GB' : 'pt-BR';
        this.colorMode = profile.preferences?.colorMode === 'dark' || profile.preferences?.colorMode === 'light'
          ? profile.preferences.colorMode : 'system';
        this.languageService.setLanguage(this.language);
        this.themeService.setMode(this.colorMode, false);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.toastr.error('Unable to load profile settings.');
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;
    const update = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      language: this.language,
      colorMode: this.colorMode
    };
    this.repository.updateProfile(update).subscribe({
      next: profile => {
        this.profile = profile;
        this.languageService.setLanguage(this.language);
        this.themeService.setMode(this.colorMode);
        this.saving = false;
        this.toastr.success('Settings saved successfully.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.toastr.error('Unable to save settings. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }
}
