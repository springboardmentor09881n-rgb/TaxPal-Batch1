import { Component, Input, Output, EventEmitter, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css'
})
export class Dropdown implements OnInit {
  @Input() id = '';
  @Input() placeholder = 'Select option';
  @Input() searchable = false;
  @Input() searchPlaceholder = 'Search...';
  
  @Input() set options(val: any[]) {
    this._options = val || [];
    this.filterText = '';
  }
  get options(): any[] {
    return this._options;
  }
  
  @Input() value: any = '';
  @Output() valueChange = new EventEmitter<any>();

  private _options: any[] = [];
  isOpen = false;
  filterText = '';

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {}

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.filterText = '';
    }
  }

  selectOption(opt: any) {
    const selectedValue = this.getOptionValue(opt);
    this.value = selectedValue;
    this.valueChange.emit(selectedValue);
    this.isOpen = false;
  }

  getOptionValue(opt: any): any {
    return typeof opt === 'object' && opt !== null ? opt.value : opt;
  }

  getOptionLabel(opt: any): string {
    return typeof opt === 'object' && opt !== null ? opt.label : opt;
  }

  getSelectedLabel(): string {
    const selected = this.options.find(o => this.getOptionValue(o) === this.value);
    if (selected) {
      return this.getOptionLabel(selected);
    }
    return this.value ? String(this.value) : this.placeholder;
  }

  getOptionIcon(opt: any): string {
    if (typeof opt === 'object' && opt !== null) {
      if (opt.flag) return opt.flag;
      if (opt.icon) return opt.icon;
    }
    
    const label = this.getOptionLabel(opt).toLowerCase();
    
    // Countries
    if (label.includes('united states') || label === 'us') return '🇺🇸';
    if (label.includes('canada')) return '🇨🇦';
    if (label.includes('united kingdom') || label === 'uk') return '🇬🇧';
    if (label.includes('australia')) return '🇦🇺';
    if (label.includes('india')) return '🇮🇳';
    if (label.includes('germany')) return '🇩🇪';
    if (label.includes('france')) return '🇫🇷';
    
    // Languages
    if (label === 'english') return '🇬🇧';
    if (label === 'spanish') return '🇪🇸';
    if (label === 'french') return '🇫🇷';
    if (label === 'german') return '🇩🇪';
    if (label === 'japanese') return '🇯🇵';
    if (label === 'chinese') return '🇨🇳';
    if (label === 'hindi') return '🇮🇳';

    // Currencies
    if (label.includes('inr') || label.includes('rupee')) return '₹';
    if (label.includes('usd') || label.includes('dollar')) return '$';
    if (label.includes('gbp') || label.includes('pound')) return '£';
    if (label.includes('eur') || label.includes('euro')) return '€';

    return '';
  }

  getFilteredOptions(): any[] {
    const query = this.filterText.trim().toLowerCase();
    if (!query) {
      return this.options;
    }
    return this.options.filter(o => 
      this.getOptionLabel(o).toLowerCase().includes(query)
    );
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
