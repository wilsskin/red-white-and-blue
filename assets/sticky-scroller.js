/**
 *  @class
 *  @function StickyScroller
 */
if (!customElements.get('sticky-scroller')) {
  class StickyScroller extends HTMLElement {
    connectedCallback() {
      this.element = this.querySelector('.sticky-scroller--element');
      if (this.element) {
        this.element.style.overflowY = 'auto';
      }
    }
  }
  customElements.define('sticky-scroller', StickyScroller);
}