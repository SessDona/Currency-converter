// ==========================
// STAGE 1: Current pair rate
// ==========================

const pairFromCode = document.getElementById("pair-from-code");
const pairToCode = document.getElementById("pair-to-code");
const pairFromFlag = document.getElementById("pair-from-flag");
const pairToFlag = document.getElementById("pair-to-flag");
const pairSwapBtn = document.getElementById("pair-swap-btn");
const pairRateLine = document.getElementById("pair-rate-line");
const pairRateTime = document.getElementById("pair-rate-time");

async function updatePairRate() {

  const from = pairFromCode.textContent;
  const to = pairToCode.textContent;

  const url = `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`;

  try {

    const response = await fetch(url);
    const data = await response.json();

    const rate = data.rates[to];

    pairRateLine.textContent = `1 ${from} = ${rate.toFixed(5)} ${to}`;

    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, "0");
    const minutes = String(now.getUTCMinutes()).padStart(2, "0");

    pairRateTime.textContent = `Mid-market exchange rate at ${hours}:${minutes} UTC`;

  } catch (error) {

    console.error("Failed to fetch pair rate:", error);
    pairRateLine.textContent = "Unable to load rate";

  }

}

updatePairRate();

// ==========================
// STAGE 2: Historical chart
// ==========================

const chartCanvas = document.getElementById("pair-chart");
let currentRange = "1M";
let priceChart = null;

function getDateRange(range) {

  const end = new Date();
  const start = new Date();

  if (range === "48H") {
    start.setDate(end.getDate() - 2);
  } else if (range === "1W") {
    start.setDate(end.getDate() - 7);
  } else if (range === "1M") {
    start.setMonth(end.getMonth() - 1);
  } else if (range === "12M") {
    start.setFullYear(end.getFullYear() - 1);
  }

  const formatDate = (d) => d.toISOString().split("T")[0];

  return { start: formatDate(start), end: formatDate(end) };

}

async function updateChart() {

  const from = pairFromCode.textContent;
  const to = pairToCode.textContent;

  const { start, end } = getDateRange(currentRange);

  const url = `https://api.frankfurter.dev/v1/${start}..${end}?base=${from}&symbols=${to}`;

  try {

    const response = await fetch(url);
    const data = await response.json();

    const labels = Object.keys(data.rates);
    const values = labels.map(date => data.rates[date][to]);

    if (priceChart) {
      priceChart.destroy();
    }

    priceChart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          data: values,
          borderColor: "#16A34A",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { display: false },
          y: { display: true }
        }
      }
    });

  } catch (error) {

    console.error("Failed to fetch historical data:", error);

  }

}

updateChart();
pairSwapBtn.style.cursor = "pointer";

pairSwapBtn.addEventListener("click", () => {
  const tempCode = pairFromCode.textContent;
  const tempFlag = pairFromFlag.src;

  pairFromCode.textContent = pairToCode.textContent;
  pairFromFlag.src = pairToFlag.src;

  pairToCode.textContent = tempCode;
  pairToFlag.src = tempFlag;

  updatePairRate();
  updateChart();
});

// ==========================
// STAGE 2.5: Currency dropdowns
// ==========================
const currencyToCountry = {
  AUD: "au", BGN: "bg", BRL: "br", CAD: "ca", CHF: "ch", CNY: "cn",
  CZK: "cz", DKK: "dk", EUR: "eu", GBP: "gb", HKD: "hk", HUF: "hu",
  IDR: "id", ILS: "il", INR: "in", ISK: "is", JPY: "jp", KRW: "kr",
  MXN: "mx", MYR: "my", NOK: "no", NZD: "nz", PHP: "ph", PLN: "pl",
  RON: "ro", SEK: "se", SGD: "sg", THB: "th", TRY: "tr", USD: "us",
  ZAR: "za"
};

const pairFromMenu = document.getElementById("pair-from-menu");
const pairToMenu = document.getElementById("pair-to-menu");

async function loadCurrencyList() {
  try {
    const response = await fetch("https://api.frankfurter.dev/v1/currencies");
    const data = await response.json();
    const codes = Object.keys(data);

    buildMenu(pairFromMenu, codes, "from");
    buildMenu(pairToMenu, codes, "to");
  } catch (error) {
    console.error("Failed to fetch currency list:", error);
  }
}

function buildMenu(menuEl, codes, side) {
  menuEl.innerHTML = "";
  codes.forEach(code => {
    const country = currencyToCountry[code] || "un";
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="https://flagcdn.com/w40/${country}.png" alt="${code} flag" class="currency-flag">
      <span>${code}</span>
    `;
    li.addEventListener("click", () => selectCurrency(side, code, country));
    menuEl.appendChild(li);
  });
}

function selectCurrency(side, code, country) {
  if (side === "from") {
    pairFromCode.textContent = code;
    pairFromFlag.src = `https://flagcdn.com/w40/${country}.png`;
    pairFromMenu.classList.remove("currency-menu--open");
    updatePairRate();
    updateChart();
  } else if (side === "to") {
    pairToCode.textContent = code;
    pairToFlag.src = `https://flagcdn.com/w40/${country}.png`;
    pairToMenu.classList.remove("currency-menu--open");
    updatePairRate();
    updateChart();
  } else if (side === "listbase") {
    listBaseCode.textContent = code;
    listBaseFlag.src = `https://flagcdn.com/w40/${country}.png`;
    listBaseMenu.classList.remove("currency-menu--open");
    updateListResults();
  }
}

document.getElementById("pair-from-box").addEventListener("click", (e) => {
  e.stopPropagation();
  pairToMenu.classList.remove("currency-menu--open");
  pairFromMenu.classList.toggle("currency-menu--open");
});

document.getElementById("pair-to-box").addEventListener("click", (e) => {
  e.stopPropagation();
  pairFromMenu.classList.remove("currency-menu--open");
  pairToMenu.classList.toggle("currency-menu--open");
});

document.addEventListener("click", () => {
  pairFromMenu.classList.remove("currency-menu--open");
  pairToMenu.classList.remove("currency-menu--open");
});

loadCurrencyList();

const rangeButtons = document.querySelectorAll(".range-btn");

rangeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    rangeButtons.forEach(b => b.classList.remove("range-btn--active"));
    btn.classList.add("range-btn--active");
    currentRange = btn.dataset.range;
    updateChart();
  });
});
// ==========================
// STAGE 3: List card results
// ==========================
const listAmountInput = document.getElementById("list-amount");
const listBaseCode = document.getElementById("list-base-code");
const listBaseFlag = document.getElementById("list-base-flag");
const listCardResults = document.getElementById("list-card-results");
const listBaseMenu = document.getElementById("list-base-menu");


const listTargetCurrencies = [
  { code: "EUR", flag: "eu" },
  { code: "USD", flag: "us" },
  { code: "INR", flag: "in" },
  { code: "CAD", flag: "ca" },
  { code: "AUD", flag: "au" },
  { code: "CHF", flag: "ch" },
  { code: "MXN", flag: "mx" }
];

async function updateListResults() {
  const base = listBaseCode.textContent;
  const amount = parseFloat(listAmountInput.value) || 0;
  const symbols = listTargetCurrencies.map(c => c.code).join(",");
  const url = `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${symbols}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    listCardResults.innerHTML = "";

    listTargetCurrencies.forEach(({ code, flag }) => {
      const rate = data.rates[code];
      if (rate === undefined) return;

      const converted = (rate * amount).toFixed(5);

      const li = document.createElement("li");
      li.innerHTML = `
        <span>${converted}</span>
        <span style="display:flex; align-items:center; gap:8px;">
          <img src="https://flagcdn.com/w40/${flag}.png" alt="${code} flag" class="currency-flag">
          ${code}
        </span>
      `;
      listCardResults.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to fetch list results:", error);
  }
}

listAmountInput.addEventListener("input", updateListResults);
updateListResults();

buildMenu(listBaseMenu, Object.keys(currencyToCountry), "listbase");

document.getElementById("list-base-box").addEventListener("click", (e) => {
  e.stopPropagation();
  pairFromMenu.classList.remove("currency-menu--open");
  pairToMenu.classList.remove("currency-menu--open");
  listBaseMenu.classList.toggle("currency-menu--open");
});

document.addEventListener("click", () => {
  listBaseMenu.classList.remove("currency-menu--open");
});
