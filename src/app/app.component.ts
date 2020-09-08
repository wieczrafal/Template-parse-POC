import { Component } from '@angular/core';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';

const template = `
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
`;

const startChar = '«';
const endChar = '»';
const argSeparator = ':';
const optsSeparator = ',';
const optsValueSeparator = '=';

interface ITagOptions {
  [optName: string]: string;
}

enum TagType {
  Currency = 'Currency',
  Date = 'Date',
  Number = 'Number'
}

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
    private _currencyPipe: CurrencyPipe,
    private _datePipe: DatePipe,
    private _numberPipe: DecimalPipe
  ) {}

  public ngOnInit() {
    this.html = template;
    this.html = this.parseTemplate(template, this.data);
  }

  private parseTemplate(template: string, data: any): string {
    const commands = ['TableStart', 'TableEnd', 'Condition'];
    let startIndex: number = template.indexOf(startChar);
    let endIndex: number = -1;
    let counter = 0;
    let output = startIndex === -1 ? template.slice(0) : template.substring(0, startIndex);

    while (startIndex !== -1) {
      endIndex = template.indexOf(endChar, startIndex);
      if (endIndex === -1) {
        throw new Error('Template Syntax Error: Closing tag missing.');
        break;
      }

      const tagOpts: string[] = template.substring(startIndex + 1, endIndex).split(argSeparator);
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
          console.log(trTemplate);
          // const listTemplate = items.reduce((acc: string, curr) => 
          //   acc.concat(this.parseTemplate(trTemplate, curr))
          // , '');

          // output += template.substring(tableStartIndex, trTemplateStartIndex) + listTemplate;
          // endIndex = trTemplateEndIndex;
        }
      } else {
        value = this.getValue(data, tagOpts);
      }

      startIndex = template.indexOf(startChar, endIndex);
      const filler = template.substring(endIndex + 1, startIndex === -1 ? template.length : startIndex);
      output += value + filler;
    }
    return output;
  }

  private getValue(data: any, tagOpts: string[]): string {
    let value = this.getValueByPath(tagOpts[tagOpts.length - 1], data);
    if (tagOpts.length > 1) {
      value = this.getTypedValue(value, tagOpts[0] as TagType, this.extractOptions(tagOpts[1]), tagOpts[2]);
    }

    return value;
  }

  private getTypedValue(value: any, type: TagType, opts: ITagOptions, path: string): string {
    switch (type) {
      case TagType.Date:
        return this._datePipe.transform(value, opts.format);
      case TagType.Currency:
        return this._currencyPipe.transform(value, opts.code);
      case TagType.Number:
        return this._numberPipe.transform(value);
      default:
        return value;
    }
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

  // opts example param1=true,param2=test
  private extractOptions(opts: string): ITagOptions {
    return opts.split(optsSeparator).reduce((acc, curr) => {
    const opArr = curr.split(optsValueSeparator);
    return {...acc, [opArr[0]]: opArr[1]};
    },{});
  }
};
