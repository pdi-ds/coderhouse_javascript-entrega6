const currency = {
	ARS: { id: "pesos argentinos", data: { USD: 0.0086, CLP: 7.41, EUR: 0.0081 }, },
	USD: { id: "dólares americanos", data: { ARS: 117.0, CLP: 866.85, EUR: 0.95 }, },
	CLP: { id: "pesos chilenos", data: { ARS: 0.13, USD: 0.0012, EUR: 0.0011 }, },
	EUR: { id: "euros", data: { ARS: 123.12, USD: 1.05, CLP: 912.75 }, },
};
Object.defineProperties(
	currency, {
	curGET: { value: function (exclude = []) { let options = Object.keys(this); if (exclude.length > 0) { options = options.filter(value => exclude.includes(value) === false); } return options; }.bind(currency) },
	curOPT: { value: function (exclude = [], join = true) { let options = this.curGET(exclude); return join === true ? options.join(', ') : options; }.bind(currency) },
	curCONV: { value: function (from, to, amout) { return amout * this[from].data[to]; }.bind(currency) }
}
);
const fail = 'fail';
const div = 'div';
const locData = { user: '', from: 'ARS', amount: "100", to: ['USD'] };
const call = {
	'sN1': function () {
		let button = this.querySelector('button'), input = this.querySelector('input[name="user"]');
		button.addEventListener('click', e => {
			let user = input.value;
			if (user === null || user === '') { validate({ input, message: 'Por favor, ingresá un usuario:' }); }
			else { locData.user = user; clear(input); step('sN2'); }
		});
	},
	'sN2': function () {
		let select = this.querySelector('select'),
			input = this.querySelector('input[name="amount"]'),
			button = this.querySelector('button'),
			currencies = [];
		(select.querySelectorAll('option:not([value=""])') || []).forEach(node => select.removeChild(node));
		currencies = currency.curGET().map(function (type) {
			let option = document.createElement('option');
			option.value = type
			option.textContent = currency[type].id;
			if (type === locData.from) option.selected = true;
			return option;
		});
		select.append.apply(select, currencies);
		input.value = locData.amount;
		button.addEventListener('click', e => {
			let from = select.value,
				amount = input.value,
				passed = [];
			if (from === null || convertible(from) === false) {
				validate({ input: select, message: 'Por favor, seleccioná una moneda de origen válida' });
			}
			else {
				clear(select);
				passed.push('from');
			}
			if (amount === '') {
				validate({ input, message: 'Ingresá un valor a convertir' });
			}
			else if (_number(amount) === false) {
				validate({ input, message: 'Por favor, ingresá un monto válido', replace: true });
			}
			else if (Number(amount) <= 0) {
				validate({ input, message: 'Por favor, ingresá un número que no sea cero', replace: true });
			}
			else { clear(input); passed.push('amount'); }
			if (passed.length === 2) { locData.amount = Number(amount); locData.from = from; step('sN3'); }
		});
	},
	'sN3': function () {
		function reg(selected = false) {
			let container = document.createElement('div'), currencies = [], select;
			container.className = 'converting';
			container.innerHTML = '<div class="form-row">' + '<label>Seleccioná la moneda de destino:</label>' + '<select name="from">' + '<option value=""></option>' + '</select>' + '</div>';
			currencies = currency.curGET(locData.from).map(function (type) {
				let option = document.createElement('option');
				option.value = type
				option.textContent = currency[type].id;
				if (selected !== false && type === selected) option.selected = true;
				return option;
			});
			select = container.querySelector('select');
			select.append.apply(select, currencies);
			return container;
		}
		let container = this.querySelector('.conversions'), button = this.querySelector('button'), selects = [];
		(container.querySelectorAll('.converting') || []).forEach(node => container.removeChild(node));
		selects = [...locData.to, ''].map((code, i) => { return reg(code); });
		container.addEventListener('change', e => {
			let target = e.target, selects = container.querySelectorAll('select'), empty = []; selects.forEach(select => { if (select.value === '') empty.push(select); });
			if (target.value !== '') { clear(target); }
			if (target.matches('select') && target.value !== '' && selects.length < currency.curGET(locData.from).length && empty.length === 0) { container.append(reg()); }
		});
		container.append.apply(container, selects);
		button.addEventListener('click', e => {
			let selects = container.querySelectorAll('select'), currencies = [];
			selects.forEach(select => { let value = select.value; if (value !== '') currencies.push(select.value); });
			if (currencies.length === 0) { validate({ input: selects[0], message: 'Tenes que seleccionar una moneda' }); }
			else { locData.to = currencies.filter((value, index) => currencies.indexOf(value) === index); step('sN4'); }
		});
	},
	'sN4': function () {
		function extraCONV({ text }) { let converting = document.createElement('div'), _text = document.createElement('p'); converting.className = 'converting'; _text.textContent = text; converting.append(_text); return converting; }
		let container = this.querySelector('.conversions'), conversions = [];
		conversions = locData.to.map(value => {
			let { from, amount } = locData, finished = currency.curCONV(from, value, amount);
			return { text: `$${amount} ${currency[from].id.toLowerCase()} = $${finished} ${currency[value].id.toLowerCase()}` };
		});
		container.append.apply(container, conversions.map(extraCONV));
	}
};
function _number(value) { return !isNaN(parseInt(value)); }
function convertible(type) { return currency.curGET().includes(type.toUpperCase()); }
function validate({ input, message, replace = false }) {
	if (input.parentNode.querySelector(`${div}.${fail}`) === null) {
		let alert = document.createElement(div);
		alert.className = fail;
		alert.textContent = message;
		input.className = fail;
		input.parentNode.insertBefore(alert, input.nextSibling);
	}
	else if (replace === true) { input.parentNode.querySelector(`${div}.${fail}`).textContent = message; }
	input.focus();
}
function clear(input) { let alert = input.parentNode.querySelector(`${div}.${fail}`); input.className = ''; if (alert !== null) alert.remove(); }
function step(user) {
	let container = document.querySelector('.container'), step = container.querySelector(`[data-step="${user}"]`), callback;
	if (step !== null) {
		container.querySelectorAll('[data-step]').forEach(current => { current.className = ''; });
		callback = step.getAttribute('data-callback');
		if (callback !== null && call[callback]) { call[callback].apply(step); } step.className = 'current';
	}
}
step('sN1');