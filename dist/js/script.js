/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
	('use strict')

	const select = {
		templateOf: {
			menuProduct: '#template-menu-product',
			cartProduct: '#template-cart-product',
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
				input: 'input.amount',
				linkDecrease: 'a[href="#less"]',
				linkIncrease: 'a[href="#more"]',
			},
		},

		cart: {
			productList: '.cart__order-summary',
			toggleTrigger: '.cart__summary',
			totalNumber: `.cart__total-number`,
			totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
			subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
			deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
			form: '.cart__order',
			formSubmit: '.cart__order [type="submit"]',
			phone: '[name="phone"]',
			address: '[name="address"]',
		},
		cartProduct: {
			amountWidget: '.widget-amount',
			price: '.cart__product-price',
			edit: '[href="#edit"]',
			remove: '[href="#remove"]',
		},
	}

	const classNames = {
		menuProduct: {
			wrapperActive: 'active',
			imageVisible: 'active',
		},
		cart: {
			wrapperActive: 'active',
		},
	}

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 0,
			defaultMax: 9,
		},
		cart: {
			defaultDeliveryFee: 20,
		},

		db: {
			url: '//localhost:3131',
			products: 'products',
			orders: 'orders',
		},
	}

	const templates = {
		menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
		cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
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
			app.cart.add(thisProduct.prepareCartProduct())
		}
	}

	class Cart {
		constructor(element) {
			const thisCart = this
			thisCart.products = []
			thisCart.getElements(element)
			thisCart.initActions()
			// console.log('new cart:', thisCart)
		}

		getElements(element) {
			const thisCart = this
			thisCart.dom = {}
			thisCart.dom.wrapper = element
			thisCart.dom.toggleTrigger = element.querySelector(select.cart.toggleTrigger)
			thisCart.dom.productList = element.querySelector(select.cart.productList)
			thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee)
			thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice)
			thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice)
			thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber)
		}

		initActions() {
			const thisCart = this
			thisCart.dom.toggleTrigger.addEventListener('click', function () {
				thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive)
			})

			thisCart.dom.productList.addEventListener('updated', function () {
				thisCart.update()
			})

			thisCart.dom.productList.addEventListener('remove', function (event) {
				thisCart.remove(event.detail.cartProduct)
			})
		}

		add(menuProduct) {
			const thisCart = this
			// console.log('adding product:', menuProduct)

			// generate HTML based on tempalte
			const generatedHTML = templates.cartProduct(menuProduct)

			// create element using utils.createElementFromHtml
			const generatedDOM = utils.createDOMFromHTML(generatedHTML)
			// console.log(generatedDOM)

			// find cart container
			thisCart.dom.productList = document.querySelector(select.cart.productList)

			// add element to menu
			thisCart.dom.productList.appendChild(generatedDOM)

			thisCart.products.push(new CartProduct(menuProduct, generatedDOM))
			console.log('thisCart.products', thisCart.products)
			thisCart.update()
		}

		update() {
			const thisCart = this
			let deliveryFee = settings.cart.defaultDeliveryFee
			let totalNumber = 0
			let subtotalPrice = 0

			for (const product of thisCart.products) {
				// console.log(product)
				totalNumber += product.amount
				subtotalPrice += product.price
				// console.log(totalNumber, subtotalPrice)
			}

			if (totalNumber === 0) {
				deliveryFee = 0
				thisCart.totalPrice = subtotalPrice
			} else thisCart.totalPrice = subtotalPrice + deliveryFee

			// console.log(deliveryFee, subtotalPrice, thisCart.totalPrice, totalNumber)
			thisCart.dom.deliveryFee.innerHTML = deliveryFee
			thisCart.dom.subtotalPrice.innerHTML = subtotalPrice
			thisCart.dom.totalNumber.innerHTML = totalNumber

			// console.log(thisCart.dom.totalPrice)
			for (let totalPrice of thisCart.dom.totalPrice) {
				totalPrice.innerHTML = thisCart.totalPrice
			}
		}

		remove(elementToRemove) {
			const thisCart = this
			// console.log(elementToRemove)
			// console.log(elementToRemove.dom.wrapper)

			// Remove from HTML
			elementToRemove.dom.wrapper.remove()

			// Remove from thisCart.products.
			const indexOfElementToRemove = thisCart.products.indexOf(elementToRemove)
			thisCart.products.splice(indexOfElementToRemove, 1)

			// invoke update method.
			thisCart.update()
		}
	}

	class CartProduct {
		constructor(menuProduct, element) {
			const thisCartProduct = this
			thisCartProduct.id = menuProduct.id
			thisCartProduct.name = menuProduct.name
			thisCartProduct.amount = menuProduct.amount
			thisCartProduct.priceSingle = menuProduct.priceSingle
			thisCartProduct.price = menuProduct.price
			thisCartProduct.params = menuProduct.params
			thisCartProduct.getElements(element)
			thisCartProduct.cartAmountWidget()
			thisCartProduct.initActions()
		}

		getElements(element) {
			const thisCartProduct = this
			thisCartProduct.dom = {}
			thisCartProduct.dom.wrapper = element
			thisCartProduct.dom.amountWidget = element.querySelector(select.cartProduct.amountWidget)
			thisCartProduct.dom.price = element.querySelector(select.cartProduct.price)
			thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit)
			thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove)
			// console.log(thisCartProduct.dom)
		}

		cartAmountWidget() {
			const thisCartProduct = this
			// console.log(thisCartProduct.amount)

			thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget)
			thisCartProduct.amountWidget.setValue(thisCartProduct.amount)

			thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
				thisCartProduct.amount = thisCartProduct.amountWidget.value
				thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount
				thisCartProduct.dom.price.innerHTML = thisCartProduct.price
			})
		}

		remove() {
			const thisCartProduct = this
			const event = new CustomEvent('remove', {
				bubbles: true,
				detail: {
					cartProduct: thisCartProduct,
				},
			})

			thisCartProduct.dom.wrapper.dispatchEvent(event)
			// console.log('remove clicked')
		}

		initActions() {
			const thisCartProduct = this
			thisCartProduct.dom.edit.addEventListener('click', function (event) {
				event.preventDefault()
			})
			thisCartProduct.dom.remove.addEventListener('click', function (event) {
				event.preventDefault()
				thisCartProduct.remove()
				console.log('remove clicked')
			})
		}
	}

	const app = {
		initMenu: function () {
			const thisApp = this
			// console.log('thisApp.data:', thisApp.data)

			for (let productData in thisApp.data.products) {
				// console.log(productData, thisApp.data.products[productData]);
				new Product(thisApp.data.products[productData].id, thisApp.data.products[productData])
			}
		},

		initData: function () {
			const thisApp = this
			thisApp.data = {}
			const url = settings.db.url + '/' + settings.db.products
			fetch(url).then(
				function (rawResponse) {
					return rawResponse.json()
				}
			).then(function (parsedResponse) {
					console.log('parsed response:', parsedResponse)
					thisApp.data.products = parsedResponse
					thisApp.initMenu()
				})
			console.log('this App data', JSON.stringify(thisApp.data))
		},

		initCart: function () {
			const thisApp = this
			const cartElem = document.querySelector(select.containerOf.cart)
			thisApp.cart = new Cart(cartElem)
			// console.log(app.cart)
		},

		init: function () {
			const thisApp = this
			console.log('*** App starting ***')
			console.log('thisApp:', thisApp)
			console.log('classNames:', classNames)
			console.log('settings:', settings)
			console.log('templates:', templates)

			thisApp.initData()
			// thisApp.initMenu()
			thisApp.initCart()
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
			const event = new CustomEvent('updated', { bubbles: true })
			// console.log(thisWidget.element)
			thisWidget.element.dispatchEvent(event)
		}
	}

	app.init()
}
