import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { ReceiptScannerService } from '../../services/receipt-scanner.service';

@Component({
  selector: 'app-receipt-scanner',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './receipt-scanner.html',
  styleUrl: './receipt-scanner.css',
})
export class ReceiptScanner implements OnInit {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  userName = 'Freelancer';
  isLightTheme = false;

  // File Upload & Camera States
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isDragging = false;
  showCamera = false;
  cameraStream: MediaStream | null = null;
  cameraError = '';

  // Core Processing States
  isScanning = false;
  showReview = false;
  isSaving = false;
  isSuccessState = false;

  // Error & Status Messages
  errorMessage = '';
  successMessage = '';

  // Form Fields for Review/Edit Screen
  transactionType: 'Income' | 'Expense' = 'Expense';
  description = '';
  amount: number | null = null;
  transactionDate = '';
  category = '';
  merchant = '';
  paymentMethod = 'Card';
  notes = '';

  // Validation Errors
  descriptionError = '';
  amountError = '';
  categoryError = '';
  dateError = '';
  isFormSubmitted = false;

  // Category lists populated from database
  expenseCategories: any[] = [];
  incomeCategories: any[] = [];

  // Supported constants
  readonly MAX_FILE_SIZE_MB = 5;
  readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];

  constructor(
    private api: ApiService,
    private scannerService: ReceiptScannerService,
    private router: Router
  ) {}

  ngOnInit() {
    // 1. Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
    } else {
      this.isLightTheme = false;
      document.body.classList.remove('light-theme');
    }

    // 2. Fetch User Info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.fullName || 'Freelancer';
      } catch (e) {
        console.error('Error parsing user storage:', e);
      }
    }

    // 3. Set default transaction date to today
    this.setTodayDate();

    // 4. Load Categories
    this.loadCategories();
  }

  toggleTheme() {
    this.isLightTheme = !this.isLightTheme;
    if (this.isLightTheme) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }

  setTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.transactionDate = `${yyyy}-${mm}-${dd}`;
  }

  loadCategories() {
    this.api.getCategories().subscribe({
      next: (res: any) => {
        let categories = [];
        if (res && res.data) {
          categories = res.data;
        } else if (Array.isArray(res)) {
          categories = res;
        } else if (res && Array.isArray(res.categories)) {
          categories = res.categories;
        }

        this.expenseCategories = categories.filter((c: any) => c.type === 'expense');
        this.incomeCategories = categories.filter((c: any) => c.type === 'income');

        if (categories.length === 0) {
          this.initializeDefaultCategories();
        } else {
          this.setDefaultCategory();
        }
      },
      error: (err: any) => {
        console.error('Error loading categories:', err);
        this.initializeDefaultCategories();
      }
    });
  }

  initializeDefaultCategories() {
    this.api.initializeDefaultCategories().subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (err: any) => {
        console.error('Error initializing default categories:', err);
        this.expenseCategories = [
          { name: 'Office Supplies' },
          { name: 'Software/SaaS' },
          { name: 'Hardware/Gadgets' },
          { name: 'Travel/Meals' },
          { name: 'Marketing/Ads' },
          { name: 'Other' }
        ];
        this.incomeCategories = [
          { name: 'Freelance Project' },
          { name: 'Consulting' },
          { name: 'Contract Work' },
          { name: 'Royalties' },
          { name: 'Ad Revenue' },
          { name: 'Other' }
        ];
        this.setDefaultCategory();
      }
    });
  }

  setDefaultCategory() {
    if (this.transactionType === 'Income') {
      this.category = this.incomeCategories.length > 0 ? this.incomeCategories[0].name : 'Freelance Project';
    } else {
      this.category = this.expenseCategories.length > 0 ? this.expenseCategories[0].name : 'Software/SaaS';
    }
  }

  onTransactionTypeChange() {
    this.setDefaultCategory();
  }

  // --- Drag & Drop Handlers ---

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  // --- File Processing and Validation ---

  handleFile(file: File) {
    this.errorMessage = '';
    this.successMessage = '';

    // Validate type
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      this.errorMessage = 'Unsupported file format. Please upload JPG, JPEG, or PNG.';
      return;
    }

    // Validate size (5MB limit)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.MAX_FILE_SIZE_MB) {
      this.errorMessage = `File is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed size is ${this.MAX_FILE_SIZE_MB}MB.`;
      return;
    }

    this.selectedFile = file;

    // Create a local object URL for preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedFile = null;
    this.previewUrl = null;
    this.showReview = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.isScanning = false;
    this.stopCamera();
  }

  // --- Camera Operations ---

  startCamera() {
    this.cameraError = '';
    this.showCamera = true;
    this.errorMessage = '';

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        this.cameraStream = stream;
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Camera access error:', err);
        this.showCamera = false;
        this.cameraError = 'Camera access denied. Please grant permission or upload an image instead.';
        this.errorMessage = this.cameraError;
      });
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    this.showCamera = false;
  }

  capturePhoto() {
    if (!this.videoElement || !this.canvasElement || !this.cameraStream) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `captured_receipt_${Date.now()}.png`, { type: 'image/png' });
          this.handleFile(file);
        }
      }, 'image/png');
    }

    this.stopCamera();
  }

  // --- API / OCR Processing Trigger ---

  scanReceipt() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select or capture a receipt image first.';
      return;
    }

    this.isScanning = true;
    this.errorMessage = '';
    this.showReview = false;

    this.scannerService.scanReceipt(this.selectedFile).subscribe({
      next: (res: any) => {
        this.isScanning = false;
        if (res && res.success && res.data) {
          this.populateExtractedData(res.data);
        } else if (res && res.data) {
          this.populateExtractedData(res.data);
        } else {
          // If response format is simple
          this.populateExtractedData(res);
        }
      },
      error: (err: any) => {
        this.isScanning = false;
        console.error('Scan receipt API error:', err);
        
        // Detailed error messages
        if (err.status === 401) {
          this.errorMessage = 'Your session has expired. Please log in again.';
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          this.router.navigate(['/']);
        } else if (err.status === 0) {
          this.errorMessage = 'Network error: OCR backend service is not running or unreachable.';
        } else {
          this.errorMessage = err.error?.message || 'Failed to scan receipt. The OCR API returned an error.';
        }
      }
    });
  }

  // Helper method to fill review fields from response
  populateExtractedData(data: any) {
    this.transactionType = data.type === 'Income' ? 'Income' : 'Expense';
    this.merchant = data.merchant || data.merchantName || '';
    this.description = data.description || (this.merchant ? `Scan: ${this.merchant}` : 'Receipt Expense');
    this.amount = data.amount != null ? Number(data.amount) : null;
    
    // Formatting date to yyyy-mm-dd
    if (data.date) {
      try {
        const parsedDate = new Date(data.date);
        if (!isNaN(parsedDate.getTime())) {
          this.transactionDate = parsedDate.toISOString().split('T')[0];
        } else {
          this.setTodayDate();
        }
      } catch {
        this.setTodayDate();
      }
    } else {
      this.setTodayDate();
    }

    // Match category if possible, or set default
    if (data.category) {
      const match = [...this.expenseCategories, ...this.incomeCategories].find(
        (c) => c.name.toLowerCase() === data.category.toLowerCase()
      );
      if (match) {
        this.category = match.name;
      } else {
        this.setDefaultCategory();
      }
    } else {
      this.setDefaultCategory();
    }

    this.paymentMethod = data.paymentMethod || 'Card';
    this.notes = data.notes || (data.confidence ? `OCR Scan (Confidence: ${Math.round(data.confidence * 100)}%)` : 'Extracted from OCR scanner.');
    
    this.showReview = true;
  }

  /**
   * Run in Demo mode: simulates receiving a high-confidence OCR scan response.
   * Helps test the frontend fields and confirm flow when backend OCR is not configured.
   */
  runDemoOCR() {
    this.isScanning = true;
    this.errorMessage = '';
    this.showReview = false;

    setTimeout(() => {
      this.isScanning = false;
      const demoData = {
        type: 'Expense',
        merchant: 'Amazon Web Services',
        description: 'Monthly SaaS hosting fee',
        amount: 8450.00,
        date: new Date().toISOString(),
        category: 'Software/SaaS',
        paymentMethod: 'Card',
        notes: 'AWS Cloud Hosting Invoice. Confidence Score: 96%',
        confidence: 0.96
      };
      this.populateExtractedData(demoData);
    }, 1500); // 1.5s visual loader for authentic experience
  }

  // --- Confirm and Save Transaction ---

  validateReviewForm(): boolean {
    this.descriptionError = '';
    this.amountError = '';
    this.categoryError = '';
    this.dateError = '';

    if (!this.description.trim()) {
      this.descriptionError = 'Description is required';
    }
    if (this.amount === null || this.amount === undefined || this.amount <= 0) {
      this.amountError = 'Please enter a valid positive amount';
    }
    if (!this.category.trim()) {
      this.categoryError = 'Category is required';
    }
    if (!this.transactionDate) {
      this.dateError = 'Transaction date is required';
    }

    return !this.descriptionError && !this.amountError && !this.categoryError && !this.dateError;
  }

  confirmTransaction() {
    this.isFormSubmitted = true;
    if (!this.validateReviewForm()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      type: this.transactionType,
      description: this.description.trim(),
      category: this.category,
      amount: Number(this.amount),
      transactionDate: this.transactionDate,
      notes: `[Merchant: ${this.merchant}] - ${this.notes}`.trim()
    };

    // Save transaction via ApiService (sends POST to /transactions)
    this.api.createTransaction(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isSuccessState = true;
        this.successMessage = 'Transaction successfully recorded and saved in your TaxPal registry!';
      },
      error: (err: any) => {
        this.isSaving = false;
        console.error('Save transaction error:', err);
        this.errorMessage = err.error?.message || 'Failed to record transaction. Please verify your input and try again.';
      }
    });
  }

  resetScanner() {
    this.selectedFile = null;
    this.previewUrl = null;
    this.showReview = false;
    this.isSuccessState = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.isFormSubmitted = false;
    this.description = '';
    this.amount = null;
    this.merchant = '';
    this.notes = '';
    this.setTodayDate();
    this.setDefaultCategory();
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
