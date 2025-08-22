import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {

  selectedFile: File | null = null;
  uploadProgress: number = 0;
  uploadSuccess: boolean = false;
  uploadError: string = '';
  isLoading: boolean = false;
  extractedData: any[] = [];
  showResults: boolean = false;
  hfclPushInProgress: boolean = false;
  hfclPushSuccess: boolean = false;
  hfclPushError: string = '';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.uploadProgress = 0;
      this.uploadSuccess = false;
      this.uploadError = '';
      this.showResults = false;
      this.extractedData = [];
    }
  }

  onUpload(): void {
    if (!this.selectedFile) {
      this.uploadError = 'No file selected';
      return;
    }

    this.isLoading = true;
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.uploadError = '';
    this.showResults = false;
    this.extractedData = [];

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.http.post('/api/python-process', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          this.uploadSuccess = true;
          this.isLoading = false;
          
          // Handle the API response
          if (event.body && event.body.results) {
            this.extractedData = event.body.results;
            this.showResults = true;
            
            // Show success message with button to push to HFCL API
            Swal.fire({
              title: 'File processed successfully!',
              text: 'File processed successfully using Python! Would you like to push the extracted data to HFCL API?',
              icon: 'success',
              showCancelButton: true,
              confirmButtonText: 'Yes, push to HFCL',
              cancelButtonText: 'No, just view results',
              confirmButtonColor: '#3E50B4',
              cancelButtonColor: '#6c757d'
            }).then((result) => {
              if (result.isConfirmed) {
                this.pushToHfclApi();
              }
            });
          } else if (event.body && event.body.error) {
            this.uploadError = event.body.error;
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.uploadProgress = 0;
        
        if (error.error && error.error.error) {
          this.uploadError = error.error.error;
        } else {
          this.uploadError = 'Error processing file with Python';
        }
        console.error('Upload error:', error);
        
        // Show error message
        Swal.fire({
          title: 'Error!',
          text: this.uploadError,
          icon: 'error',
          confirmButtonColor: '#3E50B4',
        });
      }
    }); 
  }

  // Helper method to format technical specifications for display
  formatSpecifications(specs: any): string {
    if (!specs) return 'No specifications available';
    
    let formatted = '';
    for (const [section, parameters] of Object.entries(specs)) {
      formatted += `\n${section}:\n`;
      for (const [param, value] of Object.entries(parameters as object)) {
        formatted += `  • ${param}: ${value}\n`;
      }
    }
    return formatted;
  }

  // Helper method to check if object has content
  hasContent(obj: any): boolean {
    return obj && Object.keys(obj).length > 0;
  }

  // Helper method to get object keys for template iteration
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // Method to push extracted data to HFCL API
  pushToHfclApi(): void {
    if (!this.extractedData || this.extractedData.length === 0) {
      this.hfclPushError = 'No extracted data available to push';
      return;
    }

    this.hfclPushInProgress = true;
    this.hfclPushSuccess = false;
    this.hfclPushError = '';

    // Send each cable data individually to HFCL API
    const hfclApiUrl = 'https://www.hfcl.com/testapiforsap/api/datasheet/configureDatasheet';
    
    // Prepare the data in the exact format expected by HFCL API
    const cableData = this.extractedData[0]; // Use the first cable data
    
    this.http.post(hfclApiUrl, cableData, {
      headers: { 
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        this.hfclPushInProgress = false;
        this.hfclPushSuccess = true;
        console.log('HFCL API response:', response);
        
        // Show success message
        Swal.fire({
          title: 'Success!',
          text: 'Data successfully pushed to HFCL API',
          icon: 'success',
          confirmButtonColor: '#3E50B4',
        });
      },
      error: (error) => {
        this.hfclPushInProgress = false;
        this.hfclPushSuccess = false;
        
        console.error('HFCL API error:', error);
        
        let errorMessage = 'Failed to push data to HFCL API. Please try again.';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Handle CORS errors specifically
        if (errorMessage.includes('CORS') || error.status === 0) {
          errorMessage = 'CORS error: Unable to connect to HFCL API. Please check if the API allows cross-origin requests.';
        }
        
        this.hfclPushError = errorMessage;
        
        // Show error message
        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#3E50B4',
        });
      }
    });
  }

  // Method to clear all data and reset form
  clearForm(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.uploadError = '';
    this.isLoading = false;
    this.extractedData = [];
    this.showResults = false;
    this.hfclPushInProgress = false;
    this.hfclPushSuccess = false;
    this.hfclPushError = '';
    
    // Clear file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
