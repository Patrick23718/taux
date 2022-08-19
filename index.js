const cheerio = require("cheerio");
const XLSX = require("xlsx");
const axios = require("axios");
const express = require("express");
const multer = require("multer");
const fs = require("fs");

const app = express();

const rates_data = [];
let route = "";

const url = "https://www.beac.int/";

let day = "",
  month = "",
  year = "";

async function getvalue() {
  try {
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    const rates = $(".taux_de_change");
    const dates = $(".sidebar");

    //console.log(rates)
    dates.each(function () {
      date = $(this)
        .find(".date_source_taux")
        .text()
        .split(".")[0]
        .split(":")[1]
        .trim();
      //   console.log(date);
      [day, month, year] = date.split("/");
      //   console.log(day + "" + month + "" + year);
      const dt = new Date(+year, +month - 1, +day).toLocaleDateString("fr");
      //   console.log(dt);
      const isDate = dt === new Date().toLocaleDateString("fr");
      rates_data.push({ date, isDate });
    });

    rates.each(function () {
      device = $(this).find("#left").text().trim();

      achat = $(this).find("#middle").text().trim();

      vente = $(this).find("#right").text().trim();

      //console.error({device, achat, vente, count})

      rates_data.push({ device, achat, vente });
    });

    route = `ratesOf ${day}-${month}-${year}`;

    const path = "uploads/" + route + ".xlsx";

    try {
      fs.unlinkSync(path);
      console.error("delete");
    } catch (err) {
      console.error(err);
    }

    const workSheet = XLSX.utils.json_to_sheet(rates_data);
    const workBook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workBook, workSheet, "rates");
    // Generate buffer
    XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

    // Binary string
    XLSX.write(workBook, { bookType: "xlsx", type: "binary" });

    XLSX.writeFile(workBook, "uploads/" + route + ".xlsx");

    // console.log(rates_data);
    return rates_data;
  } catch (error) {
    console.error(error);
  }
}
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET");
    return res.status(200).json({});
  }
  next();
});
app.use("/uploads", express.static("uploads"));

app.get("/", async function (req, res) {
  const rate = await getvalue();
  const file = `${__dirname}/uploads/${route}.xlsx`;
  res.download(file);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("server listening on: 3000");
});

// getvalue();
