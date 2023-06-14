import { templates, select } from '../settings.js'
import AmountWidget from './AmountWidget.js'
import DatePicker from './DatePicker.js'
import HourPicker from './HourPicker.js'

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
		thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper)
		thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper)
		// console.log(thisBooking.dom.datePicker, thisBooking.dom.hourPicker)
	}

	initWidgets() {
		const thisBooking = this

		// Set people widget
		thisBooking.peopleWidget = new AmountWidget(thisBooking.dom.peopleAmount)
		thisBooking.dom.peopleAmount = addEventListener('updated', function () {})

		// Set hours widget
		thisBooking.hoursWidget = new AmountWidget(thisBooking.dom.hoursAmount)
		thisBooking.dom.peopleAmount = addEventListener('updated', function () {})

		// Set date widget
		thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker)

		// Set hour widget
		thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker)
	}
}

export default Booking
