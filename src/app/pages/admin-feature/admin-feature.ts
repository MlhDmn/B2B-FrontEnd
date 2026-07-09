import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-feature',
  imports: [RouterLink],
  templateUrl: './admin-feature.html',
  styleUrl: './admin-feature.css',
})
export class AdminFeature {
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;

  constructor(route: ActivatedRoute) {
    this.title = route.snapshot.data['title'] as string;
    this.eyebrow = route.snapshot.data['eyebrow'] as string;
    this.description = route.snapshot.data['description'] as string;
  }
}
