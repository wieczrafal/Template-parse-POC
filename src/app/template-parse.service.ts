import { Injectable } from '@angular/core';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';


const startChar = '«';
const endChar = '»';
const argSeparator = ':';
const optsSeparator = ',';
const optsValueSeparator = '=';

interface ITagOptions {
  [optName: string]: string;
}

interface IOutputControls {
  start: number;
  end: number;
  output: string;
}

enum TagType {
  Currency = 'Currency',
  Date = 'Date',
  Number = 'Number'
}

@Injectable({
  providedIn: 'root',
})
export class TemplateParseService {


  constructor(
    private _currencyPipe: CurrencyPipe,
    private _datePipe: DatePipe,
    private _numberPipe: DecimalPipe
  ) { }

  public parse(template: string, data: any, rootData?: any): string {
    const commands = ['TableStart', 'TableEnd', 'ConditionStart', 'ConditionEnd', 'RepeaterStart', 'RepeaterEnd'];
    const oc: IOutputControls = {
      start: template.indexOf(startChar),
      end: -1,
      output: ''
    };
    let isRoot = false;

    oc.output = oc.start === -1 ? template.slice(0) : template.substring(0, oc.start);
    const startIndexes = [oc.start];

    while (oc.start !== -1) {
      isRoot = false;
      oc.end = template.indexOf(endChar, oc.start);
      if (oc.end === -1) {
        throw new Error('Template Syntax Error: Closing tag missing.');
        break;
      }

      const tagOpts: string[] = template.substring(oc.start + 1, oc.end).split(argSeparator);
      let value: string = '';

      if (tagOpts[0] === 'Root') {
        tagOpts.shift();
        isRoot = true;
      }

      if (tagOpts.length > 1 && commands.indexOf(tagOpts[0]) !== -1) {
        this.processCommand(tagOpts[0], this.extractOptions(tagOpts[1]), tagOpts[2], isRoot? rootData : data, template, oc);
      } else {
        value = this.getValue(isRoot ? rootData: data, tagOpts);
      }

      oc.start = template.indexOf(startChar, oc.end);
      if (startIndexes.indexOf(oc.start) > 0) {
        // Endless loop prevention
        throw new Error('Template Parse Error: Repeated start index.');
        break;
      }
      startIndexes.push(oc.start);

      const filler = template.substring(oc.end + 1, oc.start === -1 ? template.length : oc.start);
      oc.output += value + filler;
    }

    return oc.output;
  }

  private getValue(data: any, tagOpts: string[]): string {
    let value: any;
    if (tagOpts[0] === 'Label') {
      value = this.getValueByPath(`labels.${tagOpts[tagOpts.length - 1]}`, data);
    } else {
      value = this.getValueByPath(tagOpts[tagOpts.length - 1], data);
      if (tagOpts.length > 1) {
        value = this.getTypedValue(value, tagOpts[0] as TagType, this.extractOptions(tagOpts[1]), tagOpts[2]);
      }
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

  private processCommand(command: string, options: ITagOptions, path: string, data: any, template: string, oc: IOutputControls): void {
    switch (command) {
      case 'TableStart': 
        return this.processTable(options, path, data, template, oc);
      case 'RepeaterStart':
        return this.processRepeater(options, path, data, template, oc);
      case 'ConditionStart':
        return this.processCondition(options, path, data, template, oc);
    }
  }

  private processTable(options: ITagOptions, path: string, data: any, template: string, oc: IOutputControls): void {
    return this.processRepeater({...options, tag: 'tr'}, path, data, template, oc, 'Table');
  }

  private processRepeater(options: ITagOptions, path: string, data: any, template: string, oc: IOutputControls, context: string = 'Repeater') {
    const repeaterStartIndex = oc.end;
    const repeaterEndIndex = template.indexOf(`${startChar}${context}End:${path}${endChar}`, repeaterStartIndex);

    if (repeaterEndIndex === -1) {
      throw new Error(`Template Syntax Error: ${context} not closed.`);
    } else if (!options.tag) {
      throw new Error(`Template Syntax Error: ${context} tag not specified.`);
    }

    const repeaterTemplate = template.substring(repeaterStartIndex + 1, repeaterEndIndex);

    const closingTag = `</${options.tag}>`;
    const templateStartIndex = repeaterTemplate.lastIndexOf(`<${options.tag}`);
    const templateEndIndex = repeaterTemplate.lastIndexOf(closingTag);

    if (templateEndIndex === -1) {
      throw new Error(`Template Syntax Error: ${context} row not closed.`);
    }

    const trTemplate = repeaterTemplate.substring(templateStartIndex, templateEndIndex + closingTag.length);
    const items: any[] = this.getValueByPath(path, data);
    const listTemplate = items.reduce((acc: string, curr) => 
      acc.concat(this.parse(trTemplate, curr, data))
    , '');
    
    oc.output += this.parse(template.substring(repeaterStartIndex + 1, repeaterStartIndex + templateStartIndex + 1), data) + listTemplate;
    oc.end = repeaterStartIndex + templateEndIndex + closingTag.length;
  }

  private processCondition(options: ITagOptions, path: string, data: any, template: string, oc: IOutputControls): void {
    const value = this.getValueByPath(path, data);
    const isTruthy = options.not ? !value : value;

    console.log(template.substring(oc.end, oc.end + 50))

    if (!isTruthy) {
      const closingTag = `${startChar}ConditionEnd:${path}${endChar}`;
      const conditionTagIndex = template.indexOf(closingTag, oc.end);

      if (conditionTagIndex === -1) {
        throw new Error(`Template Syntax Error: Condition ${path} not closed.`);
      }

      oc.end = conditionTagIndex + closingTag.length - 1;
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

  // opts example param1=true,param2=test
  private extractOptions(opts: string): ITagOptions {
    return opts.split(optsSeparator).reduce((acc, curr) => {
    const opArr = curr.split(optsValueSeparator);
    return {...acc, [opArr[0]]: opArr[1] === undefined ? true : opArr[1]};
    },{});
  }

}