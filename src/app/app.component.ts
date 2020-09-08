import { Component } from '@angular/core';
import { TemplateParseService } from './template-parse.service';

let template = `
  <div>Name: «Name»</div>
  <div>Inner Value: «Obj.InnerVal»</div>
  <div>Date long: «Date:format=long:Obj.CutoffDate»</div>
  <div>Date short: «Date:format=short:Obj.CutoffDate»</div>
  <div>Number of ppl: «Number::Obj.NumberOfPeople»</div>
  <div>Price per person: «Currency:code=USD:Obj.PricePerPerson»</div>

  <br>

  «TableStart::People»
  <table>
    <tr>
      <th>Firstname</th>
      <th>Lastname</th>
      <th>Age</th>
    </tr>
    <tr>
      <td>«First»</td>
      <td>«Last»</td>
      <td>«Age»</td>
    </tr>
  </table>
  «TableEnd:People»

  «RepeaterStart:tag=li:People»
  <ul>
    <li>«First», «Last»</li>
  </ul>
  «RepeaterEnd:People»
`;
//template = `«TableStart::People»<table><tr><th>Firstname</th><th>Lastname</th><th>Age</th></tr><tr><td>«First»</td><td>«Last»</td><td>«Age»</td></tr></table>«TableEnd:People»`;
//template = `«RepeaterStart:tag=li:People»<ul><li>«First», «Last»</li></ul>«RepeaterEnd:People»`;


@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  data = {
    Name: 'Test',
    Obj: {
      InnerVal: 'Inner Test',
      CutoffDate: new Date(),
      PricePerPerson: 1000,
      NumberOfPeople: 2000,
    },
    People: [
      {First: 'James', Last: 'Bong', Age: 30},
      {First: 'Jill', Last: 'Smith', Age: 50},
      {First: 'Mary', Last: 'Smith', Age: 40},
      {First: 'Elisabeth', Last: 'Brown', Age: 20},
    ]
  };

  html = '<div>test</div>';

  constructor(
    private _templateParseService: TemplateParseService
  ) {}

  public ngOnInit() {
    this.html = template;
    this.html = this._templateParseService.parse(template, this.data);
    console.log(this.html);
  }

  
};
