const STREAMING_PROVIDERS = [
  { id: 2, name: 'Apple TV+' },
  { id: 337, name: 'Disney+' },
  { id: 307, name: 'Globoplay' },
  { id: 1899, name: 'HBO Max' },
  { id: 8, name: 'Netflix' },
  { id: 531, name: 'Paramount+' },
  { id: 119, name: 'Prime Video' },
];

const COUNTRIES = [
  { code: 'DE', name: 'Alemanha' },
  { code: 'BR', name: 'Brasil' },
  { code: 'KR', name: 'Coreia do Sul' },
  { code: 'ES', name: 'Espanha' },
  { code: 'US', name: 'EUA' },
  { code: 'FR', name: 'França' },
  { code: 'IT', name: 'Itália' },
  { code: 'JP', name: 'Japão' },
  { code: 'GB', name: 'Reino Unido' },
];

const CONFIG = {
  BEARER: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ZmE0YTkzZGFjNDYwNzA1MzJlODU1MmQzYTRjNzNjNSIsInN1YiI6IjY1ZGE3NmI1MDViNTQ5MDE3YjE2NjMwNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.jhV8oBj2vm6MdiEUz4Mo5vXJpwOXjOFeELV3YylkR6E',
  BASE: 'https://api.themoviedb.org/3',
  IMG_SM: 'https://image.tmdb.org/t/p/w300',
  IMG_MD: 'https://image.tmdb.org/t/p/w500',
  IMG_LG: 'https://image.tmdb.org/t/p/w780',
  BACKDROP_SM: 'https://image.tmdb.org/t/p/w780',
  BACKDROP_LG: 'https://image.tmdb.org/t/p/w1280',
  BACKDROP_OG: 'https://image.tmdb.org/t/p/original',
  LANG: 'pt-BR',
};
const GENRES = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  53: 'Suspense',
  10752: 'Guerra',
  37: 'Faroeste',
};
const TV_GENRES = {
  10759: 'Ação & Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  10762: 'Kids',
  9648: 'Mistério',
  10764: 'Reality',
  10749: 'Romance',
  10765: 'Ficção Científica & Fantasia',
  10768: 'Guerra & Política',
  37: 'Faroeste',
};
const ALL_GENRES = { ...GENRES, ...TV_GENRES };
const FEATURED_GENRES = [
  {
    id: 28,
    name: 'Ação',
    mediaType: 'movie',
    without_genres: '16,12,14,878,18,99,36,10752,35,10402'
  },
  {
    id: 35,
    name: 'Comédia',
    mediaType: 'both',
    without_genres: '53,28,12,14,878,16,99,36,10752,10402,18,10749',
    without_genres_tv: '53,10759,10765,16,99,36,10768,10402,18,10749'
  },
  {
    id: 18,
    name: 'Drama',
    mediaType: 'both',
    without_genres: '35,16,12,14,878,99,36,10752,10402,10749,80,27',
    without_genres_tv: '35,16,10759,10765,99,36,10768,10402,10749,80,27'
  },
  {
    id: 27,
    name: 'Terror',
    mediaType: 'movie',
    without_genres: '35,10749,16,99,36,10752,10402,878'
  },
  {
    id: 878,
    name: 'Ficção Científica',
    mediaType: 'movie',
    without_genres: '16,12,14,99,36,10752,10402,35,10749'
  },
  {
    id: 53,
    name: 'Suspense',
    mediaType: 'movie',
    without_genres: '35,10749,16,12,14,878,27,28,99,36,10752,10402'
  },
  {
    id: 10749,
    name: 'Romance',
    mediaType: 'both',
    without_genres: '27,53,16,99,36,10752,10402',
    without_genres_tv: '27,53,16,99,36,10768,10402',
    without_genres_anime: ''
  },
  {
    id: 16,
    name: 'Animação',
    mediaType: 'movie',
    without_genres: '99,36,10752,10402'
  },
  {
    id: 80,
    name: 'Crime',
    mediaType: 'both',
    without_genres: '35,10749,16,12,14,878,99,36,10752,10402',
    without_genres_tv: '35,10749,16,10759,10765,99,36,10768,10402'
  },
  {
    id: 12,
    name: 'Aventura',
    mediaType: 'movie',
    without_genres: '16,27,878,14,99,36,10752,10402,18'
  },
  {
    id: 14,
    name: 'Fantasia',
    mediaType: 'movie',
    without_genres: '16,27,18,878,99,36,10752,10402'
  },
  {
    id: 99,
    name: 'Documentário',
    mediaType: 'both'
  },
  {
    id: 10759,
    name: 'Ação & Aventura',
    mediaType: 'tv',
    without_genres: '16,99,36,10768,10402,10765,80',
    without_genres_anime: '99,36,10768,10402,10765'
  },
  {
    id: 10765,
    name: 'Sci-Fi & Fantasia',
    mediaType: 'tv',
    without_genres: '16,99,36,10768,10402,10759',
    without_genres_anime: '99,36,10768,10402,10759'
  },
];
const STREAMING_SERVICES = [
  { id: 8, name: 'Netflix' },
  { id: 119, name: 'Prime Video' },
  { id: 337, name: 'Disney+' },
  { id: 1899, name: 'HBO Max' },
  { id: 531, name: 'Paramount+' },
  { id: 307, name: 'Globoplay' },
  { id: 350, name: 'Apple TV+' },
  { id: 283, name: 'Crunchyroll' },
  { id: 167, name: 'Mubi' },
];

const CONTENT_TYPE_META = {
  movie: {
    icon: 'ph ph-film-slate',
    label: 'Filme'
  },
  tv: {
    icon: 'ph ph-television',
    label: 'Série'
  },
  anime: {
    icon: 'ph-fill ph-star-four',
    label: 'Anime'
  },
};

const VIBES = {
  nostalgica: {
    label: 'Nostálgica',
    icon: 'ph-clock-counter-clockwise',
    desc: 'Clássicos inesquecíveis',
    color: '#f59e0b',
    params: {
      with_genres: '18|28|12|10749',
      without_genres: '16,99',
      'release_date.lte': '2010-12-31',
      'release_date.gte': '1950-01-01',
      sort_by: 'popularity.desc',
      'vote_count.gte': 500,
      'vote_average.gte': 7.5,
    },
  },
  frenetica: {
    label: 'Frenética',
    icon: 'ph-lightning',
    desc: 'Sem pausa, sem respiro',
    color: '#ef4444',
    params: {
      with_genres: '28|53|80',
      without_genres: '16,35,10751,10749,878,12,36,99',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  divertida: {
    label: 'Divertida',
    icon: 'ph-mask-happy',
    desc: 'Leveza e boas risadas',
    color: '#eab308',
    params: {
      with_genres: '35',
      without_genres: '27,53,36,10752,99,16,14,18',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  dramatica: {
    label: 'Dramática',
    icon: 'ph-mask-sad',
    desc: 'Histórias que machucam',
    color: '#8b5cf6',
    params: {
      with_genres: '18',
      without_genres: '27,28,10752,53,36,99,16,80,14,878',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  romantica: {
    label: 'Romântica',
    icon: 'ph-heart',
    desc: 'O amor está no ar',
    color: '#ec4899',
    params: {
      with_genres: '10749',
      without_genres: '27,878,36,10752,99,16,80',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  sombria: {
    label: 'Sombria',
    icon: 'ph-skull',
    desc: 'Para os destemidos',
    color: '#6366f1',
    params: {
      with_genres: '27',
      without_genres: '35,878,10751,16,10749,12,10402,37,99',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  faroeste: {
    label: 'Faroeste',
    icon: 'ph-cowboy-hat',
    desc: 'Bang-bang no velho oeste',
    color: '#d97706',
    params: {
      with_genres: '37',
      without_genres: '16,35,10751,99',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  detetive: {
    label: 'Detetive',
    icon: 'ph-detective',
    desc: 'Mistério e investigação',
    color: '#8b5cf6',
    params: {
      with_genres: '9648|80|53',
      with_keywords: '703',
      without_genres: '16,35,10751,99',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  infancia: {
    label: 'Infância',
    icon: 'ph-lego',
    desc: 'Reviva a criança interior',
    color: '#06b6d4',
    params: {
      with_genres: '16',
      without_genres: '27,53,80,28,10752,99',
      without_keywords: '210024',
      certification_country: 'BR',
      certification: 'L',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  corrida: {
    label: 'Corrida',
    icon: 'ph-flag-checkered',
    desc: 'Velocidade e adrenalina',
    color: '#f97316',
    params: {
      with_keywords: '830|14725|10039|266725|302340',
      without_genres: '16,35,10751,99',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  astronauta: {
    label: 'Astronauta',
    icon: 'ph-planet',
    desc: 'Explorando o universo',
    color: '#3b82f6',
    params: {
      with_genres: '878',
      with_keywords: '9882|14626|4040|191132',
      without_genres: '16,35,10751,99',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
  apocalipse: {
    label: 'Fim do Mundo',
    icon: 'ph-meteor',
    desc: 'Catástrofes apocalípticas',
    color: '#dc2626',
    params: {
      with_genres: '878|28',
      with_keywords: '12332|10150|10617|5096',
      without_genres: '16,35,10751,99',
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    },
  },
};
