/**
 *  @class
 *  @function CollectionTabs
 */

if (!customElements.get('collection-tabs')) {
  class CollectionTabs extends HTMLElement {

    constructor() {
      super();
    }
    connectedCallback() {
      setTimeout(() => {
        this.target = this.dataset.target;
        this.links = Array.from(this.querySelectorAll('.collection-tabs__list-link'));
        this.links.forEach((link) => {
          link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (href && href !== '#') {
              return;
            }
            event.preventDefault();
            let handle = link.dataset.collection;
            [].forEach.call(this.links, function(el) {
              el.classList.remove('active');
            });
            link.classList.add('active');
            if (handle) {
              this.toggleCollection(handle);
            }
          });
        });
      }, 20);
      if (Shopify.designMode) {
        this.addEventListener('shopify:block:select', (event) => {
          const index = this.links.indexOf(event.target);
          if (index !== -1) this.links[index].dispatchEvent(new Event('click'));
        });
      }
    }
    toggleCollection(handle) {
      let slider = document.getElementById(this.target),
        products = slider.querySelectorAll(`.columns:not([data-collection*="${handle}"])`),
        active_products = slider.querySelectorAll(`[data-collection*="${handle}"]`),
        flkty = Flickity.data(slider);
      [].forEach.call(products, function(el) {
        el.classList.remove('carousel__slide');
        slider.append(el);
      });
      [].forEach.call(active_products, function(el) {
        if (el.dataset.collection === handle) {
          el.classList.add('carousel__slide');
        } else {
          el.classList.remove('carousel__slide');
          slider.append(el);
        }
      });
      flkty.insert(active_products);
      flkty.reloadCells();
      flkty.select(0, 0, 1);
    }
  }
  customElements.define('collection-tabs', CollectionTabs);
}
