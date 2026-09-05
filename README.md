# UGALights Commerce Hub

Build a complete production-ready ecommerce platform for UGALights, replacing the existing WordPress website at www.ugalights.com.

IMPORTANT: This is a complete rebuild, not a redesign of WordPress. Do not use WordPress, PHP, WooCommerce, or a WordPress-style architecture.

Use the uploaded UGALights logo as the official brand reference. Preserve the existing UGALights identity while creating a much more modern, professional and high-converting ecommerce experience.

==================================================

1. TECHNOLOGY

==================================================

Build with:

- Next.js

- TypeScript

- React

- Tailwind CSS

- PostgreSQL/Supabase

- Prisma ORM where appropriate

- Secure authentication

- Server-side rendering

- Optimized image handling

- Clean API/server architecture

The application must be suitable for:

Lovable → GitHub → Linux VPS → Production

I will later export the project to GitHub, clone it onto my own VPS and run it in production.

Do not make the application dependent on Lovable after export.

Use environment variables for all secrets and external services.

Never expose database credentials, API keys or service-role keys in browser code.

==================================================

2. PERFORMANCE

==================================================

Performance is one of the main reasons for replacing WordPress.

The application must be lightweight and optimized for low CPU and memory usage.

Avoid:

- unnecessary JavaScript

- unnecessary libraries

- large client-side bundles

- excessive animations

- heavy UI components

- polling

- unnecessary database queries

- WordPress-like plugins

- unnecessary background processes

Prefer:

- server-side rendering

- static generation where appropriate

- caching

- pagination

- optimized database queries

- optimized images

- lazy loading

- minimal client components

The storefront should remain fast even with hundreds or thousands of products.

==================================================

3. UGALIGHTS BRAND

==================================================

Business:

UGALights

Website:

www.ugalights.com

Business:

An ecommerce shop selling lighting products, electrical accessories and related products in Uganda.

Use the uploaded logo as the official logo.

Brand colors:

Primary Electric Blue:

#0066FF

Deep Navy:

#071A4A

Warm Lighting Yellow:

#FFD400

UGALights Red:

#E60012

Light Blue:

#EAF3FF

Background:

#F8FAFC

White:

#FFFFFF

Primary Text:

#111827

Secondary Text:

#64748B

Border:

#E2E8F0

Success:

#16A34A

Use colors intelligently.

Electric Blue:

Primary actions, links, active states, buttons and ecommerce interactions.

Deep Navy:

Footer, selected dark sections and some strong promotional areas.

Warm Yellow:

Lighting-related highlights and small visual accents.

Red:

SALE badges, discounts and sale prices only.

Do NOT make the entire website blue, yellow and red.

The design should feel:

- modern

- bright

- trustworthy

- professional

- premium

- affordable

- African/Ugandan ecommerce

- strongly associated with lighting

Avoid generic SaaS styling on the customer website.

==================================================

4. CUSTOMER STOREFRONT

==================================================

Create:

/

Home

/shop

Shop

/category/[slug]

Category pages

/product/[slug]

Product details

/search

Search results

/cart

Cart

/checkout

Checkout

/order-confirmation

Order confirmation

/about

About

/contact

Contact

/faq

FAQ

/delivery

Delivery information

/terms

Terms

/privacy

Privacy

==================================================

5. HEADER

==================================================

Create a professional ecommerce header.

Desktop:

Logo

Home

Shop

Categories

About

Contact

Search

Account

Cart

Mobile:

Logo

Search

Cart

Menu

Make the header clean and compact.

Use the uploaded UGALights logo.

Do not distort the logo.

Make the header sticky only if it does not hurt performance.

==================================================

6. HOMEPAGE

==================================================

Create a high-quality ecommerce homepage.

Sections:

1. Announcement bar

2. Header

3. Hero section

4. Featured categories

5. Featured products

6. Best sellers

7. Promotional banner

8. Why choose UGALights

9. Popular products

10. Customer testimonials

11. WhatsApp CTA

12. Newsletter/customer signup

13. Footer

The homepage should be designed to sell products, not simply look attractive.

Hero:

Use strong lighting imagery.

Heading example:

"Light Up Your Space"

Description example:

"Quality lighting and electrical accessories for homes, offices and businesses."

Primary button:

"Shop Now"

Secondary button:

"Chat on WhatsApp"

These are editable from the admin.

==================================================

7. HOMEPAGE CMS

==================================================

This is extremely important.

The homepage must NOT have important content hard-coded into the frontend.

Create a database-driven homepage content system.

Admin must be able to change:

- Hero heading

- Hero description

- Hero image

- Hero button text

- Hero button link

- Announcement bar

- Promotional banners

- Category section title

- Featured product section title

- Best seller section title

- Why choose us title

- Why choose us content

- Testimonials

- WhatsApp CTA

- Newsletter text

- Footer text

Admin can:

- enable/disable sections

- reorder sections

- change images

- change text

- change buttons

Do not require code changes for normal homepage updates.

==================================================

8. PRODUCT SYSTEM

==================================================

Create a complete product management system.

Each product supports:

- Name

- Slug

- SKU

- Short description

- Full description

- Price

- Sale price

- Cost price

- Stock quantity

- Low-stock threshold

- Stock status

- Main image

- Product gallery

- Category

- Subcategory

- Brand

- Tags

- Specifications

- Weight

- Dimensions

- Featured status

- Bestseller status

- New arrival status

- Published/draft status

- SEO title

- SEO description

Products can have variations.

Examples:

LED Bulb:

9W

12W

15W

Each variation can have:

- SKU

- Price

- Sale price

- Stock

- Image

- Attributes

Possible attributes:

- Wattage

- Colour

- Size

- Voltage

- Finish

- Pack size

==================================================

9. PRODUCT CATEGORIES

==================================================

Create categories such as:

LED Bulbs

LED Panels

Flood Lights

Security Lights

Solar Lights

Decorative Lights

Indoor Lighting

Outdoor Lighting

Ceiling Lights

Wall Lights

LED Strip Lights

Electrical Accessories

Switches & Sockets

Cables

Extension Cables

Other Accessories

Admin must be able to:

- create categories

- edit categories

- delete categories

- reorder categories

- upload category images

- create subcategories

==================================================

10. SHOP PAGE

==================================================

Create a professional ecommerce shop.

Features:

- Search

- Category filter

- Price filter

- Brand filter

- Attribute filters

- Sorting

- Pagination

- Product cards

- Sale badges

- New badges

- Stock status

- Add to cart

- Quick view where useful

Sorting:

- Featured

- Newest

- Price low to high

- Price high to low

- Best selling

==================================================

11. PRODUCT PAGE

==================================================

Create a high-converting product page.

Show:

- Product gallery

- Product name

- SKU

- Price

- Sale price

- Discount

- Stock status

- Variation selector

- Quantity

- Add to Cart

- Buy Now

- WhatsApp enquiry

- Description

- Specifications

- Delivery information

- Related products

- Recently viewed products where appropriate

Use structured product data for SEO.

==================================================

12. CART

==================================================

Create a complete shopping cart.

Customer can:

- increase quantity

- decrease quantity

- remove product

- clear cart

- continue shopping

Display:

Subtotal

Delivery fee

Discount

Total

Cart should persist during the shopping session.

==================================================

13. CHECKOUT

==================================================

Make checkout simple and mobile friendly.

Collect:

Customer name

Phone

Email

Delivery location

Address

Order notes

Payment options initially:

Cash on Delivery

Mobile Money / Manual Payment

WhatsApp order

Design the payment architecture so Flutterwave can be added later without rebuilding checkout.

==================================================

14. WHATSAPP

==================================================

WhatsApp is important for UGALights.

Allow:

- Product enquiry

- Availability enquiry

- Order through WhatsApp

- General customer support

Product WhatsApp message should automatically contain:

Product name

Product URL

Selected variation

Quantity

Order WhatsApp message should contain:

Customer name

Phone

Products

Quantities

Total

Delivery location

WhatsApp number must be configurable from Admin Settings.

Add a floating WhatsApp button on the storefront.

==================================================

15. ADMIN DASHBOARD

==================================================

Create a completely separate secure admin dashboard.

URL:

/admin

Require authentication.

Admin layout:

Dashboard

Products

Categories

Orders

Customers

Inventory

Homepage

Website Content

Promotions

Coupons

Media

Settings

Users

Use a professional SaaS-style dashboard design here.

==================================================

16. ADMIN DASHBOARD

==================================================

Dashboard should show:

Total sales

Today's sales

Orders

Pending orders

Completed orders

Products

Low-stock products

Out-of-stock products

Recent orders

Recent customers

Add simple sales charts if useful, but do not create heavy charts that hurt performance.

==================================================

17. ADMIN PRODUCT MANAGEMENT

==================================================

Admin can:

Add product

Edit product

Delete product

Duplicate product

Publish/unpublish

Upload images

Manage gallery

Set price

Set sale price

Set stock

Create variations

Set categories

Set specifications

Mark featured

Mark bestseller

Mark new arrival

Use a clean product form.

Allow image upload and preview.

==================================================

18. ADMIN ORDER MANAGEMENT

==================================================

Admin can:

View orders

Search orders

Filter orders

Open order

View customer

View products

View quantities

View totals

Update order status

Update payment status

Update delivery status

Print order

Statuses:

Pending

Confirmed

Processing

Ready for Delivery

Out for Delivery

Completed

Cancelled

Payment:

Pending

Paid

Failed

COD

==================================================

19. INVENTORY

==================================================

Create inventory management.

Display:

Current stock

Low stock

Out of stock

Allow:

Stock increase

Stock decrease

Stock adjustment

Track inventory movements.

Show:

Date

Product

Quantity change

Reason

Admin user

==================================================

20. CUSTOMERS

==================================================

Admin can view customers.

Show:

Name

Phone

Email

Orders

Total spent

Last order

Customer status

Do not require customer accounts for normal checkout.

Guest checkout must work.

==================================================

21. PROMOTIONS

==================================================

Create promotions and coupons.

Support:

Percentage discount

Fixed discount

Product discount

Category discount

Coupon codes

Start date

End date

Usage limits

Minimum order value

==================================================

22. WEBSITE CONTENT

==================================================

Create a simple CMS.

Admin can edit:

About Us

Contact

FAQ

Delivery information

Terms

Privacy Policy

All content should be database-driven.

==================================================

23. STORE SETTINGS

==================================================

Admin settings:

Business name

Logo

Phone

WhatsApp

Email

Address

Currency

Delivery fee

Free delivery threshold

Minimum order

Opening hours

Facebook

Instagram

TikTok

Other social links

Footer text

Default currency:

UGX

==================================================

24. MEDIA LIBRARY

==================================================

Create a simple media library.

Admin can:

Upload images

View images

Delete images

Use images for products

Use images for homepage

Use images for categories

Optimize uploaded images where possible.

Do not unnecessarily store multiple huge copies of the same image.

==================================================

25. SEO

==================================================

Implement:

SEO titles

Meta descriptions

Clean URLs

Canonical URLs

Open Graph

Twitter/X metadata

Sitemap

Robots.txt

Product structured data

Organization structured data

Breadcrumb structured data

Examples:

/shop

/shop/led-bulbs

/product/12w-led-bulb

Do not use ugly query-heavy URLs when clean URLs are possible.

==================================================

26. DATABASE

==================================================

Create a proper relational database.

Minimum entities:

User

Admin

Role

Product

ProductVariant

Category

ProductImage

ProductSpecification

Customer

Order

OrderItem

Coupon

Promotion

HomepageSection

WebsiteContent

Setting

InventoryMovement

Media

Use proper relationships, indexes and constraints.

Do not store the entire ecommerce system in unstructured JSON.

==================================================

27. AUTHENTICATION AND SECURITY

==================================================

Implement secure admin authentication.

Protect:

/admin

/admin/*

/api/admin/*

Use:

- secure sessions

- password hashing

- authorization

- input validation

- server-side validation

- protected API routes

- secure image uploads

- rate limiting where appropriate

Create role support so additional administrators can be added later.

Roles:

Super Admin

Admin

Manager

Super Admin has full access.

==================================================

28. ADMIN USER MANAGEMENT

==================================================

Super Admin can:

Create admin

Edit admin

Disable admin

Change role

Reset password

Do not hard-code a production password.

Provide a secure initial setup process.

==================================================

29. CUSTOMER EXPERIENCE

==================================================

Prioritize mobile.

The website must work correctly at:

320px

375px

414px

768px

1024px

1440px+

No horizontal scrolling.

Buttons must be easy to tap.

Product images must remain clear.

Checkout must be very easy on a phone.

==================================================

30. DESIGN DETAILS

==================================================

Use:

Rounded but not excessive cards

Clean whitespace

Strong product photography

Clear prices

Large product images

Simple navigation

Modern typography

Subtle shadows

Small transitions

Avoid:

Excessive gradients

Glassmorphism everywhere

Neon colors

Huge animations

Crowded layouts

Generic template appearance

Excessive red

Excessive yellow

The customer website should feel like a serious ecommerce business.

==================================================

31. UGANDAN ECOMMERCE

==================================================

Optimize the experience for Uganda.

Use:

UGX currency

Phone numbers suitable for Uganda.

Delivery location should support Ugandan locations.

Make WhatsApp ordering prominent.

Do not force customers to create an account before checkout.

==================================================

32. SAMPLE PRODUCTS

==================================================

Create realistic demo products for development:

9W LED Bulb

12W LED Bulb

15W LED Bulb

LED Panel Light

LED Flood Light

Solar Security Light

Outdoor Wall Light

Ceiling Light

LED Strip Light

Extension Cable

Electrical Switch

Electrical Socket

Security Light

Decorative Light

Use realistic UGX pricing.

Use appropriate placeholder/product imagery until real product images are added.

==================================================

33. ADMIN PRODUCT IMPORT

==================================================

Add CSV product import/export.

Admin should be able to:

Export products

Import products

Update stock using CSV

Update prices using CSV

Provide a downloadable CSV template.

==================================================

34. ERROR HANDLING

==================================================

Create proper:

404 page

500 page

Empty states

Loading states

Error states

Form validation

Success notifications

Never show raw database errors to customers.

==================================================

35. CODE QUALITY

==================================================

Keep the project:

Modular

Clean

Maintainable

Well structured

Strongly typed

Production ready

Separate:

UI

Business logic

Database access

Authentication

API

Admin functionality

Avoid giant components.

Avoid duplicated code.

==================================================

36. DEPLOYMENT

==================================================

The final project must be deployable on a standard Linux VPS.

Provide:

.env.example

with variables clearly documented.

The project must support:

npm install

npm run build

npm start

Do not depend on a development server in production.

Do not require Lovable to run the finished application.

==================================================

37. FUTURE INTEGRATIONS

==================================================

Prepare clean integration points for:

Flutterwave

MTN Mobile Money

Airtel Money

Email

SMS

WhatsApp Business API

Google Analytics

Meta Pixel

Delivery tracking

Do not implement all of these now.

==================================================

38. IMPORTANT ADMIN PRINCIPLE

==================================================

The administrator must be able to operate the entire shop without editing source code.

For normal business operations, the admin must be able to:

Add products

Remove products

Change prices

Change stock

Create categories

Change homepage wording

Change homepage images

Change banners

Feature products

Create promotions

Manage orders

Manage customers

Change WhatsApp number

Change contact details

Change delivery charges

Edit website pages

Manage administrators

If something normally changes during ecommerce operations, provide an admin setting or management screen for it.

==================================================

39. FINAL USER FLOW

==================================================

Customer:

Visit website

↓

Browse products

↓

Search/filter

↓

Open product

↓

Select variation

↓

Add to cart

↓

Checkout

↓

Choose payment/order method

↓

Confirm order

↓

Receive order confirmation

↓

Optional WhatsApp communication

Admin:

Login

↓

Dashboard

↓

Manage products

↓

Manage stock

↓

Manage orders

↓

Manage homepage

↓

Manage website

↓

Manage promotions

↓

Manage settings

==================================================

40. FINAL REQUIREMENT

==================================================

Do NOT just create a beautiful frontend mockup.

Build the actual working ecommerce application with:

- working database

- working authentication

- working product management

- working categories

- working cart

- working checkout

- working orders

- working inventory

- working homepage CMS

- working website CMS

- working admin dashboard

- working image management

- working search

- working filters

- working SEO structure

Everything important must be connected to the database.

Use the uploaded UGALights logo throughout the design.

The finished result should look and feel like a professionally built ecommerce store, while remaining lightweight enough to run efficiently on my own VPS.

Start by creating the database architecture, application structure, customer storefront and admin dashboard, then connect all major functionality end-to-end.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ugalights-spark.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2bd41c5e-7f88-49a9-9ed3-80cbce973a72).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
