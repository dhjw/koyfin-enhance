let heading_str = 'Shares @ Avg Price', mwt, assets, prices, interval

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afterDOMLoaded); else afterDOMLoaded();

async function afterDOMLoaded() {
	console.log('[koyfin-enhance] loaded')
	await waitTilStopMutating()
	// init and check for errors
	mwt = document.querySelector('div[class^=my-watchlist-table]')
	if (!mwt) return console.log('[koyfin-enhance] error: no watchlist table. aborting')
	if (!$(mwt).find(':contains(' + heading_str + ')').length) return console.log('[koyfin-enhance] error: no column heading with "' + heading_str + '". aborting')
	if (!$(mwt).find(':contains(Last Price)').length) return console.log('[koyfin-enhance] error: no column heading with "Last Price". aborting')
	// run
	init()
	navigation.addEventListener('navigate', (e) => {
		(async () => {
			// console.log('[koyfin-enhance] navigation detected')
			await waitTilStopMutating()
			init()
		})()
	})
}

function init() {
	update()
	if (interval) clearInterval(interval)
	interval = setInterval(update, 2000) // MutationObserver was even more inefficient
}

function update() {
	if (!document.hasFocus()) return
	// don't use cache in case assets, rows or columns are edited or moved or re-init on navigation
	mwt = document.querySelector('div[class^=my-watchlist-table]')
	if (!mwt) return
	// get and process column headings
	let headers = mwt.querySelectorAll('div[class^=table-styles__table__headerCell]')
	let indexes = {}
	for (let i = 0; i < headers.length; i++) {
		if (headers[i].innerText === 'Exchange') {
			indexes.exchange = i;
			continue
		}
		if (headers[i].innerText === 'Last Price') {
			indexes.price = i;
			continue
		}
		if (headers[i].innerText === heading_str) {
			indexes.asset = i;
			continue
		}
		if (indexes.length >= 3) break;
	}
	// get and process rows
	let rows = mwt.querySelectorAll('div[class^=table-styles__table__row]')
	for (let i = 0; i < rows.length - 1; i++) { // ignore last row
		let cells = rows[i].querySelectorAll('div[class^=table-styles__table__dataCell]')
		let exchangeText = indexes.exchange ? $(cells[indexes.exchange]).text() : null // no consistent label element, jquery is easier
		let priceText = cells[indexes.price].querySelector('div[class^=default-cell__label]').innerText
		let assetLabel = cells[indexes.asset].querySelector('div[class^=table-cell-user-data__tableCellUserData__label]')

		// console.log('i:', i, 'text: "' + assets[i].innerText + '"')
		let m = assetLabel.innerText.match(new RegExp('^(\\d+) @ (\\d+.?(?:\\d+)?)(?: ([^( ]*))?'))
		if (m) {
			// console.log('m:', m)
			// 740 @ 3.38 CAD (+1.04 +12.1% +$1550)
			// TODO: currency conversion and asset total value
			let cur_price = parseFloat(priceText)
			let buy_amt = parseFloat(m[1])
			let buy_price = parseFloat(m[2]).toFixed(2)
			let currency = m[3] ? m[3] : ''
			let diff_price = (cur_price - buy_price).toFixed(2)
			let diff_perc = ((cur_price - buy_price) / buy_price * 100).toFixed(1)
			let diff_amt = ((buy_amt * cur_price) - (buy_amt * buy_price)).toFixed(2)
			// console.log([cur_price, buy_amt, buy_price, currency, diff_price, diff_perc, diff_amt])
			assetLabel.innerText = buy_amt + ' @ ' + buy_price + (currency ? ' ' + currency : '') + ' (' + (diff_price >= 0 ? '+' : '') + diff_price + ' ' + (diff_perc >= 0 ? '+' : '') + diff_perc + '% ' + (diff_amt >= 0 ? '+' : '') + diff_amt + ')'
		}
	}
}

// wait until stop mutating
function waitTilStopMutating(time = 1000) {
	// console.log('[koyfin-enhance] waitTilStopMutating(', time, ')')
	return new Promise(resolve => {
		(async () => {
			let timer
			const observer = new MutationObserver(mutations => {
				// console.log('[koyfin-enhance] mutations:', mutations)
				if (timer) clearTimeout(timer)
				timer = setTimeout(() => {
					// console.log('[koyfin-enhance] Mutations stopped')
					observer.disconnect()
					resolve()
				}, time)
			});
			timer = setTimeout(() => {
				// console.log('[koyfin-enhance] Mutations stopped')
				observer.disconnect()
				resolve()
			}, time)
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		})()
	})
}