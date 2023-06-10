import { templates, settings, classNames, select } from '../settings.js'
import utils from '../utils.js'
import CartProduct from './CartProduct.js'

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
        thisCart.dom.form = element.querySelector(select.cart.form)
        thisCart.dom.phone = element.querySelector(select.cart.phone)
        thisCart.dom.address = element.querySelector(select.cart.address)
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

        thisCart.dom.form.addEventListener('submit', function (event) {
            event.preventDefault()
            console.log('order clicked')
            thisCart.sendOrder()
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

    sendOrder() {
        const thisCart = this
        const url = settings.db.url + '/' + settings.db.orders

        // console.log(thisCart.totalPrice)
        // console.log(thisCart.dom.totalNumber.innerHTML)
        const payload = {
            address: thisCart.dom.address.value,
            phone: thisCart.dom.phone.value,
            totalPrice: thisCart.totalPrice,
            subtotalPrice: thisCart.dom.subtotalPrice.innerHTML,
            totalNumber: thisCart.dom.totalNumber.innerHTML,
            deliveryFee: thisCart.dom.deliveryFee.innerHTML,
            products: [],
        }

        for (let prod of thisCart.products) {
            payload.products.push(prod.getData())
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }

        fetch(url, options)
        // console.log(payload)
    }
}

export default Cart