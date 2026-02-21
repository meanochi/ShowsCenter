import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { Provider } from '../../../models/provider-model';
import { ProviderService } from '../../../services/provider-service';
import { ImageService } from '../../../services/image-service';

@Component({
  selector: 'app-add-provider',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    FileUploadModule,
  ],
  templateUrl: './add-provider.html',
  styleUrl: './add-provider.scss',
})
export class AddProvider {
  providerSrv = inject(ProviderService);
  imageSrv: ImageService = inject(ImageService);
  visible = false;
  name = '';
  profileimgUrl = '';
  imagePreviewUrl: string | ArrayBuffer | null = null;
  submitLoading = false;
  submitError: string | null = null;
  file: File | null = null;
  @Output() providerAdded = new EventEmitter<Provider>();

  showDialog() {
    this.visible = true;
    this.reset();
  }

  hideDialog() {
    this.visible = false;
  }

  addProvider() {
    this.submitError = null;
    const provider = new Provider();
    provider.name = this.name;
    provider.profileimgUrl = (this.imagePreviewUrl as string) ?? (this.profileimgUrl || '');
    if (this.imagePreviewUrl) {
      this.imageSrv.upload(this.file!).subscribe({
        next: (res) => {
          console.log('הקובץ נשמר בהצלחה!', res.path);
          provider.profileimgUrl = res.path;
          // כאן תוכל לשלוח את res.path ל-Service אחר כדי לשמור ב-DB יחד עם שאר הנתונים
        },
        error: (err) => console.error('שגיאה בהעלאה', err)
      });
    }
    this.submitLoading = true;
    this.providerSrv.addProvider(provider).subscribe({
      next: (created) => {
        this.providerAdded.emit(created);
        this.reset();
        this.visible = false;
        this.submitLoading = false;
      },
      error: (err) => {
        this.submitLoading = false;
        this.submitError = err?.error?.message ?? err?.message ?? 'שמירת המפיק נכשלה';
      },
    });
  }

  reset() {
    this.name = '';
    this.profileimgUrl = '';
    this.imagePreviewUrl = null;
    this.submitError = null;
  }

  onFileSelected(event: { files?: File[] }) {
    const files = event.files;
    if (files && files.length > 0) {
      this.file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(this.file);
    }
  }

  removeImage(fileUpload: FileUpload) {
    this.imagePreviewUrl = null;
    fileUpload.clear();
  }
}
