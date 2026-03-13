/**
 *  @class
 *  @function ToggleBoxes
 */
if (!customElements.get('toggle-box')) {
  class ToggleBox extends HTMLElement {

    constructor() {
      super();
    }

    connectedCallback() {
      const front = this.querySelector('.toggle-box--front');
      const back = this.querySelector('.toggle-box--back');

      const toggle = () => {
        this.toggleAttribute('open');
      };

      if (front) {
        front.addEventListener('click', toggle);
      }
      if (back) {
        back.addEventListener('click', toggle);
      }
    }
  }
  customElements.define('toggle-box', ToggleBox);
}
