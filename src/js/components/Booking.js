import { templates, select, settings, classNames } from '../settings.js'
import AmountWidget from './AmountWidget.js'
import DatePicker from './DatePicker.js'
import HourPicker from './HourPicker.js'
import utils from '../utils.js'

class Booking {
	constructor(element) {
		const thisBooking = this
		thisBooking.element = element
		thisBooking.render(element)
		thisBooking.initWidgets()
		thisBooking.getData()
		thisBooking.selectedTable
		thisBooking.selectTable()
	}

	getData() {
		const thisBooking = this

		const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate)
		const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate)

		const params = {
			bookings: [startDateParam, endDateParam],
			eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
			eventsRepeat: [settings.db.repeatParam, endDateParam],
		}
		// console.log('get data params', params)

		const urls = {
			booking: settings.db.url + '/' + settings.db.bookings + '?' + params.bookings.join('&'),
			eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
			eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
		}
		// console.log(urls)

		Promise.all([fetch(urls.booking), fetch(urls.eventsCurrent), fetch(urls.eventsRepeat)])
			.then(function (allResponses) {
				const bookingResponse = allResponses[0]
				const eventsCurrentResponse = allResponses[1]
				const eventsRepeatResponse = allResponses[2]
				return Promise.all([bookingResponse.json(), eventsCurrentResponse.json(), eventsRepeatResponse.json()])
			})
			.then(function ([bookings, eventsCurrent, eventsRepeat]) {
				// console.log(bookings)
				// console.log(eventsCurrent)
				// console.log(eventsRepeat)
				thisBooking.parseData(bookings, eventsCurrent, eventsRepeat)
			})
	}

	parseData(bookings, eventsCurrent, eventsRepeat) {
		const thisBooking = this
		thisBooking.booked = {}

		for (let item of bookings) {
			thisBooking.makeBooked(item.date, item.hour, item.duration, item.table)
		}

		for (let item of eventsCurrent) {
			thisBooking.makeBooked(item.date, item.hour, item.duration, item.table)
		}

		const minDate = thisBooking.datePicker.minDate
		const maxDate = thisBooking.datePicker.maxDate

		for (let item of eventsRepeat) {
			if (item.repeat == 'daily') {
				for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
					thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table)
				}
			}
		}
		// console.log(thisBooking.booked)
		thisBooking.updateDOM()
	}

	makeBooked(date, hour, duration, table) {
		const thisBooking = this

		if (typeof thisBooking.booked[date] == 'undefined') {
			thisBooking.booked[date] = {}
		}

		const startHour = utils.hourToNumber(hour)

		for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
			if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
				thisBooking.booked[date][hourBlock] = []
			}
			thisBooking.booked[date][hourBlock].push(table)
		}
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
		thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper)
		thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper)
		thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables)
		thisBooking.dom.floorPlan = document.querySelector(select.containerOf.floorPlan)
	}

	selectTable() {
		const thisBooking = this
		thisBooking.selectedTable = null

		// set and reset selection on click event
		thisBooking.dom.floorPlan.addEventListener('click', function (e) {
			if (e.target.classList.contains('table')) {
				if (e.target.classList.contains('selected')) {
					thisBooking.resetSelection()
				} else {
					thisBooking.resetSelection()
					e.target.classList.add(classNames.booking.tableSelected)
				}
				if (e.target.classList.contains(classNames.booking.tableSelected)) {
					thisBooking.selectedTable = e.target.innerHTML.replace('table-', '')
				}
			}
			// unable selecting booked table
			if (e.target.classList.contains(classNames.booking.tableBooked)) {
				e.target.classList.remove(classNames.booking.tableSelected)
				alert('This table is already taken. Please choose another one :)')
			}
			// console.log((thisBooking.selectedTable))
		})
	}

	resetSelection() {
		const thisBooking = this

		for (let table of thisBooking.dom.tables) {
			if (table.classList.contains(classNames.booking.tableSelected)) {
				table.classList.remove(classNames.booking.tableSelected)
			}
		}
		// thisBooking.selectedTable = null
	}

	initWidgets() {
		const thisBooking = this

		// Set people widget
		thisBooking.peopleWidget = new AmountWidget(thisBooking.dom.peopleAmount)
		thisBooking.dom.peopleAmount.addEventListener('updated', function () {
			// console.log('people amount')
		})

		// Set hours widget
		thisBooking.hoursWidget = new AmountWidget(thisBooking.dom.hoursAmount)
		// thisBooking.hoursWidget.addEventListener('updated', function () {})

		// Set date widget
		thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker)

		// Set hour widget
		thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker)

		thisBooking.dom.wrapper.addEventListener('updated', function () {
			thisBooking.updateDOM()
			thisBooking.resetSelection()
		})
		// console.log(thisBooking.dom.wrapper)
	}

	updateDOM() {
		const thisBooking = this

		thisBooking.date = thisBooking.datePicker.value
		thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value)

		let allAvailable = false

		if (
			typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
			typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
		) {
			allAvailable = true
		}

		for (let table of thisBooking.dom.tables) {
			let tableId = table.getAttribute(settings.booking.tableIdAttribute)
			if (!isNaN(tableId)) {
				tableId = parseInt(tableId)
			}

			if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
				table.classList.add(classNames.booking.tableBooked)
			} else {
				table.classList.remove(classNames.booking.tableBooked)
			}
		}
	}
}

export default Booking
