import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl overflow-hidden border" style="border-color: rgb(var(--border));">
      <div class="editor-toolbar flex flex-wrap items-center gap-1 p-2 border-b" style="background: rgb(var(--surface-2)); border-color: rgb(var(--border));">
        <button type="button" (click)="exec('bold')" title="Bold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg></button>
        <button type="button" (click)="exec('italic')" title="Italic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
        <button type="button" (click)="exec('underline')" title="Underline"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></button>
        <span class="w-px h-5 mx-1" style="background: rgb(var(--border));"></span>
        <button type="button" (click)="exec('formatBlock', '<h1>')" title="Heading 1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 6v12M12 6v12"/></svg></button>
        <button type="button" (click)="exec('formatBlock', '<h2>')" title="Heading 2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 6v12M14 6v12"/></svg></button>
        <button type="button" (click)="exec('formatBlock', '<p>')" title="Paragraph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 6h-3a4 4 0 0 0-4 4v10"/><path d="M8 10h6"/></svg></button>
        <span class="w-px h-5 mx-1" style="background: rgb(var(--border));"></span>
        <button type="button" (click)="exec('formatBlock', '<blockquote>')" title="Quote"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2"/></svg></button>
        <button type="button" (click)="exec('insertUnorderedList')" title="Bullet list"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
        <button type="button" (click)="exec('insertOrderedList')" title="Numbered list"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg></button>
        <span class="w-px h-5 mx-1" style="background: rgb(var(--border));"></span>
        <button type="button" (click)="insertLink()" title="Link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
        <button type="button" (click)="exec('removeFormat')" title="Clear formatting"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M5 20h6M13 4 8 20M15 15l5 5M20 15l-5 5"/></svg></button>
      </div>
      <div #editor class="editor-content px-6 py-5" contenteditable="true"
           [attr.data-placeholder]="placeholder"
           (input)="onInput()"
           (blur)="onInput()"></div>
    </div>
  `,
})
export class RichEditorComponent implements AfterViewInit {
  @ViewChild('editor') editor!: ElementRef<HTMLDivElement>;
  @Input() content = '';
  @Input() placeholder = 'Begin your story…';
  @Output() contentChange = new EventEmitter<string>();

  ngAfterViewInit() {
    if (this.content) this.editor.nativeElement.innerHTML = this.content;
  }

  writeContent(html: string) {
    if (this.editor) this.editor.nativeElement.innerHTML = html;
  }

  exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    this.onInput();
    this.editor.nativeElement.focus();
  }

  onInput() {
    this.contentChange.emit(this.editor.nativeElement.innerHTML);
  }

  insertLink() {
    const url = window.prompt('Link URL:');
    if (url) this.exec('createLink', url);
  }
}
