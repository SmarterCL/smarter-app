import { Product, Activity } from './types.ts';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Heirloom Harvest Box',
    description: 'Our curated selection of 10-12 seasonal varieties, direct from the greenhouse.',
    price: 34.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQPFT_-0TMDHzu2O6aIyI4sqZkUWAGYJDnn_xu5MdoSRPF1TV8gaaB1IIsoYpYCsewL8REk3ZCRZapUsXr8_s_PFsRNj5dmVA0EosiNWQgmrHeOsSnT8dXuCpzba8-9b5NzqlGmmTm74JCLRcvt2ge5lj_Twm6dFBrrhN3WV7olvpanxorAObVhueNX6T0VQRMMRezmjT7h7fV1yKZo3ENUzArSQ7uoa7CI9Ar0SqifHSYeUk8e10ciDVSWy2DjTVbsNxkJfB2_nZb',
    category: 'Seasonal',
    badge: 'Seasonal Pick',
    unit: 'Box'
  },
  {
    id: '2',
    name: 'Wild Strawberries',
    description: '500g / Organic',
    price: 6.50,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbCWudxuOxNpojUrhZKCTNt24TCt_fE1YNYvQ9pxlkldWILwx6AiDiah8mqaSSfpXGNQFrkjnB7OiZBBhMwnFxf0fd0K_q_VhNXakN6OYZMTtVKHRiywKTB4lKaevhNPaoORlJe2advSVtJUJ8MdZFS-p0o4qQWjartIYBSZL3I01ipNjYbtPARf5CzP-ePngRAqenXI_rYhFBRqaimRqxJ80pTNug8xt_MTsKxMQCUAVS2LyUOZTw1Z7qjmNgVsUQ-qMgwoBTVgii',
    category: 'Fruits',
    unit: '500g'
  },
  {
    id: '3',
    name: 'Hass Avocados',
    description: 'Pack of 2 / Ripe',
    price: 4.20,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzWsvh-qsndgB3QKi5nPOKx_H_g2XACn9Nr_n5jUc476LTrjiY61YQuhm61wSOHGoFcC9yzji5q2fM_XK76_A5PjJarHxExw2GxbOWRs3gXfiVKY6uzOTGsv1SGfTtTFVMjNjqp6cntkImMK0XA1edoRvF3Mp8zAyk_2WrwxcFVvXOXv5ccqCh_QazJYzCBTEP0irDoiC5tTUoUpCd1TIG_kLpIXhglQ8QRubVI4X1dp5baWPVws_EsAVcVhi-9KMklrIz5DxRHYvw',
    category: 'Vegetables',
    unit: '2 units'
  },
  {
    id: '4',
    name: 'Tuscan Kale',
    description: '200g Bunch / Local',
    price: 3.15,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDWMT0Q2ovYOQQ1JKTSXBuj8b-an8VP0jlYJqkDA4Ajf8VnxfbKcuEa-m7ndvteQYBlyhgZF45bZGFpY8suf0QB5hisOWibhoKZVUeZecA5rOmOB_Ni0wnQXAJ8Gi9hfT3j1f5NcGzbLJA-_NQ1PDKGWgCF5g745HvPf3RqoFGY6VzKOpQZzZHec7COBy8B0we8aO3G075BIOxt-l7K0jLry3J4ehVtphAyldbESKOj74Ru5olHcvS0jC1H2ZucHVA3XVvfAOsPgt8',
    category: 'Vegetables',
    unit: '200g'
  },
  {
    id: '5',
    name: 'Ancient Grain Loaf',
    description: '800g / Stoneground',
    price: 7.80,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCLthM7DPNYkOlwfvK8Iu5czu6GrgC6ci6fYt3VUdZrKCLGMdc4au4xaTOvjcL8Yr2gTN3eUO6z4jySHE7G_PQ_IaUSWp388gKPqdp6NnLTeVijbXGvFgCHKBtS5Nm2JvzfXeEAzyLzAVNCZni5496nV6dyAYM3g2kYf8bBogW4-ULgueYQxkaPCbsY7H-Hl8uHmn5wnhbd6ktt3m7Zi8RNCqN5YoCsFts3rcklKLUk5RiR_ABukSdmJQpiYKvK_zUOxsZW6C7I30U',
    category: 'Artisan',
    unit: '800g'
  }
];

export const ACTIVITIES: Activity[] = [
  {
    id: '1',
    title: 'Escaneo de Botellas PET',
    points: '+150 puntos',
    time: 'Hace 2 horas',
    amount: '+$2.00',
    type: 'gain',
    icon: 'Recycle'
  },
  {
    id: '2',
    title: 'Canje en Supermercado',
    points: 'Cupón #442',
    time: 'Ayer',
    amount: '-$15.00',
    type: 'spent',
    icon: 'ShoppingBag'
  },
  {
    id: '3',
    title: 'Escaneo de Aluminio',
    points: '+45 puntos',
    time: '12 Oct',
    amount: '+$0.80',
    type: 'gain',
    icon: 'Zap'
  }
];
