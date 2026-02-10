import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-root',
  standalone: true,            
  imports: [RouterOutlet, ],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('angular-pokemon-app');
}
