const products = [
  {
    id: "turkey-avocado-sandwich",
    name: "Turkey Avocado Sandwich",
    category: "Sandwiches",
    description: "Roasted turkey, avocado, and greens on sourdough.",
    image:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85",
    originalPrice: 9.5,
    discountedPrice: 5.5,
    stock: 4,
    bestBy: "Nov 12, 2026",
    expiringSoon: true,
  },
  {
    id: "harvest-grain-salad",
    name: "Harvest Grain Salad",
    category: "Salads",
    description: "Farro, roasted vegetables, leafy greens, and lemon dressing.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85",
    originalPrice: 8,
    discountedPrice: 4.75,
    stock: 3,
    bestBy: "Nov 12, 2026",
    expiringSoon: true,
  },
  {
    id: "blueberry-yogurt-parfait",
    name: "Blueberry Yogurt Parfait",
    category: "Snacks",
    description: "Creamy yogurt layered with blueberries and crunchy granola.",
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85",
    originalPrice: 5,
    discountedPrice: 3,
    stock: 6,
    bestBy: "Nov 13, 2026",
    expiringSoon: true,
  },
  {
    id: "caprese-panini",
    name: "Caprese Panini",
    category: "Sandwiches",
    description: "Mozzarella, tomato, and basil pesto on toasted ciabatta.",
    image:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85",
    originalPrice: 8.5,
    discountedPrice: 6,
    stock: 5,
    bestBy: "Nov 14, 2026",
    expiringSoon: false,
  },
  {
    id: "garden-veggie-wrap",
    name: "Garden Veggie Wrap",
    category: "Sandwiches",
    description: "Hummus, crisp vegetables, and spinach in a soft wrap.",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=85",
    originalPrice: 7.5,
    discountedPrice: 5.25,
    stock: 7,
    bestBy: "Nov 15, 2026",
    expiringSoon: false,
  },
  {
    id: "classic-butter-croissant",
    name: "Classic Butter Croissant",
    category: "Bakery",
    description: "A flaky, buttery croissant baked fresh this morning.",
    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85",
    originalPrice: 4,
    discountedPrice: 2.5,
    stock: 8,
    bestBy: "Nov 14, 2026",
    expiringSoon: false,
  },
  {
    id: "seasonal-fruit-cup",
    name: "Seasonal Fruit Cup",
    category: "Snacks",
    description: "A refreshing cup of freshly cut seasonal fruit.",
    image:
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=85",
    originalPrice: 5.5,
    discountedPrice: 3.75,
    stock: 5,
    bestBy: "Nov 15, 2026",
    expiringSoon: false,
  },
  {
    id: "iced-oat-latte",
    name: "Iced Oat Latte",
    category: "Drinks",
    description: "Chilled espresso with smooth oat milk over ice.",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85",
    originalPrice: 6,
    discountedPrice: 4.5,
    stock: 9,
    bestBy: "Nov 13, 2026",
    expiringSoon: false,
  },
];

export const productCategories = [
  "All categories",
  ...new Set(products.map((product) => product.category)),
];

export default products;
