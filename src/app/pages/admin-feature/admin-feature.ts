import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-feature',
  imports: [RouterLink],
  templateUrl: './admin-feature.html',
  styleUrl: './admin-feature.css',
})
export class AdminFeature {
  title = '';
  eyebrow = '';
  description = '';

  constructor(route: ActivatedRoute) {
    route.data.subscribe(data => {
      this.title = data['title'] as string;
      this.eyebrow = data['eyebrow'] as string;
      this.description = data['description'] as string;
    });
  }
}
