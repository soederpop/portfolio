require('babel-plugin-require-context-hook/register')()

const runtime = require('../runtime')
const { clear, print, colors } = runtime.cli
const { bold, underline } = colors


async function main() {
  // clear()
  const game = runtime
    .game('texas-holdem', {
      players: 6,
      startingStack: 3000,
      blinds: [10, 20],
    }).ready()
  
  game.on('round', () => {
    const { stage } = game

    if (stage === 'preflop') {
      // clear()
      showPlayerCards(game)
      simulateRound(game)
    } else if (stage === 'flop') {
      // clear()
      showPlayerCards(game)
      showPlayerCards(game)
      showBoard(game, 'flop')
      simulateRound(game)
    } else if (stage === 'turn') {
      // clear()
      showPlayerCards(game)
      showBoard(game, 'flop')
      showBoard(game, 'turn')
      simulateRound(game)
    } else if (stage === 'river') {
      // clear()
      showPlayerCards(game)
      showBoard(game, 'flop')
      showBoard(game, 'turn')
      showBoard(game, 'river')
      simulateRound(game)
      printResults(game)
    }

    if (stage !== 'river') {
      game.deal()
    } else {
      if (runtime.argv.stream) {
        setTimeout(() => {
          try {
            main()
          } catch(error) {
            // clear()
            main()
          }
        }, 3000)
      }    
    }
  })

  game.deal()
}

function sleep(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
}

function showPlayerCards(game) {
  print('Cards:')

  try  {
    print(
      game.chain.get('playerCardDescriptions').entries()
        .map(([player, cards]) => `${bold.underline(player)} ${outputCards(cards)}`).chunk(3)
        .map(v => v.join("  ")).value(),
        4,
        1,
        1
    )
  } catch(error) {
    print(colors.red(error.message))
  }
}
  
function showBoard(game, stage) {
  const amt = { flop: 3, turn: 4, river: 5 }
  const max = amt[stage] || 5

  try {
    const all = (game.board || []).map(game.describeCard)
    print(colors.bold.underline(stage))
    print(outputCards(all.slice(0, max)), 4, 1, 1)  
  } catch(error) {
    print(colors.red(error.message))
  }
}

function printResults(game) {
  print('Results:')
  print(`${game.currentWinner.player.playerId} wins with a ${game.currentWinner.winningHandName}`, 4, 1, 1)
  print(outputCards((game.currentWinner.winningCombination._cards || []).map(game.describeCard)), 4, 1, 1)
}

function outputCards(cards = []) {
  const { colors: { green, blue, red, yellow }, icon } = runtime.cli

  const table = {
    h: icon('hearts'),
    c: icon('clubs'),
    d: icon('diamonds'),
    s: icon('spades')
  }

  const colorize = {
    h: (v) => red(v),
    c: (v) => green(v),
    d: (v) => blue(v),
    s: (v) => yellow(v)  
  }

  return cards.map((card) => {
    const parts = card.split('')
    const suit = parts.pop()
    const value = parts.join('')
    return colorize[suit](`${table[suit]}${value}`)
  }).join('')
}

function simulateRound(game) {
  
}

main()