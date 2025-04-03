let heading_str = 'Shares @ Avg Price', mwt, assets, prices

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
	update()
	setInterval(update, 2000) // MutationObserver was even more inefficient
}

function update() {
	if (!document.hasFocus()) return
	// don't use cache in case assets or rows are edited 
	prices = mwt.querySelectorAll('div[class*=cell-content-animated-price-update]')
	assets = mwt.querySelectorAll('div[class^=my-watchlist-table] div[class^=table-cell-user-data__tableCellUserData__label]')
	for (i = 0; i < assets.length; i++) {
		// console.log('i:', i, 'text: "' + assets[i].innerText + '"')
		let m = assets[i].innerText.match(new RegExp('^(\\d+) @ (\\d+.?(?:\\d+)?)(?: ([^( ]*))?'))
		if (m) {
			// console.log('m:', m)
			// 740 @ 3.38 CAD (+1.04 +12.1% +$1550)
			// TODO: currency conversion support
			let cur_price = parseFloat(prices[i].innerText)
			let buy_amt = parseFloat(m[1])
			let buy_price = parseFloat(m[2]).toFixed(2)
			let currency = m[3] ? m[3] : ''
			let diff_price = (cur_price - buy_price).toFixed(2)
			let diff_perc = ((cur_price - buy_price) / buy_price * 100).toFixed(1)
			let diff_amt = ((buy_amt * cur_price) - (buy_amt * buy_price)).toFixed(2)
			// console.log([cur_price, buy_amt, buy_price, currency, diff_price, diff_perc, diff_amt])
			assets[i].innerText = buy_amt + ' @ ' + buy_price + (currency ? ' ' + currency : '') + ' (' + (diff_price >= 0 ? '+' : '') + diff_price + ' ' + (diff_perc >= 0 ? '+' : '') + diff_perc + '% ' + (diff_amt >= 0 ? '+' : '') + diff_amt + ')'
		}
	}
}

// wait until stop mutating
function waitTilStopMutating(time = 1000) {
	console.log('[koyfin-enhance] waitTilStopMutating(', time, ')')
	return new Promise(resolve => {
		(async () => {
			let timer
			const observer = new MutationObserver(mutations => {
				// console.log('[koyfin-enhance] mutations:', mutations)
				if (timer) clearTimeout(timer)
				timer = setTimeout(() => {
					console.log('[koyfin-enhance] Mutations stopped')
					observer.disconnect()
					resolve()
				}, time)
			});
			timer = setTimeout(() => {
				console.log('[koyfin-enhance] Mutations stopped')
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