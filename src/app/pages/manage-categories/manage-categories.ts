import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CategoryAction {
  title: string;
  description: string;
}

@Component({
  selector: 'app-manage-categories',
  imports: [RouterLink],
  templateUrl: './manage-categories.html',
  styleUrl: './manage-categories.css',
})
export class ManageCategories {
  readonly actions: CategoryAction[] = [
    {
      title: 'Add Category',
      description: 'Create a new category for catalog products.'
    },
    {
      title: 'Edit Category',
      description: 'Update names and descriptions for existing categories.'
    }
  ];
}
