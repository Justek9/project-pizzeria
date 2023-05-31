/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
	('use strict')

	const select = {
		templateOf: {
			menuProduct: '#template-menu-product',
		},
		containerOf: {
			menu: '#product-list',
			cart: '#cart',
		},
		all: {
			menuProducts: '#product-list > .product',
			menuProductsActive: '#product-list > .product.active',
			formInputs: 'input, select',
		},
		menuProduct: {
			clickable: '.product__header',
			form: '.product__order',
			priceElem: '.product__total-price .price',
			imageWrapper: '.product__images',
			amountWidget: '.widget-amount',
			cartButton: '[href="#add-to-cart"]',
		},
		widgets: {
			amount: {
				input: 'input[name="amount"]',
				linkDecrease: 'a[href="#less"]',
				linkIncrease: 'a[href="#more"]',
			},
		},
	}

	const classNames = {
		menuProduct: {
			wrapperActive: 'active',
			imageVisible: 'active',
		},
	}

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 0,
			defaultMax: 10,
		},
	}

	const templates = {
		menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
	}

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
			// console.log('new Product:', thisProduct)
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
			console.log(thisProduct.amountWidgetElem)
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
			// console.log(thisProduct);

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
			// console.log('initOrderForm:')
			thisProduct.form.addEventListener('submit', function (event) {
				event.preventDefault()
				thisProduct.processOrder()
				// console.log('form submit');
			})

			for (let input of thisProduct.formInputs) {
				input.addEventListener('change', function () {
					thisProduct.processOrder()
					// console.log('input change');
				})
			}

			thisProduct.cartButton.addEventListener('click', function (event) {
				event.preventDefault()
				thisProduct.processOrder()
				// console.log('cart button clicked');
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
				// console.log(paramId, param)

				// [DONE] for every option in this category
				for (let optionId in param.options) {
					// [DONE] determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
					const option = param.options[optionId]
					// console.log(optionId, option)

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

					if (
						thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`) &&
						formData[paramId].includes(optionId)
					) {
						thisProduct.imageWrapper
							.querySelector(`.${paramId}-${optionId}`)
							.classList.add(classNames.menuProduct.imageVisible)
					}
				}
			}
			// multiply price by amount
			price *= thisProduct.amountWidget.value

			// [DONE] update calculated price in the HTML
			thisProduct.priceElem.innerHTML = price
		}
	}

	const app = {
		initMenu: function () {
			const thisApp = this
			// console.log('thisApp.data:', thisApp.data)

			for (let productData in thisApp.data.products) {
				// console.log(productData, thisApp.data.products[productData]);
				new Product(productData, thisApp.data.products[productData])
			}
		},

		initData: function () {
			const thisApp = this
			thisApp.data = dataSource
		},

		init: function () {
			const thisApp = this
			console.log('*** App starting ***')
			console.log('thisApp:', thisApp)
			console.log('classNames:', classNames)
			console.log('settings:', settings)
			console.log('templates:', templates)

			thisApp.initData()
			thisApp.initMenu()
		},
	}

	class AmountWidget {
		constructor(element) {
			const thisWidget = this
			// console.log('AmountWidget:', thisWidget)
			// console.log('constructor arguments', element)
			thisWidget.getElements(element)
			thisWidget.setValue(settings.amountWidget.defaultValue)
			thisWidget.initActions()
		}

		getElements(element) {
			const thisWidget = this
			thisWidget.element = element
			thisWidget.input = element.querySelector(select.widgets.amount.input)
			thisWidget.linkDecrease = element.querySelector(select.widgets.amount.linkDecrease)
			thisWidget.linkIncrease = element.querySelector(select.widgets.amount.linkIncrease)

			console.log(thisWidget.input, thisWidget.linkDecrease, thisWidget.linkIncrease)
		}

		setValue(value) {
			const thisWidget = this
			const newValue = parseInt(value)

			// Add validation

			if (
				thisWidget.value !== newValue &&
				!isNaN(newValue) &&
				newValue >= settings.amountWidget.defaultMin &&
				newValue <= settings.amountWidget.defaultMax
			) {
				thisWidget.value = newValue
			}
			thisWidget.input.value = thisWidget.value
			this.announce()
		}

		initActions() {
			const thisWidget = this

			thisWidget.input.addEventListener('change', function () {
				thisWidget.setValue(thisWidget.input.value)
			})
			thisWidget.linkDecrease.addEventListener('click', function (event) {
				event.preventDefault()
				thisWidget.setValue(+thisWidget.input.value - 1)
			})
			thisWidget.linkIncrease.addEventListener('click', function (event) {
				event.preventDefault()
				thisWidget.setValue(+thisWidget.input.value + 1)
			})
		}

		announce() {
			const thisWidget = this
			const event = new Event('updated')
			// console.log(thisWidget.element)
			thisWidget.element.dispatchEvent(event)
		}
	}

	app.init()
}
