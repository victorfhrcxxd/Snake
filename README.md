# Snake Multiplayer ULTIMATE

Um jogo da cobrinha multiplayer em tempo real com funcionalidades avanÃ§adas!

## ðŸŽ® Funcionalidades

- **2 Modos de Jogo:**
  - **ClÃ¡ssico**: Cobra nÃ£o atravessa paredes (teleporta)
  - **Batalha**: Cobra morre nas laterais

- **Sala de Espera**: Interface de espera antes da partida
- **Sistema de Temporadas**: Temporada Halloween 2024 ativa
- **Power-ups Especiais**: Velocidade, Invencibilidade, Pontos Duplos, etc.
- **PersonalizaÃ§Ã£o**: Skins, AcessÃ³rios, Efeitos de Rastro, Temas
- **Chat Global**: ComunicaÃ§Ã£o entre jogadores
- **Ranking Global**: Sistema de pontuaÃ§Ã£o
- **Interface Responsiva**: Funciona em desktop e mobile

## ðŸš€ Como Executar

1. **Instalar Node.js** (versÃ£o 14 ou superior)
2. **Instalar dependÃªncias:**
   `ash
   npm install
   `
3. **Iniciar o servidor:**
   `ash
   npm start
   `
4. **Acessar o jogo:**
   Abra http://localhost:3000 no seu navegador

## ðŸŽ¯ Controles

- **Setas** ou **WASD**: Mover a cobra
- **Enter**: Enviar mensagem no chat
- **Clique**: Navegar pelas abas e personalizaÃ§Ãµes

## ðŸŽ¨ PersonalizaÃ§Ã£o

- **Skins de Cobra**: 6 opÃ§Ãµes (ClÃ¡ssica, Fogo, Gelo, Arco-Ã­ris, Fantasma, Zumbi)
- **AcessÃ³rios**: 6 opÃ§Ãµes (Coroa, Ã“culos, ChapÃ©u, Asas, MÃ¡scara)
- **Efeitos de Rastro**: 6 opÃ§Ãµes (Brilhos, Fogo, Gelo, Arco-Ã­ris, FumaÃ§a)
- **Temas**: 5 opÃ§Ãµes (Default, Dark, Neon, Sunset, Halloween)

## ðŸ† Power-ups

- **Velocidade**: Aumenta a velocidade da cobra
- **Invencibilidade**: Cobra nÃ£o morre por 3 segundos
- **Pontos Duplos**: Dobra os pontos por 10 segundos
- **Encolher**: Reduz o tamanho da cobra
- **Invisibilidade**: Cobra fica invisÃ­vel por 5 segundos
- **Teletransporte**: Teleporta para posiÃ§Ã£o aleatÃ³ria
- **Bomba**: Reduz o tamanho de outras cobras
- **Fantasma**: Passa atravÃ©s de obstÃ¡culos
- **AbÃ³bora**: Ganha 50 pontos extras
- **Morcego**: Velocidade + efeitos especiais

## ðŸ“± Mobile

O jogo inclui controles touch para dispositivos mÃ³veis.

## ðŸŽ® Modos de Jogo

### Modo ClÃ¡ssico
- Cobra nÃ£o morre nas bordas
- Teleporta para o outro lado da tela
- Ideal para iniciantes

### Modo Batalha
- Cobra morre nas bordas
- Comportamento mais realista
- Ideal para jogadores experientes

## ðŸŒŸ Temporada Halloween 2024

- Multiplicador de pontos 1.5x
- Power-ups especiais temÃ¡ticos
- Eventos especiais automÃ¡ticos
- Banner da temporada

## ðŸ“ Estrutura do Projeto

`
projeto/
â”œâ”€â”€ package.json          # DependÃªncias e scripts
â”œâ”€â”€ server.js             # Servidor Node.js
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ index.html        # Interface do jogo
â”‚   â””â”€â”€ game.js           # LÃ³gica do cliente
â””â”€â”€ README.md             # Este arquivo
`

## ðŸ› ï¸ Tecnologias

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML5, CSS3, JavaScript, Canvas
- **ComunicaÃ§Ã£o**: WebSockets (tempo real)
- **Armazenamento**: LocalStorage (dados locais)

## ðŸ“ LicenÃ§a

MIT License - Livre para uso e modificaÃ§Ã£o.

---

**Desenvolvido com â¤ï¸ para diversÃ£o multiplayer!**
