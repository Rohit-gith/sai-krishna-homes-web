/**
 * Project detail pages. All text, numbers and RERA IDs are copied from the client's existing
 * website (page-saikrishna-residency.php, page-panchawati-residency.php, page-past-projects.php).
 * Images were downloaded from that site by scripts/fetch-project-assets.mjs.
 */
import { PHOTOS, VIRTUAL_TOURS } from './projects';
import { LEADERSHIP } from './companyInfo';
import { PANCHAWATI_PRICES, SKR_AREA_STATEMENT } from './pricing';

const price = (n) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(2).replace(/\.00$/, '')} L`);
/** Facts for one Panchawati block, computed from the official price list. */
function blockFacts(id) {
  const rows = PANCHAWATI_PRICES.blocks.find((b) => b.id === id).rows;
  const byType = {};
  for (const r of rows) byType[r.type] = Math.min(byType[r.type] ?? Infinity, r.price);
  const carpets = rows.map((r) => r.carpet);
  return [
    ...Object.entries(byType).sort().map(([t, v]) => [`${t} from`, price(v)]),
    ['Carpet area', `${Math.min(...carpets)}–${Math.max(...carpets)} sq ft`],
    ['Flat types / floor', String(rows.length)],
  ];
}

const img = (name, alt) => ({ src: `/images/projects/${name}.webp`, sm: `/images/projects/${name}-sm.webp`, alt });
const plan = (name, alt) => ({ src: `/images/projects/${name}.webp`, sm: `/images/projects/${name}.webp`, alt });
const [CMO, GM] = LEADERSHIP.contacts;

export const PROJECT_PAGES = [
  {
    slug: 'sai-krishna-residency',
    name: 'Sai Krishna Residency',
    status: 'Current project',
    tagline: 'Premium Residential Living',
    headline: 'Largest Township Project Of South Bhubaneswar Near Infosys 2',
    location: 'South Bhubaneswar · Near Cuttack–Bhubaneswar Bypass',
    rera: 'MP/19/2024/01126',
    // Official Odisha RERA page. Checked 13 Nov 2026: 497 units, S+6 + market complex, possession 1 May 2028.
    reraUrl:
      'https://rera.odisha.gov.in/projects/project-details/VTJGc2RHVmtYMSsrL1A4UmowQlNmQ0kxYnpqR0FxNWpxcFZoWnEwdXhBbUNsZmRHUjgxbTRjYzZYRzZjaS9XZm9yT0lHZGNhWENPN290QVVJNlFNd1o0bEhLNUluUkZkVnQxMkJveG04NFk9?name=SAI%20KRISHNA%20RESIDENCY',
    configs: ['1 BHK', '2 BHK', '3 BHK'],
    hero: img('skr/banner-night', 'Sai Krishna Residency township at night'),
    card: img('skr/banner-night', 'Sai Krishna Residency township at night'),
    stats: [
      ['500+', 'Flats'],
      ['~6', 'Acres of land'],
      ['900+', 'Parking spaces'],
      ['25+', 'Amenities at the Sports Arena'],
    ],
    about: [
      "Sai Krishna Residency, by Sai Krishna Homes Pvt. Ltd., is thoughtfully designed for those who seek comfort, connectivity and a lifestyle of distinction. More than a home, it is a carefully planned residential community where modern living meets peaceful surroundings. Whether you're looking for your dream flat or a promising investment, Sai Krishna Residency offers an opportunity to live better, grow confidently and build lasting memories.",
      'Backed by the experience and vision of Sai Krishna Homes Pvt. Ltd., the project reflects our commitment to creating quality homes, modern communities and thoughtfully developed spaces in prime locations of Bhubaneswar.',
    ],
    highlightsTitle: 'Project details',
    highlights: [
      '“Largest Township Project” of Southern Bhubaneswar having more than 500 Flats.',
      'Spread at nearly 6 Acres Of Land and has scope to grow further.',
      'Strategically close to the Cuttack - Bhubaneswar Bypass.',
      'Project is Approved By Rera and all major Banks.',
      'Adjacent to “Sai Krishna Sports Arena” which offers more than 25 amenities.',
      'World-Class Amenities: Gym, Swimming Pool, Indoor Cricket, Badminton, Table Tennis, Community Centre, Spa, Cafeteria, etc.',
      "Dedicated Commercial Complex featuring a Shopping Mall, Pharmacy, Doctor's Chamber, etc.",
    ],
    reasons: [
      'Project is Fairly Priced and has excellent scope for future growth and appreciation.',
      'The Sports Arena with 25+ Amenities will be a huge attraction and gives great visibility to the project.',
      'Most daily requirements (Grocery, Pharmacy, Doctor, ATM, etc.) will be available Within The Compound, making life highly comfortable.',
      'A township project with a Developed Society ensures the project is well-maintained over time.',
      "A large society creates a Cohesive Ecosystem which adds tremendous value to the resident's lifestyle.",
      'Delivered by Very Experienced Builders known for exceptional quality projects.',
      'Approved by all required authorities and major banks, making it Legally Very Sound.',
      'Land is directly in the name of the Builders, ensuring the project remains Completely Hassle-Free in the future.',
    ],
    interiors: [
      img('skr/drawing-room', 'Drawing room'),
      img('skr/dining-room', 'Dining room'),
      img('skr/bedroom', 'Bedroom'),
    ],
    floorPlans: [
      {
        id: '1bhk',
        label: '1 BHK',
        area: '698 sqft',
        text: 'An intelligently designed compact home, perfect for young professionals and small families seeking comfort and style.',
        rooms: ['1 Bedroom', '1 Kitchen', 'Living & Dining', '1 Bathroom'],
        views: [plan('skr/plan-1bhk', '1 BHK floor plan, Sai Krishna Residency')],
      },
      {
        id: '2bhk',
        label: '2 BHK',
        area: '936 sqft',
        text: 'Spacious and well-ventilated homes designed for growing families who value both comfort and convenience.',
        rooms: ['2 Bedrooms', '1 Kitchen', 'Living & Dining', '2 Bathrooms'],
        views: [plan('skr/plan-2bhk', '2 BHK floor plan, Sai Krishna Residency')],
      },
      {
        id: '3bhk',
        label: '3 BHK',
        area: '1451 sqft',
        text: 'Premium, expansive homes crafted for those who demand the finest in luxury living — truly where class meets class.',
        rooms: ['3 Bedrooms', '1 Kitchen', 'Drawing/Dining', '2 Bathrooms', 'Balconies'],
        views: [plan('skr/plan-3bhk', '3 BHK floor plan, Sai Krishna Residency')],
      },
    ],
    areaNote: 'Total area as published by Sai Krishna Homes.',
    masterPlan: plan('skr/master-plan', 'Sai Krishna Residency master plan'),
    amenitiesIntro: 'Lush green environment with state-of-the-art facilities designed for the connoisseurs of life',
    amenities: [
      ['Swimming Pool', img('pw/a-pool', 'Swimming pool')],
      ['Modern Gym', img('pw/a-gym', 'Modern gym')],
      ['Basketball & Badminton Courts', img('skr/sports-zone', 'Sports zone')],
      ['Lush Green Open Spaces', img('skr/lawn', 'Lush green lawns')],
      ["Children's Park", img('pw/a-kids-play', "Children's play area")],
      ['Jogging Track', img('skr/jogging-track', 'Jogging track')],
      ['Community Hall', img('pw/a-ac-hall', 'Community hall')],
      ['Temple & Market Complex', img('skr/temple-market', 'Temple and market complex')],
      ['24/7 Gated Security', img('pw/a-security', 'Gated security')],
    ],
    facilities: ['24 Hrs Water Supply', 'Double Lift Each Block', 'Car Parking Facilities', 'Power Backup Generator', 'High Rise Compound Wall', 'Bore Wells Water Supply'],
    specs: [
      ['Structure', [
        ['Earthquake-Resistant RCC Structure', 'Sai Krishna Residency features a robust Reinforced Cement Concrete (RCC) frame structure, engineered to provide enhanced resistance against seismic forces. Every element is thoughtfully designed with structural strength, safety and long term durability in mind.'],
        ['Premium Grade Materials', 'We use high quality cement, steel and carefully selected construction materials throughout the project to ensure lasting strength, durability and structural integrity.'],
      ]],
      ['Flooring', [
        ['Vitrified Floor Tiles', 'Experience the refined finish of premium vitrified tiles across drawing rooms, dining spaces and bedrooms. Designed to complement modern interiors, they bring together sophistication, durability and easy maintenance.'],
        ['Designer Finish', 'Carefully selected designs and finishes enhance the architectural character of every space, creating interiors that remain beautiful, practical and timeless.'],
      ]],
      ['Doors & Windows', [
        ['Premium Doors', 'The main entrance features a teak veneered flush door with durable Sal wood framing, while other doors are finished with premium enamel for a refined look. Stainless steel hardware and fittings add the perfect balance of style, strength and functionality.'],
        ['Aluminum Glazed Windows', 'Premium aluminium glazed windows bring abundant natural light and fresh ventilation into every home while offering enhanced sound insulation and durability. Designed for lasting performance with minimal maintenance, they make everyday living brighter and more comfortable.'],
      ]],
      ['Kitchen', [
        ['Ceramic Wall Tiles', 'Premium ceramic wall tiles extend 3 feet above the kitchen platform, protecting your walls while adding a polished, contemporary finish.'],
        ['Anti-Skid Flooring', 'Purpose selected anti skid ceramic flooring provides reliable grip, helping create a safer kitchen environment even in wet conditions.'],
        ['Granite Platform', 'A durable granite countertop with a premium stainless steel sink combines functionality, elegance and long lasting performance for the modern kitchen.'],
      ]],
      ['Toilets', [
        ['Designer Ceramic Walls', 'Premium designer ceramic tiles up to 6 feet in height create a refined, hygienic and easy to maintain bathroom space.'],
        ['Anti-Skid Floor Tiles', "High quality anti skid ceramic floor tiles provide enhanced grip and everyday comfort while complementing the bathroom's modern aesthetic."],
        ['Reputed Fittings', 'Bathrooms feature reputed brand wash basins, WCs/commodes, taps and chrome plated (CP) fittings, combining elegant design with dependable performance.'],
      ]],
      ['Wall Finish', [
        ['Interior Wall Finish', 'Premium POP punning creates a flawless, refined surface across interior walls providing the perfect canvas for your choice of paint, textures or wallpaper.'],
        ['Exterior Wall Finish', 'High quality cement paint provides a durable, weather resistant exterior finish, helping protect the building while maintaining its clean, elegant appearance over time.'],
      ]],
    ],
    locationIntro: 'Strategically located with seamless connectivity to key landmarks of Bhubaneswar',
    landmarks: [
      ['Healthcare', [['AIIMS, Bhubaneswar', '2.5 km']]],
      ['Transport', [['Retang Railway Station', '2 km'], ['National Highway', '2.5 km'], ['Proposed New Bhubaneswar Bus Stand', '4 km'], ['Biju Patnaik International Airport', '15 min']]],
      ['Work & study', [['Infocity-II (Asia’s Biggest IT City)', '10 min'], ['All Leading Educational Hubs', 'Nearby']]],
    ],
    map: plan('skr/map', 'Location map, Sai Krishna Residency'),
    contact: GM,
    contactTitle: 'Just A Decision Away',
    contactText: 'Step into a lifestyle designed around comfort, modern living and meaningful connections. Discover a home where your aspirations take shape, every convenience is within reach and every day feels a little more extraordinary. Your dream. Your space. Your next chapter.',
    connectText: 'Connect directly with our marketing leadership for transparent pricing, exclusive spot-booking benefits, customized unit selections, and priority site visits at Sai Krishna Residency.',
    brochure: '/brochures/sai-krishna-residency-brochure.pdf',
    brochureCover: '/images/brochures/sai-krishna-residency-cover.webp',
    brochureSize: '5.1 MB',
    areaStatement: SKR_AREA_STATEMENT,
    // Positions are % of the aerial render (placed by eye on clearly visible features).
    masterPlanSpots: [
      { id: 'towers', short: '1', x: 50, y: 55, tag: 'Residences', title: 'Residential towers', text: 'Mid-rise residential complexes of 6 floors each, set along landscaped internal roads.', link: { label: 'See the area statement', href: '#pricing' } },
      { id: 'pool', short: '2', x: 37, y: 82, tag: 'Amenity', title: 'Swimming pool', text: 'The township pool beside the towers, part of the resort-style amenities.', link: { label: 'View amenities', href: '#amenities' } },
      { id: 'rear', short: '3', x: 70, y: 17, tag: 'Residences', title: 'Towers along the rear avenue', text: 'More residential complexes line the internal avenue at the back of the township.' },
      { id: 'road', short: '4', x: 91, y: 62, tag: 'Access', title: 'Approach road', text: 'Wide approach roads on two sides for easy access to the gates.', link: { label: 'Location & connectivity', href: '#location' } },
      { id: 'greens', short: '5', x: 13, y: 22, tag: 'Surroundings', title: 'Open green surroundings', text: 'The township is set amid open land with room to grow further.' },
    ],
    walkthroughs: [
      { src: '/videos/sai-krishna-walkthrough-1.mp4', title: 'Walkthrough 1', caption: 'Sai Krishna Residency · video walkthrough', duration: '0:52', poster: img('skr/walkthrough-1', 'Walkthrough 1') },
      { src: '/videos/sai-krishna-walkthrough-2.mp4', title: 'Walkthrough 2', caption: 'Sai Krishna Residency · video walkthrough', duration: '1:32', poster: img('skr/walkthrough-2', 'Walkthrough 2') },
    ],
    extraDownloads: [{ href: '/brochures/sai-krishna-residency-site-plan.pdf', label: 'Sai Krishna Residency site plan', size: '5.5 MB' }],
    faq: [
      ['Where is Sai Krishna Residency located?', "Sai Krishna Residency is located in a prime area of Bhubaneswar, Odisha. It is just 2.5 km from AIIMS, 2 km from Retang Railway Station, and 15 minutes from Biju Patnaik International Airport. The project enjoys excellent connectivity to all major landmarks of the city."],
      ['What types of apartments are available?', 'Sai Krishna Residency offers 1 BHK, 2 BHK, and 3 BHK premium apartments. Each configuration is thoughtfully designed to maximize space utilization, natural light, and cross-ventilation for comfortable living.'],
      ['Is the building earthquake resistant?', 'Yes, the entire structure is built with an Earthquake Resistant R.C.C. (Reinforced Cement Concrete) Frame, designed to withstand seismic forces. Safety is our top priority in construction.'],
      ['What amenities are available at the project?', "The project features world-class amenities including a swimming pool, modern gym, jogging track, children's park, basketball & badminton courts, community hall, temple & market complex, 24/7 gated security, power backup, double lifts in each block, car parking facilities, and bore wells with 24-hour water supply."],
      ['Is there parking available?', 'Yes, Sai Krishna Residency offers extensive car parking facilities with 900+ dedicated parking spaces. The project is designed to accommodate the parking needs of all residents comfortably.'],
      ['How secure is the gated community?', 'Security is paramount at Sai Krishna Residency. The project features a high-rise compound wall that prevents all kinds of trespass, a gated community with round-the-clock security personnel, and advanced surveillance systems for complete peace of mind.'],
      ['Who is the developer behind this project?', 'Sai Krishna Residency is developed by Sai Krishna Homes Pvt. Ltd, one of the leading real estate developers in Bhubaneswar. With over 16 years of experience, Sai Krishna Homes Pvt.Ltd has set new trends in creating world-class townships and commercial spaces in prime locations.'],
      ['Is there 24/7 water and power supply?', 'Absolutely. The project is equipped with bore wells ensuring 24-hour uninterrupted water supply. Additionally, there is a power backup generator facility to ensure that residents never face any inconvenience due to power outages.'],
      ['How can I schedule a site visit?', 'You can schedule a site visit by calling us at 9178255757, emailing us at saikrishnahomes@gmail.com, or by filling out the enquiry form on this page. Our sales team will arrange a convenient time for your visit and provide a guided tour of the project.'],
    ],
    tours: [],
  },
  {
    slug: 'panchawati-residency',
    name: 'Panchawati Residency',
    status: 'Current project',
    tagline: 'Premium Lifestyle Living',
    headline: "Patia's Most Talked-About Address",
    location: 'Patia, Bhubaneswar',
    rera: 'RP/19/2023/00993',
    // Official Odisha RERA page. Checked 13 Nov 2026: 120 units, S+4, possession 20 Nov 2027.
    reraUrl:
      'https://rera.odisha.gov.in/projects/project-details/VTJGc2RHVmtYMSsrNUJOalNZNUpmRWQ1N1lDTkcrRmRCZUprUm5jUUVjZkVOWURNMThwdmRwQ2NWUEdDdjNsT2Z4ZmFlbXJSQzk5TGF5K3gySEdBME5GQkgreHNQNFdLN0JkODg4NzYxb009?name=Panchawati%20Residency',
    configs: ['1 BHK', '2 BHK', '3 BHK'],
    hero: PHOTOS.pwGate,
    card: PHOTOS.pwDay,
    stats: [
      ['3', 'Residential blocks'],
      ['1–3', 'BHK homes'],
      ['20', 'Amenities & services'],
      ['360°', 'Virtual home tours'],
    ],
    about: [
      'Panchawati Residency is designed to offer an elevated lifestyle experience. With its classical elevation, thoughtful amenities, and lush surroundings, this is where elegance meets everyday comfort.',
      'Experience the best of contemporary architecture with state-of-the-art facilities crafted for those who desire absolute perfection in their home.',
    ],
    highlightsTitle: 'Redefining comfort',
    highlights: [
      "Whether it's the dedicated A/C society hall or the tranquil reflexology path, every corner of Panchawati Residency is meticulously planned for your ultimate well-being.",
      'Classical elevation with a lantern-lit grand entrance.',
      'Three blocks (A, B and C) with 1, 2 and 3 BHK homes.',
      'Rooftop solar panels, EV charging, rainwater harvesting and an STP.',
    ],
    reasons: [],
    interiors: [PHOTOS.pwDay, PHOTOS.pwNight, PHOTOS.pwPool],
    floorPlans: [
      {
        id: 'block-a',
        label: 'Block A',
        text: 'An intricately designed layout featuring modern 2 BHK and 3 BHK apartments tailored for family comfort.',
        rooms: ['2 BHK', '3 BHK'],
        views: [plan('pw/block-a', 'Block A typical floor plan'), plan('pw/block-a-2bhk', 'Block A 2 BHK'), plan('pw/block-a-3bhk', 'Block A 3 BHK')],
        viewLabels: ['Typical floor', '2 BHK', '3 BHK'],
      },
      {
        id: 'block-b',
        label: 'Block B',
        text: 'Discover luxurious living spaces thoughtfully optimized for ventilation and natural light.',
        rooms: ['2 BHK', '3 BHK'],
        views: [plan('pw/block-b', 'Block B typical floor plan'), plan('pw/block-b-2bhk', 'Block B 2 BHK'), plan('pw/block-b-3bhk', 'Block B 3 BHK')],
        viewLabels: ['Typical floor', '2 BHK', '3 BHK'],
      },
      {
        id: 'block-c',
        label: 'Block C',
        text: 'A premium tower featuring exclusive 1 BHK and 2 BHK units crafted for intimate and cozy living.',
        rooms: ['1 BHK', '2 BHK'],
        views: [plan('pw/block-c', 'Block C typical floor plan'), plan('pw/block-c-1bhk', 'Block C 1 BHK'), plan('pw/block-c-2bhk', 'Block C 2 BHK')],
        viewLabels: ['Typical floor', '1 BHK', '2 BHK'],
      },
    ],
    areaNote: 'Explore layouts for Block A, Block B, and Block C carefully designed to maximize space and ventilation.',
    masterPlan: plan('pw/master-plan', 'Panchawati Residency master plan: Block A, B and C'),
    amenitiesIntro: 'Experience an abundance of lifestyle features tailored to pamper your senses',
    amenities: [
      ['Classical Elevation', img('pw/a-classical-elevation', 'Classical elevation')],
      ['Swimming Pool', img('pw/a-pool', 'Swimming pool')],
      ['Modern Gymnasium', img('pw/a-gym', 'Modern gymnasium')],
      ['Yoga Room', img('pw/a-yoga', 'Yoga room')],
      ['Dedicated A/C Society Hall', img('pw/a-ac-hall', 'A/C society hall')],
      ['Kids Play Area (Indoor)', img('pw/a-kids-play', 'Indoor kids play area')],
      ['Senior Citizen Seating Area', img('pw/a-senior-seating', 'Senior citizen seating area')],
      ['Paved Jogging Track', img('pw/a-jogging', 'Paved jogging track')],
      ['Reflexology Path', img('pw/a-reflexology', 'Reflexology path')],
      ['Rooftop Solar Panels', img('pw/a-solar', 'Rooftop solar panels')],
      ['EV Charging', img('pw/a-ev-charging', 'EV charging')],
      ['Intercom Facility', img('pw/a-intercom', 'Intercom facility')],
      ['24/7 Security', img('pw/a-security', '24/7 security')],
      ['Driveway', img('pw/a-driveway', 'Driveway')],
      ['Rainwater Harvesting', img('pw/a-rainwater', 'Rainwater harvesting')],
      ['Deep Borewell', img('pw/a-borewell', 'Deep borewell')],
      ['Power Backup (DG)', img('pw/a-power-backup', 'Power backup')],
      ['Separate Transformer', img('pw/a-transformer', 'Separate transformer')],
      ['Sewerage Treatment Plant (STP)', img('pw/a-stp', 'Sewerage treatment plant')],
      ['Fire Protection', img('pw/a-fire', 'Fire protection')],
    ],
    facilities: [],
    specs: [
      ['Structure & Flooring', [
        ['RCC Framed Structure', 'The entire structure is built with a robust Reinforced Cement Concrete (R.C.C.) frame, engineered for maximum stability and endurance.'],
        ['Vitrified Flooring', 'Premium vitrified floor tiles across Living, Dining, Master Bedroom, and all other rooms, providing a sleek and elegant finish to your home.'],
      ]],
      ['Kitchen', [
        ['Ceramic Wall Tiles & Counter', 'Ceramic tiles up to 3ft height from the counter top. Elegant Granite counter top equipped with a Single Bowl Stainless Steel sink.'],
        ['Dado Finish', 'Dado finished with cement-based putty, offering a clean and polished look to your cooking space.'],
      ]],
      ['Bathrooms', [
        ['Dado & Flooring', 'Premium Ceramic tiles up to lintel height. The flooring is also finished with high-quality anti-skid Ceramic tiles.'],
        ['Sanitary Wares', 'Reputed brand EWC with cistern and premium Porcelain wash basin for a modern bathroom experience.'],
        ['CP Fittings', 'All bathrooms are equipped with top-tier branded CP (Chrome Plated) fittings ensuring durability and elegance.'],
      ]],
      ['Doors & Walls', [
        ['Premium Doors', 'The main door features a fully laminated flush door, while all other internal doors are robust painted flush doors.'],
        ['Walls & Windows', 'Internal walls finished with cement-based Putty. High-quality Glazed Aluminum windows installed for great ventilation and natural light.'],
      ]],
      ['Electrical', [
        ['Concealed Wiring & Switches', 'Safe and efficient concealed copper wiring paired with modern, modular switches for aesthetic appeal and safety.'],
        ['Adequate Points', 'TV point in the Drawing room. Adequate electrical points across all bedrooms, Living/Dining, Kitchen & Toilets. Power point for AC in all Bedrooms & Living Room. Washing Machine point as per plan.'],
      ]],
      ['Lift & Extras', [
        ['Lifts & Staircase', '2 lifts in each tower (A&B) & 1 lift in Block C. Main & fire escape staircase features Granite flooring. Lobby floor finished with Vitrified / Ceramic tiles.'],
        ['Painting & Facilities', 'External Weather Coat finishing. Generator backup for common areas and apartment with restricted load. Water availability through Bore well as per Local Ground Water Authority guidelines.'],
      ]],
    ],
    locationIntro: 'Key landmarks around Patia',
    landmarks: [
      ['Hospitals', [['KIMS Hospital', '4 km'], ['Care Hospital', '7 km'], ['Utkal Hospital', '8 km']]],
      ['Education', [['KIIT College', '2.5 km'], ['Sai International', '4.7 km'], ['ODM Public', '6 km']]],
      ['IT sectors', [['Infosys', '4.3 km'], ['DLF Cyber City', '5 km'], ['TCS', '6 km']]],
      ['Transport', [['Railway Station', '12 km'], ['Baramunda Bus', '12 km'], ['BBSR Airport', '15 km']]],
    ],
    map: plan('pw/map', 'Location map, Panchawati Residency'),
    contact: CMO,
    contactTitle: 'Book Your Dream Home',
    contactText: 'Take the first step towards your dream home. Our dedicated sales team is ready to assist you',
    connectText: 'Connect directly with our marketing leadership for transparent pricing, exclusive spot-booking benefits, customized unit selections, and priority site visits at Panchawati Residency.',
    brochure: '/brochures/panchawati-residency-brochure.pdf',
    brochureCover: '/images/brochures/panchawati-residency-cover.webp',
    brochureSize: '18 MB',
    priceList: PANCHAWATI_PRICES,
    // Block C = the narrow middle building (6 flats/floor). TODO: client to confirm Block A (left) vs Block B (right).
    masterPlanSpots: [
      { id: 'a', short: 'A', x: 30, y: 47, tag: 'Block A', title: 'Block A', text: 'Modern 2 BHK and 3 BHK apartments tailored for family comfort.', facts: blockFacts('A'), link: { label: 'Block A price list', href: '#pricing' } },
      { id: 'c', short: 'C', x: 51, y: 40, tag: 'Block C', title: 'Block C', text: 'A premium tower featuring exclusive 1 BHK and 2 BHK units crafted for intimate and cozy living.', facts: blockFacts('C'), link: { label: 'Block C price list', href: '#pricing' } },
      { id: 'b', short: 'B', x: 73, y: 47, tag: 'Block B', title: 'Block B', text: 'Luxurious 2 BHK and 3 BHK homes thoughtfully optimized for ventilation and natural light.', facts: blockFacts('B'), link: { label: 'Block B price list', href: '#pricing' } },
      { id: 'entry', short: '1', x: 51, y: 72, tag: 'Arrival', title: 'Grand entrance & lobby', text: 'The lantern-lit classical entrance with a landscaped forecourt leading into the community.' },
      { id: 'drive', short: '2', x: 25, y: 87, tag: 'Access', title: 'Driveway & road frontage', text: 'Wide driveway along the front of the property with planted edges.' },
      { id: 'green', short: '3', x: 8, y: 40, tag: 'Landscape', title: 'Green belt', text: 'A continuous belt of trees and planting around the boundary of the site.' },
    ],
    startingFrom: 4466000,
    tourTitle: 'Experience The Reality',
    tourText: 'Step inside and take an interactive walk through our premium configurations.',
    faq: [
      ['Where is Panchawati Residency located?', "Panchawati Residency is located in Patia, Bhubaneswar, Odisha. It is 2.5 km from KIIT College, 4 km from KIMS Hospital, 4.3 km from Infosys and 15 km from BBSR Airport, with excellent connectivity to the city’s hospitals, schools and IT hubs."],
      ['What types of apartments are available?', 'Panchawati Residency offers 1 BHK, 2 BHK, and 3 BHK premium apartments. Each configuration is thoughtfully designed to maximize space utilization, natural light, and cross-ventilation for comfortable living.'],
      ['Is the building earthquake resistant?', 'Yes, the entire structure is built with an Earthquake Resistant R.C.C. (Reinforced Cement Concrete) Frame, designed to withstand seismic forces. Safety is our top priority in construction.'],
      ['What amenities are available at the project?', "The project features a swimming pool, modern gymnasium, yoga room, dedicated A/C society hall, indoor kids play area, senior citizen seating area, paved jogging track and reflexology path, along with rooftop solar panels, EV charging, intercom, 24/7 security, power backup (DG), a separate transformer, rainwater harvesting, a deep borewell, an STP and fire protection."],
      ['Is there parking available?', 'Yes, Panchawati Residency offers extensive car parking facilities with 900+ dedicated parking spaces. The project is designed to accommodate the parking needs of all residents comfortably.'],
      ['How secure is the gated community?', 'Security is paramount at Panchawati Residency. The project features a high-rise compound wall that prevents all kinds of trespass, a gated community with round-the-clock security personnel, and advanced surveillance systems for complete peace of mind.'],
      ['Who is the developer behind this project?', 'Panchawati Residency is developed by Sai Krishna Homes Pvt. Ltd, one of the leading real estate developers in Bhubaneswar. With over 16 years of experience, Sai Krishna Homes Pvt.Ltd has set new trends in creating world-class townships and commercial spaces in prime locations.'],
      ['Is there 24/7 water and power supply?', 'Absolutely. The project is equipped with bore wells ensuring 24-hour uninterrupted water supply. Additionally, there is a power backup generator facility to ensure that residents never face any inconvenience due to power outages.'],
      ['How can I schedule a site visit?', 'You can schedule a site visit by calling us at 8342948803, emailing us at saikrishnahomes@gmail.com, or by filling out the enquiry form on this page. Our sales team will arrange a convenient time for your visit and provide a guided tour of the project.'],
    ],
    tours: VIRTUAL_TOURS,
  },
];

export const projectPath = (slug) => `/projects/${slug}`;

/** "Past projects" as shown on the client's existing website (photos with captions, no project names). */
export const PAST_WORK = [
  img('past/living-room', 'Luxury Living Room'),
  img('past/lobby', 'Lobby with high ceiling'),
  img('past/kitchen', 'Large Kitchen Area'),
  img('past/bedroom', 'Bedroom Area'),
  img('past/co-working', 'Co-Working & Meeting Spaces'),
  img('past/bathroom', 'Luxury bathroom'),
  img('past/gym', 'Indoor Gym Area'),
  img('past/junior-play', 'Junior Play Area'),
  img('past/terrace-pool', 'Terrace Swimming Pool'),
  img('past/parking', 'Large Parking area'),
];
