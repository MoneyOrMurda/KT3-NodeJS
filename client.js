const soap = require("soap");
const readline = require("readline");

const serverUrl = "http://localhost:5050/cbrf";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const getDayOfWeek = (dateString) => {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const date = new Date(dateString);
  const dayIndex = date.getDay();
  return daysOfWeek[dayIndex];
};

const printCurrencyData = (currencyData, date) => {
  if (currencyData && currencyData.length > 0) {
    console.log(`Currency data on ${date} (${getDayOfWeek(date)}):`);
    currencyData.forEach(valute => {
      const currencyCode = valute.VchCode || valute.Vcode;
      console.log(`Currency Name: ${valute.Vname}, Code: ${currencyCode}, Nominal: ${valute.Vnom}, Exchange Rate: ${valute.Vcurs} to RUB`);
    });
  } else {
    console.log("Data is absent.");
  }
};

const createSoapClient = (callback) => {
  soap.createClient(`${serverUrl}?wsdl`, (err, client) => {
    if (err) {
      console.error(err);
      return;
    }
    callback(client);
  });
};

const getCursOnDateXML = (currentDate, currencyCodes) => {
  createSoapClient(client => {
    client.GetCursOnDateXML({ On_date: currentDate }, (err, result) => {
      if (err) {
        console.error(err);
        return;
      }
      const valuteCursOnDate = result.GetCursOnDateXMLResult.ValuteData.ValuteCursOnDate;
      const filteredCurrencyData = currencyCodes ? valuteCursOnDate.filter(valute => currencyCodes.includes(valute.VchCode)) : valuteCursOnDate;
      printCurrencyData(filteredCurrencyData, currentDate);
    });
  });
};

const getCursDynamicXML = (params, fromDate, toDate, currencyCode) => {
  createSoapClient(client => {
    client.GetCursDynamicXML(params, (err, result) => {
      if (err) {
        console.error(err);
        return;
      }
      const valuteData = result.GetCursDynamicXMLResult.ValuteData;
      const valuteCursDynamic = Array.isArray(valuteData.ValuteCursDynamic) ? valuteData.ValuteCursDynamic : [valuteData.ValuteCursDynamic];
      const filteredCurrencyData = currencyCode ? valuteCursDynamic.filter(valute => valute.Vcode === currencyCode) : valuteCursDynamic;
      printCurrencyData(filteredCurrencyData, fromDate);
    });
  });
};

rl.question("\nChoose action:\n\n1. Get currency data for a specific date\n\n2. Get currency dynamics for a specified date range\n\nEnter the action number (1 or 2): ", (choice) => {
  if (choice === "1") {
    rl.question("\nEnter date (YYYY-MM-DD): ", (currentDate) => {
      rl.question("\nEnter currency codes (Separated by comma, or press Enter for all): ", (input) => {
        const currencyCodesForOnDate = input.trim() ? input.trim().split(",") : [];
        getCursOnDateXML(currentDate, currencyCodesForOnDate);
        rl.close();
      });
    });
  } else if (choice === "2") {
    rl.question("\nEnter start date (YYYY-MM-DD): ", (fromDate) => {
      rl.question("\nEnter end date (YYYY-MM-DD): ", (toDate) => {
        rl.question("\nEnter currency code for dynamic data (Or press Enter for all): ", (currencyCodeForDynamic) => {
          const dynamicParams = {
            FromDate: `${fromDate}T10:30:00`,
            ToDate: `${toDate}T10:30:00`,
            ValutaCode: currencyCodeForDynamic.trim() || "R01239",
          };

          getCursDynamicXML(dynamicParams, fromDate, toDate, currencyCodeForDynamic.trim());
          rl.close();
        });
      });
    });
  } else {
    console.log("Error: Invalid choice... Please enter 1 or 2.");
    rl.close();
  }
});
