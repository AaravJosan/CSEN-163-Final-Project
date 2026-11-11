# Cellar Deals

A web app for SCU students to find and reserve discounted food from the Cellar before it expires. The goal is less waste from unsold food and cheaper meals for students. CSEN-163 final project.

**Status:** design phase. Wireframes and user research are in progress; no app code yet.

## How it works

1. Log in with SSO.
2. Browse the homepage: search, filter by type or cost, sort by name or cost. Near-expiry deals are called out.
3. Open an item, add it to the cart.
4. Buy now with dining points. If the balance is too low, add funds and retry.
5. Show the order code at the Cellar counter to pick it up.

Cellar staff use the same app to add items, set expiry dates and discounts, and move orders from preparing to ready to picked up.

## Screens

| Screen | Purpose |
| --- | --- |
| Login | SSO sign-in |
| Homepage | Search, filters, item grid, expiring-soon deals |
| Product page | Image, price, description, add to cart |
| Cart | Items, quantities, total in points, Buy now |
| Order confirmation | Order code, pickup window, countdown |
| My orders | Live order status, cancel, buy again |
| Profile | Student details, points balance |
| Staff: Inventory | Stock and expiry for every item, near-expiry flagged |
| Staff: Item editor | Price, stock, expiry, discount (percent off, free, BOGO) |
| Staff: Incoming orders | Orders by pickup time, status updates, lookup by code |

## Order rules

- Stock is held when the student taps Buy now; checkout blocks items that sold out or expired.
- Orders can be cancelled until they're Ready; points and stock are returned.
- Orders not picked up by the end of the pickup window go back on sale and the points are refunded.

## Features

**MVP:** near-expiry discounts, stock shown per item, pickup orders, add funds, expiry tracking for staff.

**Next:** BOGO and end-of-quarter deals, buy again, live inventory, pickup countdowns, live order status, personalized alerts.

**Research (emerging technology):** AI demand prediction from past sales to forecast surplus food, and IoT sensors that count items on the shelf.

## Tech

- React, HTML, CSS, JavaScript for the interface
- Fake backend: sample inventory in JSON, orders and points balances in the browser (localStorage), all behind one API module so it can be swapped for Firebase or Supabase later
- Figma for wireframes and prototypes
