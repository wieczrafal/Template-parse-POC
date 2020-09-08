import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';

@NgModule({
  imports:      [ BrowserModule, FormsModule ],
  declarations: [ AppComponent, HelloComponent ],
  providers: [DatePipe, DecimalPipe, CurrencyPipe],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
