export const BODY_TYPES = [
  'тентованный',
  'рефрижератор',
  'изотермический',
  'фургон',
  'бортовой',
  'контейнеровоз',
] as const;

export const CARGO_NAMES = [
  'Мороженое',
  'Бытовая техника',
  'Стройматериалы',
  'Мебель',
  'Продукты питания',
  'Автозапчасти',
  'Бумага',
  'Химия бытовая',
] as const;

export const ORGANIZATIONS = [
  {
    id: 340,
    name: 'ЛИМ',
    inn: '7703769184',
    kpp: '770301001',
    subscriberId: 98,
  },
  {
    id: 341,
    name: 'ТрансЛогистик',
    inn: '7714236581',
    kpp: '771401001',
    subscriberId: 99,
  },
  {
    id: 342,
    name: 'СеверСнаб',
    inn: '5904112233',
    kpp: '590401001',
    subscriberId: 100,
  },
  {
    id: 343,
    name: 'АгроТрейд',
    inn: '6316445566',
    kpp: '631601001',
    subscriberId: 101,
  },
] as const;

export const COMPETITORS = [
  {
    id: 21,
    name: 'ООО Автовек',
    inn: '7701234567',
    subscriberId: 31,
    contact: 'Петров Пётр',
  },
  {
    id: 22,
    name: 'ООО ГрузСервис',
    inn: '5905678901',
    subscriberId: 32,
    contact: 'Сидоров Сидор',
  },
  {
    id: 23,
    name: 'ИП Кузнецов',
    inn: '660312345678',
    subscriberId: 33,
    contact: 'Кузнецов Артём',
  },
] as const;

export const PAYMENT_FORMS = ['Безналичная с НДС', 'Безналичная без НДС'] as const;
