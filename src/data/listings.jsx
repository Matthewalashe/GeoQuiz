// Wanda - Lagos Seed Listings (50 real places)

import { LISTING_IMAGES } from './siteAssets.js'
import {
  SearchRegular, FoodPizzaRegular, BuildingMultipleRegular,
  LocationRegular, DrinkMargaritaRegular, TreeDeciduousRegular,
  TicketDiagonalRegular, StarRegular, ShoppingBagRegular
} from '@fluentui/react-icons'
const L = (id,name,cat,sub,area,price,rating,phone,wa,web,ig,hours,lat,lng,desc,tags) =>
  ({id,name,category:cat,subcategory:sub,area,priceRange:price,rating,phone,whatsapp:wa,website:web,instagram:ig,hours,lat,lng,description:desc,tags,photos: LISTING_IMAGES[id]?.length ? LISTING_IMAGES[id] : [`/images/listings/${id}.jpg`],status:'approved'})

const N1 = '\u20A6'
const N2 = '\u20A6\u20A6'
const N3 = '\u20A6\u20A6\u20A6'
const N4 = '\u20A6\u20A6\u20A6\u20A6'

export const LISTINGS = [
  // RESTAURANTS
  L('nok-vi','Nok by Alara','restaurant','Fine Dining','Victoria Island',N4,4.7,'08012345678','08012345678','https://alaralagos.com','@alaralagos','Mon-Sun 12PM-11PM',6.4308,3.4235,'Upscale pan-African fine dining in a stunning architectural space on Victoria Island. Known for jollof risotto and cocktails.',['fine dining','african','date night']),
  L('terra-kulture','Terra Kulture','restaurant','Nigerian','Victoria Island',N3,4.5,'08023456789','08023456789','https://terrakulture.com','@terrakulture','Mon-Sun 10AM-10PM',6.4281,3.4218,'Art gallery meets restaurant. Nigerian cuisine with live performances on weekends. The pepper soup is legendary.',['nigerian','art','live music']),
  L('bungalow-ikoyi','The Bungalow','restaurant','International','Ikoyi',N4,4.6,'08034567890','08034567890','https://thebungalow.ng','@thebungalowlagos','Tue-Sun 5PM-2AM',6.4486,3.4388,'Waterfront dining on the Lagos Lagoon. Sushi, grills, and cocktails under the stars.',['waterfront','sushi','cocktails']),
  L('mama-cass','Mama Cass','restaurant','Nigerian','Adeniran Ogunsanya',N2,4.3,'08045678901','08045678901','','@mamacassng','Mon-Sun 8AM-10PM',6.4522,3.3617,'The queen of Nigerian comfort food. Amala, pounded yam, egusi - all served fast and fresh since 1985.',['amala','local','affordable']),
  L('hardrock','Hard Rock Cafe','restaurant','American','Landmark Village',N3,4.2,'08056789012','08056789012','https://hardrockcafe.com','@hardrockcafelagos','Mon-Sun 11AM-11PM',6.4312,3.4520,'Iconic American diner chain on the Victoria Island waterfront. Burgers, wings, and live music memorabilia.',['burgers','american','family']),
  L('bukka-hut','Bukka Hut','restaurant','Nigerian','Lekki',N2,4.4,'08067890123','08067890123','','@bukkahut','Mon-Sun 7AM-10PM',6.4489,3.4714,'Modern Nigerian food in a clean, fast-casual setting. Try the ofada rice with ayamase sauce.',['nigerian','fast casual','ofada']),
  L('craft-gourmet','Craft Gourmet','restaurant','Cafe','Lekki Phase 1',N3,4.5,'08078901234','08078901234','','@craftgourmetng','Mon-Sat 8AM-9PM',6.4461,3.4748,'Artisan cafe with wood-fired pizzas, specialty coffee, and gorgeous plating. Brunch heaven.',['cafe','brunch','pizza']),
  L('sky-restaurant','Sky Restaurant and Lounge','restaurant','Rooftop','Eko Atlantic',N4,4.3,'08089012345','08089012345','','@skyrestaurantlagos','Wed-Sun 6PM-2AM',6.4145,3.4063,'Rooftop dining 20 floors up with panoramic views of the Atlantic Ocean. Premium cocktails and seafood.',['rooftop','views','seafood']),

  // HOTELS
  L('eko-hotel','Eko Hotels and Suites','hotel','5-Star','Victoria Island',N4,4.5,'08090123456','08090123456','https://ekohotels.com','@ekohotels','24/7',6.4285,3.4190,'Lagos flagship luxury hotel since 1977. Convention center, multiple restaurants, private beach. 824 rooms.',['luxury','beach','convention']),
  L('radisson-blu','Radisson Blu Anchorage','hotel','5-Star','Victoria Island',N4,4.6,'08001234567','08001234567','https://radissonhotels.com','@radissonblu_lagos','24/7',6.4341,3.4283,'Modern waterfront hotel on the Ozumba Mbadiwe strip. Rooftop pool, spa, and business center.',['waterfront','pool','business']),
  L('wheatbaker','The Wheatbaker','hotel','Boutique','Ikoyi',N4,4.7,'08012345670','08012345670','https://thewheatbakerhotel.com','@thewheatbaker','24/7',6.4508,3.4327,'Award-winning boutique hotel in Ikoyi. Art-filled rooms, artisan restaurant, and curated Nigerian art collection.',['boutique','art','upscale']),
  L('oriental-hotel','Lagos Oriental Hotel','hotel','5-Star','Lekki',N4,4.4,'08023456780','08023456780','https://lagosoriental.com','@lagosorientalhotel','24/7',6.4402,3.4565,'Chinese-inspired luxury hotel on the Lekki-Epe Expressway. Infinity pool with lagoon views.',['luxury','pool','lagoon']),
  L('southern-sun','Southern Sun Ikoyi','hotel','4-Star','Ikoyi',N3,4.3,'08034567800','08034567800','https://southernsun.com','@southernsunikoyi','24/7',6.4499,3.4395,'South African hotel brand bringing reliable comfort to Ikoyi. Great for business travelers.',['business','reliable','central']),
  L('bogobiri','Bogobiri House','hotel','Boutique','Ikoyi',N3,4.5,'08045678900','08045678900','https://bogobiri.com','@bogobirihouse','24/7',6.4540,3.4350,'Artsy boutique guesthouse with jazz nights, poetry slams, and a gallery. Not a typical hotel.',['boutique','jazz','art']),

  // ATTRACTIONS
  L('nike-art','Nike Art Gallery','attraction','Museum','Lekki',N1,4.8,'08056789000','08056789000','https://nikeart.com','@nikeartgallery','Mon-Sun 9AM-7PM',6.4371,3.5372,'Largest art gallery in West Africa. 5 floors, 8000+ artworks. Textiles, paintings, sculptures. Free entry.',['art','museum','free']),
  L('lekki-conservation','Lekki Conservation Centre','attraction','Nature','Lekki',N2,4.6,'08067890100','08067890100','https://ncf.org.ng','@likiconservation','Mon-Sun 8:30AM-5PM',6.4444,3.5340,'Nature reserve with the longest canopy walkway in Africa (401m). Spot monkeys, crocodiles, and rare birds.',['nature','canopy','wildlife']),
  L('national-theatre','National Theatre','attraction','Landmark','Surulere',N1,4.2,'08078901200','08078901200','','@nationaltheatre_ng','Mon-Sat 9AM-5PM',6.4714,3.3877,'Nigeria\'s iconic performing arts venue shaped like a military cap. Built for FESTAC 77. Cultural landmark.',['landmark','theatre','history']),
  L('freedom-park','Freedom Park','attraction','Historical','Lagos Island',N1,4.4,'08089012300','08089012300','https://freedomparklagos.com','@freedompark_lagos','Mon-Sun 10AM-10PM',6.4531,3.3906,'Former colonial prison converted into a cultural hub. Live music, art exhibitions, and open-air events.',['history','music','events']),
  L('new-afrika-shrine','New Afrika Shrine','attraction','Music','Ikeja',N1,4.7,'08090123400','08090123400','','@newafrikashrine','Thu-Sun 7PM-4AM',6.6024,3.3467,'Fela Kuti\'s legendary music venue, now run by his sons. Live Afrobeat every weekend. A Lagos institution.',['fela','afrobeat','live music']),
  L('olumo-rock','Olumo Rock','attraction','Landmark','Abeokuta',N2,4.5,'08001234500','08001234500','','@olumorockresort','Mon-Sun 8AM-6PM',7.1543,3.3448,'Ancient granite rock fortress used during the 19th-century inter-tribal wars. 137m high with panoramic views.',['landmark','history','hiking']),
  L('badagry-heritage','Badagry Heritage Museum','attraction','Museum','Badagry',N1,4.3,'08012345600','08012345600','','@badagryheritage','Mon-Sat 9AM-5PM',6.4181,2.8836,'Sobering museum documenting the trans-Atlantic slave trade through Badagry\'s role as a major port.',['museum','history','heritage']),
  L('tarkwa-bay','Tarkwa Bay Beach','attraction','Beach','Lagos Island',N2,4.4,'','','','','Mon-Sun 7AM-6PM',6.4048,3.3902,'Sheltered beach accessible only by boat. Clean water, horse riding, local food vendors. A hidden gem.',['beach','boat','swimming']),

  // NIGHTLIFE
  L('club-quilox','Club Quilox','nightlife','Club','Victoria Island',N4,4.1,'08023456700','08023456700','','@clubquilox','Thu-Sun 10PM-6AM',6.4316,3.4238,'Lagos\' most famous nightclub. Celebrity sightings, champagne showers, and Afrobeats all night.',['nightclub','vip','afrobeats']),
  L('hard-rock-live','Hard Rock Cafe Live','nightlife','Bar','Victoria Island',N3,4.3,'08034567800','08034567800','','@hardrockcafelagos','Wed-Sun 8PM-2AM',6.4312,3.4520,'Live music venue with rock memorabilia. Cocktails, burgers, and weekend concerts.',['live music','cocktails','bar']),
  L('shiro-lagos','Shiro Lagos','nightlife','Lounge','Victoria Island',N4,4.4,'08045678900','08045678900','','@shirolagos','Tue-Sun 6PM-2AM',6.4292,3.4205,'Pan-Asian restaurant by night, upscale lounge by late night. Signature cocktails and sushi rolls.',['lounge','asian','cocktails']),
  L('cactus-restaurant','Cactus','nightlife','Bar and Grill','Lekki Phase 1',N3,4.2,'08056789000','08056789000','','@cactus_lagos','Mon-Sun 4PM-12AM',6.4468,3.4729,'Relaxed outdoor bar and grill. Great for after-work drinks with a Lagos sunset backdrop.',['outdoor','grill','sunset']),

  // PARKS
  L('jhalobia-park','Jhalobia Recreation Park','park','Family','Ikeja',N2,4.3,'08067890100','08067890100','','@jhalobi_park','Mon-Sun 9AM-6PM',6.6125,3.3180,'Family-friendly park with a zoo, swimming pool, and garden. Perfect for weekend outings with kids.',['family','zoo','swimming']),
  L('muri-okunola','Muri Okunola Park','park','Urban','Victoria Island',N1,4.1,'','','','','Mon-Sun 7AM-7PM',6.4329,3.4272,'Green oasis in the heart of VI. Jogging paths, events space, and a playground. Free entry.',['urban park','jogging','free']),
  L('ikoyi-golf','Ikoyi Club Golf Section','park','Sports','Ikoyi',N4,4.6,'08078901200','08078901200','https://ikoyiclub.com','@ikoyiclub1938','Mon-Sun 6AM-7PM',6.4534,3.4405,'Exclusive 18-hole golf course and social club. Tennis courts, swimming pool, and fine dining.',['golf','sports','exclusive']),
  L('eleko-beach','Eleko Beach','park','Beach','Lekki',N1,4.2,'','','','','Mon-Sun 8AM-6PM',6.4142,3.6254,'Quiet, less-crowded alternative to Elegushi. Popular with surfers and families. Local food stalls.',['beach','surfing','family']),

  // CULTURE
  L('terra-gallery','Terra Kulture Gallery','culture','Gallery','Victoria Island',N1,4.5,'08089012300','08089012300','https://terrakulture.com','@terrakulture','Mon-Sun 10AM-10PM',6.4281,3.4218,'Art gallery and performance space. Regular exhibitions, book launches, and Nollywood screenings.',['gallery','art','nollywood']),
  L('thought-pyramid','Thought Pyramid Art Centre','culture','Gallery','Ikoyi',N1,4.4,'08090123400','08090123400','','@thoughtpyramid','Tue-Sat 10AM-6PM',6.4518,3.4362,'Contemporary art space showcasing emerging and established Nigerian artists. Rotating exhibitions.',['contemporary art','gallery','exhibitions']),
  L('red-door-gallery','Red Door Gallery','culture','Gallery','Ikoyi',N1,4.3,'08001234500','08001234500','','@reddoorgalleryng','Mon-Fri 10AM-5PM',6.4495,3.4378,'Photography-focused gallery space. Hosts the annual Lagos Photo Festival.',['photography','gallery','festival']),
  L('national-museum','National Museum Lagos','culture','Museum','Onikan',N1,4.1,'08012345600','08012345600','','@nationalmuseum_ng','Mon-Fri 9AM-5PM',6.4505,3.3960,'Federal museum housing archaeological artifacts, Benin bronzes, and contemporary Nigerian art.',['museum','history','bronzes']),

  // EXPERIENCES
  L('inagbe-resort','Inagbe Grand Resort','experience','Island Resort','Inagbe Island',N3,4.3,'08023456700','08023456700','https://inagberesort.com','@inagbe_resort','24/7',6.4050,3.2640,'Private island resort accessible by boat. Beach cabanas, fishing trips, and full-board packages.',['island','resort','getaway']),
  L('lekki-market','Lekki Arts and Crafts Market','experience','Shopping','Lekki',N1,4.5,'','','','@lekkimarket','Mon-Sun 9AM-6PM',6.4384,3.4713,'Open-air market with Nigerian art, textiles, jewelry, and woodcarvings. Bargaining expected!',['market','crafts','souvenirs']),
  L('kalakuta-museum','Kalakuta Museum','experience','Tour','Ikeja',N2,4.6,'08034567800','08034567800','','@kalakutamuseum','Mon-Sat 10AM-5PM',6.5956,3.3485,'Fela Kuti\'s former home turned museum. Personal artifacts, photos, and history of Afrobeat.',['fela','museum','tour']),
  L('boat-cruise','Lagos Lagoon Boat Cruise','experience','Tour','Victoria Island',N3,4.4,'08045678900','08045678900','','@lagosboatcruise','Sat-Sun 2PM-6PM',6.4285,3.4190,'Weekend boat cruise on the Lagos Lagoon. DJ, drinks, and sunset views of the city skyline.',['boat','cruise','sunset']),
  L('cooking-class','Iya Oloja Cooking Class','experience','Food','Yaba',N2,4.7,'08056789000','08056789000','','@iyaoloja_cooking','Sat 10AM-2PM',6.5155,3.3791,'Learn to cook authentic Nigerian dishes - jollof rice, suya, puff puff - with a master chef.',['cooking','food','class']),

  // SHOPPING
  L('palms-lekki','The Palms Shopping Centre','shopping','Mall','Lekki',N3,4.4,'08067890100','08067890100','https://thepalmsng.com','@thepalmsmall','Mon-Sun 9AM-9PM',6.4328,3.4752,'Premier shopping destination with cinema, food court, and international brands.',['mall','cinema','shopping']),
  L('ikeja-city-mall','Ikeja City Mall','shopping','Mall','Ikeja',N2,4.3,'08078901200','08078901200','https://ikejacitymall.com','@ikejacitymall','Mon-Sun 9AM-9PM',6.6088,3.3384,'Largest mall in Lagos mainland. Shoprite, Game, and over 70 stores.',['mall','shoprite','mainland']),
  L('alaba-market','Alaba International Market','shopping','Market','Ojo',N1,3.9,'','','','','Mon-Sat 7AM-6PM',6.4565,3.1881,'West Africa\'s largest electronics market. Phones, TVs, generators - everything at wholesale prices.',['electronics','market','wholesale']),
  L('balogun-market','Balogun Market','shopping','Market','Lagos Island',N1,4.0,'','','','','Mon-Sat 7AM-7PM',6.4483,3.3938,'The most famous fabric and fashion market in Lagos. Ankara, lace, aso-oke - come ready to bargain.',['fabric','fashion','market']),
  L('computer-village','Computer Village','shopping','Tech Market','Ikeja',N1,4.1,'','','','','Mon-Sat 8AM-6PM',6.6075,3.3520,'Africa\'s largest open-air technology market. 5000+ shops selling phones, laptops, and accessories.',['tech','phones','laptops']),

  // MORE ATTRACTIONS
  L('elegushi-beach','Elegushi Beach','attraction','Beach','Lekki',N2,4.1,'08089012300','08089012300','','@elegushibeach','Mon-Sun 8AM-11PM',6.4214,3.4809,'The most popular beach in Lagos. Live DJs on weekends, horse riding, bonfires, and beachside suya.',['beach','dj','party']),
  L('landmark-centre','Landmark Event Centre','attraction','Events','Victoria Island',N3,4.5,'08090123400','08090123400','https://landmarkcentre.com','@landmarkcentre','Event-based',6.4312,3.4520,'Premier events venue hosting concerts, weddings, and exhibitions. Capacity: 5000.',['events','concerts','weddings']),
]

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: <SearchRegular fontSize={24} /> },
  { id: 'restaurant', label: 'Restaurants', icon: <FoodPizzaRegular fontSize={24} /> },
  { id: 'hotel', label: 'Hotels', icon: <BuildingMultipleRegular fontSize={24} /> },
  { id: 'attraction', label: 'Attractions', icon: <LocationRegular fontSize={24} /> },
  { id: 'nightlife', label: 'Nightlife', icon: <DrinkMargaritaRegular fontSize={24} /> },
  { id: 'park', label: 'Parks', icon: <TreeDeciduousRegular fontSize={24} /> },
  { id: 'culture', label: 'Culture', icon: <TicketDiagonalRegular fontSize={24} /> },
  { id: 'experience', label: 'Experiences', icon: <StarRegular fontSize={24} /> },
  { id: 'shopping', label: 'Shopping', icon: <ShoppingBagRegular fontSize={24} /> },
]

export const PRICE_LABELS = { [N1]: 'Budget', [N2]: 'Mid-range', [N3]: 'Premium', [N4]: 'Luxury' }
