let gamesMap = new Map()

export default async function setupGamesEndpoints(app) {
  gamesMap = this.runtime.gamesMap = this.runtime.gamesMap || gamesMap
  
  app
    .route('/api/games')
    .all(gamesRequestHandler.bind(this))
    .get(listGames.bind(this))
    .post(createGame.bind(this))

  app
    .route('/api/games/:gameId')
    .all(gameRequestHandler.bind(this))
    .get(getGame.bind(this))
    .post(sendGameAction.bind(this))

  return app
}

export async function listGames(req, res) {
  const games = Array.from( gamesMap.entries() )

  res.json(
    games.map(([gameId, game]) => ({
      id: gameId,
      stage: game.stage,
      playerIds: game.playerIds
    }))  
  )
}

export async function createGame(req, res) {
  const { gameType = 'texas-holdem', players, blinds = [10, 20], startingStack, cards } = req.body

  const game = this.runtime.game(gameType, { players, blinds, startingStack, ... cards && { cards } })

  gamesMap.set(game.uuid, game)

  res.status(200).json({ id: game.uuid })
}

export async function gamesRequestHandler(req, res, next) {
  next()
}

export async function gameRequestHandler(req, res, next) {
  const game = gamesMap.get(req.params.gameId)

  if (game) {
    req.game = game
    next()
  } else {
    res.status(404).json({ error: 'not found '})
  }
}

export async function getGame(req, res) {
  const { game } = req

  try {
    res.status(200).json(game.toJSON());  
  } catch(error) {
    this.runtime.error(`Error serving game info`, error)
    res.status(500).json({ error: error.message })
  }
}

export async function sendGameAction(req, res) {
  const { game } = req
  const { action = {} } = req.body
  const { type, amount, playerId, ...data } = action
  
  if (type === 'deal') {
    game.deal()
  } else if(type === 'equity') {    
    await game.calculateEquity()
  } else if(type === 'reset') {    
    game.reset()
    game.deal()
  } else if(type === 'button') {    
    game.state.set('dealer', data.seat || (game.dealerSeat === 9 ? 1 : game.dealerSeat + 1))
  } else if(type === 'simulate') {    
    game.currentActor.act()    
  } else {
    await game.recordAction({ playerId, action: type, amount, ...data })
  }

  try {
    res.status(200).json(game.toJSON());
  } catch (error) {
    this.runtime.error(`Error serving game info`, error);
    res.status(500).json({ error: error.message });
  }  
}