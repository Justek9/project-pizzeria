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
		thisBooking.selectTable()
		thisBooking.sendBooking()
		thisBooking.catchStarters()
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

		const urls = {
			booking: settings.db.url + '/' + settings.db.bookings + '?' + params.bookings.join('&'),
			eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
			eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
		}

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
		thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.containerOf.floorPlan)
		thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address)
		thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone)
		thisBooking.dom.btnSendOrder = thisBooking.dom.wrapper.querySelector(select.booking.bookBtn)
		thisBooking.dom.starters = thisBooking.dom.wrapper.querySelector(select.containerOf.starters)
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
					thisBooking.selectedTable = Number(e.target.innerHTML.replace('table-', ''))
				}
			}
			// unable selecting booked table
			if (e.target.classList.contains(classNames.booking.tableBooked)) {
				e.target.classList.remove(classNames.booking.tableSelected)
				alert('This table is already taken. Please choose another one :)')
			}
		})
	}

	resetSelection() {
		const thisBooking = this

		for (let table of thisBooking.dom.tables) {
			if (table.classList.contains(classNames.booking.tableSelected)) {
				table.classList.remove(classNames.booking.tableSelected)
			}
		}
	}

	initWidgets() {
		const thisBooking = this

		// Set people widget
		thisBooking.peopleWidget = new AmountWidget(thisBooking.dom.peopleAmount)
		thisBooking.dom.peopleAmount.addEventListener('updated', function () {
			return thisBooking.peopleWidget.value
		})

		// Set hours widget
		thisBooking.hoursWidget = new AmountWidget(thisBooking.dom.hoursAmount)
		thisBooking.dom.hoursAmount.addEventListener('updated', function () {
			return thisBooking.hoursWidget.value
		})

		// Set date widget
		thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker)
		thisBooking.dom.datePicker.addEventListener('updated', function () {
			return thisBooking.datePicker.value
		})

		// Set hour widget
		thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker)
		thisBooking.dom.hourPicker.addEventListener('updated', function () {
			return thisBooking.hourPicker.value
		})

		thisBooking.dom.wrapper.addEventListener('updated', function () {
			thisBooking.updateDOM()
			thisBooking.resetSelection()
		})
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

	catchStarters() {
		const thisBooking = this
		thisBooking.startersArray = []
		thisBooking.dom.starters.addEventListener('change', function (event) {
			event.preventDefault()
			let checkboxValue = event.target.value

			if (!thisBooking.startersArray.includes(checkboxValue)) {
				thisBooking.startersArray.push(checkboxValue)
			} else {
				let index = thisBooking.startersArray.indexOf(checkboxValue)
				thisBooking.startersArray.splice(index, 1)
			}
		})
	}

	sendBooking() {
		const thisBooking = this
		const url = settings.db.url + '/' + settings.db.bookings
		thisBooking.dom.btnSendOrder.addEventListener('click', function () {
			const payload = {
				date: thisBooking.datePicker.value,
				hour: thisBooking.hourPicker.value,
				table: thisBooking.selectedTable,
				duration: thisBooking.hoursWidget.value,
				ppl: thisBooking.peopleWidget.value,
				address: thisBooking.dom.address.value,
				phone: thisBooking.dom.phone.value,
				starters: thisBooking.startersArray,
			}
			// console.log(payload)

			const options = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			}

			fetch(url, options)
				.then(function (response) {
					return response.json()
				})
				.then(function (parsedResponse) {
					thisBooking.makeBooked(
						parsedResponse.date,
						parsedResponse.hour,
						parsedResponse.duration,
						parsedResponse.table
					)
					//   console.log(thisBooking.booked);
				})
		})
	}
}
export default Booking
