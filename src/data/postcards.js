/**
 * PostCards & Puzzle — Game Data
 * Local images in /images/postcards/
 */

export const POSTCARD_QUESTIONS = [
  {
    id: 'pc-01',
    image: '/images/postcards/national-theatre.png',
    question: 'Which iconic Lagos building is shown in this postcard?',
    options: ['National Theatre', 'Eko Hotel', 'MUSON Centre', 'Federal Secretariat'],
    correct: 0,
    fact: 'The National Theatre was built in 1976 for FESTAC 77 and is shaped like a military hat.',
  },
  {
    id: 'pc-02',
    image: '/images/postcards/third-mainland-bridge.png',
    question: 'This bridge connects Lagos Island to the mainland. What is it?',
    options: ['Carter Bridge', 'Eko Bridge', 'Third Mainland Bridge', 'Lekki-Ikoyi Link Bridge'],
    correct: 2,
    fact: 'Third Mainland Bridge is 11.8 km long — the longest bridge in Africa when it opened in 1990.',
  },
  {
    id: 'pc-03',
    image: '/images/postcards/zuma-rock.png',
    question: 'This massive monolith sits along the Abuja–Kaduna highway. Name it.',
    options: ['Olumo Rock', 'Zuma Rock', 'Aso Rock', 'Idanre Hills'],
    correct: 1,
    fact: 'Zuma Rock is 725m high and appears on the ₦100 note. Locals call it "Gateway to Abuja".',
  },
  {
    id: 'pc-04',
    image: '/images/postcards/olumo-rock.png',
    question: 'This ancient rock fortress is located in Abeokuta. What is it?',
    options: ['Zuma Rock', 'Ikogosi Warm Springs', 'Olumo Rock', 'Erin-Ijesha Falls'],
    correct: 2,
    fact: 'Olumo Rock served as a natural fortress during inter-tribal wars in the 19th century.',
  },
  {
    id: 'pc-05',
    image: '/images/postcards/lekki-ikoyi-bridge.png',
    question: 'This cable-stayed bridge connects Lekki Phase 1 to Ikoyi. Name it.',
    options: ['Third Mainland Bridge', 'Lekki-Ikoyi Link Bridge', 'Carter Bridge', 'Falomo Bridge'],
    correct: 1,
    fact: 'The bridge was completed in 2013 and its LED lights change colors at night.',
  },
  {
    id: 'pc-06',
    image: '/images/postcards/badagry.png',
    question: 'This coastal town is known as the "point of no return" in the slave trade. Where is this?',
    options: ['Epe', 'Badagry', 'Ikorodu', 'Ajegunle'],
    correct: 1,
    fact: 'Badagry has the first two-storey building in Nigeria, built by missionaries in 1845.',
  },
  {
    id: 'pc-07',
    image: '/images/postcards/tafawa-balewa.png',
    question: 'This open square on Lagos Island hosted Nigeria\'s independence ceremony. Name it.',
    options: ['Eagle Square', 'Tafawa Balewa Square', 'Tinubu Square', 'Freedom Park'],
    correct: 1,
    fact: 'Tafawa Balewa Square is named after Nigeria\'s first Prime Minister and can hold 18,000 people.',
  },
  {
    id: 'pc-08',
    image: '/images/postcards/abuja-mosque.png',
    question: 'This mosque is one of the most prominent landmarks in Nigeria\'s capital. Where is it?',
    options: ['Kano Central Mosque', 'Lagos Central Mosque', 'Abuja National Mosque', 'Ibadan Grand Mosque'],
    correct: 2,
    fact: 'The Abuja National Mosque was completed in 1984 and can accommodate over 15,000 worshippers.',
  },
  {
    id: 'pc-09',
    image: '/images/postcards/nike-art-gallery.png',
    question: 'This is the largest art gallery in West Africa, located in Lekki. Name it.',
    options: ['Didi Museum', 'Terra Kulture', 'Nike Art Gallery', 'Wheatbaker Gallery'],
    correct: 2,
    fact: 'Nike Art Gallery has over 8,000 artworks across 5 floors and was founded by Nike Davies-Okundaye.',
  },
  {
    id: 'pc-10',
    image: '/images/postcards/aso-rock.png',
    question: 'This iconic rock formation houses the Nigerian Presidential Complex. What is it?',
    options: ['Zuma Rock', 'Olumo Rock', 'Aso Rock', 'Idanre Hills'],
    correct: 2,
    fact: 'Aso Rock is 400m high and means "victorious people" in the Asokoro dialect.',
  },
  {
    id: 'pc-11',
    image: '/images/postcards/osun-grove.png',
    question: 'This UNESCO World Heritage Site is a sacred forest in Osun State. What is it?',
    options: ['Yankari Reserve', 'Osun-Osogbo Sacred Grove', 'Cross River Park', 'Lekki Conservation'],
    correct: 1,
    fact: 'The grove is one of the last remnants of primary high forest in southern Nigeria.',
  },
  {
    id: 'pc-12',
    image: '/images/postcards/unilag.png',
    question: 'This university campus is located on the lagoon front in Akoka. Which university?',
    options: ['LASU', 'University of Lagos', 'Lagos State Polytechnic', 'Yaba College of Tech'],
    correct: 1,
    fact: 'UNILAG was founded in 1962 and nicknamed "University of first choice and the nation\'s pride".',
  },
]

export const PUZZLE_IMAGES = [
  {
    id: 'pz-01',
    title: 'National Theatre, Lagos',
    image: '/images/postcards/national-theatre.png',
    fact: 'Shaped like a military hat, this brutalist masterpiece was built for FESTAC 77.',
  },
  {
    id: 'pz-02',
    title: 'Zuma Rock',
    image: '/images/postcards/zuma-rock.png',
    fact: 'At 725m tall, Zuma Rock is often called the "Gateway to Abuja".',
  },
  {
    id: 'pz-03',
    title: 'Lekki-Ikoyi Link Bridge',
    image: '/images/postcards/lekki-ikoyi-bridge.png',
    fact: 'The LED-lit cable-stayed bridge opened in 2013 connecting Lekki to Ikoyi.',
  },
  {
    id: 'pz-04',
    title: 'Olumo Rock, Abeokuta',
    image: '/images/postcards/olumo-rock.png',
    fact: 'An ancient fortress used by the Egba people during the 19th century wars.',
  },
  {
    id: 'pz-05',
    title: 'Aso Rock, Abuja',
    image: '/images/postcards/aso-rock.png',
    fact: 'Home to the Nigerian Presidential Villa and seat of power.',
  },
  {
    id: 'pz-06',
    title: 'Third Mainland Bridge',
    image: '/images/postcards/third-mainland-bridge.png',
    fact: 'At 11.8 km, it was Africa\'s longest bridge when completed in 1990.',
  },
]
