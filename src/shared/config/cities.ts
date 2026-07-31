export type CityDictionaryItem = {
  gcId: number;
  name: string;
  fullName: string;
  lat: number;
  lon: number;
};

export const CITY_DICTIONARY: readonly CityDictionaryItem[] = [
  {
    gcId: 1,
    name: 'Москва',
    fullName: 'Москва, Россия',
    lat: 55.7558,
    lon: 37.6173,
  },
  {
    gcId: 2,
    name: 'Санкт-Петербург',
    fullName: 'Санкт-Петербург, Россия',
    lat: 59.9311,
    lon: 30.3609,
  },
  {
    gcId: 59,
    name: 'Пермь',
    fullName: 'Пермь, Россия',
    lat: 58.0105,
    lon: 56.2502,
  },
  {
    gcId: 66,
    name: 'Екатеринбург',
    fullName: 'Екатеринбург, Россия',
    lat: 56.8389,
    lon: 60.6057,
  },
  {
    gcId: 52,
    name: 'Нижний Новгород',
    fullName: 'Нижний Новгород, Россия',
    lat: 56.2965,
    lon: 43.9361,
  },
  {
    gcId: 16,
    name: 'Казань',
    fullName: 'Казань, Россия',
    lat: 55.7963,
    lon: 49.1088,
  },
  {
    gcId: 63,
    name: 'Самара',
    fullName: 'Самара, Россия',
    lat: 53.1959,
    lon: 50.1002,
  },
  {
    gcId: 54,
    name: 'Новосибирск',
    fullName: 'Новосибирск, Россия',
    lat: 55.0084,
    lon: 82.9357,
  },
  {
    gcId: 24,
    name: 'Красноярск',
    fullName: 'Красноярск, Россия',
    lat: 56.0153,
    lon: 92.8932,
  },
  {
    gcId: 74,
    name: 'Челябинск',
    fullName: 'Челябинск, Россия',
    lat: 55.1644,
    lon: 61.4368,
  },
  {
    gcId: 55,
    name: 'Омск',
    fullName: 'Омск, Россия',
    lat: 54.9885,
    lon: 73.3242,
  },
  {
    gcId: 61,
    name: 'Ростов-на-Дону',
    fullName: 'Ростов-на-Дону, Россия',
    lat: 47.2357,
    lon: 39.7015,
  },
  {
    gcId: 36,
    name: 'Воронеж',
    fullName: 'Воронеж, Россия',
    lat: 51.672,
    lon: 39.1843,
  },
  {
    gcId: 23,
    name: 'Краснодар',
    fullName: 'Краснодар, Россия',
    lat: 45.0355,
    lon: 38.9753,
  },
  {
    gcId: 72,
    name: 'Тюмень',
    fullName: 'Тюмень, Россия',
    lat: 57.1522,
    lon: 65.5272,
  },
  {
    gcId: 39,
    name: 'Калининград',
    fullName: 'Калининград, Россия',
    lat: 54.7104,
    lon: 20.4522,
  },
];

export const CITY_NAMES: readonly string[] = CITY_DICTIONARY.map((city) => city.name);

export function isKnownCity(name: string): boolean {
  return CITY_NAMES.some((city) => city.toLowerCase() === name.toLowerCase());
}

export function findCityByName(name: string): CityDictionaryItem | undefined {
  return CITY_DICTIONARY.find((city) => city.name.toLowerCase() === name.toLowerCase());
}
