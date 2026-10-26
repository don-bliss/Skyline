/* =========================================================
   SKYLINE LIVE CRYPTO MARKET
   ========================================================= */

(() => {

    "use strict";


    const cryptoList =
        document.getElementById("cryptoList");

    const cryptoUpdated =
        document.getElementById("cryptoUpdated");

    const cryptoLiveStatus =
        document.getElementById(
            "cryptoLiveStatus"
        );

    const cryptoRefresh =
        document.getElementById(
            "cryptoRefresh"
        );

    const marketTabs =
        document.querySelectorAll(
            ".crypto-tab"
        );

    const typeTabs =
        document.querySelectorAll(
            ".crypto-type-tab"
        );


    /*
        Only activate this module on pages
        that actually contain the market panel.
    */

    if (!cryptoList) return;


    const API_URL =
        "https://api.coingecko.com/api/v3/coins/markets" +
        "?vs_currency=usd" +
        "&order=market_cap_desc" +
        "&per_page=50" +
        "&page=1" +
        "&sparkline=false" +
        "&price_change_percentage=24h";


    let marketData = [];

    let activeMarketTab = "hot";

    let activeType = "spot";


    let favorites = [];


    try {

        favorites =
            JSON.parse(
                localStorage.getItem(
                    "skylineCryptoFavorites"
                )
            ) || [];

    } catch {

        favorites = [];

    }


    /* =====================================================
       FETCH MARKET DATA
    ===================================================== */

    async function loadCryptoMarket() {

        cryptoLiveStatus.textContent =
            "● Updating...";


        try {

            const response =
                await fetch(API_URL, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                });


            if (!response.ok) {

                throw new Error(
                    `Market request failed: ${response.status}`
                );

            }


            const data =
                await response.json();


            if (!Array.isArray(data)) {

                throw new Error(
                    "Invalid market response."
                );

            }


            marketData = data;


            cryptoLiveStatus.textContent =
                "● Live";


            cryptoLiveStatus.style.color =
                "var(--success-color)";


            const now =
                new Date();


            cryptoUpdated.textContent =
                `Updated ${now.toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )}`;


            renderCryptoMarket();


        } catch (error) {

            console.error(
                "SkyLine crypto market:",
                error
            );


            cryptoLiveStatus.textContent =
                "● Offline";


            cryptoLiveStatus.style.color =
                "var(--danger-color)";


            cryptoList.innerHTML = `

                <div class="crypto-error">

                    <strong>
                        Market data unavailable
                    </strong>

                    <span>
                        Check your connection and try again.
                    </span>

                </div>

            `;

        }

    }


    /* =====================================================
       SORT / FILTER
    ===================================================== */

    function getVisibleCoins() {

        const coins =
            [...marketData];


        switch (activeMarketTab) {

            case "favorites": {

    const favoriteCoins = coins.filter(
        coin =>
            favorites.includes(coin.id)
    );

    return favoriteCoins.length
        ? favoriteCoins
        : coins.slice(0, 12);
}


            case "gainers":

                return coins
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            (
                                b.price_change_percentage_24h || 0
                            ) -
                            (
                                a.price_change_percentage_24h || 0
                            )
                    )
                    .slice(0, 10);


            case "losers":

                return coins
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            (
                                a.price_change_percentage_24h || 0
                            ) -
                            (
                                b.price_change_percentage_24h || 0
                            )
                    )
                    .slice(0, 10);


            case "new":

                /*
                    CoinGecko's market endpoint doesn't
                    provide a "newly listed" flag here.

                    For the frontend prototype we show
                    a rotating set of lower-ranked live
                    assets rather than falsely labeling
                    them as newly listed.
                */

                return coins
                    .slice(20, 30);


            case "hot":

            default:

                return coins.slice(0, 12,);

        }

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderCryptoMarket() {

        if (!marketData.length) {

            cryptoList.innerHTML = `

                <div class="crypto-empty">
                    No market data available.
                </div>

            `;

            return;

        }


        const coins =
            getVisibleCoins();


        if (!coins.length) {

            cryptoList.innerHTML = `

                <div class="crypto-empty">

                    ${
                        activeMarketTab ===
                        "favorites"

                            ? "No favorite coins yet. Tap ☆ to add one."

                            : "No market data available."
                    }

                </div>

            `;

            return;

        }


        cryptoList.innerHTML = "";


        coins.forEach(
            coin => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "crypto-row";


                const change =
                    Number(
                        coin.price_change_percentage_24h || 0
                    );


                const positive =
                    change >= 0;


                const favorite =
                    favorites.includes(
                        coin.id
                    );


                row.innerHTML = `

                    <div class="crypto-left">

                        <button
                            type="button"
                            class="crypto-star ${
                                favorite
                                    ? "favorite"
                                    : ""
                            }"
                            data-coin="${coin.id}"
                            title="Favorite">

                            ${
                                favorite
                                    ? "★"
                                    : "☆"
                            }

                        </button>


                        <img
                            class="crypto-logo"
                            src="${coin.image}"
                            alt="${coin.name}">


                        <div class="crypto-name">

                            <span class="crypto-pair">

                                ${coin.symbol.toUpperCase()}

                                <small>
                                    / USD
                                </small>

                            </span>


                            <span class="crypto-volume">

                                ${formatMarketValue(
                                    coin.total_volume
                                )}

                            </span>

                        </div>

                    </div>


                    <div class="crypto-right">

                        <span class="crypto-price">

                            ${formatPrice(
                                coin.current_price
                            )}

                        </span>


                        <span
                            class="crypto-change ${
                                positive
                                    ? "positive"
                                    : "negative"
                            }">

                            ${
                                positive
                                    ? "+"
                                    : ""
                            }${change.toFixed(2)}%

                        </span>
                        <div class="crypto-trade-buttons">
                            <button type="button" class="crypto-buy" data-trade="buy" data-coin="${coin.symbol.toUpperCase()}" data-price="${coin.current_price}">Buy</button>
                            <button type="button" class="crypto-sell" data-trade="sell" data-coin="${coin.symbol.toUpperCase()}" data-price="${coin.current_price}">Sell</button>
                        </div>

                    </div>

                `;


                cryptoList.appendChild(
                    row
                );

            }
        );


        bindFavoriteButtons();

    }


    /* =====================================================
       BUY / SELL PREPARATION
       ===================================================== */
    document.addEventListener("click", function(event) {
        const button = event.target.closest("[data-trade]");
        if (!button) return;
        const side = button.dataset.trade === "buy" ? "Buy" : "Sell";
        const coin = button.dataset.coin || "Asset";
        const price = Number(button.dataset.price || 0);
        const amount = window.prompt(`${side} ${coin}\nLive price: ${price.toLocaleString("en-US")} USD\n\nEnter amount in USD for this demo:`);
        if (amount === null) return;
        alert(`${side} order prepared for ${coin}.\nAmount: $${amount}\n\nNo real trade was executed. The secure trading backend will handle orders in production.`);
    });


    /* =====================================================
       FAVORITES
    ===================================================== */

    function bindFavoriteButtons() {

        document
            .querySelectorAll(
                ".crypto-star"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.coin;


                        if (
                            favorites.includes(
                                id
                            )
                        ) {

                            favorites =
                                favorites.filter(
                                    item =>
                                        item !== id
                                );

                        } else {

                            favorites.push(
                                id
                            );

                        }


                        localStorage.setItem(
                            "skylineCryptoFavorites",
                            JSON.stringify(
                                favorites
                            )
                        );


                        renderCryptoMarket();

                    }
                );

            });

    }


    /* =====================================================
       MAIN TABS
    ===================================================== */

    marketTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                function () {

                    activeMarketTab =
                        this.dataset.marketTab;


                    marketTabs.forEach(
                        item =>
                            item.classList.toggle(
                                "active",
                                item === this
                            )
                    );


                    renderCryptoMarket();

                }
            );

        }
    );


    /* =====================================================
       MARKET TYPE
    ===================================================== */

    typeTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                function () {

                    activeType =
                        this.dataset.type;


                    typeTabs.forEach(
                        item =>
                            item.classList.toggle(
                                "active",
                                item === this
                            )
                    );


                    if (
                        activeType !==
                        "spot"
                    ) {

                        cryptoList.innerHTML = `

                            <div class="crypto-empty">

                                <strong>
                                    ${activeType.toUpperCase()}
                                </strong>

                                <br>

                                <span>
                                    This market module will be
                                    connected to the trading
                                    backend in a later phase.
                                </span>

                            </div>

                        `;

                    } else {

                        renderCryptoMarket();

                    }

                }
            );

        }
    );


    /* =====================================================
       REFRESH
    ===================================================== */

    if (cryptoRefresh) {

        cryptoRefresh.addEventListener(
            "click",
            () => {

                loadCryptoMarket();

            }
        );

    }


    /* =====================================================
       FORMATTING
    ===================================================== */

    function formatPrice(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "—";

        }


        if (value >= 1000) {

            return value.toLocaleString(
                "en-US",
                {
                    maximumFractionDigits: 2
                }
            );

        }


        if (value >= 1) {

            return value.toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4
                }
            );

        }


        return value.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 4,
                maximumFractionDigits: 8
            }
        );

    }


    function formatMarketValue(
        value
    ) {

        if (!value) return "—";


        if (value >= 1e9) {

            return (
                (value / 1e9)
                    .toFixed(2) +
                "B volume"
            );

        }


        if (value >= 1e6) {

            return (
                (value / 1e6)
                    .toFixed(2) +
                "M volume"
            );

        }


        if (value >= 1e3) {

            return (
                (value / 1e3)
                    .toFixed(2) +
                "K volume"
            );

        }


        return (
            value.toFixed(0) +
            " volume"
        );

    }


    /* =====================================================
       INITIAL LOAD + REFRESH
    ===================================================== */

    loadCryptoMarket();


    /*
        Public API → light prototype use.
        Refresh every 60 seconds.
    */

    setInterval(
        loadCryptoMarket,
        60 * 1000
    );

})();