/**
 * PostCards & Puzzle — Game Data
 * Real images from Wikimedia Commons (public domain / CC)
 */

export const POSTCARD_QUESTIONS = [
  {
    id: 'pc-01',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/National_Theatre_Lagos.jpg/800px-National_Theatre_Lagos.jpg',
    question: 'Which iconic Lagos building is shown in this postcard?',
    options: ['National Theatre', 'Eko Hotel', 'MUSON Centre', 'Federal Secretariat'],
    correct: 0,
    fact: 'The National Theatre was built in 1976 for FESTAC 77 and is shaped like a military hat.',
  },
  {
    id: 'pc-02',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Third_Mainland_Bridge%2C_Lagos.jpg/800px-Third_Mainland_Bridge%2C_Lagos.jpg',
    question: 'This bridge connects Lagos Island to the mainland. What is it?',
    options: ['Carter Bridge', 'Eko Bridge', 'Third Mainland Bridge', 'Lekki-Ikoyi Link Bridge'],
    correct: 2,
    fact: 'Third Mainland Bridge is 11.8 km long — the longest bridge in Africa when it opened in 1990.',
  },
  {
    id: 'pc-03',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Zuma_Rock.jpg/800px-Zuma_Rock.jpg',
    question: 'This massive monolith sits along the Abuja–Kaduna highway. Name it.',
    options: ['Olumo Rock', 'Zuma Rock', 'Aso Rock', 'Idanre Hills'],
    correct: 1,
    fact: 'Zuma Rock is 725m high and appears on the ₦100 note. Locals call it "Gateway to Abuja".',
  },
  {
    id: 'pc-04',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Olumo_Rock%2C_Abeokuta.jpg/800px-Olumo_Rock%2C_Abeokuta.jpg',
    question: 'This ancient rock fortress is located in Abeokuta. What is it?',
    options: ['Zuma Rock', 'Ikogosi Warm Springs', 'Olumo Rock', 'Erin-Ijesha Falls'],
    correct: 2,
    fact: 'Olumo Rock served as a natural fortress during inter-tribal wars in the 19th century.',
  },
  {
    id: 'pc-05',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Lekki-Ikoyi_Link_Bridge.jpg/800px-Lekki-Ikoyi_Link_Bridge.jpg',
    question: 'This cable-stayed bridge connects Lekki Phase 1 to Ikoyi. Name it.',
    options: ['Third Mainland Bridge', 'Lekki-Ikoyi Link Bridge', 'Carter Bridge', 'Falomo Bridge'],
    correct: 1,
    fact: 'The bridge was completed in 2013 and its LED lights change colors at night.',
  },
  {
    id: 'pc-06',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Badagry_Heritage_Museum.jpg/800px-Badagry_Heritage_Museum.jpg',
    question: 'This coastal town is known as the "point of no return" in the slave trade. Where is this?',
    options: ['Epe', 'Badagry', 'Ikorodu', 'Ajegunle'],
    correct: 1,
    fact: 'Badagry has the first two-storey building in Nigeria, built by missionaries in 1845.',
  },
  {
    id: 'pc-07',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Tafawa_Balewa_Square_Lagos.jpg/800px-Tafawa_Balewa_Square_Lagos.jpg',
    question: 'This open square on Lagos Island hosted Nigeria\'s independence ceremony. Name it.',
    options: ['Eagle Square', 'Tafawa Balewa Square', 'Tinubu Square', 'Freedom Park'],
    correct: 1,
    fact: 'Tafawa Balewa Square is named after Nigeria\'s first Prime Minister and can hold 18,000 people.',
  },
  {
    id: 'pc-08',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Mosque_Abuja_Nigeria.jpg/800px-Mosque_Abuja_Nigeria.jpg',
    question: 'This mosque is one of the most prominent landmarks in Nigeria\'s capital. Where is it?',
    options: ['Kano Central Mosque', 'Lagos Central Mosque', 'Abuja National Mosque', 'Ibadan Grand Mosque'],
    correct: 2,
    fact: 'The Abuja National Mosque was completed in 1984 and can accommodate over 15,000 worshippers.',
  },
  {
    id: 'pc-09',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Nike_Art_Gallery_Lagos.jpg/800px-Nike_Art_Gallery_Lagos.jpg',
    question: 'This is the largest art gallery in West Africa, located in Lekki. Name it.',
    options: ['Didi Museum', 'Terra Kulture', 'Nike Art Gallery', 'Wheatbaker Gallery'],
    correct: 2,
    fact: 'Nike Art Gallery has over 8,000 artworks across 5 floors and was founded by Nike Davies-Okundaye.',
  },
  {
    id: 'pc-10',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Aso_Rock_Abuja.jpg/800px-Aso_Rock_Abuja.jpg',
    question: 'This iconic rock formation houses the Nigerian Presidential Complex. What is it?',
    options: ['Zuma Rock', 'Olumo Rock', 'Aso Rock', 'Idanre Hills'],
    correct: 2,
    fact: 'Aso Rock is 400m high and means "victorious people" in the Asokoro dialect.',
  },
  {
    id: 'pc-11',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Osun-Osogbo_Sacred_Grove.jpg/800px-Osun-Osogbo_Sacred_Grove.jpg',
    question: 'This UNESCO World Heritage Site is a sacred forest in Osun State. What is it?',
    options: ['Yankari Reserve', 'Osun-Osogbo Sacred Grove', 'Cross River Park', 'Lekki Conservation'],
    correct: 1,
    fact: 'The grove is one of the last remnants of primary high forest in southern Nigeria.',
  },
  {
    id: 'pc-12',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/University_of_Lagos.jpg/800px-University_of_Lagos.jpg',
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/National_Theatre_Lagos.jpg/600px-National_Theatre_Lagos.jpg',
    fact: 'Shaped like a military hat, this brutalist masterpiece was built for FESTAC 77.',
  },
  {
    id: 'pz-02',
    title: 'Zuma Rock',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Zuma_Rock.jpg/600px-Zuma_Rock.jpg',
    fact: 'At 725m tall, Zuma Rock is often called the "Gateway to Abuja".',
  },
  {
    id: 'pz-03',
    title: 'Lekki-Ikoyi Link Bridge',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Lekki-Ikoyi_Link_Bridge.jpg/600px-Lekki-Ikoyi_Link_Bridge.jpg',
    fact: 'The LED-lit cable-stayed bridge opened in 2013 connecting Lekki to Ikoyi.',
  },
  {
    id: 'pz-04',
    title: 'Olumo Rock, Abeokuta',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Olumo_Rock%2C_Abeokuta.jpg/600px-Olumo_Rock%2C_Abeokuta.jpg',
    fact: 'An ancient fortress used by the Egba people during the 19th century wars.',
  },
  {
    id: 'pz-05',
    title: 'Aso Rock, Abuja',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Aso_Rock_Abuja.jpg/600px-Aso_Rock_Abuja.jpg',
    fact: 'Home to the Nigerian Presidential Villa and seat of power.',
  },
  {
    id: 'pz-06',
    title: 'Third Mainland Bridge',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Third_Mainland_Bridge%2C_Lagos.jpg/600px-Third_Mainland_Bridge%2C_Lagos.jpg',
    fact: 'At 11.8 km, it was Africa\'s longest bridge when completed in 1990.',
  },
]
