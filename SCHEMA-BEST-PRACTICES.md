# Schema Markup Best Practices for a U-Pick Farms Directory Website

Implementing structured data (schema markup) on your u-pick farms
directory will help search engines understand your content and can
unlock rich results (like showing hours, ratings, or breadcrumbs in
Google)[\[1\]](https://www.schemaapp.com/schema-markup/how-to-do-schema-markup-for-local-business/#:~:text=LocalBusiness%20Schema%20Markup)[\[2\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Schema%20offers%20several%20key%20benefits,for%20local%20businesses).
Below is a comprehensive guide for adding JSON-LD schema to each key
page type in your Next.js directory site (using a Cloudflare D1
database). We'll cover the homepage, category pages, location pages,
category+location pages, and individual farm listing pages -- with a
focus on using JSON-LD (programmatically generated) for best SEO
results. We'll also address handling seasonal business hours and static
information from your data (like the attached CSV). All recommendations
adhere to Google's structured data guidelines (JSON-LD is
preferred)[\[3\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=,LD)
and schema.org best practices.

## 1. Homepage Schema Markup {#homepage-schema-markup}

The homepage represents your entire directory brand. It's best to mark
it up as the organization or website behind the directory:

- **Organization markup:** Use `Organization` (or its subtype, if
  applicable) to provide details about your directory site as a
  business/brand. Include properties like the name of your site, URL,
  logo, and contact
  information[\[4\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Page%20Type%20Recommended%20Schema%20Type,%E2%80%9Creview%E2%80%9D%20and%20%E2%80%9CaggregateRating%E2%80%9D%20Location%20PagesLocalBusiness).
  For example, if your site is "PickAFarm", you might add an
  Organization schema with `"name": "PickAFarm"`,
  `"url": "https://pickafarm.com"`,
  `"logo": "https://pickafarm.com/logo.png"`, and social profile links
  via `"sameAs": [...]`. This helps establish your site's identity to
  search engines.

- **WebSite markup (with SearchAction):** In addition to Organization,
  include a `WebSite` schema with a potential search action. This
  signals to Google that you have a site-specific search feature. For
  instance, a JSON-LD snippet on the homepage can define:
  `"@type": "WebSite", "name": "PickAFarm", "url": "https://pickafarm.com", "potentialAction": { "@type": "SearchAction", "target": "https://pickafarm.com/search?query={search_term}", "query-input": "required name=search_term" }`.
  This **Sitelinks Searchbox** markup allows a search box to appear
  directly in Google results for your site (if your site has a search
  function for farms/locations).

By marking up the homepage with Organization and/or WebSite, you improve
the chances of getting a Knowledge Panel or enhanced brand snippet for
your directory. Remember to only include factual, visible info (e.g.
don't add a phone or address unless it's displayed on the
site)[\[3\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=,LD).

## 2. Category Pages (Listing Farm Categories or Regions) {#category-pages-listing-farm-categories-or-regions}

Category pages (e.g. a page for \"Christmas Tree Farms\" or \"Pumpkin
Patches\") typically list either sub-regions or sub-categories. These
pages are essentially **collection pages**, and we can use schema to
reflect that:

- **Use CollectionPage type:** Mark the page as a `CollectionPage`, a
  subtype of WebPage for pages that are collections of
  items[\[5\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=%E2%80%A2%20%206y%20ago).
  This schema type is a good fit for directory category pages, which are
  "a collection of things on a page (closest thing in the schema
  vocabulary for a category
  page)"[\[5\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=%E2%80%A2%20%206y%20ago).
  For example, your JSON-LD can start with:
  `"@type": "CollectionPage", "name": "Christmas Tree Farms Directory", ...`.

- **Provide context with about and contentLocation:** You can enhance
  the CollectionPage markup with an `"about"` and `"contentLocation"` to
  clarify what the collection is about and where. For instance, for a
  category page listing locations of Christmas tree farms, you might add
  `"about": "Christmas Tree Farms"` and perhaps a broad content location
  if applicable (e.g.,
  `"contentLocation": { "@type": "Place", "name": "Ontario, Canada" }`
  if the page is specific to a region). Using `about` and
  `contentLocation` "gives the collection more meaning -- what it is a
  collection of and for what
  location"[\[5\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=%E2%80%A2%20%206y%20ago).
  (If the category page spans all locations, contentLocation could be
  omitted or set to a broad area like the country.)

- **List of links to sub-pages:** If the category page primarily
  contains a list of links (e.g. a list of cities or counties that have
  farms in that category), you can mark that up as an `ItemList`. One
  approach is to make the ItemList the main entity of the page. For
  example, `"mainEntity": { "@type": "ItemList", ... }` within the
  CollectionPage. Each `itemListElement` can be a `ListItem` with the
  position and a URL to the subpage (the city-specific page). For
  example:
  `"itemListElement": [ { "@type": "ListItem", "position": 1, "url": "https://pickafarm.com/christmas-tree-farms/near/toronto-on-ca" }, ... ]`.
  This tells search engines that the category page's main content is a
  list of subpages (in this case,
  locations)[\[6\]](https://pastebin.com/MNtvKxwu#:~:text=101.%20).

Putting it together, a category page JSON-LD might look like
(simplified):

    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Christmas Tree Farms in Canada",
      "about": "Christmas Tree Farms",
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": [
           { "@type": "ListItem", "position": 1, "name": "Norfolk County, ON", "item": {"@type": "WebPage", "@id": "https://pickafarm.com/christmas-tree-farms/near/norfolk-county-on-ca"} },
           { "@type": "ListItem", "position": 2, "name": "Langley, BC", "item": {"@type": "WebPage", "@id": "https://pickafarm.com/christmas-tree-farms/near/langley-bc-ca"} }
        ]
      }
    }

In the above, we included each city as a ListItem with a name and link
(using `item` pointing to the URL). You could alternatively just use the
`url` property instead of an embedded item, as long as it points to the
city page. The key is that we communicate the hierarchical structure:
this page is a collection of links to more specific pages.

*Note:* It's not absolutely required to mark up pure link lists, and not
all directory sites do for category-only pages. But using
CollectionPage/ItemList is a **best practice** for clarity, especially
if you have a descriptive intro text on the category page that you're
marking as about that
category[\[5\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=%E2%80%A2%20%206y%20ago).
Ensure any schema markup reflects the actual visible content (e.g., if
you list 10 cities, your ItemList should have 10 items, matching what\'s
on the page).

## 3. Location Pages (Listing All Farms in a City/Area) {#location-pages-listing-all-farms-in-a-cityarea}

Location pages (e.g. a page for "Farms near Norfolk County, ON") list
multiple businesses in that specific area. These pages should also be
marked up as collections, with an emphasis on the location context:

- **CollectionPage with location context:** As with category pages, use
  `CollectionPage` for the page itself. But here, use the
  `"contentLocation"` property to specify the area. For example:
  `"contentLocation": { "@type": "Place", "name": "Norfolk County, ON", "address": { "@type": "PostalAddress", "addressLocality": "Norfolk County", "addressRegion": "ON", "addressCountry": "CA" } }`.
  This tells search engines that this page is specifically about a
  certain geographic location. In a real JSON-LD, you might simplify to
  just name if full address isn't appropriate, but including
  region/country is helpful for unambiguous location.

- **Describe the collection with about:** You can use `"about":` to
  indicate what the items are. For a location page that lists all types
  of farms in Norfolk County,
  `"about": "Local farms and u-pick businesses"` could be used, or
  simply omit it if the page title itself is clear. The idea is similar
  to category pages -- it provides semantic context (e.g., "collection
  of farms in X").

- **ItemList of farms:** The core of this page is the list of farm
  listings. Use `ItemList` to mark up the list of businesses. As
  recommended by other SEO experts, an `ItemList` is appropriate for "a
  list of businesses in
  \[City\]"[\[7\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=Imagine%20a%20city%20page%20for,in%20the%20area%20are%20listed).
  Each farm can be an entry in the `itemListElement`. Since each farm
  has its own detail page on your site, the ItemList elements can just
  reference those pages. For example:

<!-- -->

    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://pickafarm.com/farm/aldor-acres-christmas-trees"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "https://pickafarm.com/farm/another-farm-name"
        }
      ]
    }

This is a simplified example indicating that the page's main content is
a list of farms (with their URLs). The `position` corresponds to the
rank/order on the page. If you want to enrich this further, you could
include the name of each farm (and even a few details) in the ListItem.
For instance, you can replace the `url` with an
`"item": { "@type": "LocalBusiness", "name": "Aldor Acres Christmas Trees", "url": "...", "address": "...", "telephone": "..." }`
-- basically embedding a summary of each business. However, since you
have dedicated farm pages that will have the full details and
LocalBusiness markup, you can keep the list page's ItemList fairly light
(just names and URLs). The key is that **some schema is present to
denote the list structure**.

- **Breadcrumbs:** It's good practice to include a breadcrumb trail on
  location pages (and all pages except maybe the homepage). A
  `BreadcrumbList` schema should enumerate the path (e.g. Home \>
  \[Category\] \> \[Location\]). For a Norfolk County page that lists
  all farms, the breadcrumb might be:
- Position 1: Home (`pickafarm.com`)
- Position 2: maybe a country or category index (depending on your site
  hierarchy; e.g., "All Farms in Ontario" or just "Ontario" if you have
  an index)
- Position 3: Norfolk County page itself.

Breadcrumb schema uses `BreadcrumbList` with `itemListElement` being
`ListItem` for each link, containing `name` and
`item (URL)`[\[8\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=website%20usability%20and%20optimize%20its,in%20search%20engine%20results%20pages).
Implementing this helps Google display your breadcrumb navigation in
search results instead of a raw
URL[\[9\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=If%20you%20apply%20schema%20mark,to%20enhance%20your%20search%20result),
which improves CTR and usability. *(We'll give a full breadcrumb example
under the farm listing page, since that's typically where the breadcrumb
includes both category and location.)*

By marking up location pages with a CollectionPage and ItemList, plus
breadcrumb navigation, you clarify to search engines that *"this is a
page listing businesses (farms) in a specific area."* This can
indirectly support your SEO by reinforcing local relevance. It also sets
the stage for the farm detail pages (linked as items).

**Note:** If your location page is actually a combination (e.g., "Farms
near X" including all categories), use a general term in `"about"` like
"farms" or "u-pick farms". If instead your site structure doesn't have a
general location page and always pairs a category with a location (see
next section), then you might not need a "all farms in city" page at
all. Adjust accordingly -- the approach is similar whenever a page lists
multiple businesses.

## 4. Category + Location Pages (e.g. *Christmas Tree Farms in Norfolk County*) {#category-location-pages-e.g.-christmas-tree-farms-in-norfolk-county}

These pages combine a specific category with a specific location,
essentially filtering the directory to a niche list (for example, URL
might be `/christmas-tree-farms/near/norfolk-county-on-ca/`). The schema
approach here is a mix of the above two:

- **CollectionPage with combined context:** Use `CollectionPage` again
  for the page type. This time, both `"contentLocation"` and `"about"`
  should be used for clarity. For example:
  `"contentLocation": { "@type": "Place", "name": "Norfolk County, ON" }`
  and `"about": "Christmas Tree Farms"`. This explicitly tells search
  engines *"this page is a collection of items about Christmas Tree
  Farms in Norfolk County."* Combining these properties is helpful to
  define the narrow focus of the
  page[\[5\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=%E2%80%A2%20%206y%20ago).

- **ItemList of businesses:** Just like the general location page, list
  the farms (but only those of the given category in that area) as an
  `ItemList`. Each farm would be a ListItem with a link to its detail
  page (or an embedded mini-profile). The JSON-LD structure would mirror
  the previous section's example, just limited to the relevant farms.
  Ensure the number of items and their order in the `itemListElement`
  matches what's visibly on the page.

- **BreadcrumbList:** On these pages, the breadcrumb trail becomes even
  more important to reflect the multi-level hierarchy. For example, for
  "Christmas Tree Farms in Norfolk County, ON":

- Home (position 1)

- Christmas Tree Farms (category page, position 2)

- Norfolk County, ON (location within that category, position 3 -- this
  page itself)

Mark this up with `BreadcrumbList` in JSON-LD. Each breadcrumb ListItem
will have
`"position": 1, "name": "Home", "item": "https://pickafarm.com/"`, then
position 2 for the category page, etc. Breadcrumb schema not only helps
users navigate but also typically appears as navigational links in
Google
results[\[8\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=website%20usability%20and%20optimize%20its,in%20search%20engine%20results%20pages).
It's considered a best practice for multi-level directories.

Other than these specifics, treat the category-location page similarly
to other listing pages: CollectionPage context, and the mainEntity being
an ItemList of LocalBusiness items (or links to them). The use of
JSON-LD programmatically is straightforward -- you will generate the
list of items from your database query (e.g., all farms in Norfolk
County that have category "Christmas Tree Farms") and then output the
JSON structure accordingly.

**Example snippet:** *(for illustration)*

    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Christmas Tree Farms near Norfolk County, ON",
      "contentLocation": { "@type": "Place", "name": "Norfolk County, ON, CA" },
      "about": "Christmas Tree Farms",
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": [
           { "@type": "ListItem", "position": 1, "url": "https://pickafarm.com/farm/aldor-acres-christmas-trees" },
           { "@type": "ListItem", "position": 2, "url": "https://pickafarm.com/farm/another-xmas-tree-farm" }
        ]
      }
    }

And separately, a breadcrumb list for this page might be:

    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1,
          "name": "Home",
          "item": "https://pickafarm.com/" },
        { "@type": "ListItem", "position": 2,
          "name": "Christmas Tree Farms",
          "item": "https://pickafarm.com/christmas-tree-farms" },
        { "@type": "ListItem", "position": 3,
          "name": "Norfolk County, ON",
          "item": "https://pickafarm.com/christmas-tree-farms/near/norfolk-county-on-ca" }
      ]
    }

Feel free to adjust the breadcrumb structure based on your actual URL
design (the above assumes a category page exists at
`/christmas-tree-farms`).

**Why this matters:** By using CollectionPage+ItemList on
category/location pages, you're effectively communicating the
*structure* of your directory. This doesn't directly produce a rich
snippet on its own (Google usually won't show rich results for a list
page the same way as for an individual business), but it can aid
crawling and understanding. Moreover, having breadcrumbs marked up
**will** enhance your snippet with a breadcrumb path instead of a plain
URL[\[9\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=If%20you%20apply%20schema%20mark,to%20enhance%20your%20search%20result),
which is a tangible SEO improvement.

## 5. Individual Farm Listing Pages (Local Business Detail) {#individual-farm-listing-pages-local-business-detail}

These are the pages with the "lots of information" about each farm --
effectively the profile of a single farm. This is where the most
critical schema markup is applied, as it describes a specific local
business. Following best practices for LocalBusiness schema here is key
to eligibility for rich results like a Knowledge Panel or enhanced
result for that
farm[\[10\]](https://www.schemaapp.com/schema-markup/how-to-do-schema-markup-for-local-business/#:~:text=Adding%20LocalBusiness%20Schema%20Markup%20,organic%20traffic%2C%20and%20more%20conversions)[\[2\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Schema%20offers%20several%20key%20benefits,for%20local%20businesses).

On each farm's detail page, use **JSON-LD LocalBusiness schema**
including all relevant properties. Here's what to focus on:

- **@type choice (LocalBusiness subtype):** Schema.org offers many
  specific types for local businesses (from `Restaurant` to
  `GardenStore`, etc.). However, there isn't a dedicated type for
  "Pick-Your-Own Farm" or "Christmas Tree Farm". In such cases, use the
  generic `LocalBusiness` type (or `Organization` as a
  fallback)[\[11\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=Schema,For%20example).
  If you want, you can use `additionalType` to specify a more specific
  concept (for example, link to a Wikipedia page for "Pick-your-own
  farm"), but this is optional. Using just `@type": "LocalBusiness"` is
  perfectly fine for these farm listings, and recommended if no closer
  schema category
  exists[\[11\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=Schema,For%20example).

- **Basic identification properties (name, URL, image):** Include
  `"name"` of the farm exactly as it appears on the page. For `"url"`,
  **use the farm's official website URL if they have one**, *and* tie
  the schema to your page. For example, if Aldor Acres has their own
  website (from the CSV we see `aldoracreschristmastrees.ca`), you can
  do:

- `"name": "Aldor Acres Christmas Trees"`,

- `"url": "http://www.aldoracreschristmastrees.ca/"` (the farm's own
  site),

- `"mainEntityOfPage": { "@type": "WebPage", "@id": "https://pickafarm.com/farm/aldor-acres-christmas-trees" }`
  to indicate that this JSON-LD is describing the main entity of *this*
  page[\[12\]](https://inindiatech.com/next/local-seo-small-business-guide#:~:text=Local%20SEO%20for%20Small%20Business%3A,https).
  Using `mainEntityOfPage` with your page's URL helps clarify that the
  PickAFarm page is a profile of the farm (and not the farm's official
  site itself). It's a way to disambiguate for search engines.

- Add an `"image"` property if you have a featured image of the farm
  (URL to a representative photo). Google recommends including images
  for local business schema. Ensure the image is relevant (like a photo
  of the farm or logo).

- **Address and geo coordinates:** Use the `address` property with a
  `PostalAddress`. From your CSV data, you have fields for street, city,
  region, postal code, country -- all of these can be slotted in. For
  example:

<!-- -->

- "address": {
        "@type": "PostalAddress",
        "streetAddress": "8249 252 St",
        "addressLocality": "Langley Twp",
        "addressRegion": "BC",
        "postalCode": "V1M 3N1",
        "addressCountry": "CA"
      }

  Also include the geo coordinates using the `geo` property with
  `@type: GeoCoordinates`:

      "geo": { "@type": "GeoCoordinates", "latitude": 49.1521504, "longitude": -122.5256467 }

  We got these coordinates from the CSV for Aldor Acres. Having precise
  latitude/longitude is beneficial for maps and voice
  assistants[\[13\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=,the%20user%E2%80%99s%20location%20and%20query),
  and ensures accuracy for the
  location[\[14\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=Local%20landing%20pages%20using%20structured,easily%20process%20for%20precise%20results).

<!-- -->

- **Contact info:** Add the farm's phone number with `"telephone"`, and
  if you have an email listed (the CSV has an email for Aldor Acres),
  you can include `"email": "info@aldoracreschristmastrees.ca"` as well.
  While Google's rich results typically show phone but not email, it's
  still part of the business's structured data. (Make sure the phone
  number is in international format with +country code.) If the farm has
  a fax number, there's `faxNumber` too, but likely not needed here.

- **Opening hours (including seasonal info):** This part is crucial
  since these farms might have seasonal schedules. Use the
  `openingHoursSpecification` property with one or more entries of
  `@type: OpeningHoursSpecification`. Each entry should specify:

- `dayOfWeek`: e.g. \"Monday\", \"Tuesday\", or an array \[\"Mon\",
  \"Tue\", \...\] (use full names or ISO short codes).

- `opens`: \"09:00\" (24h format)

- `closes`: \"17:00\"

For a farm that operates year-round with the same hours each week, you'd
list the days and times accordingly. **However, many u-pick farms have
seasonal schedules or off-season closures.** Schema.org allows us to
indicate seasonal availability in two ways:

**(a) Using validFrom/validThrough:** For seasonal periods (e.g. only
open during summer, or closed during winter), you can include
`validFrom` and `validThrough` on an OpeningHoursSpecification to limit
its date range. For example, if a farm is closed from Dec 1, 2025 until
March 1, 2026, you could add an entry:

    {
      "@type": "OpeningHoursSpecification",
      "opens": "00:00",
      "closes": "00:00",
      "validFrom": "2025-12-01",
      "validThrough": "2026-03-01",
      "dayOfWeek": [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ]
    }

This essentially says "closed all day for every day between those
dates." Google's documentation confirms that using `validFrom` and
`validThrough` is the way to specify seasonal
hours[\[15\]](https://developers.google.com/search/docs/appearance/structured-data/local-business#:~:text=Seasonal%20hours).
Another source gives a similar example for off-season closure using
opens=00:00 and closes=00:00 with the date range covering the closed
season[\[16\]](https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:~:text=Structured%20Data%20for%20Seasonal%20Hours)[\[17\]](https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:~:text=,01%22).

You can likewise define the open season. For instance, if the farm is
open May 1 to Nov 30 each year, you might include another
OpeningHoursSpecification that has
`validFrom: "2025-05-01", validThrough: "2025-11-30"` and the days/times
it's open during that range. (If hours are consistent in that range,
list them; if they change by day of week, include multiple entries
accordingly.)

**(b) Using specialOpeningHoursSpecification:** This is useful for
one-off days that differ, like holidays or special event weekends. For
example, if on a specific date they have extended hours or are closed on
a holiday, `specialOpeningHoursSpecification` (an array of
OpeningHoursSpecification) can override the regular
schedule[\[18\]](https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:~:text=Schema,LD%20Format%20Example)[\[19\]](https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:~:text=,23%22).
For instance, you might say on 2025-12-24 opens 09:00, closes 14:00.
This property is meant to explicitly flag exceptions (and Google uses it
for holiday
hours)[\[20\]](https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:~:text=Structured%20Data%20for%20Holiday%20Hours).
It should be used in addition to the normal openingHoursSpecification.

In summary, **model the seasonal schedule accurately**: If the farm's
hours vary by season (or it closes entirely in some months), include
those date-bounded specifications. For always-closed periods, set
opens/closes to \"00:00\" (meaning closed that entire day
range)[\[21\]](https://developers.google.com/search/docs/appearance/structured-data/local-business#:~:text=,05%22).
This way, search engines could display messages like "Closed for the
season" if they interpret the data, and at minimum you're providing
correct info. *(Always keep the human-visible text updated too --
structured data should reflect what the page says about seasonality.)*

- **Year established:** If you have "Year Established" (e.g., 2013 for
  Aldor Acres in the CSV), you can include
  `"foundingDate": "2013"`[\[22\]](https://schema.org/LocalBusiness#:~:text=,Organization%C2%A0%20or).
  This is a schema property for organizations indicating when they were
  founded. It's optional, but it adds more detail and could appear in
  some Knowledge Panels.

- **Services or offerings:** Some farms offer multiple services (like
  "Pre-cut and Cut-your-own trees" or hayrides, etc.). While there isn't
  a direct property for "services" in LocalBusiness, you could
  incorporate these in a few ways:

- Use `"keywords"` to list notable features or services (e.g. \"Pre-Cut,
  Cut Your Own, Hayrides, Petting
  Zoo\")[\[23\]](https://schema.org/LocalBusiness#:~:text=,commas%2C%20or%20by%20repeating%20the).
  Keywords is a generic property for tags.

- Use `"amenityFeature"` for specific amenities. Schema.org's `Place`
  (and thus LocalBusiness) has `amenityFeature` which expects a
  `LocationFeatureSpecification`. This is a bit more complex to
  implement (you\'d specify an amenity name and a boolean value). For
  example:
  `"amenityFeature": { "@type": "LocationFeatureSpecification", "name": "Pet Friendly", "value": false }`
  to indicate the farm is not pet friendly (based on CSV "Pet Friendly:
  FALSE"). Similarly you could mark amenities like restrooms, gift shop,
  etc. However, this level of detail might be unnecessary for search
  engines -- much of it can be simply mentioned in the description or
  left out of structured data.

- If the farm sells products with specific prices, you might consider
  the Offer schema, but since these are experiential (not an online
  store), it's not needed to go that far. Instead, a general
  `"priceRange"` property is useful.

- **Price range:** Use `"priceRange"` to indicate the relative cost or
  typical price. Often this is given in dollar signs (e.g. \"\$\" or
  \"\$\$\$\"). In your data, price range might be textual (like \"Varies
  by size\" for Christmas trees). You can include that phrase:
  `"priceRange": "Varies by size"`[\[24\]](https://schema.org/LocalBusiness#:~:text=,the%20business%2C%20for%20example).
  Google might not show a non-standard phrase, but it doesn't harm to
  provide it. If you have a consistent scheme (like low, medium, high),
  you could standardize, but since u-pick farms often have varied
  pricing, a short phrase is fine.

- **Payment methods:** Include `"paymentAccepted": "Cash, Credit Card"`
  or
  similar[\[24\]](https://schema.org/LocalBusiness#:~:text=,the%20business%2C%20for%20example),
  based on the CSV's Payment Methods field. Schema.org also has
  `acceptedPaymentMethod` which can take a structured value, but listing
  them as a comma-separated text is simpler and sufficient (e.g.,
  \"Cash, Credit
  Card\")[\[24\]](https://schema.org/LocalBusiness#:~:text=,the%20business%2C%20for%20example).

- **Description:** Don't forget to include a descriptive `"description"`
  of the farm. You likely have a rich description (the CSV has a
  multi-line description for Aldor Acres). You can plug that into the
  schema (just ensure to escape any quotes/newlines properly in
  JSON-LD). This provides context to search engines about what the farm
  offers and its history. It may also be used in some contexts for rich
  results (for example, voice search or summary in Google's generative
  results).

- **SameAs (social and map profiles):** It's very useful to add
  `"sameAs"` links to any official profiles of the farm:

- Link to their Facebook page, Instagram, etc. (The CSV has those URLs).

- Link to their Google Maps place if you have a stable URL or Place ID.
  You can use a Google Maps share URL (as given in CSV's \"Google My
  Business\" column) in a `sameAs`. For example:
  `"sameAs": ["https://www.facebook.com/AldorAcresChristmasTreeFarm", "https://www.instagram.com/aldoracreschristmas/", "https://goo.gl/maps/xxxxxxxx"]`.
  This helps Google associate the schema data with the Google business
  listing (and other profiles).

- You can also include the official website in sameAs if you used your
  page URL as the primary URL. In our approach we put the official site
  as `"url"`, so it's already covered. If instead you choose to make
  `"url"` the directory page URL, then put the official site in
  `"sameAs"`. The goal is to list all relevant URLs that represent the
  same entity (that farm).

- **hasMap:** In addition to sameAs for Google Maps, schema has a
  `hasMap` property which can be used to link a Google Map directly. For
  example:
  `"hasMap": "https://www.google.com/maps/place/?q=place_id:ChIJt8tNe2HNhVQRsBRIZiTrKcU"`
  using the PlaceID from your CSV (this is an advanced detail -- you can
  also just use the normal maps URL). This property explicitly indicates
  a map for the location, which can be useful for any consumers of the
  data.

- **Aggregate ratings or reviews:** If your directory allows users to
  rate or review farms, you could include `aggregateRating` and
  individual `review` entries in the schema. This can make the farm
  eligible for review star rich snippets. However, **only do this if**
  your page actually displays those ratings/reviews and you comply with
  Google's review snippet guidelines (reviews should be sourced from
  users directly on your site, not scraped from elsewhere). If you have
  no review system, skip this. It's not mandatory. (Just mentioning for
  completeness: an aggregateRating would include properties like
  `"ratingValue": "4.5", "reviewCount": "10"` etc. .)

- **FAQ or other schemas:** Many farm pages have FAQs (e.g., about what
  to bring, etc.) or event schedules. If your page includes an FAQ
  section in text, you can add an `FAQPage` schema in addition to the
  LocalBusiness schema. It's perfectly acceptable to have multiple
  JSON-LD blocks on one page describing different aspects (one for the
  business, one for the
  FAQ)[\[25\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=).
  Just ensure each corresponds to actual content on the page. Similarly,
  if a farm page lists upcoming events (like a Fall Festival), you could
  mark those with `Event` schema. These are optional enhancements.
  Prioritize the core LocalBusiness markup first.

- **Breadcrumb on the farm page:** As mentioned earlier, add breadcrumb
  schema here as well. The farm page breadcrumb might be: Home
  (Position 1) \> Category (Position 2, e.g., "Christmas Tree Farms") \>
  Location (Position 3, e.g., "Norfolk County, ON") \> Farm Name
  (Position 4, current page). By marking this up using `BreadcrumbList`
  schema, you help Google display a nice path in search
  results[\[8\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=website%20usability%20and%20optimize%20its,in%20search%20engine%20results%20pages).
  Breadcrumbs also help users on your site, of course. The JSON-LD for
  breadcrumbs can be included in the page head or inline; just make sure
  it matches the actual navigation links on the page.

**Example JSON-LD for a farm detail (simplified):**

    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Aldor Acres Christmas Trees",
      "url": "http://www.aldoracreschristmastrees.ca/", 
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://pickafarm.com/farm/aldor-acres-christmastrees"
      },
      "image": "https://pickafarm.com/images/aldoracres.jpg",
      "description": "Al-Dor Farms is a family-run farm in Glen Valley... (full description)",
      "telephone": "+1 604-888-4483",
      "email": "info@aldoracreschristmastrees.ca",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "8249 252 St",
        "addressLocality": "Langley Township",
        "addressRegion": "BC",
        "postalCode": "V1M 3N1",
        "addressCountry": "CA"
      },
      "geo": { "@type": "GeoCoordinates", "latitude": 49.1521504, "longitude": -122.5256467 },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ],
          "opens": "10:00",
          "closes": "18:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [ "Saturday", "Sunday" ],
          "opens": "09:00",
          "closes": "17:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "opens": "00:00",
          "closes": "00:00",
          "validFrom": "2025-12-01",
          "validThrough": "2026-03-01",
          "dayOfWeek": [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ]
        }
      ],
      "priceRange": "Varies by size",
      "paymentAccepted": "Cash, Credit Card",
      "foundingDate": "2013",
      "petsAllowed": false, 
      "amenityFeature": [
        { "@type": "LocationFeatureSpecification", "name": "Restrooms", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Petting Zoo", "value": true }
      ],
      "sameAs": [
        "https://www.facebook.com/AldorAcresChristmasTreeFarm",
        "https://www.instagram.com/aldoracreschristmas/",
        "https://goo.gl/maps/xxxxxxxxxxxxxxxx" 
      ],
      "hasMap": "https://www.google.com/maps/place/Aldor+Acres+Christmas+Trees/@49.1521504,-122.5256467,14z/"
    }

*(The above is an illustrative example combining many of the fields;
your actual JSON-LD will vary based on data. Note how we included a
seasonal closure from Dec--Feb as an OpeningHoursSpecification with all
days closed, using validFrom/Through dates.)*

This LocalBusiness schema, when properly filled out, makes your farm
pages eligible for local business rich results. Google can use it to
display info such as hours of operation, address, phone, even
"temporarily closed" if off-season, directly in the search snippet or a
knowledge panel. It also feeds information to voice assistants and
Google Maps. For example, the presence of geo coordinates and opening
hours helps answer queries like "Is there a pumpkin patch open near me
now?" via Google
Assistant[\[26\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=Key%20Benefits%20Of%20Structured%20Data,For%20AI)[\[13\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=,the%20user%E2%80%99s%20location%20and%20query).

**Important**: Always ensure the structured data matches the visible
content on the
page[\[3\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=,LD).
If a farm is seasonal and you mention dates on the page, make sure the
JSON-LD reflects the same. If you list certain amenities or services,
those should be mentioned in text too (or in icons/list format on the
page). This alignment is required by Google's guidelines to avoid any
"misleading" markup.

## 6. Programmatic Implementation in Next.js {#programmatic-implementation-in-next.js}

Since you are using Next.js with a Cloudflare D1 database, you'll be
generating this JSON-LD dynamically. Here are some tips for
implementation:

- **Data fetching:** Use Next.js data fetching methods (e.g.,
  `getStaticProps` for static generation or `getServerSideProps` if
  needed) to retrieve the relevant data for each page from your D1
  database. For example, fetch all farms for a given location or
  category to build the ItemList, or fetch one farm's details for the
  profile page.

- **Construct JSON objects:** Build the schema object in JavaScript.
  This can be as simple as creating a JS object (following the schema
  structure) and using `JSON.stringify`. Many use a library or write
  helpers to ensure proper formatting. For instance, you might have a
  function `getFarmSchema(farmData)` that returns a JS object for the
  LocalBusiness schema of that farm.

- **Embedding JSON-LD in Next.js:** Next.js allows inserting JSON-LD in
  the `<Head>` of the page. You can use the `next/head` component or a
  third-party library like `next-seo`. The typical approach is:

<!-- -->

- import Head from 'next/head';
      ...
      <Head>
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaObject) }} 
        />
      </Head>

  This will output the JSON-LD script tag in the page's HTML. Do this
  for each schema block you need on the page (you can have multiple
  `<script type="application/ld+json">` tags, or combine into one using
  `@graph` if you prefer). Both approaches work; multiple schema in one
  page is perfectly
  fine[\[25\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=)
  as long as they describe content on that page.

<!-- -->

- **Testing and Validation:** After implementing, always test your pages
  with Google's Rich Results Test or Schema Markup Validator. They will
  show if the JSON-LD parses correctly and is eligible for any rich
  result types. For local businesses, the Google test will indicate if
  your markup is detected for their Local Business rich results feature.
  It will also flag any errors (e.g., if a required field is missing).
  Required fields for LocalBusiness according to Google typically
  include name, address, phone, and perhaps some of: image or URL. The
  Search Engine Journal guide recommends including name, URL, telephone,
  image, address, geo, and openingHours as fundamental -- which our
  implementation does. If anything is missing, the tester will let you
  know so you can fix it. Validation ensures "no errors or warnings"
  which is
  ideal[\[27\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=match%20at%20L644%20Screenshot%20from,validated%20with%20no%20errors%2Fwarnings).

- **Keeping data in sync:** If your database updates (e.g., a farm
  changes hours), make sure to update both the page content and the
  JSON-LD simultaneously. For seasonal changes, you might even automate
  this: perhaps have a field for season opening/closing dates and have
  your Next.js code include or exclude certain OpeningHoursSpecification
  based on the current date or upcoming season. Since many farms reopen
  seasonally, consider a process to update the structured data just
  ahead of season changes.

- **Performance considerations:** JSON-LD is typically small (a few KB)
  and won't majorly impact load. Since you will likely prerender these
  pages (with Next.js static generation), the JSON-LD will be present in
  the HTML served, which is good for SEO. Cloudflare D1 will provide the
  data at build time or request time. Ensure special characters in text
  (like quotes in descriptions) are properly escaped or sanitized when
  building JSON.

## 7. Ensuring Best Results {#ensuring-best-results}

To maximize the SEO benefit of your schema implementation, here's a
quick checklist of best practices and additional tips:

- **Use JSON-LD format** -- which we've done -- as it's Google's
  preferred format for structured
  data[\[3\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=,LD).
  It's easier to generate and inject compared to microdata/RDFa.

- **Be specific and accurate:** Use the most specific schema types and
  properties that apply to your content (e.g., `LocalBusiness` with
  appropriate properties, and if a farm had a very specific subtype like
  Winery or Orchard and you want to use it, you could). But never use a
  type inaccurately just to get a rich result. In our case,
  LocalBusiness is appropriate for all these farm listings.

- **Include all recommended fields:** Google's guidelines for
  LocalBusiness highlight several recommended properties beyond the
  required ones, such as geo, priceRange, openingHours, etc.. We've
  covered these. Including `hasMap`, `sameAs`, and `aggregateRating` (if
  applicable) further enriches the entity. The richer your schema, the
  more confident search engines are in the information. For example,
  including social profiles via sameAs can help populate the Knowledge
  Panel for that farm (if they don't have their own panel already).

- **Use BreadcrumbList on all hierarchical pages:** This bears repeating
  -- breadcrumb schema can boost your snippets for *every* page in the
  directory by showing a clear
  path[\[8\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=website%20usability%20and%20optimize%20its,in%20search%20engine%20results%20pages).
  It's a simple addition that improves CTR significantly by making your
  result more attractive and
  informative[\[28\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=What%20Are%20The%20Benefits%20Of,Breadcrumb%20Schema)[\[29\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=As%20you%20can%20see%2C%20the,within%203%20weeks).

- **Handle seasonal closures properly:** Many farm directories struggle
  with how to indicate when a farm is "Closed for the season." By using
  the schema techniques described (validThrough dates,
  specialOpeningHours), you provide that info to Google in a structured
  way. Google might not always show "Temporarily closed" based on markup
  alone (they often rely on Google My Business data for that), but it's
  good practice to supply it. And if the farm's GMB is marked seasonal
  closed, having consistent info on your page (marked up in schema)
  creates trust in the data.

- **Multiple schemas on one page are allowed:** We mentioned combining
  FAQ schema or Event schema if relevant. Just remember that each schema
  block should reference content that is actually on the page (FAQ text,
  event details,
  etc.)[\[3\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=,LD).
  Don't add unrelated schema in hopes of extra SEO -- that can be seen
  as spammy. But do mark up actual content appropriately (e.g., some
  farm pages might have an FAQ about "what to wear" or "can we bring
  dogs," etc., which you can wrap in FAQPage schema for an FAQ rich
  snippet).

- **Dynamic updates and revalidation:** Since you'll generate JSON-LD
  programmatically, you can also update it in real-time. For example, if
  a farm updates its hours for a holiday weekend, updating your database
  and re-deploying (or if using SSR, it'll reflect immediately) will
  change the JSON-LD. Keep an eye on Google Search Console for any
  errors under **Enhancements \> Breadcrumbs/FAQ/Local Business**
  sections, which will show if your structured data has issues.

- **Rich result eligibility:** While schema is necessary for rich
  results, it's not a guarantee. Google will decide if and when to show
  rich snippets. But by following best practices (complete, error-free
  markup, no violations), you maximize your chances. For local
  businesses, you might see improvements like the farm's hours or rating
  appearing directly in search results, which is great for
  visibility[\[2\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Schema%20offers%20several%20key%20benefits,for%20local%20businesses).

In conclusion, implementing schema markup across your directory using
JSON-LD will significantly enhance the clarity of your site to search
engines. You'll have **Organization** schema establishing your site's
identity, **CollectionPage/ItemList** schema mapping out the directory
structure (categories, locations, lists), and detailed **LocalBusiness**
schema on each farm page providing key information (NAP details, hours,
etc.). All of this works together to improve SEO. Users searching for
"u-pick farms near \[City\]" or "\[Category\] in \[Location\]" are more
likely to see rich, informative snippets from your site, and AI-based
search results can draw on your structured data to answer questions
accurately[\[14\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=Local%20landing%20pages%20using%20structured,easily%20process%20for%20precise%20results)[\[30\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=1,results%2C%20fostering%20trust%20and%20engagement).

By following this guide and leveraging Next.js to inject JSON-LD
dynamically, you are aligning your directory with the latest best
practices in structured data. This comprehensive schema implementation
will give your site the best shot at enhanced search results and a
better user experience for those looking to pick the perfect farm to
visit.

**Sources:**

- Google Developers -- *Local Business Structured Data*: Guidelines for
  required and recommended properties in LocalBusiness schema, use of
  JSON-LD, and handling seasonal hours with
  `validFrom`/`validThrough`[\[31\]](https://developers.google.com/search/docs/appearance/structured-data/local-business#:~:text=Seasonal%20hours).
- Schema.org / SEO Community Examples -- Usage of `CollectionPage` and
  `ItemList` for directory
  listings[\[7\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=Imagine%20a%20city%20page%20for,in%20the%20area%20are%20listed)[\[5\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=%E2%80%A2%20%206y%20ago),
  and breadcrumb schema
  benefits[\[8\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=website%20usability%20and%20optimize%20its,in%20search%20engine%20results%20pages).
- Authority Networks Blog -- *Schema Markup for Holiday Hours*:
  Demonstrates `specialOpeningHoursSpecification` for holiday overrides
  and `openingHoursSpecification` with date ranges for seasonal
  closures[\[20\]](https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:~:text=Structured%20Data%20for%20Holiday%20Hours)[\[16\]](https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:~:text=Structured%20Data%20for%20Seasonal%20Hours).
- SearchEngineJournal -- *Local SEO Schema Guide*: Emphasizes including
  detailed properties (like geo, hasMap, sameAs, etc.) for local
  business schema to improve rich results and AI
  understanding[\[13\]](https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:~:text=,the%20user%E2%80%99s%20location%20and%20query).
- BrightLocal -- *Schema Templates for Local SEO*: Recommends
  Organization schema on home page and LocalBusiness on location
  pages[\[4\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Page%20Type%20Recommended%20Schema%20Type,%E2%80%9Creview%E2%80%9D%20and%20%E2%80%9CaggregateRating%E2%80%9D%20Location%20PagesLocalBusiness),
  and confirms JSON-LD is the preferred format for
  implementation[\[32\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Structured%20Data%20Guidelines%20before%20implementation,to%20ensure%20compliance).
- Dave Ashworth SEO -- *Breadcrumb Schema Markup*: Explains that adding
  BreadcrumbList markup will enhance how your pages appear in SERPs by
  showing the navigation
  path[\[8\]](https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:~:text=website%20usability%20and%20optimize%20its,in%20search%20engine%20results%20pages),
  which can improve CTR.

[\[1\]](https://www.schemaapp.com/schema-markup/how-to-do-schema-markup-for-local-business/#:~:text=LocalBusiness%20Schema%20Markup)
[\[10\]](https://www.schemaapp.com/schema-markup/how-to-do-schema-markup-for-local-business/#:~:text=Adding%20LocalBusiness%20Schema%20Markup%20,organic%20traffic%2C%20and%20more%20conversions)
How-to Guide for LocalBusiness Schema Markup \| Schema App

<https://www.schemaapp.com/schema-markup/how-to-do-schema-markup-for-local-business/>

[\[2\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Schema%20offers%20several%20key%20benefits,for%20local%20businesses)
[\[3\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=,LD)
[\[4\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Page%20Type%20Recommended%20Schema%20Type,%E2%80%9Creview%E2%80%9D%20and%20%E2%80%9CaggregateRating%E2%80%9D%20Location%20PagesLocalBusiness)
[\[32\]](https://www.brightlocal.com/learn/local-seo-schema-templates/#:~:text=Structured%20Data%20Guidelines%20before%20implementation,to%20ensure%20compliance)
8 Schema Templates for Local SEO - BrightLocal

<https://www.brightlocal.com/learn/local-seo-schema-templates/>

[\[5\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=%E2%80%A2%20%206y%20ago)
[\[7\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=Imagine%20a%20city%20page%20for,in%20the%20area%20are%20listed)
[\[25\]](https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/#:~:text=)
What type of schema is best for this? : r/bigseo

<https://www.reddit.com/r/bigseo/comments/e0bl63/what_type_of_schema_is_best_for_this/>

[\[6\]](https://pastebin.com/MNtvKxwu#:~:text=101.%20)

{\"@context\":\"https://schema.org\",\"@gr - Pastebin.com\</span\>
\</div\> \<div class=\"citation-url\"\> \<a
href=\"https://pastebin.com/MNtvKxwu\"\>https://pastebin.com/MNtvKxwu\</a\>
\</div\> \</div\> \</div\> \<div class=\"citation\"\> \<div
class=\"citation-body\"\> \<div class=\"title_wrapper\"\> \<a
class=\"source\"
href=\"https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:\~:text=website%20usability%20and%20optimize%20its,in%20search%20engine%20results%20pages\"\>\[8\]\</a\>
\<a class=\"source\"
href=\"https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:\~:text=If%20you%20apply%20schema%20mark,to%20enhance%20your%20search%20result\"\>\[9\]\</a\>
\<a class=\"source\"
href=\"https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:\~:text=What%20Are%20The%20Benefits%20Of,Breadcrumb%20Schema\"\>\[28\]\</a\>
\<a class=\"source\"
href=\"https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/#:\~:text=As%20you%20can%20see%2C%20the,within%203%20weeks\"\>\[29\]\</a\>
\<span class=\"title\"\>How To: Implement Breadcrumb List Schema Mark Up
(And Why)\</span\> \</div\> \<div class=\"citation-url\"\> \<a
href=\"https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/\"\>https://daveashworth.co/blog/how-to-implement-breadcrumb-list-schema-mark-up-and-why/\</a\>
\</div\> \</div\> \</div\> \<div class=\"citation\"\> \<div
class=\"citation-body\"\> \<div class=\"title_wrapper\"\> \<a
class=\"source\"
href=\"https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:\~:text=Schema,For%20example\"\>\[11\]\</a\>
\<a class=\"source\"
href=\"https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:\~:text=,the%20user%E2%80%99s%20location%20and%20query\"\>\[13\]\</a\>
\<a class=\"source\"
href=\"https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:\~:text=Local%20landing%20pages%20using%20structured,easily%20process%20for%20precise%20results\"\>\[14\]\</a\>
\<a class=\"source\"
href=\"https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:\~:text=Key%20Benefits%20Of%20Structured%20Data,For%20AI\"\>\[26\]\</a\>
\<a class=\"source\"
href=\"https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:\~:text=match%20at%20L644%20Screenshot%20from,validated%20with%20no%20errors%2Fwarnings\"\>\[27\]\</a\>
\<a class=\"source\"
href=\"https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/#:\~:text=1,results%2C%20fostering%20trust%20and%20engagement\"\>\[30\]\</a\>
\<span class=\"title\"\>Local SEO Schema: A Complete Guide To Local
Structured Data & Rich Results\</span\> \</div\> \<div
class=\"citation-url\"\> \<a
href=\"https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/\"\>https://www.searchenginejournal.com/how-to-use-schema-for-local-seo-a-complete-guide/294973/\</a\>
\</div\> \</div\> \</div\> \<div class=\"citation\"\> \<div
class=\"citation-body\"\> \<div class=\"title_wrapper\"\> \<a
class=\"source\"
href=\"https://inindiatech.com/next/local-seo-small-business-guide#:\~:text=Local%20SEO%20for%20Small%20Business%3A,https\"\>\[12\]\</a\>
\<span class=\"title\"\>Local SEO for Small Business: Dominate Local
Search & Grow\</span\> \</div\> \<div class=\"citation-url\"\> \<a
href=\"https://inindiatech.com/next/local-seo-small-business-guide\"\>https://inindiatech.com/next/local-seo-small-business-guide\</a\>
\</div\> \</div\> \</div\> \<div class=\"citation\"\> \<div
class=\"citation-body\"\> \<div class=\"title_wrapper\"\> \<a
class=\"source\"
href=\"https://developers.google.com/search/docs/appearance/structured-data/local-business#:\~:text=Seasonal%20hours\"\>\[15\]\</a\>
\<a class=\"source\"
href=\"https://developers.google.com/search/docs/appearance/structured-data/local-business#:\~:text=,05%22\"\>\[21\]\</a\>
\<a class=\"source\"
href=\"https://developers.google.com/search/docs/appearance/structured-data/local-business#:\~:text=Seasonal%20hours\"\>\[31\]\</a\>
\<span class=\"title\"\>Local Business (LocalBusiness) Structured Data
\| Google Search Central  \|  Documentation  \|  Google for
Developers\</span\> \</div\> \<div class=\"citation-url\"\> \<a
href=\"https://developers.google.com/search/docs/appearance/structured-data/local-business\"\>https://developers.google.com/search/docs/appearance/structured-data/local-business\</a\>
\</div\> \</div\> \</div\> \<div class=\"citation\"\> \<div
class=\"citation-body\"\> \<div class=\"title_wrapper\"\> \<a
class=\"source\"
href=\"https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:\~:text=Structured%20Data%20for%20Seasonal%20Hours\"\>\[16\]\</a\>
\<a class=\"source\"
href=\"https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:\~:text=,01%22\"\>\[17\]\</a\>
\<a class=\"source\"
href=\"https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:\~:text=Schema,LD%20Format%20Example\"\>\[18\]\</a\>
\<a class=\"source\"
href=\"https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:\~:text=,23%22\"\>\[19\]\</a\>
\<a class=\"source\"
href=\"https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/#:\~:text=Structured%20Data%20for%20Holiday%20Hours\"\>\[20\]\</a\>
\<span class=\"title\"\>Schema Markup for Holiday Hours & Special Hours
with Examples\</span\> \</div\> \<div class=\"citation-url\"\> \<a
href=\"https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/\"\>https://authoritynw.com/blog/schema-markup-holiday-hours-special-hours/\</a\>
\</div\> \</div\> \</div\> \<div class=\"citation\"\> \<div
class=\"citation-body\"\> \<div class=\"title_wrapper\"\> \<a
class=\"source\"
href=\"https://schema.org/LocalBusiness#:\~:text=,Organization%C2%A0%20or\"\>\[22\]\</a\>
\<a class=\"source\"
href=\"https://schema.org/LocalBusiness#:\~:text=,commas%2C%20or%20by%20repeating%20the\"\>\[23\]\</a\>
\<a class=\"source\"
href=\"https://schema.org/LocalBusiness#:\~:text=,the%20business%2C%20for%20example\"\>\[24\]\</a\>
\<span class=\"title\"\>LocalBusiness - Schema.org Type\</span\>
\</div\> \<div class=\"citation-url\"\> \<a
href=\"https://schema.org/LocalBusiness\"\>https://schema.org/LocalBusiness\</a\>
\</div\> \</div\> \</div\> \</div\> \</body\> \</html\>
