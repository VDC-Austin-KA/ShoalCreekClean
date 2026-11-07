# Competitor Intelligence: Central Texas Exterior Cleaning

The data was retrieved on **2026-11-07**. The machine-readable dataset is [`data/competitors.json`](../data/competitors.json). It loads into the app at **Admin → Competitor intel** (`/admin/competitors`) and feeds the map's competitor and pricing layers.

## 1. Method and data rules

- **Sources.** The dataset covers 23 real operators.
  - **16 from their own websites.** Up to about 10 pages per site were downloaded: pricing, every service page, commercial, gallery, testimonials, about and service areas.
  - **7 from Thumbtack.** These operators were profiled from their marketplace pages, including review text. Thumbtack also supplied third-party review evidence for one of the website operators.
- **Verbatim prices only.** A price is recorded only if the company publishes it as its own price. Blog "industry average" figures, calculator defaults and customer-quoted amounts were excluded and logged in each record's notes. A sample of 9 recorded prices was re-checked against the downloaded page text, and all 9 matched verbatim.
- **Claimed vs. evidenced services.**
  - A service counts as **claimed** if the site lists it.
  - A service counts as **evidenced** only if actual work is shown. That means a captioned gallery photo, a case study, a named client, or a customer review that describes that job.
  - The **say/do gap** is the share of claimed services with no evidence.
- **Confidence rating.**
  - **High:** the operator publishes prices and shows real work.
  - **Medium:** the operator is real but thinly evidenced, or the data is marketplace-only.
  - **Low:** the site is a lead-gen marketplace or an SEO doorway, or its claims contradict each other. Low-confidence sources are shown in the app but **excluded from benchmarks**.
- **What was not done.**
  - Bot-protection walls were not bypassed. Enviro-Master and Squeegee Squad sit behind Cloudflare blocks, and CenTex Gutters timed out. These are listed in Appendix D.
  - No business was contacted under a false identity. Section 6 covers how to get real-time quotes honestly.

## 2. Key findings

1. **Almost nobody publishes commercial prices.**
   - Every commercial-positioned operator quotes after a site walk. That includes Newpoint, CleanTex, Bailey & Bear, FTF, Round Rock Pressure Washing, Hi-Tech, ATX Clean Pressure Washing and Clean Green.
   - The only published commercial figures are Georgetown Texas Power Wash's "typical ranges": $500–$2,500+ for a commercial building and $500–$1,500 for a lot or garage. ATX Clean Pressure Washing also lists about $299 per dumpster pad.
   - An **instant commercial estimate is an open lane**.
2. **Residential instant pricing is already contested.** Hi-Tech Power Wash publishes per-sq-ft rates *and* runs a 30-second online estimator. ATX Clean Pro Wash publishes "from" prices and bundles. Instant residential quoting is **not** a differentiator by itself.
3. **Commercial proof is thin across the market.**
   - Most commercial-positioned sites show **no commercial work evidence at all**. Newpoint, Bailey & Bear, Round Rock Pressure Washing and the doorway sites each have a 100% say/do gap.
   - Only Clean Green (about 10 commercial before/afters) and Bright Brothers (7 commercial gallery sets) document commercial jobs.
   - On Thumbtack, **1 of 52** reviews read was commercial, yet 5 pros list commercial work.
   - Timestamped, per-site photo proof therefore directly attacks the market's weakest claim.
4. **Residential entry prices are low and act as loss leaders.**
   - Driveways start at **$99–$200**, with a median of $100.
   - House washes start at **$199–$300**, with a median of $250.
   - Gutters start at **$99–$100**.
5. **Recurring plans and bundles are the established retention play.**
   - ATX Clean Pressure Washing sells plans at $39, $79 and $149 per month (annual, 12 payments).
   - ATX Soft Wash takes $50 off each cleaning on semi-annual plans and $100 off on quarterly plans.
   - ATX Clean Pro Wash sells $269, $449 and $599 bundles.
   - Hi-Tech runs weekly-to-quarterly commercial programs.
6. **Holiday lighting is the off-season revenue line.** Bright Brothers is a franchise in Leander. ATX Clean Pressure Washing charges $6–$8 per foot with a $500 minimum. Both use it to fill November–January, when washing demand drops.
7. **Many "competitors" are not operators.**
   - Clean Pro Gutter Cleaning is a national lead-gen marketplace based in Sioux Falls, SD.
   - Pressure Washer Austin (about 75 city/service pages, no reviews) and Leander Pressure Washing (an unfilled "since [YEAR]" placeholder) look like programmatic SEO pages.
   - These sites inflate how crowded the market looks in search results but compete only for clicks.

## 3. Our price book vs. the real market

The benchmarks below use medium- and high-confidence sources only. The full verbatim price list is in Appendix B.

| Service | Ours | Published market $/unit | "Starting at" job prices | Read |
|---|---|---|---|---|
| Commercial flatwork | $0.18/sq ft, $250 min | $0.15/sq ft (Flower Powerwash, residential flatwork) | $299 dumpster pad; $500+ lots | No published commercial $/sq ft exists. We sit slightly above the one residential rate. |
| Storefront / facade | $0.30/sq ft, $175 min | none published | $500+ commercial building (GTX range) | No benchmark. Log real quotes. |
| Driveway / patio | $0.22/sq ft, $150 min | $0.20/sq ft (Hi-Tech) | $99–$200, median $100 | ~10% over Hi-Tech's rate. Our $150 minimum is above the $99–$100 entry offers. |
| House soft wash | $0.28/sq ft, $300 min | $0.18/sq ft (Hi-Tech) | $199–$300, median $250 | **56% above the only published rate.** Our minimum is above the median entry price. |
| Roof soft wash | $0.35/sq ft, $350 min | $0.35/sq ft (Hi-Tech) | $300–$375 | At market. |
| Gutter cleaning | $1.40/lf, $200 min | $1.50/lf (Hi-Tech) | $99–$100 | Rate is at market. **Our minimum is double the entry offers.** |
| Sealing | $0.85/sq ft, $400 min | none published | none | No benchmark. |

**Sample size caveat.** Published per-unit rates come from **one or two operators per service**. Treat these as the *only verified data points*, not as statistically robust medians. Logged quotes (section 6) are how the sample grows.

### Pricing recommendations (partner decision, not yet applied)

- **House soft wash:** lower the rate from $0.28 to **$0.20–$0.22/sq ft** and keep a **$250 minimum**. This puts us at the market's median entry price while staying about 15% above Hi-Tech, which is justified by the photo-proof portal.
- **Gutters:** keep $1.40/lf but cut the minimum from $200 to **$150**. Alternatively, offer it only as a bundle add-on, as ATX Clean Pro Wash does with roof + gutter for $449.
- **Driveways:** keep $0.22/sq ft. Do **not** chase $99 entry offers. Instead, offer a house + driveway **bundle at about $299**, which sits between ATX Clean Pro Wash's $269 and Hi-Tech's minimum-plus-rate.
- **Commercial (flatwork, storefront):** keep current rates. There is no public price to undercut, so the edge is speed and proof. Calibrate with the first 10 logged commercial quotes.
- **Add a maintenance plan:** offer a monthly-billed annual plan. ATX Clean Pressure Washing's $39/$79/$149 tiers are the local reference points.

Rates can be changed in **Admin → Price book**. The competitor intel page immediately shows where each rate now sits against the market.

## 4. Strategy implications

- **Lead with commercial instant estimates plus photo-proof reporting.**
  - Competitors make property managers wait for a site walk and then show no evidence of the work. Our pitch is "price in 2 minutes, proof on every visit."
  - The CRM strategy generator and outreach playbook already use this angle.
- **Win HOA and retail RFPs on evidence.** Bring a portal demo and sample proof reports. Competitors claiming HOA and retail work (Round Rock Pressure Washing, Newpoint, CleanTex) show none.
- **Don't fight the $99 residential war.** Residential is a fill-in for crew downtime. Sell bundles and plans, not entry-level loss leaders.
- **Plan for November–January.** Either add holiday lighting (Phase 2), or schedule commercial deep-cleans, garages and dumpster pads into the slow season with a pre-holiday storefront campaign.
- **Pick partner targets.** Capable operators with weak commercial evidence are candidates for subcontract or overflow relationships, rather than head-to-head competition. Hill Country Pressure Wash (491 Thumbtack hires, residential) and A-Wil (0% say/do gap) are two examples.

## 5. Map layers

- The **Competitors** layer pins each operator to its published base city. The pin carries a stable offset because street addresses are rarely published, so placement is **city-level**. Out-of-market headquarters, such as the Sioux Falls lead-gen site, are not pinned.
- The **Pricing heat** layer shows each published per-sq-ft rate.

## 6. Getting real-time pricing (honestly)

Commercial prices are not published anywhere, so they have to be collected. All three channels below feed the `market_quotes` table, and the benchmarks pick them up automatically.

1. **Price-match on the instant quote.** Prospects can enter a competing company and price ("Have a quote from another company? We'll try to beat it."). Customers who are switching vendors volunteer exactly the data we need, with consent.
2. **Partner-logged quotes** (Admin → Competitor intel → Log quote). Partners log bids they receive for real properties they own or manage, and bid tabulations from public RFPs. City, county, ISD and HOA RFP results are often public records.
3. **Subcontract-rate outreach.** Ask local operators directly, as Shoal Creek Clean, for their subcontract or overflow rates. Many will share them because it is potential revenue for them.

**Not recommended:** posing as a customer under a false identity. It is deceptive to the businesses, it is a reputational risk in a small market where the partners will later bid against, partner with or hire from these companies, and channels 1–3 produce better data.

**Refreshing the dataset.** Re-run the collection quarterly. To edit the data directly, change `data/competitors.json`, then run `npm run db:setup`. This re-imports the dataset idempotently and keeps logged quotes.

## Appendix A — Operator roster

| Operator | Base | Type / focus | Confidence | Claimed | Evidenced | Say/do gap | Evidence basis |
|---|---|---|---|---|---|---|---|
| [ATX Clean Pressure Washing](https://powerwashaustin.com/) | Austin | local / mixed | high | 23 | 5 | 78% | 206 Google reviews embedded (4.9); 10 shown on page, all residential: house/exterior+driveway (3), hydraulic-fluid driveway stain (1), full  |
| [ATX Clean Pro Wash LLC](https://atxcleanprowash.com/) | Austin | local / residential | high | 9 | 5 | 44% | Gallery page lists 3 captioned items (Heavy Mildew Driveway, House Wash, Driveway Transformation = 2 driveway, 1 house wash). 6 Google-revie |
| [ATX Soft Wash](https://www.washaustin.com/) | Round Rock | local / residential | high | 12 | 10 | 17% | Reviews page: 35 customer reviews (all 5-star) with job detail: many window jobs (incl. one 3-story commercial building window cleaning, Hay |
| [Bright Brothers of North Austin](https://www.brightbrothersofnorthaustin.com/) | Leander | franchise / mixed | high | 17 | 12 | 29% | Before & After gallery: 156 sets total: House Washing 65, Walkway & Driveway 22, Pressure vs Soft Washing 18, Gutter Cleaning & Protection 1 |
| [Hi-Tech Power Wash](https://www.hitechpowerwash.com/) | Austin | local / mixed | high | 15 | 7 | 53% | Homepage gallery: 8 captioned tiles (house soft wash, driveway, limestone, paver patio, storefront, stone patio, brick column, concrete pati |
| [A-Wil Pressure Washing LLC](https://www.thumbtack.com/tx/pflugerville/pressure-washing/wil-pressure-washing-llc/service/398976076186116100) | Pflugerville | local / residential | medium | 3 | 3 | 0% | 5 Thumbtack reviews read: house_wash 1, driveway 3, fence_deck 2, patio 1, other 1 |
| [Capital Mobile Detailing & Pressure Washing Services](https://www.thumbtack.com/tx/austin/pressure-washing/capital-mobile-detailing-pressure-washing-services-we-deal-in-curb-appeal/service/213281996568765629) | Austin | local / residential | medium | 4 | 3 | 25% | 5 Thumbtack reviews read: house_wash 2, driveway 2, fence_deck 1, patio 1, other 2 |
| [Capitol Exterior Services](https://www.thumbtack.com/tx/austin/pressure-washing/capitol-city-exterior-cleaning/service/525100932123672588) | Austin | local / residential | medium | 7 | 3 | 57% | 5 Thumbtack reviews read: gutter 1, commercial 1, window 2, other 1 |
| [Clean Green Power Washing LLC](https://cleangreenpowerwashing.com/) | Austin | local / residential | medium | 22 | 16 | 27% | /service-our-work gallery: 52 before/after images with descriptive alt-text captions (not visible captions): ~10 commercial (apartment breez |
| [EverClean Exterior Cleaning](https://www.thumbtack.com/tx/georgetown/pressure-washing/everclean-exterior-cleaning/service/225326979079922935) | Georgetown | local / residential | medium | 6 | 3 | 50% | 5 Thumbtack reviews read: driveway 2, gutter 3, window 1, patio 1 |
| [Flower Powerwash](https://www.thumbtack.com/tx/austin/pressure-washing/flower-powerwash/service/467278990935719947) | Austin | local / residential | medium | 9 | 3 | 67% | 5 Thumbtack reviews read: house_wash 1, driveway 3, fence_deck 1, patio 2, other 1 |
| [Georgetown Texas Power Wash (GTX Power Wash)](https://georgetowntexaspowerwash.com/) | Georgetown | local / mixed | medium | 18 | 2 | 89% | Homepage 'Our Recent Work' is After/During/Videos tabs with no captions in HTML; Google reviews are a Trustindex widget not present in the d |
| [Hill Country Pressure Wash](https://www.thumbtack.com/tx/austin/pressure-washing/hill-country-pressure-wash/service/513732874630373381) | Austin | local / residential | medium | 8 | 2 | 75% | 5 Thumbtack reviews read: house_wash 2, driveway 2, patio 3 |
| [Plum Creek Exteriors](https://www.thumbtack.com/tx/kyle/pressure-washing/plum-creek-exteriors/service/577486636092260356) | Kyle | local / residential | medium | 9 | 3 | 67% | 6 Thumbtack reviews read: house_wash 1, driveway 1, window 5, patio 2 |
| [Round Rock Pressure Washing](https://pressurewashingroundrock.com/) | Round Rock | local / mixed | medium | 14 | 0 | 100% | No gallery, no testimonials, no named clients. About page states 'we do not post made-up reviews or photos'. Blog guides only. 0 evidenced. |
| [Bailey & Bear Commercial Cleaning](https://www.baileyandbearcleaning.com/pressure-washing-austin) | Austin | local / commercial | low | 16 | 0 | 100% | No gallery images, captions or pressure-washing testimonials seen (home has a '#gallery' anchor but text shows only 'Proof: Austin venues we |
| [Clean Pro Gutter Cleaning, LLC](https://cleanproguttercleaning.com/) | Sioux Falls | national / residential | low | 2 | 0 | 100% | Three one-line testimonials on Cedar Park page ('Ok', 'Very professional...', 'Mark the person that did the work was very good'); none descr |
| [CleanTex Pressure Washing](https://cleantexpressure.com/) | Austin | local / commercial | low | 15 | 5 | 67% | 6 anonymous testimonials (titles only, e.g. 'Restaurant Owner, South Lamar', 'HOA Board President, Cedar Park'): breezeway, common-area, dum |
| [For The Family Exterior Solutions (FTF)](https://www.ftfexteriorsolutions.com/) | Austin | local / mixed | low | 19 | 5 | 74% | /before-after: 8 captioned slider tiles + 1 featured job (concrete driveway): limestone house wall soft wash (1), storefront entry concrete  |
| [Leander Pressure Washing](https://leanderpressurewashing.com/) | Leander | local / mixed | low | 9 | 1 | 89% | Two generic first-name testimonials on the Cedar Park page ('Sarah J.', 'Mike & Jill T.'); only one mentions a job (driveway). 'Before & Aft |
| [Newpoint Services](https://www.newpointservices.com/) | Del Valle | national / commercial | low | 15 | 0 | 100% | Austin pages show 'Before & After Photos' slideshows (4-5 slides) with no captions or alt text; no testimonials, case studies or named clien |
| [Pressure Washer Austin](https://pressurewasheraustin.com/) | Austin | local / mixed | low | 16 | 0 | 100% | No gallery, testimonials, case studies or named clients on the two pages read; only a Trustpilot link. 0 evidenced. |
| [Round Rock Exteriors](https://www.roundrockexteriors.com/) | Round Rock | local / residential | low | 7 | 3 | 57% | Three first-name testimonials (Jennifer M. driveway; Tyler H. back patio; Sandra R. house, booked roof next). 'Before/After' section shows 3 |

## Appendix B — Every published price (verbatim, with source)

| Operator | Service | Price as published | Unit | Source |
|---|---|---|---|---|
| ATX Clean Pressure Washing | softwash_house | $300 to $700 - Most house washes run $300 to $700, depending on square footage ($300 minimum) | job | [link](https://powerwashaustin.com/house-washing-austin-tx/) |
| ATX Clean Pressure Washing | roof | $8.99 per roofing square - applied to the roof's square footage | roofing_square | [link](https://powerwashaustin.com/roof-cleaning-austin-tx/) |
| ATX Clean Pressure Washing | driveway | $200 to $400, by size for a standard driveway clean | job | [link](https://powerwashaustin.com/driveway-cleaning-austin-tx/) |
| ATX Clean Pressure Washing | other:rust_removal | Rust stain removal is priced per stain: $249 minimum | job | [link](https://powerwashaustin.com/rust-removal-austin-tx/) |
| ATX Clean Pressure Washing | solar | $199 to $299 for most residential solar panel cleanings | job | [link](https://powerwashaustin.com/solar-panel-cleaning-austin-tx/) |
| ATX Clean Pressure Washing | holiday_lighting | Residential runs $6 to $8 per foot, with a $500 minimum | lf | [link](https://powerwashaustin.com/christmas-light-installation-austin-tx/) |
| ATX Clean Pressure Washing | dumpster_pad | Around $299 per pad area - typically around $299 per pad area | job | [link](https://powerwashaustin.com/dumpster-pad-cleaning-austin-tx/) |
| ATX Clean Pressure Washing | other:maintenance_plan_basic | Basic $39/mo, 12 monthly payments, $468 total (1x house soft wash, 1x front-entry wash, 2x spot treatments, 2x inspectio | month | [link](https://powerwashaustin.com/maintenance-plans/) |
| ATX Clean Pressure Washing | other:maintenance_plan_standard | Standard $79/mo, $948 total (1x house wash, 1x driveway, 2x window & screen cleanings) | month | [link](https://powerwashaustin.com/maintenance-plans/) |
| ATX Clean Pressure Washing | other:maintenance_plan_premium | Premium $149/mo, $1,788 total (1x house wash, 1x driveway, 1x sidewalk, 4x window, 1x patio furniture) | month | [link](https://powerwashaustin.com/maintenance-plans/) |
| ATX Clean Pro Wash LLC | softwash_house | House washing single-story, from $199 | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | driveway | Driveway & walkway, from $99 | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | roof | Roof cleaning soft wash, from $375 | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | gutter | Gutter cleaning, from $99 | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | window | Windows exterior, from $150 (screens +$30) | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | window | Windows interior + exterior, from $249 | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | deck_fence | Deck & patio, from $149 | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | deck_fence | Fence & siding, from $199 | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | other:car_detailing | Car detailing mobile, from $149 | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | other:bundle | Bundle House + Driveway: $269 (flat) | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | other:bundle | Bundle Pre-Listing Curb Appeal (house, driveway, ext windows, deck/patio, front fence): $599 (flat) | job | [link](https://atxcleanprowash.com/pricing/) |
| ATX Clean Pro Wash LLC | other:bundle | Bundle Roof + Gutter: $449 (flat) | job | [link](https://atxcleanprowash.com/pricing/) |
| Hi-Tech Power Wash | softwash_house | house soft washing $0.18 per sq ft | sqft | [link](https://www.hitechpowerwash.com/) |
| Hi-Tech Power Wash | driveway | driveways, concrete and patios $0.20 per sq ft | sqft | [link](https://www.hitechpowerwash.com/services/driveway-cleaning) |
| Hi-Tech Power Wash | roof | Roof soft washing is $0.35 per square foot of roof area, so a 2,000 sq ft roof is around $700 | sqft | [link](https://www.hitechpowerwash.com/services/roof-washing) |
| Hi-Tech Power Wash | deck_fence | decks and fences $0.30 per sq ft | sqft | [link](https://www.hitechpowerwash.com/) |
| Hi-Tech Power Wash | other:limestone_cleaning | Limestone cleaning is $0.40 per square foot, with a $250 minimum service charge | sqft | [link](https://www.hitechpowerwash.com/) |
| Hi-Tech Power Wash | gutter | gutter cleaning $1.50 per linear ft | lf | [link](https://www.hitechpowerwash.com/) |
| Flower Powerwash | flatwork | Flatwork is prices at 15 cents per sq ft | sqft | [link](https://www.thumbtack.com/tx/austin/pressure-washing/flower-powerwash/service/467278990935719947) |
| Georgetown Texas Power Wash (GTX Power Wash) | softwash_house | House Washing $250 - $600 (Austin pricing guide, 2025; 'typical price range') | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | driveway | Driveway Cleaning $100 - $250 | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | roof | Roof Cleaning $300 - $700 | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | deck_fence | Deck Cleaning $150 - $350 | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | deck_fence | Fence Cleaning $100 - $300 | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | gutter | Gutter Cleaning $100 - $200 | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | building_wash | Commercial Building $500 - $2,500+ ('priced by square footage') | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | parking_garage | Parking Lot / Garage $500 - $1,500 ('priced by square footage') | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | flatwork | Sidewalk Cleaning $100 - $300 ('Per 100 linear feet') | per_100lf | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | graffiti | Graffiti Removal $150 - $500 | job | [link](https://georgetowntexaspowerwash.com/pressure-washing-austin-texas/) |
| Georgetown Texas Power Wash (GTX Power Wash) | window | Window Cleaning $150 - $400 (Georgetown table) | job | [link](https://georgetowntexaspowerwash.com/) |
| Georgetown Texas Power Wash (GTX Power Wash) | softwash_house | House Soft Washing $250 - $600 (Georgetown table) | job | [link](https://georgetowntexaspowerwash.com/) |
| Clean Pro Gutter Cleaning, LLC ⚠︎ | gutter | Gutter Cleaning single-story standard: Starting at $249 - $299 | job | [link](https://cleanproguttercleaning.com/gutter-cleaning-cedar-park-tx/) |
| Clean Pro Gutter Cleaning, LLC ⚠︎ | gutter | Gutter Cleaning two-story: Starting at $299 - $399 | job | [link](https://cleanproguttercleaning.com/gutter-cleaning-cedar-park-tx/) |
| Clean Pro Gutter Cleaning, LLC ⚠︎ | gutter | Gutter Cleaning multi-level estate: Starting at $399 - $499 | job | [link](https://cleanproguttercleaning.com/gutter-cleaning-cedar-park-tx/) |
| Clean Pro Gutter Cleaning, LLC ⚠︎ | other:gutter_guard_install | $22.50 per linear foot installed (Clean Pro Guard) | lf | [link](https://cleanproguttercleaning.com/) |
| Leander Pressure Washing ⚠︎ | driveway | Driveway Pressure Washing, Package Starts at $99.00 | job | [link](https://leanderpressurewashing.com/) |
| Leander Pressure Washing ⚠︎ | softwash_house | Residential House Washing, Package Starts at $149.00 | job | [link](https://leanderpressurewashing.com/) |
| Leander Pressure Washing ⚠︎ | deck_fence | Decks & Patios Washing, Package Starts at $199.00 | job | [link](https://leanderpressurewashing.com/) |
| Leander Pressure Washing ⚠︎ | flatwork | 'Commercial Power Wash' Package Starts at $299.00 (description is about concrete/stone/paver patios) | job | [link](https://leanderpressurewashing.com/) |
| Pressure Washer Austin ⚠︎ | softwash_house | House Washing Round Rock: 'starts at $400 for a standard 1,500-2,500 sq ft home'; two-story 'typically run $500-$700' | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Pressure Washer Austin ⚠︎ | driveway | Driveway Cleaning From $140 | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Pressure Washer Austin ⚠︎ | deck_fence | Deck & Patio Cleaning From $80 | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Pressure Washer Austin ⚠︎ | roof | Roof Cleaning From $350 | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Pressure Washer Austin ⚠︎ | deck_fence | Fence Cleaning From $150 | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Pressure Washer Austin ⚠︎ | flatwork | Concrete Cleaning From $120 | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Pressure Washer Austin ⚠︎ | gutter | Gutter Cleaning From $150 | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Pressure Washer Austin ⚠︎ | other:pool_deck | Pool Deck Cleaning From $200 | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Pressure Washer Austin ⚠︎ | graffiti | Graffiti Removal From $200 | job | [link](https://pressurewasheraustin.com/house-washing-round-rock-tx) |
| Round Rock Exteriors ⚠︎ | driveway | Driveway & Concrete, Starting at $150 | job | [link](https://www.roundrockexteriors.com/) |
| Round Rock Exteriors ⚠︎ | softwash_house | House Washing, Starting at $200 | job | [link](https://www.roundrockexteriors.com/) |
| Round Rock Exteriors ⚠︎ | deck_fence | Wood & Composite Decks, Starting at $175 | job | [link](https://www.roundrockexteriors.com/) |
| Round Rock Exteriors ⚠︎ | roof | Roof Soft Washing, Starting at $300 | job | [link](https://www.roundrockexteriors.com/) |
| Round Rock Exteriors ⚠︎ | window | Window Cleaning (Coming Soon), Starting at $125 | job | [link](https://www.roundrockexteriors.com/) |
| Round Rock Exteriors ⚠︎ | gutter | Gutter Cleaning (Coming Soon), Starting at $100 | job | [link](https://www.roundrockexteriors.com/) |

⚠︎ = low-confidence source, shown for completeness but excluded from benchmarks.

## Appendix C — Strategies observed

- **ATX Clean Pressure Washing**: Free estimates; commercial = free site walk + written proposal; residential 30% deposit with card on file; Make-It-Right Satisfaction Guarantee; $2M general liability + $5M umbrella; OSHA-trained, background-checked techs; COI, W-9, references on request; Most jobs scheduled within 72 hours, same-day possible; answers around the clock; after-hours/overnight for commercial; Text/email confirmations, prep flyer, before/after photos; Recurring commercial contracts (weekly to annual) with better per-visit rate; residential 12-month plans $39/$79/$149 per month, 5-20% add-on discounts; Bundle discount: Standard ~5%, Premium ~10% (residential); Claims 4.9 stars / 200+ Google reviews; 'since 2017, official May 2021'
- **ATX Clean Pro Wash LLC**: Free quote, usually same day; written firm quote valid 30 days; Starting prices cover typical single-story; pricing FAQ says about 60% of jobs land within $50 of the start price; Flat-priced bundles; Licensed & insured, general liability, COI on request; Final walk-through, fix on the spot; Claims 5.0 / 50+ Google reviews; Claims 96% of first-time clients rebook within 12 months and 24h average quote-to-job turnaround (unverified); No subcontractors
- **ATX Soft Wash**: Free quote / complimentary assessment; 14-day no-clog gutter guarantee (free return); 7-day rain guarantee on windows, rain block deionized water, free hard-water removal; Maintenance plans: semi-annual $50 off each cleaning; quarterly $100 off each cleaning (window cleaning page); Licensed & insured, 100% satisfaction, 'warrantied service'; Claims 700+ reviews across Google, Facebook, Yelp, Nice Job; Text when en route; 24-hour service in one review
- **Bright Brothers of North Austin**: Free no-obligation estimate; Triple-certified technicians (product safety, application, ladder safety); Property Protection Plan; Financing page offered; 2025 Angi Super Service Award; RainDrop Pro gutter guard authorized dealer; Franchise (franchisee location 2502, Bright Brothers Group LLC); year-round residential + commercial; Claims 'only 5 star reviews on Google' (customer quote)
- **Hi-Tech Power Wash**: Published residential per-sqft rates + 30-second online instant estimator; Free written itemized commercial quote; commercial priced on-site only; Recurring maintenance programs (weekly/monthly/quarterly/seasonal) at set price; After-hours/overnight/weekend scheduling; Certificate of insurance available; general liability on every job; Hot water equipment for grease/gum; Claims 5.0 Google rating, 100+ five-star reviews, 10+ years (since 2015); Responds to estimate requests within 1 business day
- **A-Wil Pressure Washing LLC**: Thumbtack 5.0★ · 60 reviews · 79 hires · 7 yrs
- **Capital Mobile Detailing & Pressure Washing Services**: Thumbtack 5.0★ · 121 reviews · 159 hires · 24 yrs; $20 off to Law Enforcement; $25 off for Veterans and First Responders; $25 off for Returning Customers
- **Capitol Exterior Services**: Thumbtack 5.0★ · 9 reviews · 5 hires · 2 yrs
- **Clean Green Power Washing LLC**: Free on-site quotes with clear scope; quote from a visit or photos; Founded 2018 by Bryan Gerhold; 100% satisfaction guarantee on commercial jobs; Eco-friendly / low-pressure soft wash claims; Mon-Sat 8am-8pm; Walkthrough before work; final check before crew leaves; Hiring page (Apply Now)
- **EverClean Exterior Cleaning**: Thumbtack 4.8★ · 40 reviews · 60 hires · 14 yrs
- **Flower Powerwash**: Thumbtack 5.0★ · 48 reviews · 67 hires · 4 yrs; Siding and roofs are variable - based on single/double story and size.
- **Georgetown Texas Power Wash (GTX Power Wash)**: Free written estimate; 100% satisfaction guarantee; GL insurance + workers comp; direct employees, no subs; Claims 4.8 stars, 33 (Austin page) / 37 (homepage) Google reviews; '#1 of 33 competitors' via Semrush avg rank 1.04; Since 2019; Same/next-day service; 'Open 24 hours'; Eco-friendly biodegradable solutions; HOA exterior programs
- **Hill Country Pressure Wash**: Thumbtack 4.9★ · 234 reviews · 491 hires · 7 yrs; Ask about our CURRENT PROMO: $25 OFF for New Customers.
- **Plum Creek Exteriors**: Thumbtack 5.0★ · 49 reviews · 23 hires
- **Round Rock Pressure Washing**: Free firm written quote (photos, 60-second form); 7-day clean guarantee (re-clean at no charge); Insured, COI on request; Free site walk and written proposal for HOA/commercial; one-time, seasonal or recurring; Works early morning/evenings/weekends for commercial; Bundling saves (combined quote); Mon-Sat 7-6
- **Bailey & Bear Commercial Cleaning**: Free quote after walkthrough; written scope, fixed price in writing before work; 'No published per-square-foot rate'; flat per-visit quoting; 60-second quote form; photo-based scoping; Insured, COI on request; $1M per occurrence / $2M aggregate GL (commercial-cleaning page); Claims 5.0 stars on Google; Off-hours work; test patch before full wash; before/after photos; Wash-water containment / runoff plan stated at walkthrough; Recurring or one-time; interval-based programs with two frequencies per quote
- **Clean Pro Gutter Cleaning, LLC**: Satellite-measured firm quote in 15 minutes; 30-day workmanship warranty; Flat-rate, final invoice matches quote; Contractors carry $1M GL / $2M aggregate; 0% APR financing via Wisetack (gutter guards); Claims 4.9 stars from 3,727+ customers, 100K+ jobs, '25 Years in Business' (same site also says 'pioneered ... in 2012'); Recommends 3 cleanings/yr in Cedar Park
- **CleanTex Pressure Washing**: Quote-based; free property walk and written quote within 24 hours; $2M general liability; same-day COI 'typically within 12 minutes'; Pre-approved on major Austin property-management vendor lists (claim); 90-day published service calendar; photo report after every visit; same lead crew; Recurring maintenance plans with simple monthly billing; Reschedule within 5 business days at no charge if rain; Hot water + degreaser for dumpster pads; 'health-inspector-ready documentation'; Eco-friendly biodegradable solutions
- **For The Family Exterior Solutions (FTF)**: 'Free - Fast - Flat-Rate' quote; flat-rate quote after site walkthrough; reply within one business day; Monthly or quarterly maintenance contracts with locked-in pricing and priority scheduling; Night/early-morning/weekend work; Before/after photo reports for property managers; General liability insurance; COI on request; Hot water units, surface cleaners; degreasing/gum/graffiti; 'Never collect until you are happy' / not a franchise / meet the owner; Claims 500+ homes cleaned, 7+ cities, 1-day avg quote reply
- **Leander Pressure Washing**: Free instant quote / price calculator; 100% satisfaction guarantee; Licensed & insured, COI offered; Same-day estimates, same-week appointments; Claims 500+ customers and 4.9 stars (Cedar Park page); Regular maintenance plans annual/quarterly (no pricing)
- **Newpoint Services**: Free no-obligation quote form; Trailer-mounted 3,500 PSI at 220F units with water reclaim/recycle (claimed); Cyclone 5500 drivable unit for large lots; Biodegradable cleaning agents claim; Sweeping/porter/parking-facility bundle; 'Hundreds of businesses' served (generic claim); Staff background in hospitality (About page)
- **Pressure Washer Austin**: Free estimates; Licensed & insured; 100% money-back guarantee; pay only after approval; Same-day / next-day scheduling; Hours Mon-Sat 7-7, Sun 8-5; Commercial: custom quote, works with property managers/HOAs/business owners
- **Round Rock Exteriors**: Founding Customer Offer: 30% OFF first 10 customers ('7 spots left'); Free quote, response within hours; 100% satisfaction, re-clean at no charge; Fully insured; Claims 200+ jobs, 5.0 Google rating, 1-day avg response; Mon-Sat 8-6; before/after photos sent; digital payment; 'Trusted since 2024'

## Appendix D — Unreachable during collection

- Centex Gutters (https://www.centexgutters.com/): Download failed twice for both https://www.centexgutters.com/gutter-cleaning-cedar-park-texas.php and https://www.centexgutters.com/ (curl exit 56, connection r
- Enviro-Master (Austin, RPS Commercial Pressure Washing Services) (https://enviro-master.com/commercial-cleaning-locations/austin-texas/rps-commercial-pressure-washing-services): Unreachable: the single GET returned a Cloudflare 'Sorry, you have been blocked' page (Ray ID a56a3d3a0da055eb; 5.6 KB, no content). A second attempt with a bro
- Squeegee Squad (Central Austin) (https://squeegeesquad.com/central-austin-tx/): Requested URL returned a Cloudflare 'Sorry, you have been blocked' page (host wpenginepowered.com); no content extracted. Did not attempt to bypass. 'kind' left
