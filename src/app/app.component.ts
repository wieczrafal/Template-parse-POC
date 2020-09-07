import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

const template = `
  <div>Name: «Name»</div>
  <div>Inner Value: «Obj.InnerVal»</div>
  <div>Date long: «Date:long:Obj.CutoffDate»</div>
  <div>Date short: «Date:short:Obj.CutoffDate»</div>

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
`;

const startChar = '«';
const endChar = '»';

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
      CutoffDate: new Date()
    },
    People: [
      {First: 'James', Last: 'Bong', Age: 30},
      {First: 'Jill', Last: 'Smith', Age: 50},
      {First: 'Mary', Last: 'Smith', Age: 40},
      {First: 'Elisabeth', Last: 'Brown', Age: 20},
    ]
  };

  html = '<div>test</div>';

  constructor(private _datePipe: DatePipe) {}

  public ngOnInit() {
    this.html = template;
    this.html = this.parseTemplate(template, this.data);
  }

  private parseTemplate(template: string, data: any): string {
    const commands = ['TableStart', 'TableEnd', 'Condition'];
    let startIndex: number = template.indexOf(startChar);
    let endIndex: number = -1;
    let counter = 0;

    while (startIndex !== -1) {
      endIndex = template.indexOf(endChar, startIndex);
      if (endIndex === -1) {
        throw new Error('Template Syntax Error: Closing tag missing.');
        break;
      }

      const tagOpts: string[] = template.substring(startIndex + 1, endIndex).split(':');
      let value: string = '';

      if (tagOpts.length > 1 && commands.indexOf(tagOpts[0]) !== -1) {
        const command = tagOpts[0];
        const options = tagOpts[1];
        const path = tagOpts[2];

        if (command === 'TableStart') {
          const tableStartIndex = endIndex;
          const tableEndIndex = template.indexOf(`${startChar}TableEnd:${path}${endChar}`, tableStartIndex);

          if (tableEndIndex === -1) {
            throw new Error('Template Syntax Error: Table not closed.');
            break;
          }

          const tableTemplate = template.substring(tableStartIndex + 1, tableEndIndex);

          const trTemplateStartIndex = tableTemplate.lastIndexOf('<tr', tableStartIndex);
          const trTemplateEndIndex = tableTemplate.lastIndexOf('</tr>', tableStartIndex);

          if (trTemplateEndIndex === -1) {
            throw new Error('Template Syntax Error: Table row not closed.');
            break;
          }

          const trTemplate = tableTemplate.substring(trTemplateStartIndex, trTemplateEndIndex + 5); // 5 for tr closing tag
          const items: any[] = this.getValueByPath(path, data);
          const listTemplate = items.reduce((acc: string, curr) => 
            acc.concat(this.parseTemplate(trTemplate, curr))
          , '');

          template = this.replaceBetween(template, tableStartIndex + trTemplateStartIndex + 1, tableEndIndex + trTemplateEndIndex, listTemplate);
        }
      } else {
        value = this.getValueByPath(tagOpts[tagOpts.length - 1], data);
        if (tagOpts.length > 1) {
          if (tagOpts[0] === 'Date') { // date value, render with date pipe
            value = this._datePipe.transform(value, tagOpts[1]);
          }
        }
      }

      template = this.replaceBetween(template, startIndex, endIndex + 1, value);

      startIndex = template.indexOf(startChar, endIndex);
    }

    return template;
  }

  private  getValueByPath(path: string, data: any): any {
    return path.split('.').reduce((o, i) => {
      try {
        return o[i];
      } catch (e) {
        throw new Error(
          `Template Syntax Error: The provided path '${path}' does not exist.`
        );
      }
    }, data);
  }

  private replaceBetween(template: string, start: number, end: number, what) {
    return template.substring(0, start) + what + template.substring(end);
  }
};
