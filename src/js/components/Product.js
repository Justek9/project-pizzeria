import { templates, classNames, select } from '../settings.js'
import utils from '../utils.js'
import AmountWidget from './AmountWidget.js'

class Product {
	constructor(id, data) {
		const thisProduct = this
		this.id = id
		this.data = data
		thisProduct.renderInMenu()
		thisProduct.getElements()
		thisProduct.initAccordion()
		thisProduct.initOrderForm()
		thisProduct.initAmountWidget()
		thisProduct.processOrder()
	}

	renderInMenu() {
		const thisProduct = this

		// generate HTML based on tempalte
		const generatedHTML = templates.menuProduct(thisProduct.data)

		// create element using utils.createElementFromHtml
		thisProduct.element = utils.createDOMFromHTML(generatedHTML)

		// find menu container
		const menuContainer = document.querySelector(select.containerOf.menu)

		// add element to menu
		menuContainer.appendChild(thisProduct.element)
	}

	getElements() {
		const thisProduct = this

		thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable)
		thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form)
		thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs)
		thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton)
		thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem)
		thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper)
		thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget)
	}

	initAmountWidget() {
		const thisProduct = this
		thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem)
		thisProduct.amountWidgetElem.addEventListener('updated', function () {
			thisProduct.processOrder()
		})
	}

	initAccordion() {
		const thisProduct = this

		/* [DONE] find the clickable trigger and add event listener to clickable trigger on event click */
		thisProduct.accordionTrigger.addEventListener('click', function (event) {
			/* [DONE] prevent default action for event */
			event.preventDefault()

			/* [DONE]find active product (product that has active class) */
			const artActive = document.querySelector('article.active')
			// console.log(artActive);

			/* [DONE] if there is active product and it's not thisProduct.element, remove class active from it */
			if (artActive && artActive !== thisProduct.element) {
				artActive.classList.remove(classNames.menuProduct.wrapperActive)
			}
			/* toggle active class on thisProduct.element */
			thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive)
		})
	}

	initOrderForm() {
		const thisProduct = this
		thisProduct.form.addEventListener('submit', function (event) {
			event.preventDefault()
			thisProduct.processOrder()
		})

		for (let input of thisProduct.formInputs) {
			input.addEventListener('change', function () {
				thisProduct.processOrder()
			})
		}

		thisProduct.cartButton.addEventListener('click', function (event) {
			event.preventDefault()
			thisProduct.processOrder()
			thisProduct.addToCart()
		})
	}

	processOrder() {
		const thisProduct = this

		// [DONE] covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
		const formData = utils.serializeFormToObject(thisProduct.form)
		// console.log('formData', formData)

		// [DONE] set price to default price
		let price = thisProduct.data.price

		// for every category (param)...
		for (let paramId in thisProduct.data.params) {
			// [DONE] determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
			const param = thisProduct.data.params[paramId]

			// [DONE] for every option in this category
			for (let optionId in param.options) {
				// [DONE] determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
				const option = param.options[optionId]

				// [DONE] check if price needs to be changed (steps 1-2)

				//1) [DONE] if default and unchecked - price decrease
				if (!formData[paramId].includes(optionId) && option.default) {
					price -= option.price
				}

				//2)[DONE] if not default and checked - price increase
				if (formData[paramId].includes(optionId) && !option.default) {
					price += option.price
				}

				// [DONE] toggle img display: remove active class and add to to checked option
				if (thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`))
					thisProduct.imageWrapper
						.querySelector(`.${paramId}-${optionId}`)
						.classList.remove(classNames.menuProduct.imageVisible)

				if (thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`) && formData[paramId].includes(optionId)) {
					thisProduct.imageWrapper
						.querySelector(`.${paramId}-${optionId}`)
						.classList.add(classNames.menuProduct.imageVisible)
				}
			}
		}

		// add single price
		thisProduct.priceSingle = price
		// multiply price by amount
		price *= thisProduct.amountWidget.value

		// [DONE] update calculated price in the HTML and andd total price to further push to cart

		thisProduct.price = thisProduct.priceElem.innerHTML = price
	}

	prepareCartProduct() {
		const thisProduct = this
		const productSummary = {
			id: thisProduct.id,
			name: thisProduct.data.name,
			amount: thisProduct.amountWidget.value,
			priceSingle: thisProduct.price / thisProduct.amountWidget.value,
			price: thisProduct.price,
			params: thisProduct.prepareCartProductParams(),
		}
		return productSummary
	}

	prepareCartProductParams() {
		const thisProduct = this

		let params = {}

		// [DONE] covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
		const formData = utils.serializeFormToObject(thisProduct.form)

		// for every category (param)...
		for (let paramId in thisProduct.data.params) {
			// [DONE] determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
			const param = thisProduct.data.params[paramId]
			params[paramId] = { label: param.label, options: {} }
			// [DONE] for every option in this category
			for (let optionId in param.options) {
				// [DONE] determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
				const option = param.options[optionId]

				if (formData[paramId].includes(optionId)) {
					params[paramId].options[optionId] = option.label
				}
			}
		}

		return params
	}

	addToCart() {
		const thisProduct = this
		// app.cart.add(thisProduct.prepareCartProduct())

		thisProduct.name = thisProduct.data.name
		thisProduct.amount = thisProduct.amountWidget.value

		const event = new CustomEvent('add-to-cart', {
			bubbles: true,
			detail: {
				product: thisProduct,
			},
		})
		thisProduct.element.dispatchEvent(event)
	}
}

export default Product
