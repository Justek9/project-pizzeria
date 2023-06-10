import { templates, select } from '../settings.js'
import AmountWidget from './AmountWidget.js'

class Booking {
	constructor(element) {
		const thisBooking = this
		thisBooking.element = element
		thisBooking.render(element)
		thisBooking.initWidgets()
	}

	render(element) {
		const thisBooking = this
		// generate HTML based on template
		const generatedHTML = templates.bookingWidget(element)

		// create empy object thisBooking.dom
		thisBooking.dom = {}

		// add wrapper property to above object and assign element to it
		thisBooking.dom.wrapper = element

		// change wrapper's inner HTML to the one generated from template
		element.innerHTML = generatedHTML

		thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount)
		thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount)
		// console.log(thisBooking.dom.peopleAmount, thisBooking.dom.hoursAmount)
	}

	initWidgets() {
		const thisBooking = this

		// Set people widget
		thisBooking.peopleWidget = new AmountWidget(thisBooking.dom.peopleAmount)
		thisBooking.dom.peopleAmount = addEventListener('updated', function () {})

		// Set hours widget
		thisBooking.hoursWidget = new AmountWidget(thisBooking.dom.hoursAmount)
		thisBooking.dom.peopleAmount = addEventListener('updated', function () {})
	}
}

export default Booking
