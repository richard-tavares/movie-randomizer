# MovieRandomizer

Plataforma de descoberta de filmes, séries e animes. Explore catálogos, encontre conteúdo pela sua vibe do momento, use o sorteador inteligente com filtros avançados e gerencie suas listas, tudo em um só lugar.

Acesse em: [richard-tavares.github.io/movie-randomizer](https://richard-tavares.github.io/movie-randomizer/)

## Funcionalidades

- **Sorteador Inteligente** — sorteia filmes, séries e animes com filtros de gênero, ano, nota, plataforma, país e classificação indicativa
- **Explorar** — catálogo completo com sidebar de filtros, busca por nome e paginação
- **Vibes** — 12 estados de espírito que mapeiam para recomendações (Nostálgica, Sombria, Romântica, Frenética...)
- **Sugestão do Dia** — um título diferente a cada dia, selecionado entre os mais bem avaliados e populares
- **Em Breve** — lançamentos próximos organizados por mês
- **Página de Título** — detalhes completos: elenco, títulos similares, onde assistir e trailer
- **Página de Ator** — filmografia ordenada por nota, filtrada de aparições irrelevantes
- **Minhas Listas** — salvar e favoritar conteúdos, persistidos no **localStorage**
- **Busca** — pesquisa em tempo real de filmes e séries direto da navbar

## Tecnologias

- HTML, CSS e JavaScript — sem frameworks
- [TMDB API](https://developer.themoviedb.org/docs/) — dados de filmes, séries, atores e animes
- [Phosphor Icons](https://phosphoricons.com/) — iconografia
- [Google Fonts](https://fonts.google.com/) — Nunito, Outfit, Inter

## Estrutura

```
├── index.html              # Página principal
├── title.html              # Detalhes de um título
├── person.html             # Filmografia de ator/diretora
├── explore.html            # Catálogo com filtros
├── upcoming.html           # Em breve nos cinemas
├── assets/
│   ├── css/                # Estilos por módulo
│   ├── js/                 # Scripts por módulo
│   └── img/                # Ícones e logos
└── site.webmanifest        # PWA manifest
```

## Autor

[@richard-tavares](https://github.com/richard-tavares)
