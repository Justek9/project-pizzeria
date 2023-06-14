class BaseWidget {
	constructor(wrapperElement, initialValue) {
		const thisWidget = this
		thisWidget.dom = {}
		thisWidget.dom.wrapper = wrapperElement
		thisWidget.correctValue = initialValue
	}

	get value() {
		const thisWidget = this
		return thisWidget.correctValue
	}

	set value(value) {
		console.log('using value setter')
		const thisWidget = this
		const newValue = thisWidget.parseValue(value)

		// Add validation

		if (thisWidget.correctValue !== newValue && this.isValid(newValue)) {
			thisWidget.correctValue = newValue
			this.announce()
		}
		thisWidget.renderValue()
	}

	setValue(value) {
		const thisWidget = this

		console.log('before setting')
		thisWidget.value = value //calling setter value
	}

	parseValue(value) {
		return parseInt(value)
	}

	isValid(value) {
		return !isNaN(value)
	}

	renderValue() {
		const thisWidget = this
		thisWidget.dom.wrapper.innerHTML = thisWidget.value
	}

	announce() {
		const thisWidget = this
		const event = new CustomEvent('updated', { bubbles: true })
		// console.log(thisWidget.element)
		thisWidget.dom.wrapper.dispatchEvent(event)
	}
}

export default BaseWidget
