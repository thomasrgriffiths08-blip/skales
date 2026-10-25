/* The system's sample businesses. Every business, person, number and plate here is invented.
   One profile per trade; the switcher in the sidebar swaps the whole system between them.
   Prices in pounds. mins = slot length. dep = deposit taken when booked online (0 = none).
   every = how often the work comes round again ('12m', '6w'...), which feeds Reminders. */
(function(){
  var FIRST = ['Sarah','James','Priya','Aisha','Daniel','Emma','Ravi','Chloe','Ben','Hannah','Marcus','Sophie','Liam','Grace','Owen','Fatima','Jack','Megan','Arjun','Lucy','Kwame','Rebecca','Nathan','Zara','Ellie','Callum','Nadia','Harry','Isla','Joel','Amara','Reece','Leah','Imran','Molly','Theo'];
  var LAST = ['Whitfield','Okafor','Raman','Khan','Moss','Clarke','Patel','Barnes','Kowalski','Price','Reid','Turner','O’Brien','Mensah','Davies','Ali','Fletcher','Hall','Shah','Grant','Asante','Lowe','Cole','Hussain','Brooks','Ross','Osman','Webb','Murray','Pryce','Adeyemi','Walsh','Nowak','Iqbal','Hart','Doyle'];

  var T = [
    { key: 'heating', label: 'Plumbing & heating', biz: 'Larchfield Heating', mark: 'L', c: '#B04A24',
      town: 'Leeds', pc: ['LS6', 'LS8', 'LS16', 'LS17', 'LS12', 'LS7'], streets: ['Otley Road', 'Harehills Lane', 'Street Lane', 'Kirkstall Road', 'Cardigan Road', 'Moortown Drive', 'Becketts Park', 'Spen Lane'],
      owner: 'Dan', team: ['Dan', 'Kieran'], noun: 'job',
      services: [
        { id: 'service', name: 'Boiler service', price: 89, mins: 60, dep: 25, every: '12m' },
        { id: 'breakdown', name: 'Breakdown visit', price: 95, mins: 90, dep: 30, from: true },
        { id: 'cp12', name: 'Landlord gas safety (CP12)', price: 70, mins: 45, dep: 20, every: '12m' },
        { id: 'survey', name: 'New boiler survey', price: 0, mins: 45, dep: 0 },
        { id: 'flush', name: 'Power flush', price: 395, mins: 240, dep: 50 },
        { id: 'radiator', name: 'Radiator or valve repair', price: 120, mins: 90, dep: 25, from: true }
      ],
      asks: [
        { ch: 'call', svc: 'breakdown', text: 'Boiler’s showing F28 and there’s no hot water. Can someone come today?' },
        { ch: 'web', svc: 'survey', text: 'Looking for a price on a new combi. 3 bed semi, current boiler is about 15 years old.' },
        { ch: 'text', svc: 'service', text: 'Hi, could I book my annual service for next week? It’s a Worcester Bosch 30i.' },
        { ch: 'google', svc: 'cp12', text: 'Do you do landlord certificates? I’ve got three flats in Headingley.' },
        { ch: 'fb', svc: 'radiator', text: 'Radiator in the back bedroom won’t get warm at the top. Bleeding it hasn’t helped.' },
        { ch: 'call', svc: 'breakdown', text: 'Pressure keeps dropping to 0.5. I’ve topped it up twice this week.' },
        { ch: 'web', svc: 'flush', text: 'Radiators are cold at the bottom and the boiler is noisy. Would a power flush help?' }
      ],
      reviews: [
        { s: 5, t: 'Boiler went off on a Sunday night. Got a text back within a minute and Dan was here by nine the next morning. Fixed in an hour at a fair price.' },
        { s: 5, t: 'Booked my service online in two minutes and got a text when he was on his way. Exactly how it should work.' },
        { s: 5, t: 'New combi fitted in a day and the quote was the price we paid. Tidy, polite, explained everything.' },
        { s: 4, t: 'Good service and on time. Only wish there were Saturday slots.' }
      ],
      quotes: [
        { title: 'Combi boiler replacement', svc: 'survey', items: [['Worcester Bosch Greenstar 4000, 30kW', 1, 1640], ['Magnetic system filter', 1, 145], ['Flue kit and fittings', 1, 185], ['Labour, one engineer, one day', 1, 480], ['Gas Safe notification and Benchmark', 1, 0]] },
        { title: 'Power flush, eight radiators', svc: 'flush', items: [['Power flush', 1, 395], ['System inhibitor', 1, 35], ['Thermostatic valves, supplied and fitted', 3, 38]] },
        { title: 'Two radiators moved for kitchen refit', svc: 'radiator', items: [['Double panel radiator, 600 x 1000', 2, 145], ['Pipework and valves', 1, 110], ['Labour, half a day', 1, 240]] }
      ],
      book: [{ m: 'Google profile', w: 30 }, { m: 'Google Ads', w: 22 }, { m: 'Website', w: 15 }, { m: 'Meta ads', w: 11 }, { m: 'Recommended', w: 14 }, { m: 'Repeat customer', w: 8 }],
      spend: { 'Google Ads': 520, 'Meta ads': 300 } },

    { key: 'electrical', label: 'Electrical', biz: 'Kestrel Electrical', mark: 'K', c: '#1B4D8F',
      town: 'Nottingham', pc: ['NG7', 'NG9', 'NG2', 'NG5', 'NG3', 'NG11'], streets: ['Derby Road', 'Mansfield Road', 'Trent Boulevard', 'Wollaton Road', 'Carlton Road', 'Mapperley Plains', 'Castle Boulevard', 'Beeston Lane'],
      owner: 'Jo', team: ['Jo', 'Rob'], noun: 'job',
      services: [
        { id: 'fault', name: 'Fault finding', price: 70, mins: 60, dep: 20, from: true },
        { id: 'eicr', name: 'EICR (landlord report)', price: 165, mins: 150, dep: 30, every: '5y' },
        { id: 'cu', name: 'Consumer unit upgrade', price: 595, mins: 360, dep: 100, from: true },
        { id: 'ev', name: 'EV charger install', price: 899, mins: 240, dep: 100, from: true },
        { id: 'sockets', name: 'Sockets and lights', price: 70, mins: 60, dep: 20, from: true },
        { id: 'pat', name: 'PAT testing', price: 60, mins: 60, dep: 0, every: '12m', from: true }
      ],
      asks: [
        { ch: 'call', svc: 'fault', text: 'Half the sockets downstairs have gone off and the trip won’t reset.' },
        { ch: 'web', svc: 'ev', text: 'Quote for an EV charger please. Tesla Model 3, driveway, the board is in the garage.' },
        { ch: 'google', svc: 'eicr', text: 'Need an EICR for a rental by the end of the month. Two bed flat in Beeston.' },
        { ch: 'text', svc: 'sockets', text: 'Could you fit four extra sockets in a kitchen we’re redoing?' },
        { ch: 'fb', svc: 'cu', text: 'Old fuse box with the wire fuses. Is it worth upgrading before we sell?' },
        { ch: 'call', svc: 'fault', text: 'Outside light trips everything whenever it rains.' },
        { ch: 'web', svc: 'pat', text: 'PAT testing for a small office, about 40 items. Evenings possible?' }
      ],
      reviews: [
        { s: 5, t: 'Rang at 7am with no power. Got a text straight back and Rob was here before ten.' },
        { s: 5, t: 'Clear written quote for the consumer unit, done in a day, certificate emailed that night.' },
        { s: 5, t: 'Charger fitted neatly and they sorted the paperwork for us too.' },
        { s: 4, t: 'Good work, just a bit of a wait for a slot in December.' }
      ],
      quotes: [
        { title: 'Consumer unit upgrade', svc: 'cu', items: [['18th Edition consumer unit, 10 way with RCBOs', 1, 420], ['Surge protection device', 1, 95], ['Labour, one day', 1, 320], ['Testing and certification', 1, 90]] },
        { title: '7kW EV charge point', svc: 'ev', items: [['7kW smart charger, tethered', 1, 640], ['Cable run, up to 10m', 1, 120], ['Install and test', 1, 280], ['DNO notification', 1, 0]] },
        { title: 'Kitchen rewire, first and second fix', svc: 'sockets', items: [['Double sockets, supplied and fitted', 6, 65], ['Under-cabinet lighting circuit', 1, 260], ['Cooker circuit and isolator', 1, 210], ['Certification', 1, 60]] }
      ],
      book: [{ m: 'Google profile', w: 28 }, { m: 'Google Ads', w: 26 }, { m: 'Website', w: 16 }, { m: 'Meta ads', w: 8 }, { m: 'Recommended', w: 15 }, { m: 'Repeat customer', w: 7 }],
      spend: { 'Google Ads': 610, 'Meta ads': 240 } },

    { key: 'garage', label: 'Garage & MOT', biz: 'Kerb & Camber', mark: 'K', c: '#B3271E',
      town: 'Reading', pc: ['RG1', 'RG2', 'RG4', 'RG6', 'RG30', 'RG31'], streets: ['Oxford Road', 'London Road', 'Basingstoke Road', 'Wokingham Road', 'Caversham Road', 'Bath Road', 'Northumberland Avenue', 'Tilehurst Road'],
      owner: 'Ade', team: ['Ade', 'Sam'], noun: 'car', plates: true,
      services: [
        { id: 'mot', name: 'MOT', price: 54.85, mins: 60, dep: 0, every: '12m' },
        { id: 'interim', name: 'Interim service', price: 139, mins: 90, dep: 20, every: '12m', from: true },
        { id: 'full', name: 'Full service', price: 219, mins: 180, dep: 30, from: true },
        { id: 'diag', name: 'Diagnostics', price: 45, mins: 60, dep: 0 },
        { id: 'brakes', name: 'Brakes', price: 120, mins: 120, dep: 20, from: true },
        { id: 'tyres', name: 'Tyres, fitted', price: 75, mins: 45, dep: 0, from: true }
      ],
      asks: [
        { ch: 'call', svc: 'diag', text: 'Engine light’s on and it’s gone into limp mode. 2016 Ford Focus.' },
        { ch: 'web', svc: 'mot', text: 'MOT due on the 14th. Can I book in and wait? RA18 WHX.' },
        { ch: 'google', svc: 'brakes', text: 'How much for front pads and discs on a 2017 Golf?' },
        { ch: 'text', svc: 'brakes', text: 'Squealing when I brake and it’s getting worse.' },
        { ch: 'fb', svc: 'full', text: 'Do you do a courtesy car with a full service?' },
        { ch: 'call', svc: 'tyres', text: 'Need two front tyres, 205/55 R16, today if possible.' },
        { ch: 'web', svc: 'interim', text: 'Service and MOT together for a Fiesta, any discount?' }
      ],
      reviews: [
        { s: 5, t: 'Got an MOT reminder text, booked from the link, waited with a coffee and was out in 50 minutes.' },
        { s: 5, t: 'Told me what actually needed doing and what could wait. An honest garage.' },
        { s: 5, t: 'Sent photos of the worn pads before starting, so I knew exactly what I was paying for.' },
        { s: 4, t: 'Good work. Parking outside is tight.' }
      ],
      quotes: [
        { title: 'Front brakes, VW Golf 2017', svc: 'brakes', items: [['Front discs, pair', 1, 96], ['Front pads, set', 1, 48], ['Labour, 1.2 hours', 1.2, 72], ['Brake fluid check', 1, 0]] },
        { title: 'Timing belt and water pump', svc: 'full', items: [['Timing belt kit', 1, 165], ['Water pump', 1, 78], ['Labour, 3.5 hours', 3.5, 72], ['Coolant', 1, 24]] },
        { title: 'Clutch replacement, Fiesta 1.0', svc: 'diag', items: [['Clutch kit with release bearing', 1, 210], ['Labour, 4 hours', 4, 72], ['Gearbox oil', 1, 28]] }
      ],
      book: [{ m: 'Google profile', w: 34 }, { m: 'Google Ads', w: 18 }, { m: 'Website', w: 12 }, { m: 'Meta ads', w: 6 }, { m: 'Recommended', w: 12 }, { m: 'Repeat customer', w: 18 }],
      spend: { 'Google Ads': 380, 'Meta ads': 150 } },

    { key: 'salon', label: 'Salon & beauty', biz: 'Linden Rooms', mark: 'L', c: '#8A3A5B',
      town: 'York', pc: ['YO1', 'YO10', 'YO23', 'YO24', 'YO30', 'YO31'], streets: ['Bishopthorpe Road', 'Gillygate', 'Fulford Road', 'Clarence Street', 'Holgate Road', 'Burton Stone Lane', 'Heworth Green', 'Tadcaster Road'],
      owner: 'Hannah', team: ['Hannah', 'Priya', 'Ellie'], noun: 'appointment',
      services: [
        { id: 'cut', name: 'Cut & finish', price: 42, mins: 60, dep: 10, every: '6w' },
        { id: 'colour', name: 'Full colour', price: 75, mins: 120, dep: 20, every: '8w', from: true },
        { id: 'balayage', name: 'Balayage', price: 140, mins: 180, dep: 30, from: true },
        { id: 'blowdry', name: 'Blow dry', price: 28, mins: 45, dep: 10 },
        { id: 'gents', name: 'Gents cut', price: 24, mins: 30, dep: 0, every: '4w' },
        { id: 'bridal', name: 'Bridal trial', price: 85, mins: 90, dep: 25 }
      ],
      asks: [
        { ch: 'call', svc: 'cut', text: 'Any chance of a cut and blow dry on Saturday morning?' },
        { ch: 'web', svc: 'colour', text: 'Do I need a patch test before a colour? First time with you.' },
        { ch: 'ig', svc: 'balayage', text: 'Saw your balayage on Instagram. How much for long hair?' },
        { ch: 'text', svc: 'cut', text: 'Running ten minutes late for my 2pm, so sorry!' },
        { ch: 'fb', svc: 'bridal', text: 'Do you do bridal hair for a party of four in June?' },
        { ch: 'call', svc: 'colour', text: 'Can I move my Thursday colour to next week?' },
        { ch: 'ig', svc: 'blowdry', text: 'Blow dry before a wedding on Friday, have you got anything early?' }
      ],
      reviews: [
        { s: 5, t: 'Booked at midnight from Instagram, got a reminder the day before and a text to rebook at six weeks. Lovely cut.' },
        { s: 5, t: 'Priya is brilliant with colour. Exactly what I showed her.' },
        { s: 5, t: 'Easy online booking, and the deposit meant I actually turned up on time.' },
        { s: 4, t: 'Great cut, ran a little late.' }
      ],
      quotes: [
        { title: 'Bridal party, four people', svc: 'bridal', items: [['Bride, hair on the day', 1, 120], ['Bridesmaids, hair on the day', 3, 65], ['Trial', 1, 85], ['Travel to venue', 1, 40]] },
        { title: 'Colour correction', svc: 'colour', items: [['Consultation and strand test', 1, 0], ['Colour correction, three hours', 1, 210], ['Bond treatment', 1, 35]] },
        { title: 'Prom package, three people', svc: 'blowdry', items: [['Hair up', 3, 45], ['Make-up', 3, 40]] }
      ],
      book: [{ m: 'Instagram', w: 30 }, { m: 'Google profile', w: 22 }, { m: 'Meta ads', w: 14 }, { m: 'Website', w: 10 }, { m: 'Recommended', w: 10 }, { m: 'Repeat customer', w: 14 }],
      spend: { 'Meta ads': 280, 'Google Ads': 120 } },

    { key: 'cleaning', label: 'Cleaning', biz: 'Brightwell Cleaning', mark: 'B', c: '#1C7A80',
      town: 'Bristol', pc: ['BS6', 'BS7', 'BS8', 'BS3', 'BS5', 'BS9'], streets: ['Gloucester Road', 'Whiteladies Road', 'North Street', 'Cotham Hill', 'Stapleton Road', 'Henleaze Road', 'Coronation Road', 'Chandos Road'],
      owner: 'Leah', team: ['Leah', 'Marta', 'Jade'], noun: 'clean',
      services: [
        { id: 'regular', name: 'Regular clean, two hours', price: 44, mins: 120, dep: 0, every: '2w' },
        { id: 'deep', name: 'Deep clean', price: 180, mins: 300, dep: 40, from: true },
        { id: 'eot', name: 'End of tenancy', price: 220, mins: 360, dep: 50, from: true },
        { id: 'oven', name: 'Oven clean', price: 65, mins: 120, dep: 15, every: '6m' },
        { id: 'carpet', name: 'Carpet clean', price: 90, mins: 120, dep: 20, every: '12m', from: true },
        { id: 'office', name: 'Office clean', price: 40, mins: 120, dep: 0, from: true }
      ],
      asks: [
        { ch: 'call', svc: 'eot', text: 'Need an end of tenancy clean on the 30th. Two bed flat in Redland.' },
        { ch: 'web', svc: 'regular', text: 'Weekly clean for a four bed house, Tuesdays ideally. Do you bring products?' },
        { ch: 'google', svc: 'oven', text: 'Do you clean ovens? Ours is grim.' },
        { ch: 'text', svc: 'regular', text: 'Can we skip this Friday? Away for the weekend.' },
        { ch: 'fb', svc: 'office', text: 'Price for an office, six desks and a kitchen, twice a week?' },
        { ch: 'call', svc: 'deep', text: 'Moving in on Saturday and the place needs a proper deep clean first.' },
        { ch: 'web', svc: 'carpet', text: 'Carpets in three rooms after a dog, can you get the smell out?' }
      ],
      reviews: [
        { s: 5, t: 'Booked online, the deposit came off the bill, and we got our whole tenancy deposit back.' },
        { s: 5, t: 'Same cleaner every fortnight and a reminder the day before. Easy.' },
        { s: 5, t: 'Oven looks new. Already booked again for Christmas.' },
        { s: 4, t: 'Very good, just missed one window sill.' }
      ],
      quotes: [
        { title: 'End of tenancy, two bed flat', svc: 'eot', items: [['End of tenancy clean', 1, 220], ['Oven clean', 1, 65], ['Carpet clean, per room', 2, 45], ['Inside windows', 1, 30]] },
        { title: 'Office clean, twice weekly', svc: 'office', items: [['Office clean, two hours, per visit', 8, 40], ['Washroom supplies, monthly', 1, 35]] },
        { title: 'Deep clean before moving in', svc: 'deep', items: [['Deep clean, three bed house', 1, 260], ['Inside cupboards and appliances', 1, 45], ['Oven clean', 1, 65]] }
      ],
      book: [{ m: 'Google profile', w: 26 }, { m: 'Website', w: 18 }, { m: 'Meta ads', w: 16 }, { m: 'Google Ads', w: 12 }, { m: 'Recommended', w: 16 }, { m: 'Repeat customer', w: 12 }],
      spend: { 'Meta ads': 260, 'Google Ads': 200 } },

    { key: 'clinic', label: 'Physio & clinics', biz: 'Fern Physio', mark: 'F', c: '#3C6E57',
      town: 'Sheffield', pc: ['S7', 'S10', 'S11', 'S8', 'S6', 'S2'], streets: ['Abbeydale Road', 'Ecclesall Road', 'Sharrow Vale Road', 'Fulwood Road', 'Chesterfield Road', 'Crookes', 'Psalter Lane', 'Hunters Bar'],
      owner: 'Anna', team: ['Anna', 'Ben'], noun: 'appointment',
      services: [
        { id: 'initial', name: 'Initial assessment', price: 65, mins: 45, dep: 20 },
        { id: 'follow', name: 'Follow-up session', price: 50, mins: 30, dep: 15, every: '2w' },
        { id: 'massage', name: 'Sports massage', price: 45, mins: 45, dep: 15, every: '4w' },
        { id: 'running', name: 'Running assessment', price: 85, mins: 60, dep: 25 },
        { id: 'postop', name: 'Post-op rehab', price: 55, mins: 45, dep: 15 },
        { id: 'video', name: 'Video consultation', price: 40, mins: 30, dep: 10 }
      ],
      asks: [
        { ch: 'call', svc: 'initial', text: 'Hurt my back lifting yesterday and can hardly stand up straight. Anything today?' },
        { ch: 'web', svc: 'running', text: 'Knee pain running downhill. Training for the Sheffield half in March.' },
        { ch: 'google', svc: 'initial', text: 'Do you take Bupa?' },
        { ch: 'text', svc: 'follow', text: 'Need to cancel tomorrow’s 9am. Can we move it to Friday?' },
        { ch: 'fb', svc: 'massage', text: 'Sports massage before a marathon, how far ahead should I book?' },
        { ch: 'call', svc: 'postop', text: 'Physio after an ACL operation. The surgeon said start in two weeks.' },
        { ch: 'web', svc: 'video', text: 'Can you do a video call first? I work in Leeds most days.' }
      ],
      reviews: [
        { s: 5, t: 'Booked an assessment online at 10pm and was seen the next morning. Clear plan and a reminder before every session.' },
        { s: 5, t: 'Anna sorted a shoulder that two other places couldn’t.' },
        { s: 5, t: 'Simple booking, and exercises sent by text after each visit.' },
        { s: 4, t: 'Excellent, though parking can be tricky.' }
      ],
      quotes: [
        { title: 'Six-week rehab plan', svc: 'follow', items: [['Initial assessment', 1, 65], ['Follow-up sessions', 5, 50], ['Home exercise programme', 1, 0]] },
        { title: 'Running club, eight assessments', svc: 'running', items: [['Running assessment, group rate', 8, 70], ['Written report per runner', 8, 0]] },
        { title: 'Workplace massage day', svc: 'massage', items: [['Chair massage, 20 minutes', 16, 22], ['Travel', 1, 30]] }
      ],
      book: [{ m: 'Google profile', w: 32 }, { m: 'Website', w: 20 }, { m: 'Google Ads', w: 14 }, { m: 'Meta ads', w: 8 }, { m: 'Recommended', w: 16 }, { m: 'Repeat customer', w: 10 }],
      spend: { 'Google Ads': 300, 'Meta ads': 140 } }
  ];

  window.SYS_DATA = { trades: T, first: FIRST, last: LAST };
})();
