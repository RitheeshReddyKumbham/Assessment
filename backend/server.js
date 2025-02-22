const express = require("express");
const cors = require("cors");


const app = express();
const port = 3001;
app.use(cors());


const fetchData = async () => {
  const response = await fetch("https://s3.amazonaws.com/roxiler.com/product_transaction.json");
  const data = await response.json();

};

app.get("/sales", async (req, res) => {
  try {
    const { month = 1, search_q = "", page = 1 } = req.query;
    const data = await fetchData();
    
    const filteredData = data.filter((item) => {
      const itemMonth = new Date(item.dateOfSale).getMonth() + 1;
      return (
        itemMonth == month &&
        (item.title.includes(search_q) ||
         item.price.toString().includes(search_q) ||
         item.description.includes(search_q))
      );
    });
    
    const paginatedData = filteredData.slice((page - 1) * 10, page * 10);
    res.json(paginatedData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/statistics", async (req, res) => {
  try {
    const { month = 1 } = req.query;
    const data = await fetchData();
    
    const filteredData = data.filter(item => new Date(item.dateOfSale).getMonth() + 1 == month);
    
    const sales = filteredData.reduce((sum, item) => item.sold ? sum + item.price : sum, 0);
    const soldItems = filteredData.filter(item => item.sold).length;
    const unSoldItems = filteredData.length - soldItems;
    
    res.json({ sales, soldItems, unSoldItems });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/items", async (req, res) => {
  try {
    const { month } = req.query;
    const data = await fetchData();
    const filteredData = data.filter(item => new Date(item.dateOfSale).getMonth() + 1 == month);
    
    const priceRanges = {
      "0-100": 0, "101-200": 0, "201-300": 0, "301-400": 0,
      "401-500": 0, "501-600": 0, "601-700": 0, "701-800": 0,
      "801-900": 0, "901-above": 0
    };
    
    filteredData.forEach(item => {
      const price = item.price;
      if (price <= 100) priceRanges["0-100"]++;
      else if (price <= 200) priceRanges["101-200"]++;
      else if (price <= 300) priceRanges["201-300"]++;
      else if (price <= 400) priceRanges["301-400"]++;
      else if (price <= 500) priceRanges["401-500"]++;
      else if (price <= 600) priceRanges["501-600"]++;
      else if (price <= 700) priceRanges["601-700"]++;
      else if (price <= 800) priceRanges["701-800"]++;
      else if (price <= 900) priceRanges["801-900"]++;
      else priceRanges["901-above"]++;
    });
    
    res.json(priceRanges);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const { month = 1 } = req.query;
    const data = await fetchData();
    const filteredData = data.filter(item => new Date(item.dateOfSale).getMonth() + 1 == month);
    
    const categoryCount = {};
    filteredData.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });
    
    res.json(categoryCount);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const monthsData = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
};

app.get("/all-statistics", async (req, res) => {
  try {
    const { month = 3 } = req.query;
    const [statistics, itemPriceRange, categories] = await Promise.all([
      fetchData().then(data => data.filter(item => new Date(item.dateOfSale).getMonth() + 1 == month)),
      fetchData().then(data => data.filter(item => new Date(item.dateOfSale).getMonth() + 1 == month)),
      fetchData().then(data => data.filter(item => new Date(item.dateOfSale).getMonth() + 1 == month))
    ]);
    
    res.json({
      monthName: monthsData[month],
      statistics,
      itemPriceRange,
      categories
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
