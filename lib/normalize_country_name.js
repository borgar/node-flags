var alias = {
  'syrian_arab_republic': 'syria'
, 'lao_peoples_democratic_republic': 'laos'
, 'united_states_minor_outlying_islands': 'us_minor_islands'
, 'united_states_minoroutlying_islands': 'us_minor_islands'
, 'united_states_of_america': 'usa'
, 'united_states': 'usa'
, 'united_arab_emirates': 'emirates'
, 'french_south_territories': 'taaf' // French Southern Territories
, 'french_south_lands': 'taaf' // French Southern and Antarctic Lands
, 'french_south_and_antarctic_lands': 'taaf' // French Southern and Antarctic Lands
, 'commonwealth_of_independent_states': 'cis'
, 'heard_island_and_mcdonald_islands': 'himi'
, 'heard_and_mcdonald_islands': 'himi'
, 'uk_indian_ocean_territory': 'biot'
, 'uk_indian_oceanterritory': 'biot'
, 'saint_kitts_and_nevis': 'st_kitts_nevis'
, 'libyan_arab_jamahiriya': 'libya'  // unsure about this: flags are different
, 'northern_mariana_islands': 'cnmi'
, 'palestinian_territory': 'palestine'
, 'palestinian_authority': 'palestine'
, 'south_georgia_and_the_south_sandwich_islands': 'sgssi'
, 'south_georgia_and_southsandwich_islands': 'sgssi'
, 'svalbard_and_jan_mayen': 'svalbard'
, 'svalbard_and_jan_mayenislands': 'svalbard'
, 'saint_pierre_and_miquelon': 'st_pierre_miquelon'
, 'turks_and_caicos_islands': 'tci'
, 'st_vincent_and_thegrenadines': 'grenadines'
, 'st_vincent_and_the_grenadines': 'grenadines' // Saint Vincent and the Grenadines
, 'brunei_darussalam': 'brunei'
, 'east_timor': 'timor_leste'
, 'akrotiri_and_dhekelia': 'uk_cyprus' // Akrotiri and Dhekelia
, 'nagorno_karabakh_republic': 'nkr' // Nagorno-Karabakh Republic
, 'italian_tripolitania': 'italian_libya' // Italian Tripolitania
, 'condominium_of_bosnia_and_herzegovina': 'cmbh' // Condominium of Bosnia and Herzegovina
, 'ottoman_empire': 'ottoman' // Ottoman Empire
, 'emirate_of_diriyah': 'diriyah' // Emirate of Diriyah
, 'karamanid_dynasty': 'karamanids' // Karamanid dynasty
, 'first_hellenic_republic': 'hellenic1' // First Hellenic Republic
, 'second_hellenic_republic': 'hellenic2' // Second Hellenic Republic
, 'french_protectorate_of_tunisia': 'french_tunisia' // French protectorate of Tunisia
, 'fezzan_ghadames': 'french_libya' // Fezzan-Ghadames
, 'puntland_somalia': 'puntland' // Puntland State of Somalia
, 'dervish_state': 'daraawiish' // Dervish state
, 'azad_jammu_and_kashmir': 'ajk' // Azad Jammu and Kashmir
, 'sahrawi_arab_democratic_republic': 'sadr' // Sahrawi Arab Democratic Republic
, 'west_sahara': 'sadr'
, 'falkland_islands': 'malvinas' // Falkland Islands (Malvinas)
, 'north_mariana_islands': 'cnmi' // Northern Mariana Islands
, 'jolly_roger': 'pirate' // Jolly Roger
, 'trust_territory_of_somalia': 'somalia_tt' // Trust Territory of Somalia
, 'sovereign_military_order_of_malta': 'smom' // Sovereign Military Order of Malta
, 'macedonia_the_former_yugoslav': 'macedonia' // Macedonia, the former Yugoslav Republic of
, 'st_helena_ascension_and_tristan_da_cunha': 'sh_a_tdc' // Saint Helena, Ascension and Tristan da Cunha
, 'caribbean_netherlands': 'bes_islands'
, 'wallis_and_futuna_islands': 'wallis_and_futuna'
, 'bonaire_sint_eustatiusand_saba': 'bonaire'
, 'russian_federation': 'russia'
, 'macao': 'macau'
, 'pitcairn_islands': 'pitcairn'
, 'aland_islands': 'aland'
, 'federation_of_malaya': 'malaya'
, 'khmer_republic': 'khmer'
, 'byelorussian_soviet_socialist_republic': 'bssr'
, 'european_union': 'eu'
};

function normalize_country_name ( name ) {
  if ( /\bkorea\b/i.test( name ) ) {
    if ( /\b(democratic|dpr|d\.\s*p\.\s*r\.|people)/i.test( name ) ) {
      return 'north_korea';
    }
    return 'south_korea';
  }
  if ( /\byugoslavia\b/i.test( name ) ) {
    if ( /\b(socialist|sfr|s\.\s*f\.\s*r\.)\b/i.test( name ) ) {
      return 'yugoslavia';
    }
    if ( /\b(federal|republic)\b/i.test( name ) ) {
      return 'serbia_and_montenegro';
    }
    return 'yugoslavia';
  }
  if ( /\bchina\b/i.test( name ) ) {
    // Taiwan, Republic of China, Chinese Taipei
    if ( /\b(people|dpr|d\.\s*p\.\s*r\.)\b/i.test( name ) ) {
      return 'china';
    }
    if ( /\b(taiwan|republic|taipei)\b/i.test( name ) ) {
      return 'taiwan';
    }
    return 'china';
  }
  if ( /\bviet[\s\-]?nam\b/i.test( name ) ) {
    if ( /\b(north|democratic)\b/i.test( name ) ) {
      return 'north_vietnam';
    }
    if ( /\b(south|republic)\b/i.test( name ) ) {
      return 'south_vietnam';
    }
    return 'vietnam';
  }
  if ( /virgin\s+islands/i.test( name ) ) {
    if ( /united\sstates|u\.s\.|\bus\b/i.test( name ) ) {
      return 'usvi';
    }
    if ( /spanish|puerto(\srican)?/i.test( name ) ) {
      return 'passage_islands';
    }
    // default is the "british"
    return 'virgin_islands';
  }
  if ( /congo/i.test( name ) ) {
    if ( /(?:democratic|dr|d\.r\.)/i.test( name ) ) {
      return 'congo_dr';
    }
    else if ( /(?:brazzaville|people)/i.test( name ) ) {
      return 'congo_brazzaville';
    }
    else if ( /(?:kinshasa|l[eé]opoldville)/i.test( name ) ) {
      return 'congo_kinshasa';
    }
    else if ( /(?:free state|belgian)/i.test( name ) ) {
      return 'congo_belgian';
    }
    return 'congo';
  }
  if ( /(?:vatican|holy\s+see)/i.test( name ) ) {
    return 'vatican';
  }
  var id = name.toLowerCase()
            .replace( /^(.+), british$/, 'british $1' ) // virgin islands
            .replace( /^(.+), u\.s\.$/, 'u.s. $1' ) // virgin islands
            .replace( /\(keeling\)/, '' ) // Cocos (Keeling) islands

            .replace( /^the/, '' )
            .replace( /['\.]/g, '' )
            .replace( /:.*$/, '' )
            .replace( /\(.*\)$/, '' )
            .replace( /\bbritish\b/, 'uk' )
            .replace( /\bsaint\b/, 'st' )
            .replace( /\b(islamic|plurinational|federated)\b/, '' )
            .replace( /\bstates?\s+of(?!\samerica)\b/, '' )
            .replace( /\b((people(s\'?|\'s|s)|united|bolivarian)\s)?republic\s+of\b/, '' )
            .replace( /\b(north|west|east|south)ern\b/, '$1' )
            .replace( /\[.*?\]/g, '' )
            .replace( /å/g, 'a' )
            .replace( /é/g, 'e' )
            .replace( /ç/g, 'c' )
            .replace( /ô/g, 'o' )
            .replace( /í/g, 'i' )
            .replace( /ã/g, 'a' )
            .replace( /\b[12]$/, '' )
            .replace( /\W+/g, ' ' )
            .trim()
            .replace( /[\s\-\/]+/g, '_' )
            ;
  if ( id in alias ) {
    id = alias[ id ];
  }
  return id;
}
exports.normalize_country_name = normalize_country_name;
