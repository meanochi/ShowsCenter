import { Injectable } from '@angular/core';
import { Category } from '../models/category-model';

@Injectable({
  providedIn: 'root',
})
export class CategorySrvice {
  categories: Category[] = []
  newCategory: Category = new Category()
  addCategory(c:string){
    this.newCategory.id = this.categories.length+1
    this.newCategory.name = c
    this.categories.push(this.newCategory)
    this.newCategory = new Category()
  }
  constructor(){
      this.addCategory("ערב התעוררות");
      this.addCategory("כנס נשים");
      this.addCategory("מסיבת סידור/חומש");
      this.addCategory("דינר ישיבתי");
      this.addCategory("תחרות שירה/קלידים");
      this.addCategory("סיומי מסכתות");
      this.addCategory("מופע אומנותי");
      this.addCategory("סימפוזיון");
      this.addCategory("כינוס ילדים");
      this.addCategory("ערב גיבוש");
  }
}
