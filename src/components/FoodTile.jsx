import drinkIcon from "../assets/icons/food-drink.svg";
import fruitIcon from "../assets/icons/food-fruit.svg";
import mealIcon from "../assets/icons/food-meal.svg";
import saladIcon from "../assets/icons/food-salad.svg";

const icons = {
  Meal: mealIcon,
  Drink: drinkIcon,
  Fruit: fruitIcon,
  Salad: saladIcon,
};

// Colored tile with a food icon, used in place of product photos.
export default function FoodTile({ kind = "Meal", className = "", label }) {
  const tileKind = icons[kind] ? kind : "Meal";
  return (
    <div
      className={`food-tile food-tile--${tileKind.toLowerCase()} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <img src={icons[tileKind]} alt="" width="56" height="56" />
    </div>
  );
}
